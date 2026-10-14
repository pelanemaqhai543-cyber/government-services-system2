const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/citizenController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Own profile
router.get('/profile', verifyToken, ctrl.getProfile);
router.get('/notifications', verifyToken, ctrl.getNotifications);
router.put('/notifications/:id/read', verifyToken, ctrl.markNotificationRead);
router.put('/profile-picture', verifyToken, requireRole('citizen'), ctrl.updateProfilePicture);

// Home Affairs — view-only access
router.get('/all', verifyToken, requireRole('home_affairs'), ctrl.getAllCitizens);
router.post('/report-death', verifyToken, requireRole('home_affairs'), ctrl.reportDeath);
router.get('/events', verifyToken, requireRole('home_affairs'), ctrl.getEvents);

module.exports = router;