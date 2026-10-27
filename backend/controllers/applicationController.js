
const db = require('../config/db');
const { callModel } = require('../services/aiClient');
const { SUMMARY_SCHEMA, buildSummaryPrompt } = require('../services/prompts');

const generateRef = (prefix = 'APP') => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}-${year}-${random}`;
};

const SERVICE_PREFIXES = {
  'Birth Certificate': 'BC',
  'National ID Registration': 'ID',
  'National ID Renewal': 'IDR',
  'National ID Replacement': 'IDX',
  'Death Certificate': 'DC',
  'Marriage Certificate': 'MC',
  'Passport Application': 'PP',
  'Passport Renewal': 'PPR',
  'Police Clearance': 'PC',
  "Driver's Licence": 'DL',
  'Vehicle Registration': 'VR',
  'Tax Filing': 'TX',
  'Pension Application': 'PN',
};

const DEPARTMENT_MAP = {
  'Birth Certificate': 'home_affairs',
  'National ID Registration': 'home_affairs',
  'National ID Renewal': 'home_affairs',
  'National ID Replacement': 'home_affairs',
  'Death Certificate': 'home_affairs',
  'Marriage Certificate': 'home_affairs',
  'Passport Application': 'passport',
  'Passport Renewal': 'passport',
  'Police Clearance': 'police',
  "Driver's Licence": 'traffic',
  'Vehicle Registration': 'traffic',
  'Tax Filing': 'finance',
  'Pension Application': 'pension',
};

const PENSION_SERVICES = [
  'Pension Application',
  'Pension Renewal',
  'Old-Age Pension',
];

exports.createApplication = async (req, res) => {
  const { service_type, form_data, notes, documents } = req.body;
  const userId = req.user.id;

  if (!service_type) {
    return res.status(400).json({
      error: 'MISSING_SERVICE',
      message: 'Please select a service type.',
    });
  }

  const department = DEPARTMENT_MAP[service_type];

  if (!department) {
    return res.status(400).json({
      error: 'INVALID_SERVICE',
      message: 'Please select a valid service.',
    });
  }

  try {
    const [userRows] = await db.query(
      `SELECT status, is_government_employee, full_name, national_id
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    const user = userRows[0];

    if (user.status === 'deceased') {
      return res.status(403).json({
        error: 'ACCOUNT_DECEASED',
        message: 'This account cannot submit applications.',
      });
    }

    if (
      PENSION_SERVICES.includes(service_type) &&
      user.is_government_employee
    ) {
      return res.status(403).json({
        error: 'GOV_EMPLOYEE_INELIGIBLE',
        message: 'Government employees are not eligible for pension benefits.',
      });
    }

    const prefix = SERVICE_PREFIXES[service_type] || 'APP';
    const ref = generateRef(prefix);

    const [result] = await db.query(
      `INSERT INTO citizen_applications
       (reference_number, user_id, service_type, department,
        form_data, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, 'submitted')`,
      [
        ref,
        userId,
        service_type,
        department,
        JSON.stringify(form_data || {}),
        notes || null,
      ]
    );

    const applicationId = result.insertId;

    if (Array.isArray(documents) && documents.length > 0) {
      for (const doc of documents) {
        if (!doc.file_data || !doc.file_name) continue;

        await db.query(
          `INSERT INTO application_documents
           (application_id, file_name, file_type, file_size, file_data)
           VALUES (?, ?, ?, ?, ?)`,
          [
            applicationId,
            doc.file_name,
            doc.file_type || null,
            doc.file_size || null,
            doc.file_data,
          ]
        );
      }
    }

    // Preserve the existing AI processing workflow.
    try {
      const appForAI = {
        id: applicationId,
        reference_number: ref,
        service_type,
        department,
        form_data: form_data || {},
        notes: notes || '',
        documents: documents || [],
      };

      const citizen = {
        full_name: user.full_name,
        national_id: user.national_id,
      };

      const { system, user: promptUser } = buildSummaryPrompt(
        appForAI,
        citizen,
        { eligible: true }
      );

      const aiResult = await callModel({
        system,
        user: promptUser,
        responseSchema: SUMMARY_SCHEMA,
        temperature: 0.1,
      });

      let newStatus = 'pending';
      let notificationMsg =
        `Your application ${ref} has been submitted and is under review.`;

      if (aiResult.recommendation === 'approve') {
        newStatus = 'approved';
        notificationMsg =
          `Good news! Your application ${ref} has been APPROVED by the AI system.`;
      } else if (aiResult.recommendation === 'reject') {
        newStatus = 'rejected';
        notificationMsg =
          `Your application ${ref} was REJECTED. Reason: ${aiResult.summary}`;
      } else if (aiResult.recommendation === 'request_info') {
        newStatus = 'pending';
        notificationMsg =
          `Action required: Please upload missing documents for ${ref}. Details: ${aiResult.summary}`;
      }

      await db.query(
        `UPDATE citizen_applications
         SET status = ?,
             ai_summary = ?,
             ai_recommendation = ?,
             ai_risk_score = ?,
             ai_processed_at = NOW()
         WHERE id = ?`,
        [
          newStatus,
          aiResult.summary,
          aiResult.recommendation,
          aiResult.risk_score,
          applicationId,
        ]
      );

      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [userId, notificationMsg]
      );
    } catch (aiErr) {
      console.error('AI Submission Processing Failed:', aiErr.message);

      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [
          userId,
          `Your application ${ref} has been submitted successfully.`,
        ]
      );
    }

    return res.status(201).json({
      message: 'Application submitted and analyzed by AI.',
      reference_number: ref,
      application_id: applicationId,
      service_type,
      department,
    });
  } catch (err) {
    console.error('createApplication error:', err);

    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Unable to submit: ' + err.message,
    });
  }
};

