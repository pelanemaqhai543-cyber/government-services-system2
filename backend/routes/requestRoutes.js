
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

// Public QR verification. This must be before router.use(verifyToken).
router.get(
  '/demo-verification/:token',
  ctrl.verifyDemoDocument
);

router.use(verifyToken);

router.post(
  '/',
  upload.array('documents', 5),
  ctrl.createRequest
);

router.get(
  '/queue',
  requireRole(...EMPLOYEE_ROLES),
  ctrl.getQueue
);

router.post(
  '/:id/issue-demo',
  requireRole(...EMPLOYEE_ROLES),
  ctrl.issueDemoDocument
);

// Keep the download route before the generic /:id route.
router.get(
  '/:id/demo-document',
  ctrl.downloadDemoDocument
);

router.get(
  '/:id',
  requireRole(...EMPLOYEE_ROLES),
  ctrl.getRequestDetail
);

router.put(
  '/:id/status',
  requireRole(...EMPLOYEE_ROLES),
  ctrl.updateRequestStatus
);

module.exports = router;
