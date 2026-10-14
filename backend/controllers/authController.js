const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const NATIONAL_ID_REGEX = /^\d{13}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.register = async (req, res) => {
  const { account_type, full_name, national_id, username, email, phone, date_of_birth, gender, password } = req.body;

  if (!full_name || full_name.trim().length < 2) {
    return res.status(400).json({ error: 'INVALID_NAME', message: 'Please enter your full name.' });
  }
  if (!date_of_birth) {
    return res.status(400).json({ error: 'MISSING_DOB', message: 'Please enter your date of birth.' });
  }
  if (!gender || !['Male', 'Female', 'Other'].includes(gender)) {
    return res.status(400).json({ error: 'INVALID_GENDER', message: 'Please select your gender.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters.' });
  }
  if (email && !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'INVALID_EMAIL', message: 'Please enter a valid email address.' });
  }

  const type = account_type === 'youth' ? 'youth' : 'adult';

  if (type === 'adult') {
    if (!national_id) {
      return res.status(400).json({ error: 'MISSING_NATIONAL_ID', message: 'Please enter your National ID, or select "I don\'t have an ID yet".' });
    }
    if (!NATIONAL_ID_REGEX.test(String(national_id))) {
      return res.status(400).json({ error: 'INVALID_NATIONAL_ID_FORMAT', message: 'National ID must be exactly 13 digits.' });
    }
  } else {
    if (!username) {
      return res.status(400).json({ error: 'MISSING_USERNAME', message: 'Please choose a username.' });
    }
    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({ error: 'INVALID_USERNAME', message: 'Username must be 3–20 characters, letters/numbers/underscore only.' });
    }
  }

  try {
    if (type === 'adult') {
      const [existing] = await db.query('SELECT id FROM users WHERE national_id = ?', [national_id]);
      if (existing.length > 0) {
        return res.status(409).json({ error: 'DUPLICATE_ID', message: 'This National ID is already registered. Please log in instead.' });
      }
    } else {
      const [existingUser] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
      if (existingUser.length > 0) {
        return res.status(409).json({ error: 'DUPLICATE_USERNAME', message: 'This username is already taken. Please choose another.' });
      }
    }

    if (email) {
      const [existingEmail] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existingEmail.length > 0) {
        return res.status(409).json({ error: 'DUPLICATE_EMAIL', message: 'This email is already registered. Please log in instead.' });
      }
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users
       (national_id, username, account_type, password, full_name, email, phone, date_of_birth, gender, role, is_verified, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'citizen', TRUE, 'active')`,
      [
        type === 'adult' ? national_id : null,
        type === 'youth' ? username : null,
        type,
        hashed,
        full_name.trim(),
        email || null,
        phone || null,
        date_of_birth,
        gender,
      ]
    );

    const userId = result.insertId;

    await db.query(
      `INSERT INTO citizen_profiles (user_id, verification_status, verified_at) VALUES (?, 'auto_verified', NOW())`,
      [userId]
    );

    await db.query(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [userId, `Welcome to MyGov Lesotho, ${full_name.trim().split(' ')[0]}! Your account is ready.`]
    );

    const token = jwt.sign(
      { id: userId, role: 'citizen', national_id: type === 'adult' ? national_id : null, username: type === 'youth' ? username : null, full_name: full_name.trim() },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      message: 'Registration successful. Welcome to MyGov!',
      token,
      user: {
        id: userId,
        national_id: type === 'adult' ? national_id : null,
        username: type === 'youth' ? username : null,
        full_name: full_name.trim(),
        role: 'citizen',
        account_type: type,
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(503).json({ error: 'DB_UNAVAILABLE', message: 'Service temporarily unavailable. Please try again in a moment.' });
    }
    res.status(500).json({ error: 'SERVER_ERROR', message: 'An unexpected error occurred during registration. ' + err.message });
  }
};

exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Please enter your ID, username, or email and your password.' });
  }

  try {
    const trimmed = String(identifier).trim();

    const [rows] = await db.query(
      `SELECT * FROM users WHERE national_id = ? OR username = ? OR email = ? LIMIT 1`,
      [trimmed, trimmed.toLowerCase(), trimmed.toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'USER_NOT_FOUND', message: 'No account found with these details. Please check or create a new account.' });
    }

    const user = rows[0];

    if (user.status === 'deceased') {
      return res.status(403).json({ error: 'ACCOUNT_DECEASED', message: 'This account is marked as deceased. Please contact Home Affairs.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'ACCOUNT_SUSPENDED', message: 'This account has been suspended. Please contact Home Affairs.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'INVALID_PASSWORD', message: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, national_id: user.national_id, username: user.username, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        national_id: user.national_id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        account_type: user.account_type,
        department: user.department,
        picture_data: user.picture_data || null,
        is_government_employee: user.is_government_employee || false,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(503).json({ error: 'DB_UNAVAILABLE', message: 'Service temporarily unavailable. Please try again in a moment.' });
    }
    res.status(500).json({ error: 'SERVER_ERROR', message: 'An unexpected error occurred: ' + err.message });
  }
};