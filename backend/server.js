const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const citizenRoutes = require('./routes/citizenRoutes');
const requestRoutes = require('./routes/requestRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const applicationRoutes = require('./routes/applicationRoutes');  // ← NEW

const app = express();

/* ============================================================
   CORS CONFIGURATION
   Allows local dev + any Vercel deployment (production + previews)
============================================================ */
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://government-services-system2.vercel.app',
  'https://government-services-system.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (/\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/* ============================================================
   BODY PARSERS — larger limit for base64 file uploads
============================================================ */
app.use(express.json({ limit: '25mb' }));                        // ← UPDATED
app.use(express.urlencoded({ limit: '25mb', extended: true })); // ← NEW

/* ============================================================
   HEALTH CHECK
============================================================ */
app.get('/', (req, res) => {
  res.json({
    message: 'Gov Services API running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/* ============================================================
   API ROUTES
============================================================ */
app.use('/api/auth', authRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/applications', applicationRoutes);                 // ← NEW

/* ============================================================
   404 HANDLER
============================================================ */
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

/* ============================================================
   GLOBAL ERROR HANDLER
============================================================ */
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
});

/* ============================================================
   SERVER START
============================================================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Allowed origins: localhost + *.vercel.app`);
});