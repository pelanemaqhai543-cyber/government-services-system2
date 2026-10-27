const db = require('../config/db');
const { callModel } = require('../services/aiClient');
const {
  SUMMARY_SCHEMA,
  buildSummaryPrompt,
} = require('../services/prompts');
const ruleEngine = require('../rules');

const VALID_RECOMMENDATIONS = new Set([
  'approve',
  'request_info',
  'escalate',
  'reject',
]);

function getInstructions(recommendation) {
  switch (recommendation) {
    case 'approve':
      return 'AI recommendation: approval may be appropriate. An authorized officer must verify the evidence and make the official decision.';
    case 'request_info':
      return 'Action: officer should check whether documents or information are missing before requesting them from the citizen.';
    case 'reject':
      return 'AI recommendation: potential grounds for rejection were identified. An authorized officer must review the evidence and applicable requirements before deciding.';
    case 'escalate':
    default:
      return 'Action: manual officer review is required. Do not make an automatic decision.';
  }
}

function parseFindings(aiResult, ruleResult) {
  if (Array.isArray(aiResult.findings)) return aiResult.findings;
  if (Array.isArray(aiResult.risks)) return aiResult.risks;
  if (ruleResult !== undefined && ruleResult !== null) return [{ source: 'rule_engine', details: ruleResult }];
  return [];
}

function generateNationalID(dateOfBirth, gender, sequence) {
  const d = new Date(dateOfBirth || new Date());
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const genderDigit = String(gender).toLowerCase() === 'male' ? '5' : '6';
  const seq = String(sequence).padStart(6, '0');
  return `${yy}${mm}${dd}${seq}${genderDigit}`;
}

