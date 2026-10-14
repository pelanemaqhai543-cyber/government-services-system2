const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/applicationController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

/* ============================================================
   CITIZEN ROUTES
============================================================ */
router.post('/', verifyToken, requireRole('citizen'), ctrl.createApplication);
router.get('/my', verifyToken, requireRole('citizen'), ctrl.getMyApplications);
router.get('/detail/:id', verifyToken, requireRole('citizen'), ctrl.getApplicationById);

/* ============================================================
   PUBLIC ROUTE — track by reference
============================================================ */
router.get('/track/:reference', ctrl.trackByReference);

/* ============================================================
   OFFICER ROUTES
============================================================ */
const OFFICER_ROLES = ['home_affairs', 'traffic', 'finance', 'pension', 'police', 'passport'];

router.get('/officer/queue', verifyToken, requireRole(...OFFICER_ROLES), ctrl.getOfficerQueue);
router.get('/officer/:id', verifyToken, requireRole(...OFFICER_ROLES), ctrl.getOfficerApplicationDetail);
router.put('/officer/:id/status', verifyToken, requireRole(...OFFICER_ROLES), ctrl.updateApplicationStatus);

module.exports = router;