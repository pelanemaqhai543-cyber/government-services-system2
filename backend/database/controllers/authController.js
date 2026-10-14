const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const NATIONAL_ID_REGEX = /^\d{13}$/;

/* ============================================================
   REGISTER — citizens auto-verified on registration
============================================================ */
exports.register = async (req, res) => {
  const { national_id, password, full_name, email, phone, role } = req.body;

  // ---- Validate National ID: exactly 13 digits ----
  if (!national_id) {
    return res.status(400).json({
      error: 'MISSING_NATIONAL_ID',
      message: 'Please enter your National ID number.'
    });
  }
  if (!NATIONAL_ID_REGEX.test(String(national_id))) {
    return res.status(400).json({
      error: 'INVALID_NATIONAL_ID_FORMAT',
      message: 'National ID must be exactly 13 digits. Letters and symbols are not allowed.'
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
    const [existing] = await db.query(
      'SELECT id FROM users WHERE national_id = ?',
      [national_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        error: 'DUPLICATE_ID',
        message: 'This National ID is already registered. Please log in instead.'
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const assignedRole = role || 'citizen';

    const [result] = await db.query(
      `INSERT INTO users (national_id, password, full_name, email, phone, role, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [national_id, hashed, full_name, email || null, phone || null, assignedRole]
    );

    // ---- Citizens: create profile with AUTO-VERIFIED status ----
    if (assignedRole === 'citizen') {
      await db.query(
        `INSERT INTO citizen_profiles (user_id, verification_status, verified_at)
         VALUES (?, 'auto_verified', NOW())`,
        [result.insertId]
      );

      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [result.insertId, 'Welcome to MyGov Lesotho! Your account is active and ready to use.']
      );
    }

    res.status(201).json({
      message: 'Registration successful. Your account is ready to use.',
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
      message: 'An unexpected error occurred during registration.'
    });
  }
};

/* ============================================================
   LOGIN
============================================================ */
exports.login = async (req, res) => {
  const { national_id, password } = req.body;

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

    // ---- Check if deceased ----
    if (user.status === 'deceased') {
      return res.status(403).json({
        error: 'ACCOUNT_DECEASED',
        message: 'This account is marked as deceased. Please contact Home Affairs for assistance.'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        error: 'ACCOUNT_SUSPENDED',
        message: 'This account has been suspended. Please contact Home Affairs.'
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        error: 'INVALID_PASSWORD',
        message: 'Incorrect password. Please try again.'
      });
    }

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

    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(503).json({
        error: 'DB_UNAVAILABLE',
        message: 'Service temporarily unavailable. Please try again in a moment.'
      });
    }

    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'An unexpected error occurred.'
    });
  }
};