exports.getMasterQueue = async (req, res) => {
  try {
    const role = String(req.user?.role || '').toLowerCase();
    const isAdmin = role === 'admin';
    const isHomeAffairs = role === 'home_affairs';

    // 1. NO BIRTH CERTIFICATE COLUMN IN THIS QUERY
    let query = `
      SELECT sr.*, u.full_name, u.national_id, u.email, u.date_of_birth, u.gender, u.status AS citizen_status,
        (SELECT COUNT(*) FROM request_documents rd WHERE rd.request_id = sr.id) AS doc_count
      FROM service_requests sr
      INNER JOIN users u ON u.id = sr.user_id
    `;
    
    const params = [];

    if (!isAdmin) {
      if (isHomeAffairs) {
        query += ` WHERE LOWER(sr.department) = 'home_affairs' `;
      } else {
        query += ` WHERE LOWER(sr.department) = ? `;
        params.push(role);
      }
    }
    
    query += ` ORDER BY sr.created_at DESC`;

    const [applications] = await db.query(query, params);

    const processedApps = await Promise.all(
      applications.map(async (app) => {
        const documentCount = Number(app.doc_count || 0);

        // 2. FETCH BIRTH CERTIFICATE SEPARATELY (BYPASSES CACHE)
        let existingBC = null;
        try {
          const [bcRows] = await db.query(`SELECT birth_certificate_number FROM users WHERE id = ?`, [app.user_id]);
          if (bcRows.length > 0) existingBC = bcRows[0].birth_certificate_number;
        } catch (err) {
          console.log('Could not fetch birth_certificate_number', err.message);
        }

        const [documents] = await db.query(
          `SELECT id, file_name, file_path, uploaded_at FROM request_documents WHERE request_id = ? ORDER BY uploaded_at DESC`,
          [app.id]
        );

        const appWithDocuments = { ...app, birth_certificate_number: existingBC, doc_count: documentCount, documents };

        // If AI already processed it, just return it
        if (app.ai_summary && app.ai_recommendation) {
          return {
            ...appWithDocuments,
            ai_instructions: getInstructions(app.ai_recommendation),
            ai_processed: true,
          };
        }

        // Otherwise run the AI
        const citizen = { full_name: app.full_name, national_id: app.national_id, date_of_birth: app.date_of_birth, status: app.citizen_status };
        const applicationForReview = { ...app, documents: documents.map((doc) => ({ file_name: doc.file_name, uploaded_at: doc.uploaded_at })), document_count: documentCount, document_contents_inspected: false };

        try {
          const ruleResult = ruleEngine.evaluate(app.department || 'home_affairs', applicationForReview, citizen);
          const { system, user } = buildSummaryPrompt(applicationForReview, citizen, ruleResult);
          const aiResult = await callModel({ system, user, responseSchema: SUMMARY_SCHEMA, temperature: 0.1 });

          const recommendation = String(aiResult.recommendation || 'escalate').toLowerCase();
          const safeRecommendation = VALID_RECOMMENDATIONS.has(recommendation) ? recommendation : 'escalate';
          const summary = typeof aiResult.summary === 'string' && aiResult.summary.trim() ? aiResult.summary.trim() : 'No usable AI summary was returned. Manual review is required.';
          const findings = parseFindings(aiResult, ruleResult);
          
          const rawRisk = Number(aiResult.risk_score);
          const riskScore = Number.isInteger(rawRisk) && rawRisk >= 0 && rawRisk <= 100 ? rawRisk : null;

          let dbStatus = 'review';
          if (safeRecommendation === 'approve' && !isAdmin) {
            dbStatus = 'completed';
          } else if (safeRecommendation === 'reject') {
            dbStatus = 'rejected';
          }

          // AUTO-GENERATE ID LOGIC
          let generatedMessage = "";
          if (dbStatus === 'completed' && isHomeAffairs) {
            const serviceLower = String(app.service_type).toLowerCase();
            const isBirthCert = serviceLower.includes('birth');
            const isNewID = serviceLower.includes('id') || serviceLower.includes('identity');

            if (isBirthCert && !existingBC) {
              const bcNumber = `BC-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`;
              await db.query(`UPDATE users SET birth_certificate_number = ? WHERE id = ?`, [bcNumber, app.user_id]);
              generatedMessage += ` Your Birth Certificate Number is ${bcNumber}.`;
            }

            if (isNewID && (!app.national_id || String(app.national_id).length !== 13)) {
              const randomSeq = Math.floor(Math.random() * 900000) + 100000;
              const newID = generateNationalID(app.date_of_birth, app.gender, randomSeq);
              await db.query(`UPDATE users SET national_id = ? WHERE id = ?`, [newID, app.user_id]);
              generatedMessage += ` Your National ID Number is ${newID}.`;
            }
          }

          await db.query(
            `UPDATE service_requests SET status = ?, ai_summary = ?, ai_recommendation = ?, ai_risk_score = ?, ai_findings = ?, ai_processed_at = NOW() WHERE id = ?`,
            [dbStatus, summary, safeRecommendation, riskScore, JSON.stringify(findings), app.id]
          );

          if (generatedMessage) {
            await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [app.user_id, `Your application ${app.reference_number} was approved.${generatedMessage}`]);
          } else {
            await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [app.user_id, `An initial review of your application ${app.reference_number} has been completed.`]);
          }

          return {
            ...appWithDocuments,
            status: dbStatus,
            ai_summary: summary,
            ai_recommendation: safeRecommendation,
            ai_risk_score: riskScore,
            ai_findings: findings,
            ai_processed_at: new Date().toISOString(),
            ai_instructions: getInstructions(safeRecommendation),
            ai_processed: true,
          };
        } catch (error) {
          console.error(`AI review failed for ${app.reference_number}:`, error.message);
          return {
            ...appWithDocuments,
            ai_recommendation: 'escalate',
            ai_summary: app.ai_summary || null,
            ai_findings: app.ai_findings || null,
            ai_instructions: 'AI processing failed. An officer must review this application manually.',
            ai_processed: false,
            ai_error: 'AI review could not be completed.',
          };
        }
      })
    );

    return res.status(200).json({ success: true, count: processedApps.length, applications: processedApps });
  } catch (error) {
    console.error('Master Queue Error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to load the AI application queue.' });
  }
};