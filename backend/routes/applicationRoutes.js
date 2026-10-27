
const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/applicationController');
const {
  verifyToken,
  requireRole,
} = require('../middleware/authMiddleware');

const OFFICER_ROLES = [
  'home_affairs',
  'admin',
  'traffic',
  'finance',
  'pension',
  'police',
  'passport',
];

// Citizen application routes.
router.post(
  '/',
  verifyToken,
  requireRole('citizen'),
  ctrl.createApplication
);

router.get(
  '/my',
  verifyToken,
  requireRole('citizen'),
  ctrl.getMyApplications
);

router.get(
  '/detail/:id',
  verifyToken,
  requireRole('citizen'),
  ctrl.getApplicationById
);

// Public reference tracking.
router.get(
  '/track/:reference',
  ctrl.trackByReference
);

// Employee application queue and status processing.
router.get(
  '/officer/queue',
  verifyToken,
  requireRole(...OFFICER_ROLES),
  ctrl.getOfficerQueue
);

router.get(
  '/officer/:id',
  verifyToken,
  requireRole(...OFFICER_ROLES),
  ctrl.getOfficerApplicationDetail
);

router.put(
  '/officer/:id/status',
  verifyToken,
  requireRole(...OFFICER_ROLES),
  ctrl.updateApplicationStatus
);

module.exports = router;
