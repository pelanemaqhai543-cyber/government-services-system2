const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const citizenRoutes = require('./routes/citizenRoutes');
const requestRoutes = require('./routes/requestRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const rulesRouter = require('./routes/rules');
const aiRouter = require('./routes/ai');
const documentRoutes = require('./routes/documents'); // NEW

const app = express();

// ── CORS CONFIGURATION ──
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const isLocalhost = /^https?:\/\/localhost:\d+$/i.test(origin);
    const is127 = /^https?:\/\/127\.0\.0\.1:\d+$/i.test(origin);
    const isVercel = /^https:\/\/[a-z0-9-]+(?:-[a-z0-9-]+)*\.vercel\.app$/i.test(origin);

    const allowedOrigins = (process.env.FRONTEND_URLS || '')
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);

    const isConfiguredOrigin = allowedOrigins.includes(origin);

    if (isLocalhost || is127 || isVercel || isConfiguredOrigin) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

app.get('/', (req, res) => {
  res.json({
    message: 'Gov Services API running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ── API ROUTES ──
app.use('/api/auth', authRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/rules', rulesRouter);
app.use('/api/ai', aiRouter);
app.use('/api/documents', documentRoutes); // NEW

// ── 404 HANDLER ──
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ── ERROR HANDLER ──
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
});

// ── DATABASE KEEP-ALIVE ──
const db = require('./config/db');

const keepAlive = async () => {
  try {
    await db.query('SELECT 1');
    console.log('Database keep-alive successful');
  } catch (error) {
    console.error('Database keep-alive failed:', error.message);
  }
};

const keepAliveTimer = setInterval(keepAlive, 4 * 60 * 1000);
keepAliveTimer.unref();

// ── SERVER START ──
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${PORT}`);
});