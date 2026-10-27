
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

// REGISTER
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

    // Check whether the selected identifier already exists.
    if (type === 'adult') {
      const [existing] = await connection.query(
        'SELECT id FROM users WHERE national_id = ? LIMIT 1',
        [normalizedNationalId]
      );

      if (existing.length) {
        await connection.rollback();
        return res.status(409).json({
          error: 'DUPLICATE_ID',
          message: 'This National ID is already registered. Please log in instead.'
        });
      }
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
    }

    if (normalizedEmail) {
      const [existing] = await connection.query(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [normalizedEmail]
      );

      if (existing.length) {
        await connection.rollback();
        return res.status(409).json({
          error: 'DUPLICATE_EMAIL',
          message: 'This email is already registered.'
        });
      }
    }

    // Check the actual users table so missing optional columns
    // do not cause the registration INSERT to fail.
    const [columnRows] = await connection.query(
      'SHOW COLUMNS FROM users'
    );
    const columns = new Set(columnRows.map(column => column.Field));

    const insertFields = [
      'national_id',
      'password',
      'full_name',
      'email',
      'phone',
      'role'
    ];

    const insertValues = [
      type === 'adult' ? normalizedNationalId : null,
      await bcrypt.hash(password, 10),
      full_name.trim(),
      normalizedEmail,
      phone || null,
      'citizen'
    ];

    const optionalValues = {
      username: type === 'youth' ? normalizedUsername : null,
      account_type: type,
      date_of_birth: date_of_birth,
      gender: gender,
      is_verified: 0,
      status: 'active'
    };

    for (const [column, value] of Object.entries(optionalValues)) {
      if (columns.has(column)) {
        insertFields.push(column);
        insertValues.push(value);
      }
    }

    const placeholders = insertFields.map(() => '?').join(', ');
    const fieldList = insertFields.map(field => `\`${field}\``).join(', ');

    const [result] = await connection.query(
      `INSERT INTO users (${fieldList}) VALUES (${placeholders})`,
      insertValues
    );

    const userId = result.insertId;

    // Create a profile if the existing schema supports the expected table.
    await connection.query(
      `INSERT INTO citizen_profiles
       (user_id, verification_status, verified_at)
       VALUES (?, 'pending', NULL)`,
      [userId]
    );

    await connection.query(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [
        userId,
        `Welcome to MyGov Lesotho, ${full_name.trim().split(' ')[0]}! Your account is ready.`
      ]
    );

    await connection.commit();

    const user = {
      id: userId,
      national_id: type === 'adult' ? normalizedNationalId : null,
      username: type === 'youth' ? normalizedUsername : null,
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
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Registration rollback error:', rollbackError.message);
      }
    }

    console.error('Registration error:', err);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'DUPLICATE_ACCOUNT',
        message: 'An account with these details already exists.'
      });
    }

    if (isDatabaseUnavailable(err)) {
      return res.status(503).json({
        error: 'DB_UNAVAILABLE',
        message: 'Service temporarily unavailable. Please try again.'
      });
    }

    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Registration failed. Check the backend terminal for details.'
    });
  } finally {
    if (connection) connection.release();
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  if (
    typeof identifier !== 'string' ||
    !identifier.trim() ||
    typeof password !== 'string' ||
    !password
  ) {
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
      console.log('Login failed: account not found.');
      return res.status(401).json({
        error: 'USER_NOT_FOUND',
        message: 'No account found with these details.'
      });
    }

    const user = rows[0];

    if (user.status === 'deceased' || user.status === 'suspended') {
      return res.status(403).json({
        error: user.status === 'deceased'
          ? 'ACCOUNT_DECEASED'
          : 'ACCOUNT_SUSPENDED',
        message: 'This account cannot currently log in. Please contact Home Affairs.'
      });
    }

    // All accounts, including seeded officers, use bcrypt.
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      console.log('Login failed: password mismatch for account ID:', user.id);
      return res.status(401).json({
        error: 'INVALID_PASSWORD',
        message: 'Incorrect password. Please try again.'
      });
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
      return res.status(503).json({
        error: 'DB_UNAVAILABLE',
        message: 'Service temporarily unavailable. Please try again.'
      });
    }

    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'An unexpected error occurred during login.'
    });
  }
};
