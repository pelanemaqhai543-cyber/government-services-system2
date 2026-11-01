const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/requestController');

const {
  verifyToken,
  requireRole
} = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

const EMPLOYEE_ROLES = [
  'home_affairs',
  'admin',
  'traffic',
  'finance',
  'pension',
  'police',
  'passport'
];

// Public QR verification.
// Keep this before router.use(verifyToken).
router.get(
  '/demo-verification/:token',
  ctrl.verifyDemoDocument
);

// All routes below require authentication.
router.use(verifyToken);

// Citizen application submission.
router.post(
  '/',
  upload.array('documents', 5),
  ctrl.createRequest
);

// Officer application queue.
router.get(
  '/queue',
  requireRole(...EMPLOYEE_ROLES),
  ctrl.getQueue
);

// Issue a demonstration document.
router.post(
  '/:id/issue-demo',
  requireRole(...EMPLOYEE_ROLES),
  ctrl.issueDemoDocument
);

// Download a demonstration document.
router.get(
  '/:id/demo-document',
  ctrl.downloadDemoDocument
);

// Officer decision history.
router.get(
  '/:id/history',
  requireRole(...EMPLOYEE_ROLES),
  ctrl.getRequestHistory
);

// Officer application details.
router.get(
  '/:id',
  requireRole(...EMPLOYEE_ROLES),
  ctrl.getRequestDetail
);

// Officer decision, recommendation and citizen feedback.
router.put(
  '/:id/status',
  requireRole(...EMPLOYEE_ROLES),
  ctrl.updateRequestStatus
);

module.exports = router;