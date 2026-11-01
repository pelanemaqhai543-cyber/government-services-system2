const db = require('../config/db');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { callModel } = require('../services/aiClient');
const {
  SUMMARY_SCHEMA,
  buildSummaryPrompt
} = require('../services/prompts');

const ruleEngine = require('../rules');

let AI_QUOTA_EXHAUSTED = false;

const VALID_RECOMMENDATIONS = new Set([
  'approve',
  'reject',
  'request_info',
  'escalate'
]);

const VALID_STATUSES = new Set([
  'pending',
  'review',
  'approved',
  'rejected',
  'completed'
]);

function getMissingDocuments(ruleResult) {
  if (!Array.isArray(ruleResult?.missing_documents)) return [];
  return ruleResult.missing_documents.filter(
    doc => doc && doc.document_name
  );
}

function buildCitizenMessage(app, decision, missingDocuments, reason, generated) {
  const ref = app.reference_number || `application ${app.id}`;

  if (decision === 'approve') {
    return (
      `APPLICATION APPROVED - ${ref}\n\n` +
      `Your application has met the configured requirements and has been approved automatically.\n\n` +
      (generated.length
        ? `Issued number(s):\n${generated.join('\n')}\n\n`
        : '') +
      `You can check your application dashboard for further details.`
    );
  }

  if (decision === 'reject') {
    return (
      `APPLICATION NOT APPROVED - ${ref}\n\n` +
      `Your application did not meet the required eligibility conditions.\n\n` +
      `Reason: ${reason || 'The configured eligibility requirements were not met.'}\n\n` +
      `Please contact the relevant department if you need clarification or wish to challenge this decision.`
    );
  }

  if (decision === 'request_info') {
    const details = missingDocuments.map((doc, index) =>
      `${index + 1}. ${doc.document_name}\n` +
      `Why required: ${doc.reason}\n` +
      `What to do: ${doc.action}`
    ).join('\n\n');

    return (
      `DOCUMENTS REQUIRED - ${ref}\n\n` +
      `Your application is missing the following required document(s):\n\n` +
      `${details}\n\n` +
      `Please upload the listed document(s) to continue processing your application.`
    );
  }

  return (
    `APPLICATION UNDER REVIEW - ${ref}\n\n` +
    `${reason || 'Your application needs additional review.'}\n\n` +
    `An authorised officer can continue reviewing and managing your application.`
  );
}

async function generateUniqueBirthCertificateNumber() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const number =
      `BC-${new Date().getFullYear()}-${crypto.randomInt(100000, 1000000)}`;

    const [rows] = await db.query(
      `SELECT id FROM users WHERE birth_certificate_number = ? LIMIT 1`,
      [number]
    );

    if (rows.length === 0) return number;
  }

  throw new Error('Could not generate a unique Birth Certificate number.');
}

async function generateUniqueNationalID(dateOfBirth, gender) {
  const date = new Date(dateOfBirth);

  if (Number.isNaN(date.getTime())) {
    throw new Error('A valid date of birth is required to generate a National ID.');
  }

  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const genderDigit =
    String(gender || '').toLowerCase() === 'male' ? '5' : '6';

  for (let attempt = 0; attempt < 10; attempt++) {
    const sequence = String(
      crypto.randomInt(0, 1000000)
    ).padStart(6, '0');

    const number = `${yy}${mm}${dd}${sequence}${genderDigit}`;

    const [rows] = await db.query(
      `SELECT id FROM users WHERE national_id = ? LIMIT 1`,
      [number]
    );

    if (rows.length === 0) return number;
  }

  throw new Error('Could not generate a unique National ID.');
}

