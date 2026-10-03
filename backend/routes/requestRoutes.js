const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/requestController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.post('/', verifyToken, requireRole('citizen'), ctrl.createRequest);
router.get('/my', verifyToken, requireRole('citizen'), ctrl.getMyRequests);
router.get('/track/:ref', verifyToken, requireRole('citizen'), ctrl.getRequestByRef);

router.get('/queue', verifyToken,
  requireRole('home_affairs', 'traffic', 'finance', 'pension', 'police', 'passport'),
  ctrl.getQueue);

router.put('/:id/status', verifyToken,
  requireRole('home_affairs', 'traffic', 'finance', 'pension', 'police', 'passport'),
  ctrl.updateRequestStatus);

module.exports = router;