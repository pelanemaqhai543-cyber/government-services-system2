const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const citizenRoutes = require('./routes/citizenRoutes');
const requestRoutes = require('./routes/requestRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

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
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // Allow any Vercel preview URL (*.vercel.app)
    if (/\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    // Allow explicit list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

/* ============================================================
   HEALTH CHECK — used by Render + Vercel to verify backend is up
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
   Render requires binding to 0.0.0.0 for external access
============================================================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Allowed origins: localhost + *.vercel.app`);
});