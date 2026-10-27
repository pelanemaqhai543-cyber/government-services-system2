const db = require('../config/db');

/* ============================================================
   Get own profile
============================================================ */
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.national_id, u.username, u.account_type,
              u.full_name, u.email, u.phone, u.role,
              u.status, u.picture_data,
              (u.picture_data IS NOT NULL AND u.picture_data <> '') AS picture_locked,
              u.date_of_birth, u.gender,
              cp.verification_status
       FROM users u
       LEFT JOIN citizen_profiles cp ON cp.user_id = u.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Profile not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ message: 'Error fetching profile: ' + err.message });
  }
};

/* ============================================================
   Notifications
============================================================ */
exports.getNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getNotifications error:', err);
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
    console.error('markNotificationRead error:', err);
    res.status(500).json({ message: 'Error updating notification' });
  }
};

/* ============================================================
   LEGACY: Home Affairs verification
============================================================ */
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
    console.error('getPendingVerifications error:', err);
    res.status(500).json({ message: 'Error fetching verifications' });
  }
};

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
    console.error('verifyCitizen error:', err);
    res.status(500).json({ message: 'Error verifying citizen' });
  }
};

/* ============================================================
   List all citizens — Home Affairs view-only
   Includes picture_data so directory can show real avatars
============================================================ */
exports.getAllCitizens = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.national_id, u.username, u.account_type,
              u.full_name, u.email, u.phone,
              u.status, u.created_at, u.picture_data,
              u.date_of_birth, u.gender,
              cp.verification_status
       FROM users u
       LEFT JOIN citizen_profiles cp ON cp.user_id = u.id
       WHERE u.role = 'citizen'
       ORDER BY u.created_at DESC
       LIMIT 200`
    );
    res.json(rows);
  } catch (err) {
    console.error('getAllCitizens error:', err);
    res.status(500).json({ message: 'Error fetching citizens' });
  }
};

/* ============================================================
   Report a citizen as deceased
============================================================ */
exports.reportDeath = async (req, res) => {
  const { national_id, reason } = req.body;

  if (!national_id) {
    return res.status(400).json({
      error: 'MISSING_NATIONAL_ID',
      message: 'National ID is required.'
    });
  }

  try {
    const [rows] = await db.query(
      "SELECT id, full_name, status FROM users WHERE national_id = ? AND role = 'citizen'",
      [national_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'CITIZEN_NOT_FOUND',
        message: 'No citizen found with this National ID.'
      });
    }

    const citizen = rows[0];

    if (citizen.status === 'deceased') {
      return res.status(409).json({
        error: 'ALREADY_DECEASED',
        message: 'This citizen is already marked as deceased.'
      });
    }

    await db.query(
      `UPDATE users
       SET status = 'deceased',
           deceased_at = NOW(),
           deceased_reason = ?,
           deceased_reported_by = ?
       WHERE id = ?`,
      [reason || null, req.user.id, citizen.id]
    );

    const [cancelResult] = await db.query(
      `UPDATE service_requests
       SET status = 'cancelled',
           cancellation_reason = 'Citizen reported deceased'
       WHERE user_id = ? AND status NOT IN ('completed', 'cancelled', 'rejected')`,
      [citizen.id]
    );

    await db.query(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [citizen.id, `Account marked as deceased on ${new Date().toLocaleDateString()}. All active requests cancelled.`]
    );

    const affected = ['home_affairs', 'traffic', 'finance', 'pension', 'police', 'passport'];
    await db.query(
      `INSERT INTO notification_events
       (event_type, user_id, national_id, affected_departments, payload, created_by)
       VALUES ('death', ?, ?, ?, ?, ?)`,
      [
        citizen.id,
        national_id,
        affected.join(','),
        JSON.stringify({
          full_name: citizen.full_name,
          reason: reason || 'Not specified',
          cancelled_requests: cancelResult.affectedRows
        }),
        req.user.id
      ]
    );

    await db.query(
      `INSERT INTO change_log (user_id, field_changed, old_value, new_value, changed_by, reason)
       VALUES (?, 'status', 'active', 'deceased', ?, ?)`,
      [citizen.id, req.user.id, reason || 'Reported deceased']
    );

    res.json({
      message: `Citizen ${citizen.full_name} marked as deceased. ${cancelResult.affectedRows} active request(s) cancelled. All departments notified.`,
      citizen_id: citizen.id,
      cancelled_requests: cancelResult.affectedRows,
      notified_departments: affected
    });
  } catch (err) {
    console.error('reportDeath error:', err);
    res.status(500).json({ message: 'Error processing death report' });
  }
};

/* ============================================================
   Set profile picture — ONE TIME ONLY
============================================================ */
exports.updateProfilePicture = async (req, res) => {
  const { picture_url } = req.body;

  if (typeof picture_url !== 'string' || !picture_url.trim()) {
    return res.status(400).json({
      error: 'MISSING_PICTURE',
      message: 'Picture data is required.'
    });
  }

  if (picture_url.length > 8 * 1024 * 1024) {
    return res.status(413).json({
      error: 'PICTURE_TOO_LARGE',
      message: 'Picture data is too large. Please choose an image under 5MB.'
    });
  }

  try {
    const [result] = await db.query(
      `UPDATE users
       SET picture_data = ?
       WHERE id = ?
         AND (picture_data IS NULL OR picture_data = '')`,
      [picture_url.trim(), req.user.id]
    );

    if (result.affectedRows === 0) {
      const [users] = await db.query(
        'SELECT id, picture_data FROM users WHERE id = ?',
        [req.user.id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          error: 'USER_NOT_FOUND',
          message: 'User not found.'
        });
      }

      return res.status(409).json({
        error: 'PICTURE_ALREADY_SET',
        message: 'Your profile picture has already been set and cannot be changed through the portal.'
      });
    }

    await db.query(
      `INSERT INTO change_log
       (user_id, field_changed, old_value, new_value, changed_by, reason)
       VALUES (?, 'picture_data', NULL, '[base64 image set]', ?, 'Initial profile picture upload')`,
      [req.user.id, req.user.id]
    );

    return res.status(201).json({
      picture_locked: true,
      message: 'Profile picture saved. It cannot be changed again through the portal.'
    });
  } catch (err) {
    console.error('updateProfilePicture error:', err);
    return res.status(500).json({
      error: 'PICTURE_SAVE_FAILED',
      message: 'Error saving profile picture.'
    });
  }
};

/* ============================================================
   Get cross-department events (Home Affairs only)
============================================================ */
exports.getEvents = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM notification_events ORDER BY created_at DESC LIMIT 50'
    );
    res.json(rows);
  } catch (err) {
    console.error('getEvents error:', err);
    res.status(500).json({ message: 'Error fetching events' });
  }
};