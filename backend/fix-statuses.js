
// backend/fix-statuses.js

const db = require('./config/db');
const { callModel } = require('./services/aiClient');
const {
  SUMMARY_SCHEMA,
  buildSummaryPrompt,
} = require('./services/prompts');

const ruleEngine = require('./rules');

const VALID_RECOMMENDATIONS = [
  'approve',
  'request_info',
  'escalate',
  'reject',
];

function safeJson(value, fallback = []) {
  if (Array.isArray(value)) return value;

  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function getApplicationDocuments(applicationId) {
  const [documents] = await db.query(
    `SELECT
       id,
       file_name,
       file_path,
       uploaded_at
     FROM request_documents
     WHERE request_id = ?
     ORDER BY uploaded_at DESC`,
    [applicationId]
  );

  return documents;
}

async function reviewApplication(app) {
  console.log(
    `Reviewing: ${app.reference_number} ` +
    `(Current: ${app.status}, Documents: ${app.documents.length})`
  );

  const citizen = {
    id: app.user_id,
    full_name: app.full_name,
    national_id: app.national_id,
    email: app.email,
    phone: app.phone,
    date_of_birth: app.date_of_birth,
    status: app.citizen_status,
  };

  const ruleResult = ruleEngine.evaluate(
    app.department || 'home_affairs',
    app,
    citizen
  );

  const { system, user } = buildSummaryPrompt(
    app,
    citizen,
    ruleResult
  );

  const aiResult = await callModel({
    system,
    user,
    responseSchema: SUMMARY_SCHEMA,
    temperature: 0.1,
  });

  const recommendation = VALID_RECOMMENDATIONS.includes(
    aiResult.recommendation
  )
    ? aiResult.recommendation
    : 'escalate';

  const summary = String(
    aiResult.summary || 'AI summary unavailable.'
  );

  const riskScore = Math.max(
    0,
    Math.min(100, Number(aiResult.risk_score) || 0)
  );

  const findings = Array.isArray(aiResult.findings)
    ? aiResult.findings
    : [];

  /*
   * IMPORTANT:
   * The AI records a recommendation, but does not decide
   * the application's official status.
   *
   * Keep the existing application status unchanged.
   */
  await db.query(
    `UPDATE service_requests
     SET
       ai_summary = ?,
       ai_recommendation = ?,
       ai_risk_score = ?,
       ai_findings = ?,
       ai_processed_at = NOW()
     WHERE id = ?`,
    [
      summary,
      recommendation,
      riskScore,
      JSON.stringify(findings),
      app.id,
    ]
  );

  let message;

  switch (recommendation) {
    case 'approve':
      message =
        `Your application ${app.reference_number} has been reviewed ` +
        'by the AI assistant and is awaiting an authorised officer decision.';
      break;

    case 'reject':
      message =
        `Your application ${app.reference_number} requires an authorised ` +
        'officer review before a final decision can be made.';
      break;

    case 'request_info':
      message =
        `Your application ${app.reference_number} may require additional ` +
        'information. Please check your application portal for updates.';
      break;

    default:
      message =
        `Your application ${app.reference_number} has been flagged ` +
        'for additional review by a government officer.';
  }

  await db.query(
    `INSERT INTO notifications (user_id, message)
     VALUES (?, ?)`,
    [app.user_id, message]
  );

  console.log(
    `  AI recommendation: ${recommendation.toUpperCase()}`
  );

  console.log(
    `  Application status remains: ${app.status}`
  );

  console.log('  AI summary saved; notification created.\n');
}

async function fixOldApplications() {
  console.log('AI APPLICATION REVIEW STARTED\n');

  try {
    /*
     * This query uses service_requests, which is the
     * application table in your existing database.
     */
    const [applications] = await db.query(
      `SELECT
         sr.*,
         u.full_name,
         u.national_id,
         u.email,
         u.phone,
         u.date_of_birth,
         u.status AS citizen_status
       FROM service_requests sr
       INNER JOIN users u ON u.id = sr.user_id
       ORDER BY sr.created_at ASC`
    );

    console.log(
      `Found ${applications.length} applications to review.\n`
    );

    let succeeded = 0;
    let failed = 0;

    for (const app of applications) {
      try {
        app.documents = await getApplicationDocuments(app.id);

        await reviewApplication(app);
        succeeded++;
      } catch (error) {
        failed++;

        console.error(
          `AI review failed for ${app.reference_number}:`,
          error.message,
          '\n'
        );
      }
    }

    console.log('====================================');
    console.log('AI REVIEW FINISHED');
    console.log(`Total applications: ${applications.length}`);
    console.log(`Successfully reviewed: ${succeeded}`);
    console.log(`Failed reviews: ${failed}`);
    console.log('====================================');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Application review failed:', error.message);
    process.exitCode = 1;
  } finally {
    // Close the MySQL connection pool cleanly.
    try {
      await db.end();
    } catch (error) {
      console.error('Database shutdown warning:', error.message);
    }
  }
}

fixOldApplications();
