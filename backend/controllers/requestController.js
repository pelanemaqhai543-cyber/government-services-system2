
const db = require('../config/db');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

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

const DEMO_DIRECTORY = path.join(
  __dirname,
  '..',
  'uploads',
  'demo-documents'
);

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

function makeDocumentNumber() {
  return `DEMO-ID-${Date.now()}-${crypto
    .randomBytes(3)
    .toString('hex')
    .toUpperCase()}`;
}

function publicBaseUrl(req) {
  // Configure PUBLIC_BASE_URL in production.
  // Do not trust forwarded host headers without proxy configuration.
  return String(
    process.env.PUBLIC_BASE_URL ||
    `${req.protocol}://${req.get('host')}`
  ).replace(/\/+$/, '');
}

async function notifyCitizen(userId, message) {
  try {
    await db.execute(
      `INSERT INTO notifications
         (user_id, message, is_read, created_at)
       VALUES (?, ?, 0, CURRENT_TIMESTAMP)`,
      [userId, message]
    );
  } catch (error) {
    console.error('Notification creation failed:', error.message);
  }
}

async function getDocuments(requestId) {
  const [documents] = await db.execute(
    `SELECT id, request_id, file_name, file_path, uploaded_at
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
       u.full_name,
       u.national_id,
       u.email,
       cp.date_of_birth,
       cp.gender,
       cp.address,
       cp.district
     FROM service_requests sr
     LEFT JOIN users u ON u.id = sr.user_id
     LEFT JOIN citizen_profiles cp ON cp.user_id = sr.user_id
     WHERE sr.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

/**
 * POST /api/requests
 * Submit an application.
 */
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

    const serviceType = String(req.body.service_type || '').trim();
    const department = String(req.body.department || '').trim();
    const notes = String(req.body.notes || '').trim();

    if (!serviceType || !department) {
      return res.status(400).json({
        message: 'Service type and department are required.'
      });
    }

    if (serviceType.length > 150 || department.length > 100) {
      return res.status(400).json({
        message: 'Service type or department is too long.'
      });
    }

    if (notes.length > 10000) {
      return res.status(400).json({
        message: 'Application notes cannot exceed 10,000 characters.'
      });
    }

    // Reject applications from inactive citizens.
    const [users] = await db.execute(
      'SELECT status FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!users.length || users[0].status !== 'active') {
      return res.status(403).json({
        message: 'Your account is not active. Contact the relevant office.'
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

        if (error.code === 'ER_DUP_ENTRY' && attempts < 5) {
          continue;
        }

        throw error;
      }
    }

    if (!requestId) {
      throw new Error('Unable to create a unique application reference.');
    }

    for (const file of uploadedFiles) {
      await connection.execute(
        `INSERT INTO request_documents (
           request_id, file_name, file_path, uploaded_at
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
        console.error('Rollback failed:', rollbackError.message);
      }
    }

    if (!committed) {
      const uploadDirectory = path.join(
        __dirname,
        '..',
        'uploads',
        'requests'
      );

      for (const file of uploadedFiles) {
        try {
          fs.unlinkSync(
            path.join(uploadDirectory, path.basename(file.filename))
          );
        } catch (fileError) {
          if (fileError.code !== 'ENOENT') {
            console.warn('File cleanup failed:', fileError.message);
          }
        }
      }
    }

    console.error('createRequest error:', error);

    return res.status(500).json({
      message: 'Unable to submit application. Check the backend terminal.'
    });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * GET /api/requests/queue
 * Department-filtered officer queue.
 */
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
       LEFT JOIN users u ON u.id = sr.user_id
       LEFT JOIN citizen_profiles cp ON cp.user_id = sr.user_id
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

/**
 * GET /api/requests/:id
 * Officer-only application details.
 */
exports.getRequestDetail = async (req, res) => {
  try {
    if (!isEmployee(req)) {
      return res.status(403).json({
        message: 'You are not authorized to view this application.'
      });
    }

    const application = await getRequestById(req.params.id);

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

    application.documents = await getDocuments(application.id);
    application.document_count = application.documents.length;

    const [issued] = await db.execute(
      `SELECT id, document_type, document_number, status, issued_at
       FROM demo_issued_documents
       WHERE request_id = ?
       LIMIT 1`,
      [application.id]
    );

    application.demo_document = issued[0] || null;

    return res.json(application);
  } catch (error) {
    console.error('getRequestDetail error:', error);

    return res.status(500).json({
      message: 'Unable to load application details.'
    });
  }
};

/**
 * PUT /api/requests/:id/status
 * Officer status review and citizen notification.
 */
exports.updateRequestStatus = async (req, res) => {
  try {
    if (!isEmployee(req)) {
      return res.status(403).json({
        message: 'You are not authorized to update applications.'
      });
    }

    const id = Number(req.params.id);
    const status = normalizeStatus(req.body.status);
    const reason = String(req.body.rejection_reason || '').trim();

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: 'Invalid application ID.' });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: 'Invalid application status.',
        allowedStatuses: ALLOWED_STATUSES
      });
    }

    if (status === 'rejected' && !reason) {
      return res.status(400).json({
        message: 'Provide a reason before rejecting the application.'
      });
    }

    const application = await getRequestById(id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (!canAccessRequest(req, application)) {
      return res.status(403).json({
        message: 'You cannot update this department’s application.'
      });
    }

    // Do not change an application after a demo document is issued.
    const [issued] = await db.execute(
      `SELECT id FROM demo_issued_documents
       WHERE request_id = ? LIMIT 1`,
      [id]
    );

    if (issued.length && status !== 'approved') {
      return res.status(409).json({
        message: 'A demo document has already been issued. Revoke it through a separate controlled workflow first.'
      });
    }

    const oldStatus = application.status;
    const newNotes = status === 'rejected'
      ? `${application.notes || ''}\n\nOfficer rejection reason: ${reason}`.trim()
      : application.notes;

    await db.execute(
      `UPDATE service_requests
       SET status = ?,
           notes = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, newNotes || null, id]
    );

    await notifyCitizen(
      application.user_id,
      `Application ${application.reference_number} status changed from ${oldStatus} to ${status}.${status === 'rejected' ? ` Reason: ${reason}` : ''}`
    );

    return res.json({
      message: 'Application status updated successfully.',
      id,
      reference_number: application.reference_number,
      previous_status: oldStatus,
      status
    });
  } catch (error) {
    console.error('updateRequestStatus error:', error);

    return res.status(500).json({
      message: 'Unable to update application status.'
    });
  }
};

/**
 * POST /api/requests/:id/issue-demo
 * Issue a demonstration PDF only after officer approval.
 */
exports.issueDemoDocument = async (req, res) => {
  let pdfPath;

  try {
    if (!isEmployee(req)) {
      return res.status(403).json({
        message: 'Only authorized officers can issue demo documents.'
      });
    }

    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: 'Invalid application ID.' });
    }

    const application = await getRequestById(id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (!canAccessRequest(req, application)) {
      return res.status(403).json({
        message: 'You cannot issue a document for this department.'
      });
    }

    if (normalizeStatus(application.status) !== 'approved') {
      return res.status(409).json({
        message: 'An officer must approve the application before issuing a demo document.'
      });
    }

    const service = String(application.service_type || '').toLowerCase();

    if (
      !service.includes('national id') &&
      !service.includes('national identity') &&
      !service.includes('birth certificate')
    ) {
      return res.status(400).json({
        message: 'Demo issuance is available only for National ID and Birth Certificate applications.'
      });
    }

    const documentType = service.includes('birth')
      ? 'DEMO BIRTH CERTIFICATE'
      : 'DEMO NATIONAL ID';

    // The unique request_id constraint also prevents a second issuance.
    const [existing] = await db.execute(
      `SELECT id, document_number, status, issued_at
       FROM demo_issued_documents
       WHERE request_id = ?
       LIMIT 1`,
      [id]
    );

    if (existing.length) {
      return res.status(409).json({
        message: 'A demo document has already been issued for this application.',
        document: existing[0]
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const documentNumber = makeDocumentNumber();

    const baseUrl = publicBaseUrl(req);
    const verificationUrl =
      `${baseUrl}/api/requests/demo-verification/${token}`;

    fs.mkdirSync(DEMO_DIRECTORY, { recursive: true });

    const filename = `${crypto.randomUUID()}.pdf`;
    pdfPath = path.join(DEMO_DIRECTORY, filename);

    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 240
    });

    const qrImage = Buffer.from(
      qrDataUrl.replace(/^data:image\/png;base64,/, ''),
      'base64'
    );

    // Build PDF before inserting the database record.
    await new Promise((resolve, reject) => {
      const pdf = new PDFDocument({
        size: 'A4',
        margins: { top: 55, bottom: 55, left: 55, right: 55 }
      });

      const output = fs.createWriteStream(pdfPath);

      output.on('finish', resolve);
      output.on('error', reject);
      pdf.on('error', reject);

      pdf.pipe(output);

      pdf.rect(0, 0, 595, 842).fill('#ffffff');

      pdf.fillColor('#b91c1c')
        .fontSize(21)
        .font('Helvetica-Bold')
        .text('DEMO DOCUMENT — NOT OFFICIAL', 45, 42, {
          width: 505,
          align: 'center'
        });

      pdf.moveTo(55, 82)
        .lineTo(540, 82)
        .strokeColor('#b91c1c')
        .lineWidth(2)
        .stroke();

      pdf.fillColor('#111827')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('MYGOV LESOTHO — DEMONSTRATION', 55, 105, {
          width: 485,
          align: 'center'
        });

      pdf.fontSize(18)
        .fillColor('#1d4ed8')
        .text(documentType, 55, 145, {
          width: 485,
          align: 'center'
        });

      pdf.fillColor('#111827').fontSize(11);

      const fields = [
        ['Document number', documentNumber],
        ['Application reference', application.reference_number],
        ['Applicant name', application.full_name || 'Not supplied'],
        ['National ID (masked)', application.national_id
          ? `********${String(application.national_id).slice(-3)}`
          : 'Not supplied'],
        ['Service', application.service_type],
        ['Department', application.department],
        ['Issue date', new Date().toISOString().slice(0, 10)],
        ['Status', 'DEMO ONLY — NOT VALID FOR IDENTIFICATION']
      ];

      let y = 205;

      for (const [label, value] of fields) {
        pdf.font('Helvetica-Bold')
          .text(`${label}:`, 65, y, { width: 145 });

        pdf.font('Helvetica')
          .text(String(value || 'Not supplied'), 215, y, {
            width: 310
          });

        y += 32;
      }

      pdf.image(qrImage, 225, y + 5, {
        width: 125,
        height: 125
      });

      pdf.fillColor('#b91c1c')
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('DEMO ONLY — NOT A GOVERNMENT CREDENTIAL', 55, 730, {
          width: 485,
          align: 'center'
        });

      pdf.fillColor('#374151')
        .font('Helvetica')
        .fontSize(9)
        .text(
          'This file is generated for software demonstration and testing. ' +
          'It is not an official Lesotho identity document, birth certificate, ' +
          'proof of citizenship, or proof of identity.',
          65,
          752,
          { width: 465, align: 'center' }
        );

      pdf.end();
    });

    let insertedId;

    try {
      const [result] = await db.execute(
        `INSERT INTO demo_issued_documents (
           request_id,
           user_id,
           document_type,
           document_number,
           verification_token,
           file_path,
           status,
           issued_by,
           issued_at
         )
         VALUES (?, ?, ?, ?, ?, ?, 'valid', ?, CURRENT_TIMESTAMP)`,
        [
          id,
          application.user_id,
          documentType,
          documentNumber,
          token,
          pdfPath,
          getUserId(req)
        ]
      );

      insertedId = result.insertId;
    } catch (error) {
      // If another request won the race, don't leave an orphan PDF.
      try {
        fs.unlinkSync(pdfPath);
      } catch (_) {}

      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          message: 'A demo document has already been issued for this application.'
        });
      }

      throw error;
    }

    await notifyCitizen(
      application.user_id,
      `A demonstration document for application ${application.reference_number} has been issued. It is not an official government credential.`
    );

    return res.status(201).json({
      message: 'Demo document issued successfully.',
      warning: 'DEMO ONLY — NOT AN OFFICIAL GOVERNMENT DOCUMENT.',
      document: {
        id: insertedId,
        request_id: id,
        reference_number: application.reference_number,
        document_type: documentType,
        document_number: documentNumber,
        status: 'valid',
        verification_url: verificationUrl,
        download_url: `/api/requests/${id}/demo-document`
      }
    });
  } catch (error) {
    console.error('issueDemoDocument error:', error);

    return res.status(500).json({
      message: 'Unable to issue the demo document.'
    });
  }
};

/**
 * GET /api/requests/demo-verification/:token
 * Public verification endpoint. Exposes minimal information only.
 */
exports.verifyDemoDocument = async (req, res) => {
  try {
    const token = String(req.params.token || '');

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        verified: false,
        message: 'Invalid verification token.'
      });
    }

    const [rows] = await db.execute(
      `SELECT
         document_type,
         document_number,
         status,
         issued_at
       FROM demo_issued_documents
       WHERE verification_token = ?
       LIMIT 1`,
      [token]
    );

    if (!rows.length) {
      return res.status(404).json({
        verified: false,
        message: 'Demo document not found.'
      });
    }

    const doc = rows[0];

    return res.json({
      verified: doc.status === 'valid',
      demo_only: true,
      warning: 'This is a demonstration record, not an official government credential.',
      document_type: doc.document_type,
      document_number: doc.document_number,
      status: doc.status,
      issued_at: doc.issued_at
    });
  } catch (error) {
    console.error('verifyDemoDocument error:', error);

    return res.status(500).json({
      verified: false,
      message: 'Unable to verify this demo document.'
    });
  }
};

/**
 * GET /api/requests/:id/demo-document
 * Download a demo PDF.
 *
 * Citizens can download their own document; officers must have
 * department access to the application.
 */
exports.downloadDemoDocument = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: 'Please sign in.' });
    }

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: 'Invalid application ID.' });
    }

    const [rows] = await db.execute(
      `SELECT
         d.file_path,
         d.document_number,
         d.user_id,
         sr.department
       FROM demo_issued_documents d
       JOIN service_requests sr ON sr.id = d.request_id
       WHERE d.request_id = ? AND d.status = 'valid'
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: 'No valid demo document exists for this application.'
      });
    }

    const document = rows[0];

    if (Number(document.user_id) !== Number(userId)) {
      if (!isEmployee(req) || !canAccessRequest(req, document)) {
        return res.status(403).json({
          message: 'You cannot download this document.'
        });
      }
    }

    const absolutePath = path.resolve(document.file_path);
    const allowedDirectory = path.resolve(DEMO_DIRECTORY) + path.sep;

    if (!absolutePath.startsWith(allowedDirectory)) {
      return res.status(400).json({
        message: 'Invalid document file path.'
      });
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        message: 'The PDF file could not be found.'
      });
    }

    res.setHeader('Cache-Control', 'no-store');
    res.download(
      absolutePath,
      `${document.document_number}.pdf`
    );
  } catch (error) {
    console.error('downloadDemoDocument error:', error);

    return res.status(500).json({
      message: 'Unable to download the demo document.'
    });
  }
};