async function issueOfficialNumbers(app, citizen) {
  const issued = [];
  const service = String(app.service_type || '').toLowerCase();
  const department = String(app.department || '').toLowerCase();

  if (!['home_affairs', 'home-affairs', 'home affairs'].includes(department)) {
    return issued;
  }

  if (service.includes('birth')) {
    const [users] = await db.query(
      `SELECT birth_certificate_number FROM users WHERE id = ? LIMIT 1`,
      [app.user_id]
    );

    if (!users[0]?.birth_certificate_number) {
      const number = await generateUniqueBirthCertificateNumber();

      await db.query(
        `UPDATE users
         SET birth_certificate_number = ?
         WHERE id = ?
         AND (birth_certificate_number IS NULL OR birth_certificate_number = '')`,
        [number, app.user_id]
      );

      const [updated] = await db.query(
        `SELECT birth_certificate_number FROM users WHERE id = ?`,
        [app.user_id]
      );

      if (updated[0]?.birth_certificate_number) {
        issued.push(
          `Birth Certificate Number: ${updated[0].birth_certificate_number}`
        );
      }
    } else {
      issued.push(
        `Birth Certificate Number: ${users[0].birth_certificate_number}`
      );
    }
  }

  const isNewId =
    (service.includes('id') || service.includes('identity')) &&
    (service.includes('new') || service.includes('registration'));

  if (isNewId) {
    const [users] = await db.query(
      `SELECT national_id, date_of_birth, gender
       FROM users WHERE id = ? LIMIT 1`,
      [app.user_id]
    );

    if (!users[0]?.national_id) {
      const dob = users[0]?.date_of_birth || citizen.date_of_birth;
      const gender = users[0]?.gender || citizen.gender;
      const number = await generateUniqueNationalID(dob, gender);

      await db.query(
        `UPDATE users
         SET national_id = ?
         WHERE id = ?
         AND (national_id IS NULL OR national_id = '')`,
        [number, app.user_id]
      );

      const [updated] = await db.query(
        `SELECT national_id FROM users WHERE id = ?`,
        [app.user_id]
      );

      if (updated[0]?.national_id) {
        issued.push(`National ID Number: ${updated[0].national_id}`);
      }
    } else {
      issued.push(`National ID Number: ${users[0].national_id}`);
    }
  }

  return issued;
}

function manualReviewResult(app, documents, documentCount) {
  return {
    ...app,
    documents: documents || [],
    doc_count: Number(documentCount || 0),
    ai_recommendation: 'escalate',
    ai_summary:
      'Automated assessment could not be completed. Officer review is required.',
    ai_instructions:
      `Your application ${app.reference_number || ''} requires further review by an authorised officer.`,
    ai_processed: false,
    ai_pending: true,
    manual_review_required: true
  };
}

function isQuotaError(error) {
  const message = String(error?.message || '').toLowerCase();

  return (
    message.includes('insufficient_quota') ||
    message.includes('credit_balance_exhausted') ||
    (message.includes('429') &&
      (message.includes('no credits') || message.includes('quota')))
  );
}

function parseFindings(aiResult, ruleResult) {
  const findings = Array.isArray(aiResult?.findings)
    ? aiResult.findings
    : [];

  return [
    ...findings,
    { source: 'rule_engine', details: ruleResult }
  ];
}

function safeParseJSON(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function generateReferenceNumber(department) {
  const prefix =
    String(department || 'APP')
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 3)
      .toUpperCase() || 'APP';

  const year = new Date().getFullYear();
  const random = crypto.randomInt(100000, 999999);

  return `${prefix}-${year}-${random}`;
}

async function generateUniqueReferenceNumber(department) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const ref = generateReferenceNumber(department);

    const [rows] = await db.query(
      `SELECT id FROM service_requests
       WHERE reference_number = ? LIMIT 1`,
      [ref]
    );

    if (rows.length === 0) return ref;
  }

  throw new Error('Could not generate a unique application reference number.');
}

function normalizeDepartment(input) {
  const value = String(input || '').toLowerCase().trim();

  const map = {
    'home affairs': 'home_affairs',
    'home-affairs': 'home_affairs',
    home_affairs: 'home_affairs',
    homeaffairs: 'home_affairs',
    traffic: 'traffic',
    finance: 'finance',
    pension: 'pension',
    police: 'police',
    passport: 'passport'
  };

  return map[value] || value;
}

/* ------------------------------------------------------------------
   MASTER AI QUEUE
------------------------------------------------------------------ */

