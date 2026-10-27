const db = require('../config/db');
const { callModel } = require('../services/aiClient');
const { SUMMARY_SCHEMA, buildSummaryPrompt } = require('../services/prompts');
const ruleEngine = require('../rules');

const VALID_RECOMMENDATIONS = new Set(['approve', 'request_info', 'escalate', 'reject']);

function getInstructions(recommendation, app) {
  const ref = app?.reference_number || 'this application';
  switch (recommendation) {
    case 'approve': return `✅ Approved. Documents verified for ${ref}.`;
    case 'request_info': return `📄 Missing documents for ${ref}. Upload the missing items.`;
    case 'reject': return `⛔ Rejected. Application ${ref} did not meet requirements.`;
    case 'escalate': default: return `⚠️ Manual review needed for ${ref}.`;
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

        let existingBC = null;
        try {
          const [bcRows] = await db.query(`SELECT birth_certificate_number FROM users WHERE id = ?`, [app.user_id]);
          if (bcRows.length > 0) existingBC = bcRows[0].birth_certificate_number;
        } catch (err) {}

        const [documents] = await db.query(
          `SELECT id, file_name, file_path, uploaded_at FROM request_documents WHERE request_id = ? ORDER BY uploaded_at DESC`,
          [app.id]
        );

        const appWithDocuments = { ...app, birth_certificate_number: existingBC, doc_count: documentCount, documents };

        if (app.ai_summary && app.ai_recommendation) {
          return {
            ...appWithDocuments,
            ai_instructions: getInstructions(app.ai_recommendation, app),
            ai_processed: true,
          };
        }

        const citizen = { full_name: app.full_name, national_id: app.national_id, date_of_birth: app.date_of_birth, status: app.citizen_status };
        
        // Pass the actual filename to the AI
        const applicationForReview = { 
          ...app, 
          documents: documents.map((doc) => ({ file_name: doc.file_name })), 
          document_count: documentCount 
        };

        try {
          const ruleResult = ruleEngine.evaluate(app.department || 'home_affairs', applicationForReview, citizen);
          const { system, user } = buildSummaryPrompt(applicationForReview, citizen, ruleResult);
          const aiResult = await callModel({ system, user, responseSchema: SUMMARY_SCHEMA, temperature: 0.1 });

          const recommendation = String(aiResult.recommendation || 'escalate').toLowerCase();
          const safeRecommendation = VALID_RECOMMENDATIONS.has(recommendation) ? recommendation : 'escalate';
          const summary = aiResult.summary || 'Manual review required.';
          const findings = parseFindings(aiResult, ruleResult);
          
          let rawRisk = Math.round(Number(aiResult.risk_score));
          if (isNaN(rawRisk) || rawRisk < 0) rawRisk = 0;
          const riskScore = Math.min(rawRisk, 100);

          let dbStatus = 'review';
          if (safeRecommendation === 'approve' && !isAdmin) dbStatus = 'completed';
          else if (safeRecommendation === 'reject') dbStatus = 'rejected';

          let generatedMessage = "";
          if (dbStatus === 'completed' && isHomeAffairs) {
            const serviceLower = String(app.service_type).toLowerCase();
            const isBirthCert = serviceLower.includes('birth');
            const isNewID = serviceLower.includes('id') || serviceLower.includes('identity');

            if (isBirthCert && !existingBC) {
              const bcNumber = `BC-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`;
              try {
                await db.query(`UPDATE users SET birth_certificate_number = ? WHERE id = ?`, [bcNumber, app.user_id]);
                generatedMessage += ` Your Birth Certificate Number is ${bcNumber}.`;
              } catch (e) {}
            }

            if (isNewID && (!app.national_id || String(app.national_id).length !== 13)) {
              if (app.date_of_birth) {
                const randomSeq = Math.floor(Math.random() * 900000) + 100000;
                const newID = generateNationalID(app.date_of_birth, app.gender, randomSeq);
                await db.query(`UPDATE users SET national_id = ? WHERE id = ?`, [newID, app.user_id]);
                generatedMessage += ` Your National ID Number is ${newID}.`;
              }
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
            ai_instructions: getInstructions(safeRecommendation, app),
            ai_processed: true,
          };
        } catch (error) {
          return {
            ...appWithDocuments,
            ai_recommendation: 'escalate',
            ai_summary: 'AI processing failed. Manual review required.',
            ai_instructions: '⚠️ Officer must review this application manually.',
            ai_processed: false,
          };
        }
      })
    );

    return res.status(200).json({ success: true, count: processedApps.length, applications: processedApps });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to load the AI application queue.' });
  }
};