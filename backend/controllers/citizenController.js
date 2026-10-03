const db = require('../config/db');

exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.national_id, u.full_name, u.email, u.phone, u.role,
              cp.date_of_birth, cp.gender, cp.address, cp.district, cp.verification_status
       FROM users u
       LEFT JOIN citizen_profiles cp ON cp.user_id = u.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Profile not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating notification' });
  }
};

// Home Affairs: verify a citizen
exports.verifyCitizen = async (req, res) => {
  const { userId, status } = req.body;
  if (!['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    await db.query(
      `UPDATE citizen_profiles 
       SET verification_status = ?, verified_by = ?, verified_at = NOW()
       WHERE user_id = ?`,
      [status, req.user.id, userId]
    );
    res.json({ message: `Citizen ${status}` });
  } catch (err) {
    res.status(500).json({ message: 'Error verifying citizen' });
  }
};

// Home Affairs: get pending verifications
exports.getPendingVerifications = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.national_id, u.full_name, u.email, cp.created_at
       FROM users u
       JOIN citizen_profiles cp ON cp.user_id = u.id
       WHERE cp.verification_status = 'pending'
       ORDER BY cp.created_at ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching verifications' });
  }
};