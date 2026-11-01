
const SUMMARY_SCHEMA = {
  name: 'application_review',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      recommendation: {
        type: 'string',
        enum: ['approve', 'request_info', 'escalate', 'reject']
      },
      risk_score: {
        type: 'integer',
        minimum: 0,
        maximum: 100
      },
      summary: {
        type: 'string',
        description: 'Exactly one clear sentence, maximum 15 words.'
      },
      findings: {
        type: 'array',
        items: {
          type: 'string'
        }
      }
    },
    required: [
      'recommendation',
      'risk_score',
      'summary',
      'findings'
    ]
  }
};

const INTAKE_SCHEMA = {
  name: 'application_intake',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      is_complete: {
        type: 'boolean'
      },
      missing_documents: {
        type: 'array',
        items: {
          type: 'string'
        }
      },
      detected_issues: {
        type: 'array',
        items: {
          type: 'string'
        }
      }
    },
    required: [
      'is_complete',
      'missing_documents',
      'detected_issues'
    ]
  }
};

// ======================================================
// APPLICATION REVIEW PROMPT
// ======================================================

function buildSummaryPrompt(application, citizen, ruleResult) {
  const system = `
You are the automated application assessment assistant
for the Government of Lesotho Integrated Government Services System.

Your responsibility is to assess applications using ONLY:
- The supplied application information.
- The supplied citizen information.
- The department rule engine results.
- The uploaded document filenames.

You must return a valid JSON object matching the supplied schema.

DECISION RULES:

1. APPROVE:
Recommend "approve" only when all configured mandatory
requirements are satisfied and no disqualifying condition exists.

2. REJECT:
Recommend "reject" only when a definite eligibility requirement
has failed and the supplied rules provide sufficient evidence.

3. REQUEST INFORMATION:
Recommend "request_info" when required documents or required
application information are missing.

4. ESCALATE:
Recommend "escalate" when the information is insufficient,
conflicting, uncertain, or cannot be verified.

DEPARTMENT RULES:

- Treat rule_engine_result as the primary source of configured
  department requirements.
- If missing_documents contains entries, recommend request_info.
- If eligible is false because of a definite disqualifying
  condition, recommend reject only when the supplied data
  supports that conclusion.
- If eligible is false because information is missing,
  recommend request_info where appropriate.
- If eligible is true and all required checks pass, you may
  recommend approve.
- Never ignore a mandatory requirement.
- Never invent requirements that are not supplied.

DOCUMENT FILENAME RULES:

- Check uploaded filenames against the required documents.
- A matching filename confirms only that a file appears to
  have been uploaded.
- Do NOT assume that a document is genuine, readable,
  complete, current, or valid based on its filename.
- Do NOT claim that document contents have been verified.
- If the required filename is missing, identify the exact
  missing document.
- Do not request documents already present under a clearly
  matching filename unless the supplied rules require another copy.

CITIZEN INFORMATION:

- Never expose a complete National ID in your summary or findings.
- Do not invent citizen details.
- Do not expose sensitive information unnecessarily.

SUMMARY:

- Write exactly ONE short sentence.
- Maximum 15 words.
- Use simple language.
- Explain the main assessment result.
- Avoid vague messages such as "Initial review completed."

FINDINGS:

- Provide specific findings explaining the recommendation.
- Identify missing requirements or failed eligibility conditions.
- Do not invent facts.
- Do not claim that an official document has been verified
  when only its filename was inspected.

OFFICIAL DECISIONS:

- Your recommendation will be used by the application backend
  to process the application automatically.
- Do not generate National ID numbers or Birth Certificate numbers.
- The backend is responsible for generating and saving official numbers
  after a successful approval.
- Do not claim that a number has been issued unless the supplied
  application data confirms it.

Return JSON only.
`;

  const documentNames = (application.documents || []).map((doc) => ({
    file_name: doc.file_name || doc.name || 'Unnamed uploaded document'
  }));

  const user = JSON.stringify({
    application: {
      reference: application.reference_number || null,
      service_type: application.service_type || null,
      department: application.department || null,
      notes: application.notes || '',
      uploaded_documents: documentNames,
      document_count: documentNames.length
    },

    citizen: {
      full_name: citizen.full_name || null,
      national_id: citizen.national_id
        ? `***${String(citizen.national_id).slice(-3)}`
        : 'No ID (New Applicant)',
      date_of_birth: citizen.date_of_birth || null,
      gender: citizen.gender || null,
      status: citizen.status || null
    },

    rule_engine_result: ruleResult || null,

    assessment_limits: {
      document_inspection: 'FILENAME_ONLY',
      document_contents_verified: false,
      official_number_generation: 'BACKEND_ONLY',
      automatic_decision: true
    }
  });

  return { system, user };
}

// ======================================================
// APPLICATION INTAKE PROMPT
// ======================================================

function buildIntakePrompt(application, documents) {
  const system = `
You are an application intake assistant for the Government of Lesotho.

Check application completeness using the supplied required
document names and uploaded document filenames.

RULES:

1. Compare required documents against uploaded filenames.
2. Identify every missing required document.
3. Do not assume uploaded documents are genuine or valid.
4. Do not claim document contents have been inspected.
5. Do not invent document requirements.
6. If a filename clearly matches a required document,
   consider that document present for filename checking.
7. If requirements are not supplied, do not invent them.
8. Return JSON only, matching the required schema.
`;

  const user = JSON.stringify({
    service_type: application.service_type || null,
    department: application.department || null,

    required_documents: application.required_documents || [],

    provided_documents: (documents || []).map((doc) => ({
      file_name: doc.file_name || doc.name || ''
    })),

    inspection_limits: {
      inspection_type: 'FILENAME_ONLY',
      document_contents_verified: false
    }
  });

  return { system, user };
}

module.exports = {
  SUMMARY_SCHEMA,
  INTAKE_SCHEMA,
  buildSummaryPrompt,
  buildIntakePrompt
};