exports.getMasterQueue = async (req, res) => {
  try {
    const role = String(req.user?.role || '').toLowerCase();
    const isAdmin = role === 'admin';
    const isHomeAffairs = role === 'home_affairs';

    let query = `
      SELECT
        sr.*,
        u.full_name,
        u.national_id,
        u.email,
        u.status AS citizen_status,
        u.birth_certificate_number,
        u.date_of_birth,
        u.gender,
        (SELECT COUNT(*) FROM request_documents rd
         WHERE rd.request_id = sr.id) AS doc_count
      FROM service_requests sr
      INNER JOIN users u ON u.id = sr.user_id
    `;

    const params = [];

    if (!isAdmin && !isHomeAffairs) {
      query += ` WHERE LOWER(sr.department) = ? `;
      params.push(role);
    }

    query += ` ORDER BY sr.created_at DESC`;

    const [applications] = await db.query(query, params);

    const processedApps = await Promise.all(
      applications.map(async (app) => {
        const documentCount = Number(app.doc_count || 0);

        const [documents] = await db.query(
          `SELECT id, file_name, document_type, uploaded_at
           FROM request_documents
           WHERE request_id = ?
           ORDER BY uploaded_at DESC`,
          [app.id]
        );

        const appWithDocuments = {
          ...app,
          documents: documents || [],
          doc_count: documentCount
        };

        if (app.ai_processed_at && app.ai_recommendation) {
          return { ...appWithDocuments, ai_processed: true };
        }

        if (AI_QUOTA_EXHAUSTED) {
          return manualReviewResult(
            appWithDocuments,
            documents,
            documentCount
          );
        }

        const citizen = {
          full_name: app.full_name,
          national_id: app.national_id,
          date_of_birth: app.date_of_birth,
          gender: app.gender,
          status: app.citizen_status
        };

        const applicationForReview = {
          ...app,
          documents: (documents || []).map(doc => ({
            file_name: doc.file_name
          })),
          document_count: documentCount
        };

        try {
          const ruleResult = await ruleEngine.evaluate(
            app.department || 'home_affairs',
            applicationForReview,
            citizen
          );

          const missingDocuments = getMissingDocuments(ruleResult);

          const { system, user } = buildSummaryPrompt(
            applicationForReview,
            citizen,
            ruleResult
          );

          const aiResult = await callModel({
            system,
            user,
            responseSchema: SUMMARY_SCHEMA,
            temperature: 0.1
          });

          const aiRecommendation = String(
            aiResult.recommendation || 'escalate'
          ).toLowerCase();

          const validRecommendation =
            VALID_RECOMMENDATIONS.has(aiRecommendation)
              ? aiRecommendation
              : 'escalate';

          let decision = validRecommendation;

          if (missingDocuments.length > 0) {
            decision = 'request_info';
          } else if (ruleResult?.eligible === false) {
            decision =
              validRecommendation === 'reject' ? 'reject' : 'escalate';
          } else if (ruleResult?.eligible !== true) {
            decision = 'escalate';
          }

          const statusByDecision = {
            approve: 'approved',
            reject: 'rejected',
            request_info: 'pending',
            escalate: 'review'
          };

          const newStatus = statusByDecision[decision];

          const summary = String(
            aiResult.summary || ruleResult.reason || 'Assessment completed.'
          );

          const findings = parseFindings(aiResult, ruleResult);

          let riskScore = Math.round(Number(aiResult.risk_score));

          if (!Number.isFinite(riskScore)) riskScore = 0;

          riskScore = Math.max(0, Math.min(100, riskScore));

          const [saveResult] = await db.query(
            `UPDATE service_requests
             SET status = ?,
                 ai_summary = ?,
                 ai_recommendation = ?,
                 ai_risk_score = ?,
                 ai_findings = ?,
                 ai_processed_at = NOW()
             WHERE id = ? AND ai_processed_at IS NULL`,
            [
              newStatus,
              summary,
              decision,
              riskScore,
              JSON.stringify(findings),
              app.id
            ]
          );

          if (saveResult.affectedRows === 0) {
            const [savedRows] = await db.query(
              `SELECT * FROM service_requests WHERE id = ?`,
              [app.id]
            );

            return {
              ...appWithDocuments,
              ...(savedRows[0] || {}),
              ai_processed: true
            };
          }

          let generatedNumbers = [];

          if (decision === 'approve') {
            try {
              generatedNumbers = await issueOfficialNumbers(app, citizen);
            } catch (numberError) {
              console.error(
                `Number issuance failed for application ${app.id}:`,
                numberError.message
              );

              await db.query(
                `UPDATE service_requests SET ai_summary = ? WHERE id = ?`,
                [
                  `${summary} Approval recorded, but official number issuance needs officer attention: ${numberError.message}`,
                  app.id
                ]
              );
            }
          }

          const notification = buildCitizenMessage(
            app,
            decision,
            missingDocuments,
            ruleResult.reason || summary,
            generatedNumbers
          );

          await db.query(
            `INSERT INTO notifications (user_id, message) VALUES (?, ?)`,
            [app.user_id, notification]
          );

          return {
            ...appWithDocuments,
            status: newStatus,
            ai_summary: summary,
            ai_recommendation: decision,
            ai_risk_score: riskScore,
            ai_findings: findings,
            ai_processed_at: new Date().toISOString(),
            ai_instructions: notification,
            ai_processed: true,
            manual_review_required: decision === 'escalate'
          };
        } catch (error) {
          if (isQuotaError(error)) AI_QUOTA_EXHAUSTED = true;

          console.error(
            `AI processing failed for application ${app.id}:`,
            error.message
          );

          return manualReviewResult(
            appWithDocuments,
            documents,
            documentCount
          );
        }
      })
    );

    return res.status(200).json({
      success: true,
      count: processedApps.length,
      ai_available: !AI_QUOTA_EXHAUSTED,
      message: 'Master application queue loaded successfully.',
      applications: processedApps
    });
  } catch (error) {
    console.error('MASTER QUEUE CRASHED:', error);

    return res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'Failed to load the master application queue.'
          : error.message
    });
  }
};

