
const db = require('../config/db');
const crypto = require('crypto');

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

// Limits how many applications are processed simultaneously.
// This protects the Aiven database from excessive concurrent queries.
const AI_CONCURRENCY_LIMIT = 3;

/**
 * Process items with limited concurrency.
 * This replaces an unrestricted Promise.all() over all applications.
 */
async function mapWithConcurrency(items, limit, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const currentIndex = nextIndex++;

      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await callback(
        items[currentIndex],
        currentIndex
      );
    }
  }

  const workerCount = Math.min(
    Math.max(1, limit),
    items.length
  );

  await Promise.all(
    Array.from({ length: workerCount }, () => worker())
  );

  return results;
}

/**
 * Returns the missing documents identified by the rule engine.
 */
function getMissingDocuments(ruleResult) {
  if (!Array.isArray(ruleResult?.missing_documents)) {
    return [];
  }

  return ruleResult.missing_documents.filter(
    doc => doc && doc.document_name
  );
}

/**
 * Creates a notification message for the citizen.
 */
function buildCitizenMessage(
  app,
  decision,
  missingDocuments,
  reason,
  generated
) {
  const ref = app.reference_number || `application ${app.id}`;

  if (decision === 'approve') {
    return (
      `APPLICATION APPROVED - ${ref}\n\n` +
      `Your application has met the configured requirements and has been approved automatically.\n\n` +
      (
        generated.length
          ? `Issued number(s):\n${generated.join('\n')}\n\n`
          : ''
      ) +
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
    const details = missingDocuments
      .map((doc, index) =>
        `${index + 1}. ${doc.document_name}\n` +
        `Why required: ${doc.reason || 'Required for processing.'}\n` +
        `What to do: ${doc.action || 'Please upload this document.'}`
      )
      .join('\n\n');

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

/**
 * Generates a unique birth certificate number.
 */
async function generateUniqueBirthCertificateNumber() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const number =
      `BC-${new Date().getFullYear()}-${crypto.randomInt(100000, 1000000)}`;

    const [rows] = await db.query(
      `SELECT id
       FROM users
       WHERE birth_certificate_number = ?
       LIMIT 1`,
      [number]
    );

    if (rows.length === 0) {
      return number;
    }
  }

  throw new Error(
    'Could not generate a unique Birth Certificate number.'
  );
}

/**
 * Generates a unique National ID number.
 */
async function generateUniqueNationalID(dateOfBirth, gender) {
  const date = new Date(dateOfBirth);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      'A valid date of birth is required to generate a National ID.'
    );
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
      `SELECT id
       FROM users
       WHERE national_id = ?
       LIMIT 1`,
      [number]
    );

    if (rows.length === 0) {
      return number;
    }
  }

  throw new Error('Could not generate a unique National ID.');
}

/**
 * Issues official numbers for eligible Home Affairs applications.
 */
async function issueOfficialNumbers(app, citizen) {
  const issued = [];

  const service = String(
    app.service_type || ''
  ).toLowerCase();

  const department = String(
    app.department || ''
  ).toLowerCase();

  if (
    ![
      'home_affairs',
      'home-affairs',
      'home affairs'
    ].includes(department)
  ) {
    return issued;
  }

  // Birth certificate application
  if (service.includes('birth')) {
    const [users] = await db.query(
      `SELECT birth_certificate_number
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [app.user_id]
    );

    if (!users[0]?.birth_certificate_number) {
      const number =
        await generateUniqueBirthCertificateNumber();

      await db.query(
        `UPDATE users
         SET birth_certificate_number = ?
         WHERE id = ?
         AND (
           birth_certificate_number IS NULL
           OR birth_certificate_number = ''
         )`,
        [number, app.user_id]
      );

      const [updated] = await db.query(
        `SELECT birth_certificate_number
         FROM users
         WHERE id = ?`,
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

  // New National ID application
  const isNewId =
    (
      service.includes('id') ||
      service.includes('identity')
    ) &&
    (
      service.includes('new') ||
      service.includes('registration')
    );

  if (isNewId) {
    const [users] = await db.query(
      `SELECT national_id, date_of_birth, gender
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [app.user_id]
    );

    if (!users[0]?.national_id) {
      const dob =
        users[0]?.date_of_birth ||
        citizen.date_of_birth;

      const gender =
        users[0]?.gender ||
        citizen.gender;

      const number =
        await generateUniqueNationalID(dob, gender);

      await db.query(
        `UPDATE users
         SET national_id = ?
         WHERE id = ?
         AND (
           national_id IS NULL
           OR national_id = ''
         )`,
        [number, app.user_id]
      );

      const [updated] = await db.query(
        `SELECT national_id
         FROM users
         WHERE id = ?`,
        [app.user_id]
      );

      if (updated[0]?.national_id) {
        issued.push(
          `National ID Number: ${updated[0].national_id}`
        );
      }
    } else {
      issued.push(
        `National ID Number: ${users[0].national_id}`
      );
    }
  }

  return issued;
}

