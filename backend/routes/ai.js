
const express = require('express');
const router = express.Router();

const {
  verifyToken,
  requireRole,
} = require('../middleware/authMiddleware');

const aiController = require('../controllers/aiController');

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

// GET /api/ai/master-queue
// Returns applications for authorized staff.
// It does not approve, reject, or change application statuses.
router.get(
  '/master-queue',
  verifyToken,
  requireRole(...STAFF_ROLES),
  aiController.getMasterQueue
);

module.exports = router;
