const db = require('../config/db');

const generateRef = () => 'REF-' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100);

exports.createRequest = async (req, res) => {
  const { service_type, department, notes } = req.body;
  const userId = req.user.id;
  const ref = generateRef();

  if (!service_type || !department) {
    return res.status(400).json({ message: 'Service type and department required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO service_requests (reference_number, user_id, service_type, department, notes) VALUES (?, ?, ?, ?, ?)',
      [ref, userId, service_type, department, notes || null]
    );

    await db.query(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [userId, `Your request ${ref} for ${service_type} has been submitted.`]
    );

    res.status(201).json({
      message: 'Request submitted',
      requestId: result.insertId,
      reference_number: ref
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating request' });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM service_requests WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching requests' });
  }
};

exports.getRequestByRef = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM service_requests WHERE reference_number = ? AND user_id = ?',
      [req.params.ref, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Request not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching request' });
  }
};

// Officer queue
exports.getQueue = async (req, res) => {
  try {
    let query = `
      SELECT sr.*, u.full_name, u.national_id 
      FROM service_requests sr 
      JOIN users u ON sr.user_id = u.id
    `;
    const params = [];

    // Non-home-affairs roles only see their department's requests
    if (req.user.role !== 'home_affairs') {
      query += ' WHERE sr.department = ?';
      params.push(req.user.role);
    }

    query += ' ORDER BY sr.created_at DESC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching queue' });
  }
};

exports.updateRequestStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  const validStatuses = ['ready', 'review', 'submitted', 'rejected', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM service_requests WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Request not found' });

    // Non-home-affairs can only update their own department's requests
    if (req.user.role !== 'home_affairs' && rows[0].department !== req.user.role) {
      return res.status(403).json({ message: 'Access denied to this department' });
    }

    await db.query('UPDATE service_requests SET status = ? WHERE id = ?', [status, id]);

    await db.query(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [rows[0].user_id, `Your request ${rows[0].reference_number} status is now: ${status}`]
    );

    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating status' });
  }
};