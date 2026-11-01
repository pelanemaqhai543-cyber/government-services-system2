
const db = require('../config/db');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALLOWED_STATUSES = [
  'pending',
  'submitted',
  'review',
  'ready',
  'approved',
  'rejected',
  'completed'
];

const EMPLOYEE_ROLES = [
  'home_affairs',
  'admin',
  'traffic',
  'finance',
  'pension',
  'police',
  'passport'
];

const ALLOWED_DECISIONS = [
  'approve',
  'reject',
  'request_info',
  'review'
];

const REQUEST_UPLOAD_DIRECTORY = path.join(
  __dirname,
  '..',
  'uploads',
  'requests'
);

/* =========================================================
   GENERAL HELPERS
========================================================= */

function getUserId(req) {
  return req.user?.id ?? req.user?.user_id;
}

function getUserRole(req) {
  return String(req.user?.role || '').toLowerCase();
}

function getUserDepartment(req) {
  return String(
    req.user?.department || req.user?.role || ''
  ).toLowerCase();
}

function isEmployee(req) {
  return EMPLOYEE_ROLES.includes(getUserRole(req));
}

function canAccessRequest(req, application) {
  if (getUserRole(req) === 'admin') {
    return true;
  }

  const role = getUserRole(req);

  const department = String(
    application.department || ''
  ).toLowerCase();

  if (role === 'home_affairs') {
    return (
      department.includes('home affairs') ||
      department.includes('home_affairs') ||
      department.includes('home-affairs') ||
      department.includes('identity') ||
      department.includes('passport')
    );
  }

  return department === getUserDepartment(req);
}

function normalizeStatus(status) {
  return String(status || '').trim().toLowerCase();
}

function makeReference() {
  return `HA${Date.now().toString().slice(-7)}${crypto
    .randomBytes(2)
    .toString('hex')
    .toUpperCase()}`;
}

/**
 * Saves a citizen notification.
 * This helper is for operations outside a database transaction.
 */
async function notifyCitizen(userId, message) {
  try {
    await db.execute(
      `INSERT INTO notifications
         (user_id, message, is_read, created_at)
       VALUES (?, ?, 0, CURRENT_TIMESTAMP)`,
      [userId, message]
    );
  } catch (error) {
    console.error(
      'Notification creation failed:',
      error.message
    );
  }
}

/**
 * Gets uploaded documents for an application.
 */
async function getDocuments(requestId) {
  const [documents] = await db.execute(
    `SELECT
       id,
       request_id,
       file_name,
       file_path,
       uploaded_at
     FROM request_documents
     WHERE request_id = ?
     ORDER BY uploaded_at DESC`,
    [requestId]
  );

  return documents.map((doc) => ({
    ...doc,
    file_url: doc.file_path || null
  }));
}

/**
 * Gets one application with applicant details,
 * AI assessment and officer review information.
 */
