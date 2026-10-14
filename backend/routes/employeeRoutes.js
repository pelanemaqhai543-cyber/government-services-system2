const express = require('express');
const router = express.Router();

const employeeController = require('../controllers/employeeController');
const { verifyToken } = require('../middleware/authMiddleware');

const EMPLOYEE_ROLES = new Set([
  'traffic',
  'finance',
  'pension',
  'police',
  'passport',
  'home_affairs',
  'admin',
]);

const normalizeRole = (role) => {
  return String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_');
};

const requireEmployeeRole = (req, res, next) => {
  const role = normalizeRole(req.user?.role);

  if (!EMPLOYEE_ROLES.has(role)) {
    return res.status(403).json({
      message: 'You are not authorized to search citizens',
    });
  }

  req.user.role = role;
  next();
};

router.get(
  '/search-citizen',
  verifyToken,
  requireEmployeeRole,
  employeeController.searchCitizen
);

module.exports = router;
