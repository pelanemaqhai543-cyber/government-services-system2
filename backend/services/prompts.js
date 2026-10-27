const SUMMARY_SCHEMA = {
  name: 'application_review',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      recommendation: { type: 'string', enum: ['approve', 'request_info', 'escalate', 'reject'] },
      risk_score: { type: 'integer', minimum: 0, maximum: 100 },
      summary: { type: 'string', description: "Exactly 1 short sentence. Max 15 words." },
      findings: { type: 'array', items: { type: 'string' } },
    },
    required: ['recommendation', 'risk_score', 'summary', 'findings'],
  },
};

const INTAKE_SCHEMA = {
  name: 'application_intake',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      is_complete: { type: 'boolean' },
      missing_documents: { type: 'array', items: { type: 'string' } },
      detected_issues: { type: 'array', items: { type: 'string' } },
    },
    required: ['is_complete', 'missing_documents', 'detected_issues'],
  },
};

function buildSummaryPrompt(application, citizen, ruleResult) {
  const system = `
You are a government AI assistant in Lesotho. Review the application.
STRICT RULES:
1. The summary must be EXACTLY 1 sentence (max 15 words). Do not write paragraphs.
2. Look at the "rule_engine_result". If it says "eligible: false", use its exact "reason" in your summary.
3. If "uploaded_documents" is empty, say "Missing: [document name]."
4. If "uploaded_documents" has a file (e.g., "birth.pdf"), assume it is valid.
5. Base your answer ONLY on the provided data.
`;

  const documentNames = (application.documents || []).map(d => d.file_name || d.name || 'Uploaded Document').join(', ');

  const user = JSON.stringify({
    application: {
      reference: application.reference_number,
      service_type: application.service_type,
      department: application.department,
      notes: application.notes || '',
      uploaded_documents: documentNames || 'None uploaded',
    },
    citizen: {
      full_name: citizen.full_name,
      national_id: citizen.national_id ? `***${String(citizen.national_id).slice(-3)}` : 'No ID (New Applicant)',
    },
    rule_engine_result: ruleResult || null,
  });

  return { system, user };
}

function buildIntakePrompt(application, documents) {
  const system = `Check if complete based on documents. Return JSON only.`;
  const user = JSON.stringify({
    service_type: application.service_type,
    required_documents: application.required_documents || [],
    provided_documents: (documents || []).map(d => d.file_name),
  });
  return { system, user };
}

module.exports = { SUMMARY_SCHEMA, INTAKE_SCHEMA, buildSummaryPrompt, buildIntakePrompt };