exports.getOfficerQueue = async (req, res) => {
  const role = String(req.user.role || '').toLowerCase();

  try {
    let query = `
      SELECT ca.*,
             u.full_name AS citizen_name,
             u.national_id AS citizen_id,
             u.username AS citizen_username,
             u.email AS citizen_email,
             u.phone AS citizen_phone,
             u.picture_data AS citizen_picture,
             u.is_government_employee,
             u.date_of_birth
      FROM citizen_applications ca
      JOIN users u ON u.id = ca.user_id
    `;

    const params = [];

    if (role !== 'home_affairs') {
      query += ' WHERE ca.department = ?';
      params.push(role);
    }

    query += ' ORDER BY ca.created_at DESC';

    const [rows] = await db.query(query, params);

    const rowsWithDocs = await Promise.all(
      rows.map(async (app) => {
        const [docs] = await db.query(
          `SELECT id, file_name, file_type, file_size,
                  file_data, uploaded_at
           FROM application_documents
           WHERE application_id = ?`,
          [app.id]
        );

        return {
          ...app,
          documents: docs,
        };
      })
    );

    return res.json(rowsWithDocs);
  } catch (err) {
    console.error('getOfficerQueue error:', err);

    return res.status(500).json({
      message: 'Error fetching queue',
    });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ca.*,
              (SELECT COUNT(*)
               FROM application_documents ad
               WHERE ad.application_id = ca.id) AS document_count
       FROM citizen_applications ca
       WHERE ca.user_id = ?
       ORDER BY ca.created_at DESC`,
      [req.user.id]
    );

    return res.json(rows);
  } catch (err) {
    console.error('getMyApplications error:', err);

    return res.status(500).json({
      message: 'Error fetching applications',
    });
  }
};

exports.trackByReference = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT reference_number, service_type, department, status,
              rejection_reason, created_at, updated_at, processed_at
       FROM citizen_applications
       WHERE reference_number = ?`,
      [req.params.reference]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No application found with this reference number.',
      });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error('trackByReference error:', err);

    return res.status(500).json({
      message: 'Error fetching application',
    });
  }
};

exports.getApplicationById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT *
       FROM citizen_applications
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Application not found',
      });
    }

    const [docs] = await db.query(
      `SELECT id, file_name, file_type, file_size, file_data, uploaded_at
       FROM application_documents
       WHERE application_id = ?`,
      [req.params.id]
    );

    return res.json({
      ...rows[0],
      documents: docs,
    });
  } catch (err) {
    console.error('getApplicationById error:', err);

    return res.status(500).json({
      message: 'Error fetching application',
    });
  }
};

exports.getOfficerApplicationDetail = async (req, res) => {
  const role = String(req.user.role || '').toLowerCase();

  try {
    const [rows] = await db.query(
      `SELECT ca.*,
              u.full_name AS citizen_name,
              u.national_id AS citizen_id,
              u.username AS citizen_username,
              u.email AS citizen_email,
              u.phone AS citizen_phone,
              u.picture_data AS citizen_picture,
              u.date_of_birth,
              u.gender,
              u.is_government_employee
       FROM citizen_applications ca
       JOIN users u ON u.id = ca.user_id
       WHERE ca.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Application not found',
      });
    }

    if (role !== 'home_affairs' && rows[0].department !== role) {
      return res.status(403).json({
        message: 'Access denied',
      });
    }

    const [docs] = await db.query(
      `SELECT id, file_name, file_type, file_size, file_data, uploaded_at
       FROM application_documents
       WHERE application_id = ?`,
      [req.params.id]
    );

    return res.json({
      ...rows[0],
      documents: docs,
    });
  } catch (err) {
    console.error('getOfficerApplicationDetail error:', err);

    return res.status(500).json({
      message: 'Error fetching application',
    });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  const { status, rejection_reason } = req.body;
  const role = String(req.user.role || '').toLowerCase();

  const validStatuses = [
    'submitted',
    'pending',
    'review',
    'ready',
    'completed',
    'rejected',
    'cancelled',
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Allowed: ${validStatuses.join(', ')}`,
    });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM citizen_applications WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Application not found',
      });
    }

    if (role !== 'home_affairs' && rows[0].department !== role) {
      return res.status(403).json({
        message: 'Access denied',
      });
    }

    await db.query(
      `UPDATE citizen_applications
       SET status = ?,
           rejection_reason = ?,
           processed_by = ?,
           processed_at = NOW()
       WHERE id = ?`,
      [
        status,
        rejection_reason || null,
        req.user.id,
        req.params.id,
      ]
    );

    await db.query(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [
        rows[0].user_id,
        `Your application ${rows[0].reference_number} status is now: ${status}.`,
      ]
    );

    return res.json({
      message: 'Status updated',
    });
  } catch (err) {
    console.error('updateApplicationStatus error:', err);

    return res.status(500).json({
      message: 'Error updating status: ' + err.message,
    });
  }
};