/* ------------------------------------------------------------------
   CITIZEN: CREATE APPLICATION
------------------------------------------------------------------ */

exports.createApplication = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    const {
      department,
      service_type,
      serviceType,
      details,
      additional_info,
      application_data
    } = req.body || {};

    const rawDepartment = department || req.body?.dept;
    const rawService = service_type || serviceType || req.body?.service;

    if (!rawDepartment || !rawService) {
      return res.status(400).json({
        success: false,
        error: 'Both department and service_type are required.'
      });
    }

    const normalizedDepartment = normalizeDepartment(rawDepartment);
    const referenceNumber =
      await generateUniqueReferenceNumber(normalizedDepartment);

    const payload = {
      details: details ?? null,
      additional_info: additional_info ?? null,
      application_data: application_data ?? null
    };

    const [result] = await db.query(
      `INSERT INTO service_requests
         (user_id, reference_number, department, service_type,
          status, application_data, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?, NOW())`,
      [
        userId,
        referenceNumber,
        normalizedDepartment,
        String(rawService),
        JSON.stringify(payload)
      ]
    );

    const [rows] = await db.query(
      `SELECT * FROM service_requests WHERE id = ? LIMIT 1`,
      [result.insertId]
    );

    await db.query(
      `INSERT INTO notifications (user_id, message) VALUES (?, ?)`,
      [
        userId,
        `APPLICATION RECEIVED - ${referenceNumber}\n\nYour ${String(rawService)} application for ${normalizedDepartment.replace(/_/g, ' ')} has been received and is pending review.`
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      application: rows[0] || null
    });
  } catch (error) {
    console.error('CREATE APPLICATION FAILED:', error);

    return res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'Failed to submit application.'
          : error.message
    });
  }
};

/* ------------------------------------------------------------------
   CITIZEN: GET MY APPLICATIONS
------------------------------------------------------------------ */

exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    const [applications] = await db.query(
      `SELECT
         sr.*,
         (SELECT COUNT(*) FROM request_documents rd
          WHERE rd.request_id = sr.id) AS doc_count
       FROM service_requests sr
       WHERE sr.user_id = ?
       ORDER BY sr.created_at DESC`,
      [userId]
    );

    for (const app of applications) {
      app.ai_findings = safeParseJSON(app.ai_findings, null);
    }

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error('GET MY APPLICATIONS FAILED:', error);

    return res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'Failed to load your applications.'
          : error.message
    });
  }
};

