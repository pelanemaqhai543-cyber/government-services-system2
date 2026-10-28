const db = require('../config/db');
const { callModel } = require('../services/aiClient');
const { SUMMARY_SCHEMA, buildSummaryPrompt } = require('../services/prompts');

const generateRef = (prefix = 'APP') => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}-${year}-${random}`;
};

const SERVICE_PREFIXES = {
  'Birth Certificate': 'BC', 'National ID Registration': 'ID', 'National ID Renewal': 'IDR',
  'National ID Replacement': 'IDX', 'Death Certificate': 'DC', 'Marriage Certificate': 'MC',
  'Passport Application': 'PP', 'Passport Renewal': 'PPR', 'Police Clearance': 'PC',
  "Driver's Licence": 'DL', 'Vehicle Registration': 'VR', 'Tax Filing': 'TX', 'Pension Application': 'PN',
};

const DEPARTMENT_MAP = {
  'Birth Certificate': 'home_affairs', 'National ID Registration': 'home_affairs', 'National ID Renewal': 'home_affairs',
  'National ID Replacement': 'home_affairs', 'Death Certificate': 'home_affairs', 'Marriage Certificate': 'home_affairs',
  'Passport Application': 'passport', 'Passport Renewal': 'passport', 'Police Clearance': 'police',
  "Driver's Licence": 'traffic', 'Vehicle Registration': 'traffic', 'Tax Filing': 'finance', 'Pension Application': 'pension',
};

const PENSION_SERVICES = ['Pension Application', 'Pension Renewal', 'Old-Age Pension'];

exports.createApplication = async (req, res) => {
  const { service_type, form_data, notes, documents } = req.body;
  const userId = req.user.id;

  if (!service_type) return res.status(400).json({ error: 'MISSING_SERVICE', message: 'Please select a service type.' });
  const department = DEPARTMENT_MAP[service_type];
  if (!department) return res.status(400).json({ error: 'INVALID_SERVICE', message: 'Please select a valid service.' });

  try {
    const [existing] = await db.query(
      `SELECT id, status, reference_number FROM service_requests
       WHERE user_id = ? AND service_type = ?
       AND status IN ('submitted', 'pending', 'review', 'ready')
       LIMIT 1`,
      [userId, service_type]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        error: 'DUPLICATE_APPLICATION',
        message: `You already have an active application for ${service_type} (ref: ${existing[0].reference_number}).`
      });
    }

    const [userRows] = await db.query(
      `SELECT status, is_government_employee, full_name, national_id, date_of_birth, gender
       FROM users WHERE id = ?`,
      [userId]
    );
    if (userRows.length === 0) return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });

    const user = userRows[0];
    if (user.status === 'deceased') return res.status(403).json({ error: 'ACCOUNT_DECEASED', message: 'This account cannot submit applications.' });
    if (PENSION_SERVICES.includes(service_type) && user.is_government_employee) {
      return res.status(403).json({ error: 'GOV_EMPLOYEE_INELIGIBLE', message: 'Government employees are not eligible for pension.' });
    }

    const prefix = SERVICE_PREFIXES[service_type] || 'APP';
    const ref = generateRef(prefix);

    const [result] = await db.query(
      `INSERT INTO service_requests
       (reference_number, user_id, service_type, department, form_data, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, 'submitted')`,
      [ref, userId, service_type, department, JSON.stringify(form_data || {}), notes || null]
    );

    const applicationId = result.insertId;

    if (Array.isArray(documents) && documents.length > 0) {
      for (const doc of documents) {
        if (!doc.file_data || !doc.file_name) continue;
        await db.query(
          `INSERT INTO request_documents (request_id, file_name, file_path) VALUES (?, ?, ?)`,
          [applicationId, doc.file_name, doc.file_data]
        );
      }
    }

    try {
      const appForAI = {
        id: applicationId, reference_number: ref, service_type, department,
        form_data: form_data || {}, notes: notes || '', documents: documents || [],
      };
      const citizen = { full_name: user.full_name, national_id: user.national_id, date_of_birth: user.date_of_birth, gender: user.gender };
      const { system, user: promptUser } = buildSummaryPrompt(appForAI, citizen, { eligible: true });
      const aiResult = await callModel({ system, user: promptUser, responseSchema: SUMMARY_SCHEMA, temperature: 0.1 });

      let newStatus = 'review';
      let notificationMsg = `Your application ${ref} has been received and is being processed.`;

      if (aiResult.recommendation === 'approve') { newStatus = 'approved'; notificationMsg = `Good news! Your application ${ref} has been approved.`; }
      else if (aiResult.recommendation === 'reject') { newStatus = 'rejected'; notificationMsg = `Your application ${ref} was rejected. Reason: ${aiResult.summary}.`; }
      else if (aiResult.recommendation === 'request_info') { newStatus = 'review'; notificationMsg = `Action required: Please upload missing documents for ${ref}.`; }

      await db.query(
        `UPDATE service_requests SET status = ?, ai_summary = ?, ai_recommendation = ?, ai_risk_score = ?, ai_processed_at = NOW() WHERE id = ?`,
        [newStatus, aiResult.summary, aiResult.recommendation, aiResult.risk_score, applicationId]
      );

      // GENERATE DOCUMENTS
      if (newStatus === 'approved') {
        if (service_type === 'National ID Registration') {
          if (!user.national_id || String(user.national_id).length !== 13) {
            if (user.date_of_birth) {
              const d = new Date(user.date_of_birth);
              const yy = String(d.getFullYear()).slice(-2);
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              const genderDigit = String(user.gender).toLowerCase() === 'male' ? '5' : '6';
              const seq = String(Math.floor(Math.random() * 900000) + 100000).padStart(6, '0');
              const newID = `${yy}${mm}${dd}${seq}${genderDigit}`;

              await db.query(`UPDATE users SET national_id = ? WHERE id = ?`, [newID, userId]);
              notificationMsg += ` Your National ID is ${newID}.`;
            }
          }
        } else if (service_type === 'Birth Certificate') {
          const bcNumber = `BC-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`;
          await db.query(`UPDATE users SET birth_certificate_number = ? WHERE id = ?`, [bcNumber, userId]);
          notificationMsg += ` Your Birth Certificate Number is ${bcNumber}.`;
        } else {
          const prefixMap = {
            'Passport Application': 'PP', 'Passport Renewal': 'PPR',
            "Driver's Licence": 'DL', 'Vehicle Registration': 'VR',
            'Tax Filing': 'TX', 'Pension Application': 'PN',
            'Police Clearance': 'PC'
          };
          const docPrefix = prefixMap[service_type] || 'DOC';
          const docNumber = `${docPrefix}-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`;

          await db.query(`UPDATE users SET other_document_number = ?, other_document_type = ? WHERE id = ?`, [docNumber, service_type, userId]);
          notificationMsg += ` Your ${service_type} document number is ${docNumber}.`;
        }
      }

      await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [userId, notificationMsg]);
    } catch (aiErr) {
      console.error('AI Submission Processing Failed:', aiErr.message);
      await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [userId, `Your application ${ref} has been received and is under review.`]);
    }

    return res.status(201).json({ message: 'Submitted.', reference_number: ref, application_id: applicationId, service_type, department });
  } catch (err) {
    console.error('createApplication error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Unable to submit: ' + err.message });
  }
};

exports.updateApplicationDocuments = async (req, res) => {
  const { documents } = req.body;
  const applicationId = req.params.id;
  const userId = req.user.id;

  try {
    const [apps] = await db.query(
      `SELECT id, status, reference_number, service_type, department FROM service_requests WHERE id = ? AND user_id = ?`,
      [applicationId, userId]
    );

    if (apps.length === 0) return res.status(404).json({ message: 'Application not found' });
    const app = apps[0];
    if (!['review', 'pending', 'submitted'].includes(app.status)) {
      return res.status(400).json({ message: 'You can only update applications that are under review.' });
    }

    if (Array.isArray(documents) && documents.length > 0) {
      for (const doc of documents) {
        if (!doc.file_data || !doc.file_name) continue;
        await db.query(
          `INSERT INTO request_documents (request_id, file_name, file_path) VALUES (?, ?, ?)`,
          [applicationId, doc.file_name, doc.file_data]
        );
      }
    }

    await db.query(
      `UPDATE service_requests SET status = 'submitted', ai_summary = NULL, ai_processed_at = NULL WHERE id = ?`,
      [applicationId]
    );

    const [userRows] = await db.query(`SELECT full_name, national_id, date_of_birth, gender FROM users WHERE id = ?`, [userId]);
    const user = userRows[0];

    try {
      const [docs] = await db.query(`SELECT file_name, file_path FROM request_documents WHERE request_id = ?`, [applicationId]);
      const appForAI = { id: applicationId, reference_number: app.reference_number, service_type: app.service_type, department: app.department, documents: docs };
      const citizen = { full_name: user.full_name, national_id: user.national_id, date_of_birth: user.date_of_birth, gender: user.gender };
      const { system, user: promptUser } = buildSummaryPrompt(appForAI, citizen, { eligible: true });
      const aiResult = await callModel({ system, user: promptUser, responseSchema: SUMMARY_SCHEMA, temperature: 0.1 });

      let newStatus = 'review';
      let notificationMsg = `Your application ${app.reference_number} is under review.`;

      if (aiResult.recommendation === 'approve') { newStatus = 'approved'; notificationMsg = `Good news! Your application ${app.reference_number} has been approved.`; }
      else if (aiResult.recommendation === 'reject') { newStatus = 'rejected'; notificationMsg = `Your application ${app.reference_number} was rejected. Reason: ${aiResult.summary}.`; }
      else if (aiResult.recommendation === 'request_info') { newStatus = 'review'; notificationMsg = `Action required: Please upload missing documents for ${app.reference_number}.`; }

      await db.query(
        `UPDATE service_requests SET status = ?, ai_summary = ?, ai_recommendation = ?, ai_risk_score = ?, ai_processed_at = NOW() WHERE id = ?`,
        [newStatus, aiResult.summary, aiResult.recommendation, aiResult.risk_score, applicationId]
      );

      if (newStatus === 'approved') {
        if (app.service_type === 'National ID Registration') {
          if (!user.national_id || String(user.national_id).length !== 13) {
            if (user.date_of_birth) {
              const d = new Date(user.date_of_birth);
              const yy = String(d.getFullYear()).slice(-2);
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              const genderDigit = String(user.gender).toLowerCase() === 'male' ? '5' : '6';
              const seq = String(Math.floor(Math.random() * 900000) + 100000).padStart(6, '0');
              const newID = `${yy}${mm}${dd}${seq}${genderDigit}`;

              await db.query(`UPDATE users SET national_id = ? WHERE id = ?`, [newID, userId]);
              notificationMsg += ` Your National ID is ${newID}.`;
            }
          }
        } else if (app.service_type === 'Birth Certificate') {
          const bcNumber = `BC-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`;
          await db.query(`UPDATE users SET birth_certificate_number = ? WHERE id = ?`, [bcNumber, userId]);
          notificationMsg += ` Your Birth Certificate Number is ${bcNumber}.`;
        } else {
          const prefixMap = {
            'Passport Application': 'PP', 'Passport Renewal': 'PPR',
            "Driver's Licence": 'DL', 'Vehicle Registration': 'VR',
            'Tax Filing': 'TX', 'Pension Application': 'PN',
            'Police Clearance': 'PC'
          };
          const docPrefix = prefixMap[app.service_type] || 'DOC';
          const docNumber = `${docPrefix}-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`;

          await db.query(`UPDATE users SET other_document_number = ?, other_document_type = ? WHERE id = ?`, [docNumber, app.service_type, userId]);
          notificationMsg += ` Your ${app.service_type} document number is ${docNumber}.`;
        }
      }

      await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [userId, notificationMsg]);
      return res.json({ message: 'Application processed successfully.' });

    } catch (aiErr) {
      console.error('AI Re-processing Failed:', aiErr.message);
      return res.json({ message: 'Documents uploaded. Your application is under review.' });
    }

  } catch (err) {
    console.error('updateApplicationDocuments error:', err);
    return res.status(500).json({ message: 'Error updating application' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) { return res.status(500).json({ message: 'Error fetching notifications' }); }
};

exports.deleteNotification = async (req, res) => {
  try {
    await db.query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ success: true, message: 'Notification deleted' });
  } catch (err) { return res.status(500).json({ message: 'Error deleting notification' }); }
};

exports.getOfficerQueue = async (req, res) => {
  const role = String(req.user.role || '').toLowerCase();
  try {
    let query = `
      SELECT sr.*, u.full_name AS citizen_name, u.national_id AS citizen_id,
             u.email AS citizen_email, u.phone AS citizen_phone, u.picture_data AS citizen_picture,
             u.date_of_birth, u.is_government_employee
      FROM service_requests sr
      JOIN users u ON u.id = sr.user_id
    `;
    const params = [];
    if (role !== 'home_affairs') { query += ' WHERE sr.department = ?'; params.push(role); }
    query += ' ORDER BY sr.created_at DESC';

    const [rows] = await db.query(query, params);
    const rowsWithDocs = await Promise.all(rows.map(async (app) => {
      const [docs] = await db.query(`SELECT id, file_name, file_path, uploaded_at FROM request_documents WHERE request_id = ?`, [app.id]);
      return { ...app, documents: docs };
    }));
    return res.json(rowsWithDocs);
  } catch (err) { return res.status(500).json({ message: 'Error fetching queue' }); }
};

exports.getMyApplications = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT sr.*, (SELECT COUNT(*) FROM request_documents rd WHERE rd.request_id = sr.id) AS document_count
       FROM service_requests sr WHERE sr.user_id = ? ORDER BY sr.created_at DESC`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) { return res.status(500).json({ message: 'Error fetching applications' }); }
};

