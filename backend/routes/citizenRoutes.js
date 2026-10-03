const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/citizenController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/profile', verifyToken, ctrl.getProfile);
router.get('/notifications', verifyToken, ctrl.getNotifications);
router.put('/notifications/:id/read', verifyToken, ctrl.markNotificationRead);
router.get('/pending-verifications', verifyToken, requireRole('home_affairs'), ctrl.getPendingVerifications);
router.post('/verify', verifyToken, requireRole('home_affairs'), ctrl.verifyCitizen);

module.exports = router;