/* ------------------------------------------------------------------
   CITIZEN: NOTIFICATIONS
------------------------------------------------------------------ */

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    const [notifications] = await db.query(
      `SELECT id, user_id, message, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error('GET NOTIFICATIONS FAILED:', error);

    return res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'Failed to load notifications.'
          : error.message
    });
  }
};

/* ------------------------------------------------------------------
   CITIZEN: UPLOAD ADDITIONAL DOCUMENTS
------------------------------------------------------------------ */

exports.updateApplicationDocuments = async (req, res) => {
  const uploadedFiles = Array.isArray(req.files) ? req.files : [];

  try {
    const userId = req.user?.id;
    const applicationId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    if (!/^\d+$/.test(String(applicationId))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid application ID.'
      });
    }

    if (uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please select at least one document to upload.'
      });
    }

    const [existing] = await db.query(
      `SELECT id, user_id, status, reference_number
       FROM service_requests
       WHERE id = ?
       LIMIT 1`,
      [applicationId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Application not found.'
      });
    }

    if (Number(existing[0].user_id) !== Number(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You do not own this application.'
      });
    }

    const uploadRoot = path.resolve(
      __dirname,
      '..',
      'uploads',
      'requests'
    );

    const uploaded = [];

    for (const file of uploadedFiles) {
      const storedPath = path
        .relative(path.resolve(__dirname, '..'), file.path)
        .split(path.sep)
        .join('/');

      const documentType = 'other';

      const [insert] = await db.query(
        `INSERT INTO request_documents
           (request_id, file_name, document_type, file_path, uploaded_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [
          applicationId,
          file.originalname,
          documentType,
          storedPath
        ]
      );

      uploaded.push({
        id: insert.insertId,
        file_name: file.originalname,
        document_type: documentType,
        file_path: storedPath
      });
    }

    await db.query(
      `UPDATE service_requests
       SET status = 'pending',
           ai_processed_at = NULL,
           ai_recommendation = NULL
       WHERE id = ?`,
      [applicationId]
    );

    await db.query(
      `INSERT INTO notifications (user_id, message) VALUES (?, ?)`,
      [
        userId,
        `DOCUMENTS RECEIVED - ${existing[0].reference_number || `application ${applicationId}`}\n\nYour additional document(s) have been received and the application has been returned to the review queue.`
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Documents uploaded successfully.',
      uploaded
    });
  } catch (error) {
    console.error('UPDATE APPLICATION DOCUMENTS FAILED:', error);

    // Remove files from disk if the database operation failed.
    for (const file of uploadedFiles) {
      try {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (cleanupError) {
        console.error('UPLOADED FILE CLEANUP FAILED:', cleanupError.message);
      }
    }

    return res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'Failed to upload documents.'
          : error.message
    });
  }
};

/* ------------------------------------------------------------------
   CITIZEN: APPLICATION DETAIL
------------------------------------------------------------------ */

exports.getApplicationById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const applicationId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    const [rows] = await db.query(
      `SELECT
         sr.*,
         u.full_name,
         u.national_id,
         u.email,
         u.birth_certificate_number,
         u.date_of_birth,
         u.gender
       FROM service_requests sr
       INNER JOIN users u ON u.id = sr.user_id
       WHERE sr.id = ?
       LIMIT 1`,
      [applicationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Application not found.'
      });
    }

    const application = rows[0];

    if (Number(application.user_id) !== Number(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You do not own this application.'
      });
    }

    const [documents] = await db.query(
      `SELECT id, file_name, document_type, uploaded_at
       FROM request_documents
       WHERE request_id = ?
       ORDER BY uploaded_at DESC`,
      [applicationId]
    );

    application.documents = documents;
    application.doc_count = documents.length;
    application.ai_findings = safeParseJSON(
      application.ai_findings,
      null
    );

    return res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    console.error('GET APPLICATION BY ID FAILED:', error);

    return res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'Failed to load application.'
          : error.message
    });
  }
};

/* ------------------------------------------------------------------
   PUBLIC TRACKING
------------------------------------------------------------------ */

exports.trackByReference = async (req, res) => {
  try {
    const reference = String(req.params.reference || '').trim();

    if (!reference) {
      return res.status(400).json({
        success: false,
        error: 'Reference number is required.'
      });
    }

    const [rows] = await db.query(
      `SELECT
         sr.id,
         sr.reference_number,
         sr.department,
         sr.service_type,
         sr.status,
         sr.ai_summary,
         sr.ai_recommendation,
         sr.created_at,
         sr.updated_at,
         u.full_name
       FROM service_requests sr
       INNER JOIN users u ON u.id = sr.user_id
       WHERE sr.reference_number = ?
       LIMIT 1`,
      [reference]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No application found for that reference.'
      });
    }

    const application = rows[0];

    const [documents] = await db.query(
      `SELECT id, file_name, document_type, uploaded_at
       FROM request_documents
       WHERE request_id = ?
       ORDER BY uploaded_at DESC`,
      [application.id]
    );

    application.documents = documents;
    application.doc_count = documents.length;

    return res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    console.error('TRACK BY REFERENCE FAILED:', error);

    return res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'Failed to track application.'
          : error.message
    });
  }
};

/* ------------------------------------------------------------------
   OFFICER: QUEUE
------------------------------------------------------------------ */