async function getRequestById(id) {
  const [rows] = await db.execute(
    `SELECT
       sr.id,
       sr.reference_number,
       sr.user_id,
       sr.service_type,
       sr.department,
       sr.notes,
       sr.status,
       sr.created_at,
       sr.updated_at,

       sr.ai_summary,
       sr.ai_recommendation,
       sr.ai_risk_score,
       sr.ai_processed_at,
       sr.ai_findings,

       sr.officer_recommendation,
       sr.officer_feedback,
       sr.officer_decision,
       sr.officer_reviewed_by,
       sr.officer_reviewed_at,

       u.full_name,
       u.national_id,
       u.email,

       cp.date_of_birth,
       cp.gender,
       cp.address,
       cp.district

     FROM service_requests sr

     LEFT JOIN users u
       ON u.id = sr.user_id

     LEFT JOIN citizen_profiles cp
       ON cp.user_id = sr.user_id

     WHERE sr.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

/**
 * Inserts a notification using an existing transaction connection.
 */
async function insertNotification(connection, userId, message) {
  await connection.execute(
    `INSERT INTO notifications
       (user_id, message, is_read, created_at)
     VALUES (?, ?, 0, CURRENT_TIMESTAMP)`,
    [userId, message]
  );
}

/* =========================================================
   CREATE APPLICATION
   POST /api/requests
========================================================= */

exports.createRequest = async (req, res) => {
  let connection;
  let transactionStarted = false;
  let committed = false;

  const uploadedFiles = req.files || [];

  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Please sign in before submitting an application.'
      });
    }

    if (isEmployee(req)) {
      return res.status(403).json({
        message: 'Government officers cannot submit citizen applications.'
      });
    }

    const serviceType = String(
      req.body.service_type || ''
    ).trim();

    const department = String(
      req.body.department || ''
    ).trim();

    const notes = String(
      req.body.notes || ''
    ).trim();

    if (!serviceType || !department) {
      return res.status(400).json({
        message: 'Service type and department are required.'
      });
    }

    if (
      serviceType.length > 150 ||
      department.length > 100
    ) {
      return res.status(400).json({
        message: 'Service type or department is too long.'
      });
    }

    if (notes.length > 10000) {
      return res.status(400).json({
        message: 'Application notes cannot exceed 10,000 characters.'
      });
    }

    const [users] = await db.execute(
      'SELECT status FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!users.length || users[0].status !== 'active') {
      return res.status(403).json({
        message: 'Your account is not active. Contact the relevant office.'
      });
    }

    const [existing] = await db.execute(
      `SELECT id, reference_number
       FROM service_requests
       WHERE user_id = ?
         AND service_type = ?
         AND status NOT IN ('completed', 'rejected', 'cancelled')
       LIMIT 1`,
      [userId, serviceType]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message:
          `You already have an active application for ${serviceType} ` +
          `(Ref: ${existing[0].reference_number}). Please wait for it to be processed.`
      });
    }

    connection = await db.getConnection();

    let referenceNumber;
    let requestId;
    let attempts = 0;

    while (attempts < 5) {
      attempts += 1;
      referenceNumber = makeReference();

      try {
        await connection.beginTransaction();
        transactionStarted = true;

        const [result] = await connection.execute(
          `INSERT INTO service_requests (
             reference_number,
             user_id,
             service_type,
             department,
             notes,
             status,
             created_at,
             updated_at
           )
           VALUES (?, ?, ?, ?, ?, 'submitted',
                   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            referenceNumber,
            userId,
            serviceType,
            department,
            notes || null
          ]
        );

        requestId = result.insertId;
        break;

      } catch (error) {
        if (transactionStarted) {
          await connection.rollback();
          transactionStarted = false;
        }

        if (
          error.code === 'ER_DUP_ENTRY' &&
          attempts < 5
        ) {
          continue;
        }

        throw error;
      }
    }

    if (!requestId) {
      throw new Error(
        'Unable to create a unique application reference.'
      );
    }

    for (const file of uploadedFiles) {
      await connection.execute(
        `INSERT INTO request_documents (
           request_id,
           file_name,
           file_path,
           uploaded_at
         )
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          requestId,
          path.basename(file.originalname),
          path.posix.join(
            'uploads',
            'requests',
            path.basename(file.filename)
          )
        ]
      );
    }

    await connection.commit();

    transactionStarted = false;
    committed = true;

    await notifyCitizen(
      userId,
      `Your application ${referenceNumber} has been submitted and is awaiting review.`
    );

    return res.status(201).json({
      message: 'Application submitted successfully.',
      reference_number: referenceNumber,
      request: {
        id: requestId,
        reference_number: referenceNumber,
        user_id: userId,
        service_type: serviceType,
        department,
        notes: notes || null,
        status: 'submitted'
      },
      documents_uploaded: uploadedFiles.length
    });

  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          'Rollback failed:',
          rollbackError.message
        );
      }
    }

    if (!committed) {
      for (const file of uploadedFiles) {
        try {
          fs.unlinkSync(
            path.join(
              REQUEST_UPLOAD_DIRECTORY,
              path.basename(file.filename)
            )
          );
        } catch (fileError) {
          if (fileError.code !== 'ENOENT') {
            console.warn(
              'File cleanup failed:',
              fileError.message
            );
          }
        }
      }
    }

    console.error('createRequest error:', error);

    return res.status(500).json({
      message: 'Unable to submit application. Check the backend terminal.'
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/* =========================================================
   OFFICER QUEUE
   GET /api/requests/queue
========================================================= */

exports.getQueue = async (req, res) => {
  try {
    if (!isEmployee(req)) {
      return res.status(403).json({
        message: 'You are not authorized to view applications.'
      });
    }

    const [applications] = await db.execute(
      `SELECT
         sr.id,
         sr.reference_number,
         sr.user_id,
         sr.service_type,
         sr.department,
         sr.notes,
         sr.status,
         sr.created_at,
         sr.updated_at,

         sr.ai_summary,
         sr.ai_recommendation,
         sr.ai_risk_score,
         sr.ai_processed_at,
         sr.ai_findings,

         u.full_name,
         u.national_id,
         u.email,

         cp.date_of_birth,

         (
           SELECT COUNT(*)
           FROM request_documents rd
           WHERE rd.request_id = sr.id
         ) AS document_count

       FROM service_requests sr

       LEFT JOIN users u
         ON u.id = sr.user_id

       LEFT JOIN citizen_profiles cp
         ON cp.user_id = sr.user_id

       ORDER BY sr.created_at DESC`
    );

    const authorized = applications.filter(
      (application) => canAccessRequest(req, application)
    );

    const result = await Promise.all(
      authorized.map(async (application) => ({
        ...application,
        documents: await getDocuments(application.id)
      }))
    );

    return res.json(result);

  } catch (error) {
    console.error('getQueue error:', error);

    return res.status(500).json({
      message: 'Unable to load the application queue.'
    });
  }
};

/* =========================================================
   APPLICATION DETAILS
   GET /api/requests/:id
========================================================= */

exports.getRequestDetail = async (req, res) => {
  try {
    if (!isEmployee(req)) {
      return res.status(403).json({
        message: 'You are not authorized to view this application.'
      });
    }

    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        message: 'Invalid application ID.'
      });
    }

    const application = await getRequestById(id);

    if (!application) {
      return res.status(404).json({
        message: 'Application not found.'
      });
    }

    if (!canAccessRequest(req, application)) {
      return res.status(403).json({
        message: 'You cannot access this department’s application.'
      });
    }

    application.documents = await getDocuments(
      application.id
    );

    application.document_count =
      application.documents.length;

    /*
     * The demo_issued_documents table does not exist.
     * The real issued_documents table has a different schema.
     *
     * Therefore, do not query the missing demo table here.
     */
    application.demo_document = null;

    return res.json(application);

  } catch (error) {
    console.error('getRequestDetail error:', error);

    return res.status(500).json({
      message: 'Unable to load application details.'
    });
  }
};

/* =========================================================
   OFFICER REVIEW AND DECISION
   PUT /api/requests/:id/status

   Expected request body example:

   {
     "decision": "request_info",
     "officer_recommendation": "The applicant must provide ...",
     "citizen_message": "Please upload a clearer copy ... "
   }

   Supported decisions:
   approve
   reject
   request_info
   review
========================================================= */

exports.updateRequestStatus = async (req, res) => {
  let connection;
  let transactionStarted = false;

  try {
    if (!isEmployee(req)) {
      return res.status(403).json({
        message: 'You are not authorized to update applications.'
      });
    }

    const officerId = getUserId(req);

    if (!officerId) {
      return res.status(401).json({
        message: 'Officer identity could not be verified.'
      });
    }

    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        message: 'Invalid application ID.'
      });
    }

    const decision = normalizeStatus(
      req.body.decision || req.body.status
    );

    const officerRecommendation = String(
      req.body.officer_recommendation || ''
    ).trim();

    const citizenMessage = String(
      req.body.citizen_message ||
      req.body.officer_feedback ||
      ''
    ).trim();

    const rejectionReason = String(
      req.body.rejection_reason || ''
    ).trim();

    if (!ALLOWED_DECISIONS.includes(decision)) {
      return res.status(400).json({
        message: 'Invalid officer decision.',
        allowedDecisions: ALLOWED_DECISIONS
      });
    }

    if (officerRecommendation.length > 10000) {
      return res.status(400).json({
        message: 'Officer recommendation is too long.'
      });
    }

    if (citizenMessage.length > 5000) {
      return res.status(400).json({
        message: 'Citizen message is too long.'
      });
    }

    let newStatus;

    switch (decision) {
      case 'approve':
        newStatus = 'approved';
        break;

      case 'reject':
        newStatus = 'rejected';
        break;

      case 'request_info':
        newStatus = 'review';
        break;

      case 'review':
        newStatus = 'review';
        break;

      default:
        return res.status(400).json({
          message: 'Unsupported decision.'
        });
    }

    if (decision === 'reject' && !rejectionReason && !citizenMessage) {
      return res.status(400).json({
        message: 'Provide a rejection reason or a message to the citizen.'
      });
    }

    if (decision === 'request_info' && !citizenMessage) {
      return res.status(400).json({
        message: 'Provide a message explaining what information the citizen must submit.'
      });
    }

    if (decision === 'approve' && !citizenMessage) {
      return res.status(400).json({
        message: 'Provide a message informing the citizen of the approval.'
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

    /*
     * Lock the application row while the officer reviews it.
     * This prevents two officers from overwriting each other's
     * decisions at the same time.
     */
    const [rows] = await connection.execute(
      `SELECT
         id,
         reference_number,
         user_id,
         department,
         status,
         notes
       FROM service_requests
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [id]
    );

    const application = rows[0];

    if (!application) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(404).json({
        message: 'Application not found.'
      });
    }

    if (!canAccessRequest(req, application)) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(403).json({
        message: 'You cannot update this department’s application.'
      });
    }

    /*
     * The old demo document protection check has been removed
     * because demo_issued_documents does not exist in the database.
     *
     * Demo PDF issuance is disabled below until a compatible
     * database schema is configured.
     */

    const previousStatus = application.status;

    const finalCitizenMessage =
      decision === 'reject' && !citizenMessage
        ? rejectionReason
        : citizenMessage;

    /*
     * Store the officer's internal recommendation separately
     * from the message shown to the citizen.
     *
     * Do not put private officer notes into application notes.
     */
    await connection.execute(
      `UPDATE service_requests
       SET
         status = ?,
         officer_recommendation = ?,
         officer_feedback = ?,
         officer_decision = ?,
         officer_reviewed_by = ?,
         officer_reviewed_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        newStatus,
        officerRecommendation || null,
        finalCitizenMessage || null,
        decision,
        officerId,
        id
      ]
    );

    /*
     * Save the audit/history record.
     */
    await connection.execute(
      `INSERT INTO officer_request_history (
         request_id,
         officer_id,
         previous_status,
         new_status,
         decision,
         officer_recommendation,
         citizen_message,
         created_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        id,
        officerId,
        previousStatus,
        newStatus,
        decision,
        officerRecommendation || null,
        finalCitizenMessage || null
      ]
    );

    /*
     * Save the citizen notification inside the same transaction.
     */
    const notificationMessage =
      `Application ${application.reference_number}: ` +
      `${finalCitizenMessage || `Your application status is now ${newStatus}.`}`;

    await insertNotification(
      connection,
      application.user_id,
      notificationMessage
    );

    await connection.commit();
    transactionStarted = false;

    return res.status(200).json({
      message: 'Officer decision saved successfully.',
      id,
      reference_number: application.reference_number,
      previous_status: previousStatus,
      status: newStatus,
      decision,
      officer_recommendation: officerRecommendation || null,
      citizen_message: finalCitizenMessage || null,
      reviewed_by: officerId,
      reviewed_at: new Date().toISOString()
    });

  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          'Decision rollback failed:',
          rollbackError.message
        );
      }
    }

    console.error('updateRequestStatus error:', error);

    return res.status(500).json({
      message: 'Unable to save the officer decision.'
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/* =========================================================
   APPLICATION DECISION HISTORY
   GET /api/requests/:id/history
========================================================= */

exports.getRequestHistory = async (req, res) => {
  try {
    if (!isEmployee(req)) {
      return res.status(403).json({
        message: 'You are not authorized to view decision history.'
      });
    }

    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        message: 'Invalid application ID.'
      });
    }

    const application = await getRequestById(id);

    if (!application) {
      return res.status(404).json({
        message: 'Application not found.'
      });
    }

    if (!canAccessRequest(req, application)) {
      return res.status(403).json({
        message: 'You cannot access this department’s application.'
      });
    }

    const [history] = await db.execute(
      `SELECT
         h.id,
         h.request_id,
         h.officer_id,
         u.full_name AS officer_name,
         h.previous_status,
         h.new_status,
         h.decision,
         h.officer_recommendation,
         h.citizen_message,
         h.created_at
       FROM officer_request_history h
       LEFT JOIN users u
         ON u.id = h.officer_id
       WHERE h.request_id = ?
       ORDER BY h.created_at DESC, h.id DESC`,
      [id]
    );

    return res.status(200).json(history);

  } catch (error) {
    console.error('getRequestHistory error:', error);

    return res.status(500).json({
      message: 'Unable to load decision history.'
    });
  }
};

