
const SUMMARY_SCHEMA = {
  name: 'application_review',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      recommendation: {
        type: 'string',
        enum: ['approve', 'request_info', 'escalate', 'reject'],
      },
      risk_score: {
        type: 'integer',
        minimum: 0,
        maximum: 100,
      },
      summary: { type: 'string' },
      findings: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: [
      'recommendation',
      'risk_score',
      'summary',
      'findings',
    ],
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
      missing_documents: {
        type: 'array',
        items: { type: 'string' },
      },
      detected_issues: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: [
      'is_complete',
      'missing_documents',
      'detected_issues',
    ],
  },
};

function buildSummaryPrompt(application, citizen, ruleResult) {
  const documents = Array.isArray(application.documents)
    ? application.documents
    : [];

  const system = `
You assist authorized government officers reviewing applications in Lesotho.

Rules:
1. The authorized officer makes the final decision.
2. Use only the supplied application information and evidence.
3. Never invent documents, facts, stamps, signatures, or verification results.
4. A document filename does not prove that its contents are valid.
5. If only filenames are provided, explicitly state that the document contents have not been inspected.
6. Flag potentially missing information as a finding, not as a proven violation.
7. For new Birth Certificate or National ID applications, do not penalize a citizen merely for lacking an existing national ID.
8. Recommend request_info when necessary evidence is missing or insufficient.
9. Recommend escalate when the evidence is ambiguous or requires specialist review.
10. Give a concise, factual summary and a risk score from 0 to 100.
11. Do not claim an application is officially approved or rejected.
`;

  const user = JSON.stringify({
    application: {
      id: application.id ?? null,
      reference: application.reference_number ?? null,
      service_type: application.service_type ?? null,
      department: application.department ?? null,
      status: application.status ?? null,
      form_data: application.form_data ?? {},
      notes: application.notes ?? '',
      document_count: documents.length,
      uploaded_documents: documents.map((doc) => ({
        file_name: doc.file_name || doc.name || 'Unnamed document',
        file_type: doc.file_type || null,
        content_inspected: doc.content_inspected === true,
      })),
    },
    citizen: {
      full_name: citizen.full_name ?? null,
      national_id: citizen.national_id
        ? `***${String(citizen.national_id).slice(-3)}`
        : null,
      date_of_birth: citizen.date_of_birth ?? null,
    },
    rule_engine_result: ruleResult ?? null,
  });

  return { system, user };
}

function buildIntakePrompt(application, documents) {
  const system = `
Check whether a government application appears complete based only on the supplied requirements and evidence.

Do not invent required documents.
A filename alone does not establish document validity.
Do not claim that a stamp or signature is present unless document contents were actually inspected.
Return only the required structured response.
`;

  const user = JSON.stringify({
    service_type: application.service_type ?? null,
    required_documents: application.required_documents ?? [],
    provided_documents: (documents || []).map((doc) => ({
      type: doc.document_type ?? null,
      name: doc.file_name ?? null,
      content_inspected: doc.content_inspected === true,
    })),
  });

  return { system, user };
}

module.exports = {
  SUMMARY_SCHEMA,
  INTAKE_SCHEMA,
  buildSummaryPrompt,
  buildIntakePrompt,
};