exports.getOfficerQueue = async (req, res) => {
  try {
    const role = String(req.user?.role || '').toLowerCase();
    const isAdmin = role === 'admin';

    let query = `
      SELECT
        sr.*,
        u.full_name,
        u.national_id,
        u.email,
        u.status AS citizen_status,
        u.birth_certificate_number,
        u.date_of_birth,
        u.gender,
        (SELECT COUNT(*) FROM request_documents rd
         WHERE rd.request_id = sr.id) AS doc_count
      FROM service_requests sr
      INNER JOIN users u ON u.id = sr.user_id
    `;

    const params = [];

    if (!isAdmin) {
      query += ` WHERE LOWER(sr.department) = ? `;
      params.push(role);
    }

    query += `
      ORDER BY
        FIELD(sr.status, 'review', 'pending', 'approved', 'rejected', 'completed'),
        sr.created_at DESC
    `;

    const [applications] = await db.query(query, params);

    for (const app of applications) {
      app.ai_findings = safeParseJSON(app.ai_findings, null);
    }

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error('GET OFFICER QUEUE FAILED:', error);

    return res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'Failed to load officer queue.'
          : error.message
    });
  }
};

/* ------------------------------------------------------------------
   OFFICER: APPLICATION DETAIL
------------------------------------------------------------------ */

exports.getOfficerApplicationDetail = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const role = String(req.user?.role || '').toLowerCase();
    const isAdmin = role === 'admin';

    const [rows] = await db.query(
      `SELECT
         sr.*,
         u.full_name,
         u.national_id,
         u.email,
         u.status AS citizen_status,
         u.birth_certificate_number,
         u.date_of_birth,
         u.gender
       FROM service_requests sr
       INNER JOIN users u ON u.id = sr.user_id
       WHERE sr.id = ?
       LIMIT 1`,
      [applicationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Application not found.'
      });
    }

    const application = rows[0];

    if (
      !isAdmin &&
      String(application.department).toLowerCase() !== role
    ) {
      return res.status(403).json({
        success: false,
        error: 'This application is outside your department.'
      });
    }

    const [documents] = await db.query(
      `SELECT id, file_name, document_type, uploaded_at
       FROM request_documents
       WHERE request_id = ?
       ORDER BY uploaded_at DESC`,
      [applicationId]
    );

    application.documents = documents;
    application.doc_count = documents.length;
    application.ai_findings = safeParseJSON(
      application.ai_findings,
      null
    );

    return res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    console.error('GET OFFICER APPLICATION DETAIL FAILED:', error);

    return res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'Failed to load application.'
          : error.message
    });
  }
};

/* ------------------------------------------------------------------
   OFFICER: UPDATE APPLICATION STATUS
------------------------------------------------------------------ */

exports.updateApplicationStatus = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const role = String(req.user?.role || '').toLowerCase();
    const isAdmin = role === 'admin';

    const newStatusRaw = String(
      req.body?.status || req.body?.new_status || ''
    ).toLowerCase().trim();

    if (!VALID_STATUSES.has(newStatusRaw)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed: ${Array.from(VALID_STATUSES).join(', ')}.`
      });
    }

    const note = String(
      req.body?.note || req.body?.comment || ''
    ).trim();

    const [existing] = await db.query(
      `SELECT id, user_id, department, reference_number, status
       FROM service_requests
       WHERE id = ?
       LIMIT 1`,
      [applicationId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Application not found.'
      });
    }

    const application = existing[0];

    if (
      !isAdmin &&
      String(application.department).toLowerCase() !== role
    ) {
      return res.status(403).json({
        success: false,
        error: 'This application is outside your department.'
      });
    }

    await db.query(
      `UPDATE service_requests
       SET status = ?, updated_at = NOW()
       WHERE id = ?`,
      [newStatusRaw, applicationId]
    );

    const message = note
      ? `APPLICATION UPDATE - ${application.reference_number || `application ${applicationId}`}\n\nNew status: ${newStatusRaw}\n\n${note}`
      : `APPLICATION UPDATE - ${application.reference_number || `application ${applicationId}`}\n\nYour application status has been updated to: ${newStatusRaw}.`;

    await db.query(
      `INSERT INTO notifications (user_id, message) VALUES (?, ?)`,
      [application.user_id, message]
    );

    const [updatedRows] = await db.query(
      `SELECT * FROM service_requests WHERE id = ? LIMIT 1`,
      [applicationId]
    );

    return res.status(200).json({
      success: true,
      message: 'Application status updated.',
      application: updatedRows[0] || null
    });
  } catch (error) {
    console.error('UPDATE APPLICATION STATUS FAILED:', error);

    return res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'Failed to update application status.'
          : error.message
    });
  }
};