/**
 * Fallback when AI assessment cannot be completed.
 */
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

/**
 * Detects AI API quota errors.
 */
function isQuotaError(error) {
  const message = String(
    error?.message || ''
  ).toLowerCase();

  return (
    message.includes('insufficient_quota') ||
    message.includes('credit_balance_exhausted') ||
    (
      message.includes('429') &&
      (
        message.includes('no credits') ||
        message.includes('quota')
      )
    )
  );
}

/**
 * Combines AI findings with rule-engine findings.
 */
function parseFindings(aiResult, ruleResult) {
  const findings = Array.isArray(aiResult?.findings)
    ? aiResult.findings
    : [];

  return [
    ...findings,
    {
      source: 'rule_engine',
      details: ruleResult
    }
  ];
}

/**
 * MAIN AI MASTER QUEUE
 */
exports.getMasterQueue = async (req, res) => {
  try {
    const role = String(
      req.user?.role || ''
    ).toLowerCase();

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

        (
          SELECT COUNT(*)
          FROM request_documents rd
          WHERE rd.request_id = sr.id
        ) AS doc_count

      FROM service_requests sr

      INNER JOIN users u
        ON u.id = sr.user_id
    `;

    const params = [];

    if (!isAdmin && !isHomeAffairs) {
      query += `
        WHERE LOWER(sr.department) = ?
      `;

      params.push(role);
    }

    query += `
      ORDER BY sr.created_at DESC
    `;

    // Step 1: Fetch applications.
    const [applications] = await db.query(
      query,
      params
    );

    if (!applications.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        ai_available: !AI_QUOTA_EXHAUSTED,
        message: 'Master application queue loaded successfully.',
        applications: []
      });
    }

    // Step 2: Load document metadata for ALL applications
    // in a single query. Do NOT retrieve file_data.
    const applicationIds = applications.map(
      app => app.id
    );

    const placeholders = applicationIds
      .map(() => '?')
      .join(',');

    const [allDocuments] = await db.query(
      `SELECT
         request_id,
         id,
         file_name,
         document_type,
         uploaded_at

       FROM request_documents

       WHERE request_id IN (${placeholders})

       ORDER BY uploaded_at DESC`,
      applicationIds
    );

    // Step 3: Group documents by application ID.
    const documentsByApplication = new Map();

    for (const document of allDocuments) {
      const requestId = document.request_id;

      if (!documentsByApplication.has(requestId)) {
        documentsByApplication.set(
          requestId,
          []
        );
      }

      documentsByApplication
        .get(requestId)
        .push(document);
    }

    // Step 4: Process applications with limited concurrency.
    const processedApps = await mapWithConcurrency(
      applications,
      AI_CONCURRENCY_LIMIT,

      async (app) => {
        const documentCount = Number(
          app.doc_count || 0
        );

        const documents =
          documentsByApplication.get(app.id) || [];

        const appWithDocuments = {
          ...app,
          documents,
          doc_count: documentCount
        };

        // Already assessed by AI.
        if (
          app.ai_processed_at &&
          app.ai_recommendation
        ) {
          return {
            ...appWithDocuments,
            ai_processed: true
          };
        }

        // AI quota unavailable.
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

        // AI only needs document filenames.
        const applicationForReview = {
          ...app,

          documents: documents.map(
            doc => ({
              file_name: doc.file_name
            })
          ),

          document_count: documentCount
        };

        try {
          // Step 5: Run eligibility rules.
          const ruleResult = await ruleEngine.evaluate(
            app.department || 'home_affairs',
            applicationForReview,
            citizen
          );

          const missingDocuments =
            getMissingDocuments(ruleResult);

          // Step 6: Prepare AI prompt.
          const {
            system,
            user
          } = buildSummaryPrompt(
            applicationForReview,
            citizen,
            ruleResult
          );

          // Step 7: Call AI model.
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

          // Step 8: Determine final decision.
          let decision = validRecommendation;

          if (missingDocuments.length > 0) {
            decision = 'request_info';

          } else if (ruleResult?.eligible === false) {
            decision =
              validRecommendation === 'reject'
                ? 'reject'
                : 'escalate';

          } else if (ruleResult?.eligible !== true) {
            decision = 'escalate';
          }

          const statusByDecision = {
            approve: 'approved',
            reject: 'rejected',
            request_info: 'pending',
            escalate: 'review'
          };

          const newStatus =
            statusByDecision[decision];

          const summary = String(
            aiResult.summary ||
            ruleResult.reason ||
            'Assessment completed.'
          );

          const findings = parseFindings(
            aiResult,
            ruleResult
          );

          // Step 9: Safely save the AI assessment.
          // Only update applications that have not already
          // been processed by another request.
          let riskScore = Math.round(
            Number(aiResult.risk_score)
          );

          if (!Number.isFinite(riskScore)) {
            riskScore = 0;
          }

          riskScore = Math.max(
            0,
            Math.min(100, riskScore)
          );

          const [saveResult] = await db.query(
            `UPDATE service_requests

             SET
               status = ?,
               ai_summary = ?,
               ai_recommendation = ?,
               ai_risk_score = ?,
               ai_findings = ?,
               ai_processed_at = NOW()

             WHERE id = ?
               AND ai_processed_at IS NULL`,
            [
              newStatus,
              summary,
              decision,
              riskScore,
              JSON.stringify(findings),
              app.id
            ]
          );

          // Another process may have saved the assessment.
          if (saveResult.affectedRows === 0) {
            const [savedRows] = await db.query(
              `SELECT *
               FROM service_requests
               WHERE id = ?`,
              [app.id]
            );

            return {
              ...appWithDocuments,
              ...(savedRows[0] || {}),
              ai_processed: true
            };
          }

          // Step 10: Generate official numbers
          // for eligible approved applications.
          let generatedNumbers = [];

          if (decision === 'approve') {
            try {
              generatedNumbers =
                await issueOfficialNumbers(
                  app,
                  citizen
                );

            } catch (numberError) {
              console.error(
                `Number issuance failed for application ${app.id}:`,
                numberError.message
              );

              await db.query(
                `UPDATE service_requests
                 SET ai_summary = ?
                 WHERE id = ?`,
                [
                  `${summary} Approval recorded, but official number issuance needs officer attention: ${numberError.message}`,
                  app.id
                ]
              );
            }
          }

          // Step 11: Notify the citizen.
          const notification = buildCitizenMessage(
            app,
            decision,
            missingDocuments,
            ruleResult.reason || summary,
            generatedNumbers
          );

          await db.query(
            `INSERT INTO notifications
             (user_id, message)
             VALUES (?, ?)`,
            [
              app.user_id,
              notification
            ]
          );

          // Step 12: Return processed application.
          return {
            ...appWithDocuments,

            status: newStatus,

            ai_summary: summary,
            ai_recommendation: decision,
            ai_risk_score: riskScore,
            ai_findings: findings,

            ai_processed_at:
              new Date().toISOString(),

            ai_instructions: notification,

            ai_processed: true,

            manual_review_required:
              decision === 'escalate'
          };

        } catch (error) {
          if (isQuotaError(error)) {
            AI_QUOTA_EXHAUSTED = true;
          }

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
      }
    );

    // Step 13: Return the master queue.
    return res.status(200).json({
      success: true,

      count: processedApps.length,

      ai_available: !AI_QUOTA_EXHAUSTED,

      message:
        'Master application queue loaded successfully.',

      applications: processedApps
    });

  } catch (error) {
    console.error(
      'MASTER QUEUE CRASHED:',
      error
    );

    return res.status(500).json({
      success: false,

      error:
        process.env.NODE_ENV === 'production'
          ? 'Failed to load the master application queue.'
          : error.message
    });
  }
};
