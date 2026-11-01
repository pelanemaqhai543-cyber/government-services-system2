
const express = require('express');
const router = express.Router();

const {
  verifyToken,
  requireRole,
} = require('../middleware/authMiddleware');

const aiController = require('../controllers/aiController');

// ======================================================
// AUTHORIZED STAFF ROLES
// ======================================================

const STAFF_ROLES = [
  'home_affairs',
  'admin',
  'officer',
  'traffic',
  'finance',
  'pension',
  'police',
  'passport',
  'employee',
];

// ======================================================
// GET MASTER APPLICATION QUEUE
// GET /api/ai/master-queue
// ======================================================

// Admin and Home Affairs can access all applications.
// Other staff are restricted by department in aiController.
//
// This route only retrieves applications.
// It does not directly approve, reject, or change statuses.

router.get(
  '/master-queue',
  verifyToken,
  requireRole(...STAFF_ROLES),
  aiController.getMasterQueue
);

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;
