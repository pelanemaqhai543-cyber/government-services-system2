const express = require('express');
const router = express.Router();
const db = require('../config/db');
const engine = require('../rules');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const STAFF_ROLES = [
  'home_affairs',
  'admin',
  'officer',
  'employee',
  'traffic',
  'finance',
  'pension',
  'police',
  'passport',
];

router.post(
  '/evaluate',
  verifyToken,
  requireRole(...STAFF_ROLES),
  async (req, res) => {
    const applicationId = req.body.applicationId || req.body.application_id;

    if (!applicationId) {
      return res.status(400).json({
        error: 'APPLICATION_ID_REQUIRED',
        message: 'applicationId is required',
      });
    }

    try {
      const [apps] = await db.query(
        `SELECT ca.*, u.full_name AS citizen_name,
                u.national_id AS citizen_national_id,
                u.email AS citizen_email,
                u.phone AS citizen_phone,
                cp.date_of_birth, cp.gender, cp.address, cp.district
         FROM service_requests ca
         JOIN users u ON u.id = ca.user_id
         LEFT JOIN citizen_profiles cp ON cp.user_id = ca.user_id
         WHERE ca.id = ?`,
        [applicationId]
      );

      if (!apps.length) {
        return res.status(404).json({
          error: 'APPLICATION_NOT_FOUND',
          message: 'Application not found',
        });
      }

      const application = apps[0];
      if (typeof application.form_data === 'string') {
        try {
          application.form_data = JSON.parse(application.form_data);
        } catch {
          application.form_data = {};
        }
      }

      const [documents] = await db.query(
        `SELECT id, file_name, file_path
         FROM request_documents
         WHERE request_id = ?`,
        [applicationId]
      );
      application.documents = documents;

      const citizen = {
        id: application.user_id,
        full_name: application.citizen_name,
        national_id: application.citizen_national_id,
        email: application.citizen_email,
        phone: application.citizen_phone,
        date_of_birth: application.date_of_birth,
        gender: application.gender,
        address: application.address,
        district: application.district,
      };

      const result = engine.evaluate(
        application.department,
        application,
        citizen
      );

      // Keep an audit event when the optional audit table exists.
      try {
        await db.query(
          `INSERT INTO application_events
            (application_id, actor_type, from_status, to_status, reason, metadata)
           VALUES (?, 'system', ?, ?, ?, ?)`,
          [
            applicationId,
            application.status,
            application.status,
            `Rule engine: ${result.rule_id || 'evaluation'} — ${result.reason || ''}`,
            JSON.stringify(result),
          ]
        );
      } catch (eventError) {
        console.warn('Rule audit event was not recorded:', eventError.message);
      }

      res.json({
        application_id: application.id,
        rule_result: result,
      });
    } catch (err) {
      console.error('Rule engine error:', err);
      res.status(500).json({
        error: 'RULE_EVALUATION_FAILED',
        message: 'Rule evaluation failed',
      });
    }
  }
);

module.exports = router;
