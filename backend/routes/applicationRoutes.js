const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/applicationController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const OFFICER_ROLES = ['home_affairs', 'admin', 'traffic', 'finance', 'pension', 'police', 'passport'];

// Citizen routes
router.post('/', verifyToken, requireRole('citizen'), ctrl.createApplication);
router.get('/my', verifyToken, requireRole('citizen'), ctrl.getMyApplications);
router.get('/notifications', verifyToken, requireRole('citizen'), ctrl.getNotifications);

// NEW ROUTE: Update missing documents
router.put('/:id/update-documents', verifyToken, requireRole('citizen'), ctrl.updateApplicationDocuments);

router.get('/detail/:id', verifyToken, requireRole('citizen'), ctrl.getApplicationById);

// Public tracking
router.get('/track/:reference', ctrl.trackByReference);

// Officer routes
router.get('/officer/queue', verifyToken, requireRole(...OFFICER_ROLES), ctrl.getOfficerQueue);
router.get('/officer/:id', verifyToken, requireRole(...OFFICER_ROLES), ctrl.getOfficerApplicationDetail);
router.put('/officer/:id/status', verifyToken, requireRole(...OFFICER_ROLES), ctrl.updateApplicationStatus);

module.exports = router;