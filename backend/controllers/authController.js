const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const NATIONAL_ID_REGEX = /^\d{13}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured in the backend .env file.');
  }

  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      national_id: user.national_id || null,
      username: user.username || null,
      full_name: user.full_name
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function isDatabaseUnavailable(err) {
  return ['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST'].includes(
    err.code
  );
}

exports.register = async (req, res) => {
  const {
    account_type,
    full_name,
    national_id,
    username,
    email,
    phone,
    date_of_birth,
    gender,
    password
  } = req.body;

  if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
    return res.status(400).json({
      error: 'INVALID_NAME',
      message: 'Please enter your full name.'
    });
  }

  if (!date_of_birth) {
    return res.status(400).json({
      error: 'MISSING_DOB',
      message: 'Please enter your date of birth.'
    });
  }

  if (!gender || !['Male', 'Female', 'Other'].includes(gender)) {
    return res.status(400).json({
      error: 'INVALID_GENDER',
      message: 'Please select your gender.'
    });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      error: 'WEAK_PASSWORD',
      message: 'Password must be at least 6 characters.'
    });
  }

  if (email && !EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      error: 'INVALID_EMAIL',
      message: 'Please enter a valid email address.'
    });
  }

  const type = account_type === 'youth' ? 'youth' : 'adult';
  const normalizedEmail = email ? email.trim().toLowerCase() : null;
  const normalizedUsername = username ? String(username).trim() : null;
  const normalizedNationalId = national_id ? String(national_id).trim() : null;

  if (type === 'adult') {
    if (!normalizedNationalId) {
      return res.status(400).json({
        error: 'MISSING_NATIONAL_ID',
        message: 'Enter your National ID or select the option for people without an ID.'
      });
    }

    if (!NATIONAL_ID_REGEX.test(normalizedNationalId)) {
      return res.status(400).json({
        error: 'INVALID_NATIONAL_ID_FORMAT',
        message: 'National ID must be exactly 13 digits.'
      });
    }
  } else {
    if (!normalizedUsername) {
      return res.status(400).json({
        error: 'MISSING_USERNAME',
        message: 'Please choose a username.'
      });
    }

    if (!USERNAME_REGEX.test(normalizedUsername)) {
      return res.status(400).json({
        error: 'INVALID_USERNAME',
        message: 'Username must be 3–20 characters, using letters, numbers, and underscores.'
      });
    }
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    if (type === 'adult') {
      const [existing] = await connection.query(
        'SELECT id, role, password FROM users WHERE national_id = ? LIMIT 1',
        [normalizedNationalId]
      );

      if (existing.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          error: 'ID_NOT_FOUND',
          message: 'This National ID is not registered in the system. Please apply for a National ID first.'
        });
      }

      const existingUser = existing[0];

      if (existingUser.password && existingUser.role === 'citizen') {
        await connection.rollback();
        return res.status(409).json({
          error: 'DUPLICATE_ID',
          message: 'This National ID is already registered. Please log in instead.'
        });
      }

      await connection.query(
        `UPDATE users
         SET password = ?, full_name = ?, email = ?, phone = ?, date_of_birth = ?, gender = ?, is_verified = TRUE, status = 'active'
         WHERE national_id = ?`,
        [
          await bcrypt.hash(password, 10),
          full_name.trim(),
          normalizedEmail,
          phone || null,
          date_of_birth,
          gender,
          normalizedNationalId
        ]
      );

      const userId = existingUser.id;

      await connection.commit();

      const user = {
        id: userId,
        national_id: normalizedNationalId,
        username: null,
        full_name: full_name.trim(),
        role: 'citizen',
        account_type: type
      };

      const token = createToken(user);
      return res.status(201).json({
        message: 'Registration successful. Welcome to MyGov!',
        token,
        user
      });

    } else {
      const [existing] = await connection.query(
        'SELECT id FROM users WHERE username = ? LIMIT 1',
        [normalizedUsername]
      );

      if (existing.length) {
        await connection.rollback();
        return res.status(409).json({
          error: 'DUPLICATE_USERNAME',
          message: 'This username is already taken.'
        });
      }

      const insertFields = ['username', 'password', 'full_name', 'email', 'phone', 'role', 'account_type', 'date_of_birth', 'gender', 'is_verified', 'status'];
      const insertValues = [
        normalizedUsername,
        await bcrypt.hash(password, 10),
        full_name.trim(),
        normalizedEmail,
        phone || null,
        'citizen',
        'youth',
        date_of_birth,
        gender,
        0,
        'active'
      ];

      const placeholders = insertFields.map(() => '?').join(', ');
      const fieldList = insertFields.map(field => `\`${field}\``).join(', ');

      const [result] = await connection.query(
        `INSERT INTO users (${fieldList}) VALUES (${placeholders})`,
        insertValues
      );

      const userId = result.insertId;

      await connection.query(
        `INSERT INTO citizen_profiles (user_id, verification_status, verified_at) VALUES (?, 'pending', NULL)`,
        [userId]
      );

      await connection.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [userId, `Welcome to MyGov Lesotho, ${full_name.trim().split(' ')[0]}! Your account is ready.`]
      );

      await connection.commit();

      const user = {
        id: userId,
        national_id: null,
        username: normalizedUsername,
        full_name: full_name.trim(),
        role: 'citizen',
        account_type: type
      };

      const token = createToken(user);
      return res.status(201).json({
        message: 'Registration successful. Welcome to MyGov!',
        token,
        user
      });
    }
  } catch (err) {
    if (connection) {
      try { await connection.rollback(); } catch (e) {}
    }

    console.error('Registration error:', err);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'DUPLICATE_ACCOUNT', message: 'An account with these details already exists.' });
    }
    if (isDatabaseUnavailable(err)) {
      return res.status(503).json({ error: 'DB_UNAVAILABLE', message: 'Service temporarily unavailable.' });
    }
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Registration failed. ' + err.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  if (typeof identifier !== 'string' || !identifier.trim() || typeof password !== 'string' || !password) {
    return res.status(400).json({
      error: 'MISSING_FIELDS',
      message: 'Enter your National ID, username, or email and your password.'
    });
  }

  try {
    const trimmed = identifier.trim();

    const [rows] = await db.query(
      `SELECT * FROM users
       WHERE national_id = ?
          OR LOWER(username) = LOWER(?)
          OR LOWER(email) = LOWER(?)
       LIMIT 1`,
      [trimmed, trimmed, trimmed]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'USER_NOT_FOUND', message: 'No account found with these details.' });
    }

    const user = rows[0];

    if (user.status === 'deceased' || user.status === 'suspended') {
      return res.status(403).json({
        error: user.status === 'deceased' ? 'ACCOUNT_DECEASED' : 'ACCOUNT_SUSPENDED',
        message: 'This account cannot currently log in. Please contact Home Affairs.'
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'INVALID_PASSWORD', message: 'Incorrect password. Please try again.' });
    }

    const token = createToken(user);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        national_id: user.national_id || null,
        username: user.username || null,
        full_name: user.full_name,
        role: user.role,
        account_type: user.account_type || 'adult',
        department: user.department || null,
        picture_data: user.picture_data || null,
        is_government_employee: Boolean(user.is_government_employee)
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    if (isDatabaseUnavailable(err)) {
      return res.status(503).json({ error: 'DB_UNAVAILABLE', message: 'Service temporarily unavailable.' });
    }
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'An unexpected error occurred during login.' });
  }
};