/* =========================================================
   ISSUE DEMO DOCUMENT
   POST /api/requests/:id/issue-demo

   TEMPORARILY DISABLED

   The existing database contains issued_documents,
   not demo_issued_documents.

   The existing issued_documents schema stores document_data
   as JSON and does not contain the file_path column required
   by the old demo PDF system.

   No database tables or existing documents are modified.
========================================================= */

exports.issueDemoDocument = async (req, res) => {
  try {
    if (!isEmployee(req)) {
      return res.status(403).json({
        message: 'Only authorized officers can issue documents.'
      });
    }

    return res.status(503).json({
      message:
        'Demo PDF issuance is temporarily unavailable because the database schema does not support the demo document system.',
      details:
        'The existing issued_documents table stores document_data as JSON and does not contain the required file_path column.',
      suggestion:
        'Officer decisions and application approvals are still available.'
    });

  } catch (error) {
    console.error('issueDemoDocument error:', error);

    return res.status(500).json({
      message: 'Unable to issue the demo document.'
    });
  }
};

/* =========================================================
   VERIFY DEMO DOCUMENT
   GET /api/requests/demo-verification/:token

   TEMPORARILY DISABLED

   The demo_issued_documents table does not exist.
========================================================= */

exports.verifyDemoDocument = async (req, res) => {
  return res.status(503).json({
    verified: false,
    demo_only: true,
    message:
      'Demo document verification is temporarily unavailable because the demo document database table has not been configured.'
  });
};

/* =========================================================
   DOWNLOAD DEMO DOCUMENT
   GET /api/requests/:id/demo-document

   TEMPORARILY DISABLED

   The demo_issued_documents table does not exist.
========================================================= */

exports.downloadDemoDocument = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Please sign in.'
      });
    }

    return res.status(503).json({
      message:
        'Demo PDF downloads are temporarily unavailable because the demo document database table has not been configured.',
      suggestion:
        'Contact the system administrator for document issuance.'
    });

  } catch (error) {
    console.error('downloadDemoDocument error:', error);

    return res.status(500).json({
      message: 'Unable to download the demo document.'
    });
  }
};
