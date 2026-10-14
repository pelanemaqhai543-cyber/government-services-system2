const db = require('../config/db');

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

const PENSION_SERVICES = ['Pension Application', 'Pension Renewal', 'Old-Age Pension'];

exports.createApplication = async (req, res) => {
  const { service_type, form_data, notes, documents } = req.body;
  const userId = req.user.id;

  if (!service_type) {
    return res.status(400).json({ error: 'MISSING_SERVICE', message: 'Please select a service type.' });
  }

  const department = DEPARTMENT_MAP[service_type];
  if (!department) {
    return res.status(400).json({ error: 'INVALID_SERVICE', message: 'Please select a valid service.' });
  }

  try {
    const [userRows] = await db.query(
      'SELECT status, is_government_employee, full_name FROM users WHERE id = ?',
      [userId]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
    }

    const user = userRows[0];

    if (user.status === 'deceased') {
      return res.status(403).json({ error: 'ACCOUNT_DECEASED', message: 'This account cannot submit applications.' });
    }

    if (PENSION_SERVICES.includes(service_type) && user.is_government_employee) {
      return res.status(403).json({
        error: 'GOV_EMPLOYEE_INELIGIBLE',
        message: 'Government employees are not eligible for pension benefits.'
      });
    }

    const prefix = SERVICE_PREFIXES[service_type] || 'APP';
    const ref = generateRef(prefix);

    const [result] = await db.query(
      `INSERT INTO citizen_applications
       (reference_number, user_id, service_type, department, form_data, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, 'submitted')`,
      [ref, userId, service_type, department, JSON.stringify(form_data || {}), notes || null]
    );

    const applicationId = result.insertId;

    if (Array.isArray(documents) && documents.length > 0) {
      for (const doc of documents) {
        if (!doc.file_data || !doc.file_name) continue;
        await db.query(
          `INSERT INTO application_documents
           (application_id, file_name, file_type, file_size, file_data)
           VALUES (?, ?, ?, ?, ?)`,
          [applicationId, doc.file_name, doc.file_type || null, doc.file_size || null, doc.file_data]
        );
      }
    }

    await db.query(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [userId, `Your application ${ref} for ${service_type} has been submitted successfully.`]
    );

    res.status(201).json({
      message: 'Application submitted successfully.',
      reference_number: ref,
      application_id: applicationId,
      service_type,
      department,
      status: 'submitted'
    });
  } catch (err) {
    console.error('createApplication error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Unable to submit: ' + err.message });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ca.*,
              (SELECT COUNT(*) FROM application_documents ad WHERE ad.application_id = ca.id) AS document_count
       FROM citizen_applications ca
       WHERE ca.user_id = ?
       ORDER BY ca.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getMyApplications error:', err);
    res.status(500).json({ message: 'Error fetching applications' });
  }
};

exports.trackByReference = async (req, res) => {
  const { reference } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT reference_number, service_type, department, status,
              rejection_reason, created_at, updated_at, processed_at
       FROM citizen_applications
       WHERE reference_number = ?`,
      [reference]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'No application found with this reference number.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('trackByReference error:', err);
    res.status(500).json({ message: 'Error fetching application' });
  }
};

exports.getApplicationById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT * FROM citizen_applications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const [docs] = await db.query(
      `SELECT id, file_name, file_type, file_size, uploaded_at
       FROM application_documents WHERE application_id = ?`,
      [id]
    );

    res.json({ ...rows[0], documents: docs });
  } catch (err) {
    console.error('getApplicationById error:', err);
    res.status(500).json({ message: 'Error fetching application' });
  }
};

exports.getOfficerQueue = async (req, res) => {
  const role = req.user.role;
  try {
    let query = `
      SELECT ca.*, u.full_name AS citizen_name, u.national_id AS citizen_id,
             u.username AS citizen_username, u.email AS citizen_email,
             u.phone AS citizen_phone, u.is_government_employee,
             (SELECT COUNT(*) FROM application_documents ad WHERE ad.application_id = ca.id) AS document_count
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
    res.json(rows);
  } catch (err) {
    console.error('getOfficerQueue error:', err);
    res.status(500).json({ message: 'Error fetching queue' });
  }
};

exports.getOfficerApplicationDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT ca.*, u.full_name AS citizen_name, u.national_id AS citizen_id,
              u.username AS citizen_username, u.email AS citizen_email,
              u.phone AS citizen_phone, u.date_of_birth, u.gender,
              u.is_government_employee
       FROM citizen_applications ca
       JOIN users u ON u.id = ca.user_id
       WHERE ca.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (req.user.role !== 'home_affairs' && rows[0].department !== req.user.role) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [docs] = await db.query(
      `SELECT id, file_name, file_type, file_size, file_data, uploaded_at
       FROM application_documents WHERE application_id = ?`,
      [id]
    );

    res.json({ ...rows[0], documents: docs });
  } catch (err) {
    console.error('getOfficerApplicationDetail error:', err);
    res.status(500).json({ message: 'Error fetching application' });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  const { id } = req.params;
  const { status, rejection_reason } = req.body;

  const validStatuses = ['submitted', 'review', 'ready', 'completed', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM citizen_applications WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (req.user.role !== 'home_affairs' && rows[0].department !== req.user.role) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await db.query(
      `UPDATE citizen_applications
       SET status = ?, rejection_reason = ?, processed_by = ?, processed_at = NOW()
       WHERE id = ?`,
      [status, rejection_reason || null, req.user.id, id]
    );

    await db.query(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [rows[0].user_id, `Your application ${rows[0].reference_number} status is now: ${status}.`]
    );

    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error('updateApplicationStatus error:', err);
    res.status(500).json({ message: 'Error updating status' });
  }
};