exports.trackByReference = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT reference_number, service_type, department, status, notes, created_at, updated_at, ai_summary
       FROM service_requests WHERE reference_number = ?`,
      [req.params.reference]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND', message: 'No application found.' });
    return res.json(rows[0]);
  } catch (err) { return res.status(500).json({ message: 'Error fetching application' }); }
};

exports.getApplicationById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM service_requests WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Application not found' });
    const [docs] = await db.query(`SELECT id, file_name, file_path, uploaded_at FROM request_documents WHERE request_id = ?`, [req.params.id]);
    return res.json({ ...rows[0], documents: docs });
  } catch (err) { return res.status(500).json({ message: 'Error fetching application' }); }
};

exports.getOfficerApplicationDetail = async (req, res) => {
  const role = String(req.user.role || '').toLowerCase();
  try {
    const [rows] = await db.query(
      `SELECT sr.*, u.full_name AS citizen_name, u.national_id AS citizen_id, u.email AS citizen_email, u.phone AS citizen_phone, u.picture_data AS citizen_picture, u.date_of_birth, u.gender
       FROM service_requests sr JOIN users u ON u.id = sr.user_id WHERE sr.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Application not found' });
    if (role !== 'home_affairs' && rows[0].department !== role) return res.status(403).json({ message: 'Access denied' });
    const [docs] = await db.query(`SELECT id, file_name, file_path, uploaded_at FROM request_documents WHERE request_id = ?`, [req.params.id]);
    return res.json({ ...rows[0], documents: docs });
  } catch (err) { return res.status(500).json({ message: 'Error fetching application' }); }
};

exports.updateApplicationStatus = async (req, res) => {
  const { status, rejection_reason } = req.body;
  const role = String(req.user.role || '').toLowerCase();
  const validStatuses = ['submitted', 'pending', 'review', 'ready', 'completed', 'rejected', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ message: `Invalid status.` });

  try {
    const [rows] = await db.query('SELECT * FROM service_requests WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Application not found' });
    if (role !== 'home_affairs' && rows[0].department !== role) return res.status(403).json({ message: 'Access denied' });

    await db.query(
      `UPDATE service_requests SET status = ?, notes = CONCAT(COALESCE(notes, ''), ?) WHERE id = ?`,
      [status, rejection_reason ? `\nOfficer: ${rejection_reason}` : '', req.params.id]
    );

    if (status === 'rejected') {
      await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [rows[0].user_id, `Your application ${rows[0].reference_number} was rejected. Reason: ${rejection_reason || 'see details'}.`]);
    } else {
      await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [rows[0].user_id, `Your application ${rows[0].reference_number} status is now: ${status}.`]);
    }
    return res.json({ message: 'Status updated' });
  } catch (err) { return res.status(500).json({ message: 'Error updating status: ' + err.message }); }
};