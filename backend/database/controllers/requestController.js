
const db = require('../config/db');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const ALLOWED_STATUSES = [
  'submitted',
  'review',
  'ready',
  'rejected',
  'completed',
  'cancelled'
];

const EMPLOYEE_ROLES = [
  'home_affairs',
  'traffic',
  'finance',
  'pension',
  'police',
  'passport',
  'admin'
];

const ISSUABLE_SERVICES = {
  'national id registration': 'national_id',
  'national id replacement': 'national_id',
  'birth certificate': 'birth_certificate'
};

const ACTIVE_STATUSES = ['submitted', 'review', 'ready', 'completed'];

const getUserId = (req) => req.user?.id ?? req.user?.user_id;
const getUserRole = (req) => String(req.user?.role || '').toLowerCase();

const getUserDepartment = (req) =>
  String(req.user?.department || req.user?.role || '').toLowerCase();

function normalizeDepartment(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function canAccessRequest(req, application) {
  const role = getUserRole(req);
  const department = normalizeDepartment(application.department);

  if (role === 'admin') return true;

  if (role === 'home_affairs') {
    return [
      'home_affairs',
      'identity',
      'passport'
    ].includes(department);
  }

  return department === normalizeDepartment(getUserDepartment(req));
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

async function notifyCitizen(userId, message) {
  await db.execute(
    `INSERT INTO notifications (user_id, message, is_read)
     VALUES (?, ?, 0)`,
    [userId, message]
  );
}

function generateReference() {
  return `HA${Date.now().toString().slice(-7)}${crypto
    .randomBytes(2)
    .toString('hex')
    .toUpperCase()}`;
}

/**
 * POST /api/requests
 * Submit a citizen application.
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

    if (EMPLOYEE_ROLES.includes(getUserRole(req))) {
      return res.status(403).json({
        message: 'Government officers cannot submit citizen applications.'
      });
    }

    const serviceType = String(req.body.service_type || '').trim();
    const department = normalizeDepartment(req.body.department);
    const notes = String(req.body.notes || '').trim();

    const allowedDepartments = [
      'home_affairs',
      'traffic',
      'finance',
      'pension',
      'police',
      'passport'
    ];

    if (!serviceType || !department) {
      return res.status(400).json({
        message: 'Service type and department are required.'
      });
    }

    if (
      serviceType.length > 150 ||
      notes.length > 10000 ||
      !allowedDepartments.includes(department)
    ) {
      return res.status(400).json({
        message: 'Please check the service, department and notes.'
      });
    }

    if (uploadedFiles.length > 5) {
      return res.status(400).json({
        message: 'A maximum of five supporting documents is allowed.'
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    // Prevent duplicate active requests for the same citizen and service.
    const [duplicates] = await connection.execute(
      `SELECT id, reference_number, status
       FROM service_requests
       WHERE user_id = ?
         AND LOWER(TRIM(service_type)) = LOWER(TRIM(?))
         AND status IN ('submitted', 'review', 'ready')
       LIMIT 1
       FOR UPDATE`,
      [userId, serviceType]
    );

    if (duplicates.length) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(409).json({
        message: 'You already have an active application for this service.',
        existing_application: duplicates[0]
      });
    }

    let referenceNumber;
    let result;
    let attempts = 0;

    while (attempts < 5) {
      attempts += 1;
      referenceNumber = generateReference();

      try {
        const [insertResult] = await connection.execute(
          `INSERT INTO service_requests
            (reference_number, user_id, service_type, department, notes, status)
           VALUES (?, ?, ?, ?, ?, 'submitted')`,
          [
            referenceNumber,
            userId,
            serviceType,
            department,
            notes || null
          ]
        );

        result = insertResult;
        break;
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY' && attempts < 5) continue;
        throw error;
      }
    }

    if (!result) {
      throw new Error('Could not generate an application reference.');
    }

    for (const file of uploadedFiles) {
      await connection.execute(
        `INSERT INTO request_documents
          (request_id, file_name, file_path)
         VALUES (?, ?, ?)`,
        [
          result.insertId,
          path.basename(file.originalname),
          path.posix.join('uploads', 'requests', path.basename(file.filename))
        ]
      );
    }

    await connection.commit();
    transactionStarted = false;
    committed = true;

    try {
      await notifyCitizen(
        userId,
        `Your application ${referenceNumber} has been submitted successfully.`
      );
    } catch (notificationError) {
      console.error('Submission notification failed:', notificationError.message);
    }

    return res.status(201).json({
      message: 'Application submitted successfully.',
      reference_number: referenceNumber,
      request: {
        id: result.insertId,
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
        __dirname, '..', 'uploads', 'requests'
      );

      for (const file of uploadedFiles) {
        try {
          fs.unlinkSync(
            path.join(uploadDirectory, path.basename(file.filename))
          );
        } catch (fileError) {
          if (fileError.code !== 'ENOENT') {
            console.warn('Upload cleanup failed:', fileError.message);
          }
        }
      }
    }

    console.error('createRequest error:', error);

    return res.status(500).json({
      message: 'Unable to submit application.'
    });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * GET /api/requests/queue
 */
exports.getQueue = async (req, res) => {
  try {
    if (!EMPLOYEE_ROLES.includes(getUserRole(req))) {
      return res.status(403).json({
        message: 'You are not authorized to view applications.'
      });
    }

    // users.date_of_birth does not exist in your supplied schema.
    const [applications] = await db.execute(
      `SELECT
         sr.id, sr.reference_number, sr.user_id,
         sr.service_type, sr.department, sr.notes,
         sr.status, sr.created_at, sr.updated_at,
         u.full_name, u.national_id, u.email,
         (SELECT COUNT(*) FROM request_documents rd
          WHERE rd.request_id = sr.id) AS document_count
       FROM service_requests sr
       JOIN users u ON u.id = sr.user_id
       ORDER BY sr.created_at DESC`
    );

    const authorized = applications.filter((app) =>
      canAccessRequest(req, app)
    );

    return res.json(await Promise.all(
      authorized.map(async (app) => ({
        ...app,
        documents: await getDocuments(app.id)
      }))
    ));
  } catch (error) {
    console.error('getQueue error:', error);
    return res.status(500).json({
      message: 'Unable to load the application queue.'
    });
  }
};

/**
 * GET /api/requests/:id
 */
exports.getRequestDetail = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
         sr.id, sr.reference_number, sr.user_id,
         sr.service_type, sr.department, sr.notes,
         sr.status, sr.created_at, sr.updated_at,
         u.full_name, u.national_id, u.email
       FROM service_requests sr
       JOIN users u ON u.id = sr.user_id
       WHERE sr.id = ?
       LIMIT 1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (!canAccessRequest(req, rows[0])) {
      return res.status(403).json({
        message: 'You cannot access this department’s application.'
      });
    }

    const application = rows[0];
    application.documents = await getDocuments(application.id);
    application.document_count = application.documents.length;

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
 * Officer review and status changes.
 */
exports.updateRequestStatus = async (req, res) => {
  try {
    const status = String(req.body.status || '').toLowerCase();
    const reason = String(req.body.rejection_reason || '').trim();
    const officerNotes = String(req.body.officer_notes || '').trim();

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: 'Invalid application status.',
        allowedStatuses: ALLOWED_STATUSES
      });
    }

    if (status === 'rejected' && !reason) {
      return res.status(400).json({
        message: 'A rejection reason is required.'
      });
    }

    const [rows] = await db.execute(
      `SELECT id, user_id, reference_number, service_type,
              department, status, notes
       FROM service_requests WHERE id = ? LIMIT 1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    const application = rows[0];

    if (!canAccessRequest(req, application)) {
      return res.status(403).json({
        message: 'You cannot update this department’s application.'
      });
    }

    if (status === 'completed' && !['ready', 'completed'].includes(application.status)) {
      return res.status(400).json({
        message: 'An application must be reviewed and marked ready before completion.'
      });
    }

    const updatedNotes = [
      application.notes,
      officerNotes ? `Officer notes: ${officerNotes}` : '',
      status === 'rejected' ? `Rejection reason: ${reason}` : ''
    ].filter(Boolean).join('\n\n');

    await db.execute(
      `UPDATE service_requests
       SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, updatedNotes || null, application.id]
    );

    try {
      await notifyCitizen(
        application.user_id,
        `Application ${application.reference_number} status changed to ${status}.` +
          (status === 'rejected' ? ` Reason: ${reason}` : '')
      );
    } catch (notificationError) {
      console.warn('Status notification failed:', notificationError.message);
    }

    return res.json({
      message: 'Application status updated successfully.',
      id: application.id,
      reference_number: application.reference_number,
      previous_status: application.status,
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
 *
 * Generates a demo PDF for a reviewed, ready application.
 * This is a demonstration feature, NOT an official government credential.
 */
exports.issueDemoDocument = async (req, res) => {
  try {
    const officerId = getUserId(req);

    if (!EMPLOYEE_ROLES.includes(getUserRole(req))) {
      return res.status(403).json({ message: 'Officer access required.' });
    }

    const [rows] = await db.execute(
      `SELECT sr.*, u.full_name, u.national_id
       FROM service_requests sr
       JOIN users u ON u.id = sr.user_id
       WHERE sr.id = ?
       LIMIT 1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    const application = rows[0];

    if (!canAccessRequest(req, application)) {
      return res.status(403).json({
        message: 'You cannot issue a document for this department.'
      });
    }

    if (application.status !== 'ready') {
      return res.status(400).json({
        message: 'The application must be reviewed and marked ready first.'
      });
    }

    const serviceKey = String(application.service_type || '').trim().toLowerCase();
    const documentType = ISSUABLE_SERVICES[serviceKey];

    if (!documentType) {
      return res.status(400).json({
        message: 'Demo issuance is only configured for National ID registration/replacement and Birth Certificate applications.'
      });
    }

    // Reuse an already issued demo document rather than issuing duplicates.
    const [existing] = await db.execute(
      `SELECT id, document_type, document_number, file_path, status
       FROM documents
       WHERE user_id = ? AND document_type = ?
         AND file_path LIKE ?
       ORDER BY uploaded_at DESC LIMIT 1`,
      [
        application.user_id,
        documentType,
        `%${application.reference_number}%`
      ]
    );

    if (existing.length) {
      return res.json({
        message: 'A demo document has already been issued for this application.',
        document: existing[0]
      });
    }

    const documentNumber =
      `DEMO-${documentType.toUpperCase()}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

    const verificationToken = crypto.randomBytes(24).toString('hex');
    const outputDirectory = path.join(__dirname, '..', 'uploads', 'issued');
    await fs.promises.mkdir(outputDirectory, { recursive: true });

    const fileName = `${application.reference_number}-${documentNumber}.pdf`;
    const absolutePath = path.join(outputDirectory, fileName);
    const relativePath = path.posix.join('uploads', 'issued', fileName);

    // QR verification URL should point to the application's configured public URL.
    const baseUrl = String(process.env.PUBLIC_APP_URL || '').replace(/\/+$/, '');

    if (!baseUrl) {
      return res.status(500).json({
        message: 'Configure PUBLIC_APP_URL in the backend environment before issuing demo documents.'
      });
    }

    const verificationUrl =
      `${baseUrl}/verify-demo/${encodeURIComponent(verificationToken)}`;

    const qrDataUrl = await QRCode.toDataURL(verificationUrl);
    const qrImage = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    await new Promise((resolve, reject) => {
      const pdf = new PDFDocument({ size: 'A4', margin: 55 });
      const stream = fs.createWriteStream(absolutePath);

      stream.on('finish', resolve);
      stream.on('error', reject);
      pdf.on('error', reject);
      pdf.pipe(stream);

      pdf.fontSize(20).fillColor('#00209F')
        .text('MYGOV LESOTHO', { align: 'center' });

      pdf.moveDown(0.4);
      pdf.fontSize(15).fillColor('#009543')
        .text('DEMO DOCUMENT — NOT AN OFFICIAL CREDENTIAL', {
          align: 'center'
        });

      pdf.moveDown(1.5);
      pdf.fontSize(12).fillColor('#172235')
        .text(`Document type: ${documentType.replace(/_/g, ' ').toUpperCase()}`);
      pdf.moveDown(0.6);
      pdf.text(`Test document number: ${documentNumber}`);
      pdf.moveDown(0.6);
      pdf.text(`Applicant: ${application.full_name}`);
      pdf.moveDown(0.6);
      pdf.text(`Application reference: ${application.reference_number}`);
      pdf.moveDown(0.6);
      pdf.text(`Application status: ${application.status.toUpperCase()}`);
      pdf.moveDown(1);
      pdf.text(
        'This file is generated for software demonstration and testing only. ' +
        'It is not issued by a government authority and must not be used as proof of identity, birth, citizenship, or legal status.',
        { align: 'left', lineGap: 5 }
      );

      pdf.moveDown(1);
      pdf.image(qrImage, {
        fit: [130, 130],
        align: 'center'
      });

      pdf.moveDown(0.5);
      pdf.fontSize(9).fillColor('#555555')
        .text('Scan the QR code to view the demo verification status.', {
          align: 'center'
        });

      pdf.end();
    });

    try {
      await db.execute(
        `INSERT INTO documents
          (user_id, document_type, document_number, file_path, status)
         VALUES (?, ?, ?, ?, 'valid')`,
        [
          application.user_id,
          documentType,
          documentNumber,
          relativePath
        ]
      );

      await notifyCitizen(
        application.user_id,
        `A DEMO ${documentType.replace(/_/g, ' ')} document was generated for application ${application.reference_number}. It is not an official credential.`
      );
    } catch (databaseError) {
      await fs.promises.unlink(absolutePath).catch(() => {});
      throw databaseError;
    }

    return res.status(201).json({
      message: 'Demo document generated. It is not an official government credential.',
      document: {
        document_type: documentType,
        document_number: documentNumber,
        application_reference: application.reference_number,
        file_path: relativePath,
        verification_url: verificationUrl,
        demo_only: true
      }
    });
  } catch (error) {
    console.error('issueDemoDocument error:', error);
    return res.status(500).json({
      message: 'Unable to generate the demo document.'
    });
  }
};

/**
 * GET /api/requests/demo-verification/:token
 * Public demo verification endpoint; returns no sensitive citizen ID.
 */
exports.verifyDemoDocument = async (req, res) => {
  try {
    const token = String(req.params.token || '');

    // This table does not store verification tokens in the supplied schema.
    // Do not claim a QR token is verified until a dedicated token record exists.
    return res.status(501).json({
      verified: false,
      demo_only: true,
      message: 'Token verification requires a dedicated issuance table and migration.',
      token_received: Boolean(token)
    });
  } catch (error) {
    console.error('verifyDemoDocument error:', error);
    return res.status(500).json({ message: 'Verification failed.' });
  }
};
