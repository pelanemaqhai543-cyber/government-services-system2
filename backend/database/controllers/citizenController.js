const db = require('../config/db');

/* ============================================================
   Get own profile
============================================================ */
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.national_id, u.full_name, u.email, u.phone, u.role,
              u.status, u.picture_url, u.picture_locked_until,
              cp.date_of_birth, cp.gender, cp.address, cp.district,
              cp.verification_status
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

/* ============================================================
   List all citizens — for Home Affairs viewing (no verify)
============================================================ */
exports.getAllCitizens = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.national_id, u.full_name, u.email, u.phone,
              u.status, u.created_at,
              cp.date_of_birth, cp.gender, cp.address, cp.district,
              cp.verification_status
       FROM users u
       LEFT JOIN citizen_profiles cp ON cp.user_id = u.id
       WHERE u.role = 'citizen'
       ORDER BY u.created_at DESC
       LIMIT 200`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching citizens' });
  }
};

/* ============================================================
   Report a citizen as deceased
   — auto-cancels all requests
   — creates notification events for all departments
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

    // 1. Mark user as deceased
    await db.query(
      `UPDATE users
       SET status = 'deceased',
           deceased_at = NOW(),
           deceased_reason = ?,
           deceased_reported_by = ?
       WHERE id = ?`,
      [reason || null, req.user.id, citizen.id]
    );

    // 2. Cancel all active requests
    const [cancelResult] = await db.query(
      `UPDATE service_requests
       SET status = 'cancelled',
           cancellation_reason = 'Citizen reported deceased'
       WHERE user_id = ? AND status NOT IN ('completed', 'cancelled', 'rejected')`,
      [citizen.id]
    );

    // 3. Notify the citizen's account (record kept for audit)
    await db.query(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [citizen.id, `Account marked as deceased on ${new Date().toLocaleDateString()}. All active requests cancelled.`]
    );

    // 4. Broadcast event to all departments
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

    // 5. Log the change
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
   Change profile picture (restricted)
   — only once every 180 days
   — must provide a reason
============================================================ */
exports.updateProfilePicture = async (req, res) => {
  const { picture_url, reason } = req.body;

  if (!picture_url) {
    return res.status(400).json({
      error: 'MISSING_PICTURE',
      message: 'Picture URL is required.'
    });
  }

  if (!reason || reason.trim().length < 10) {
    return res.status(400).json({
      error: 'MISSING_REASON',
      message: 'Please provide a valid reason (at least 10 characters) for changing your picture.'
    });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, picture_url, picture_locked_until FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];

    // ---- Check lock ----
    if (user.picture_locked_until && new Date(user.picture_locked_until) > new Date()) {
      const daysLeft = Math.ceil(
        (new Date(user.picture_locked_until) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return res.status(429).json({
        error: 'PICTURE_LOCKED',
        message: `You cannot change your profile picture yet. You can change it in ${daysLeft} day(s). Please visit Home Affairs for urgent cases.`
      });
    }

    // ---- Apply the change ----
    await db.query(
      `UPDATE users
       SET picture_url = ?,
           picture_locked_until = DATE_ADD(NOW(), INTERVAL 180 DAY)
       WHERE id = ?`,
      [picture_url, req.user.id]
    );

    // ---- Log it ----
    await db.query(
      `INSERT INTO change_log (user_id, field_changed, old_value, new_value, changed_by, reason)
       VALUES (?, 'picture_url', ?, ?, ?, ?)`,
      [req.user.id, user.picture_url || null, picture_url, req.user.id, reason.trim()]
    );

    res.json({
      message: 'Profile picture updated. You can change it again in 180 days.',
      locked_until: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (err) {
    console.error('updateProfilePicture error:', err);
    res.status(500).json({ message: 'Error updating profile picture' });
  }
};

/* ============================================================
   Get cross-department events (Home Affairs only)
============================================================ */
exports.getEvents = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM notification_events ORDER BY created_at DESC LIMIT 50`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching events' });
  }
};