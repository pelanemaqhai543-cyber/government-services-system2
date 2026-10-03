const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

exports.register = async (req, res) => {
  const { national_id, password, full_name, email, phone, role } = req.body;

  if (!national_id || !password || !full_name) {
    return res.status(400).json({ message: 'National ID, password, and full name are required' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE national_id = ?', [national_id]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'National ID already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const assignedRole = role || 'citizen';

    const [result] = await db.query(
      'INSERT INTO users (national_id, password, full_name, email, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [national_id, hashed, full_name, email || null, phone || null, assignedRole]
    );

    // Create citizen profile if citizen
    if (assignedRole === 'citizen') {
      await db.query(
        'INSERT INTO citizen_profiles (user_id, verification_status) VALUES (?, ?)',
        [result.insertId, 'pending']
      );
    }

    res.status(201).json({ message: 'Registration successful', userId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  const { national_id, password } = req.body;

  if (!national_id || !password) {
    return res.status(400).json({ message: 'National ID and password required' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE national_id = ?', [national_id]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, national_id: user.national_id, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
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
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
};