
const { yearsBetween } = require('./utils');
const db = require('../config/db');

async function evaluate(application, citizen) {
  const warnings = [];
  const missingDocuments = [];
  const service = String(application.service_type || '').toLowerCase();
  const formData = application.form_data || {};
  const docs = application.documents || [];

  const docNames = docs.map((d) =>
    String(
      d.file_name ||
      d.document_type ||
      d.name ||
      ''
    ).toLowerCase()
  );

  const hasDocument = (...keywords) =>
    docNames.some((name) =>
      keywords.some((keyword) => name.includes(keyword))
    );

  const isNewId =
    service.includes('id') &&
    (service.includes('new') || service.includes('registration'));

  // 1. Citizen status check
  if (String(citizen.status || '').toLowerCase() === 'deceased') {
    return {
      eligible: false,
      reason: 'Citizen is marked as deceased.',
      rule_id: 'HA_DECEASED',
      warnings,
      missing_documents: missingDocuments
    };
  }

  // 2. Parents' National IDs for new National ID applications
  if (isNewId) {
    const motherId = formData.mother_id;
    const fatherId = formData.father_id;

    if (!motherId || String(motherId).length !== 13) {
      warnings.push(
        "A valid 13-digit Mother's National ID is required."
      );
    }

    if (!fatherId || String(fatherId).length !== 13) {
      warnings.push(
        "A valid 13-digit Father's National ID is required."
      );
    }

    if (
      motherId && String(motherId).length === 13 &&
      fatherId && String(fatherId).length === 13
    ) {
      try {
        const [mother] = await db.query(
          'SELECT id FROM users WHERE national_id = ?',
          [motherId]
        );

        const [father] = await db.query(
          'SELECT id FROM users WHERE national_id = ?',
          [fatherId]
        );

        if (!mother.length) {
          warnings.push("Mother's National ID was not found in the system.");
        }

        if (!father.length) {
          warnings.push("Father's National ID was not found in the system.");
        }
      } catch (error) {
        console.error('Parent verification failed:', error.message);
        warnings.push('Parent National ID verification could not be completed.');
      }
    }
  }

  // 3. Death Certificate application
  if (service.includes('death')) {
    const deceasedId =
      formData.deceased_national_id ||
      formData.subject_national_id;

    if (!deceasedId || String(deceasedId).length !== 13) {
      warnings.push(
        "Death Certificate requires the deceased person's 13-digit National ID."
      );
    }
  }

  // 4. New National ID requires Birth Certificate
  if (isNewId) {
    if (!hasDocument('birth', 'bc-')) {
      missingDocuments.push({
        document_name: 'Birth Certificate',
        reason: 'A Birth Certificate is required for a new National ID application.',
        action: 'Upload your Birth Certificate.'
      });
    }
  }

  // 5. Birth Certificate requires Chief's Letter
  if (service.includes('birth')) {
    if (!hasDocument('chief', 'village')) {
      missingDocuments.push({
        document_name: "Village Chief's Letter",
        reason: "A letter from the village chief is required for this Birth Certificate application.",
        action: "Upload a letter from your village chief."
      });
    }
  }

  // 6. Age check
  if (/identity|id registration/i.test(application.service_type || '')) {
    const age = yearsBetween(citizen.date_of_birth);

    if (age !== null && age < 16) {
      warnings.push(`Applicant is ${age} years old.`);
    }
  }

  const eligible = missingDocuments.length === 0;

  return {
    eligible,
    reason: eligible
      ? 'No missing documents were identified by the configured rules.'
      : `${missingDocuments.length} required document(s) are missing.`,
    rule_id: eligible ? 'HA_OK' : 'HA_MISSING_DOCUMENTS',
    warnings,
    missing_documents: missingDocuments
  };
}

module.exports = { evaluate };
