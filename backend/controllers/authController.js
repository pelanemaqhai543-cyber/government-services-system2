const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

/* ============================================================
   REGISTER
============================================================ */
exports.register = async (req, res) => {
  const { national_id, password, full_name, email, phone, role } = req.body;

  if (!national_id && !password && !full_name) {
    return res.status(400).json({
      error: 'MISSING_FIELDS',
      message: 'National ID, password, and full name are required.'
    });
  }
  if (!national_id) {
    return res.status(400).json({
      error: 'MISSING_NATIONAL_ID',
      message: 'Please enter your National ID number.'
    });
  }
  if (!full_name) {
    return res.status(400).json({
      error: 'MISSING_FULL_NAME',
      message: 'Please enter your full name.'
    });
  }
  if (!password) {
    return res.status(400).json({
      error: 'MISSING_PASSWORD',
      message: 'Please create a password.'
    });
  }
  if (password.length < 6) {
    return res.status(400).json({
      error: 'WEAK_PASSWORD',
      message: 'Password must be at least 6 characters long.'
    });
  }

  try {
    // Check if National ID already exists
    const [existing] = await db.query(
      'SELECT id FROM users WHERE national_id = ?',
      [national_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: 'DUPLICATE_ID',
        message: 'This National ID is already registered. Please log in instead, or contact Home Affairs if this is an error.'
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const assignedRole = role || 'citizen';

    const [result] = await db.query(
      'INSERT INTO users (national_id, password, full_name, email, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [national_id, hashed, full_name, email || null, phone || null, assignedRole]
    );

    if (assignedRole === 'citizen') {
      await db.query(
        'INSERT INTO citizen_profiles (user_id, verification_status) VALUES (?, ?)',
        [result.insertId, 'pending']
      );
    }

    res.status(201).json({
      message: 'Registration successful. Your account is now pending verification by Home Affairs.',
      userId: result.insertId
    });
  } catch (err) {
    console.error('Registration error:', err);

    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(503).json({
        error: 'DB_UNAVAILABLE',
        message: 'Service temporarily unavailable. Please try again in a moment.'
      });
    }

    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'An unexpected error occurred during registration. Please try again later.'
    });
  }
};

/* ============================================================
   LOGIN
============================================================ */
exports.login = async (req, res) => {
  const { national_id, password } = req.body;

  // ---- Field validation ----
  if (!national_id && !password) {
    return res.status(400).json({
      error: 'MISSING_FIELDS',
      message: 'Please enter both your National ID and password.'
    });
  }
  if (!national_id) {
    return res.status(400).json({
      error: 'MISSING_NATIONAL_ID',
      message: 'Please enter your National ID number.'
    });
  }
  if (!password) {
    return res.status(400).json({
      error: 'MISSING_PASSWORD',
      message: 'Please enter your password.'
    });
  }

  try {
    // ---- Find user ----
    const [rows] = await db.query(
      'SELECT * FROM users WHERE national_id = ?',
      [national_id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        error: 'USER_NOT_FOUND',
        message: 'No account found with this National ID. Please check the number or create a new account.'
      });
    }

    const user = rows[0];

    // ---- Check citizen verification status ----
    if (user.role === 'citizen') {
      const [profile] = await db.query(
        'SELECT verification_status FROM citizen_profiles WHERE user_id = ?',
        [user.id]
      );

      if (profile.length > 0) {
        const status = profile[0].verification_status;
        if (status === 'pending') {
          return res.status(403).json({
            error: 'ACCOUNT_PENDING',
            message: 'Your account is pending verification by Home Affairs. You will be notified once approved.'
          });
        }
        if (status === 'rejected') {
          return res.status(403).json({
            error: 'ACCOUNT_REJECTED',
            message: 'Your account verification was rejected. Please contact Home Affairs for assistance.'
          });
        }
      }
    }

    // ---- Verify password ----
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        error: 'INVALID_PASSWORD',
        message: 'Incorrect password. Please try again or use Forgot Password.'
      });
    }

    // ---- Generate JWT ----
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        national_id: user.national_id,
        full_name: user.full_name
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // ---- Success ----
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        national_id: user.national_id,
        full_name: user.full_name,
        role: user.role,
        department: user.department
      }
    });
  } catch (err) {
    console.error('Login error:', err);

    // ---- Database connection error ----
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(503).json({
        error: 'DB_UNAVAILABLE',
        message: 'Service temporarily unavailable. Please try again in a moment.'
      });
    }

    // ---- Generic server error ----
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
};