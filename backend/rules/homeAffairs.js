const { yearsBetween } = require('./utils');

function evaluate(application, citizen) {
  const warnings = [];
  const service = String(application.service_type || '').toLowerCase();
  const isNewApplicant = service.includes('birth') || service.includes('new') || service.includes('registration');

  if (citizen.status === 'deceased') {
    return { eligible: false, reason: 'The system indicates this citizen is marked as deceased. This application cannot proceed.', rule_id: 'HA_DECEASED', warnings };
  }

  if (!isNewApplicant) {
    if (!citizen.national_id || String(citizen.national_id).length !== 13) {
      return { eligible: false, reason: 'The citizen does not have a valid 13-digit National ID on file. Please request identity verification.', rule_id: 'HA_ID_13', warnings };
    }
  }

  if (isNewApplicant) {
    const docs = application.documents || [];
    const hasBirthDoc = docs.some(d => /birth/i.test(d.file_name || '') || /birth/i.test(d.document_type || '') || /hospital/i.test(d.file_name || ''));
    if (service.includes('birth') && !hasBirthDoc && docs.length === 0) {
      return { eligible: false, reason: 'For a new Birth Certificate, the citizen needs to upload hospital records, a birth notice, or parents\' IDs.', rule_id: 'HA_MISSING_BIRTH_DOC', warnings };
    }
  }

  if (/identity|id registration/i.test(application.service_type)) {
    const age = yearsBetween(citizen.date_of_birth);
    if (age !== null && age < 16) { warnings.push(`Applicant is ${age} years old — under 16 may require guardian consent.`); }
  }

  return { eligible: true, reason: isNewApplicant ? 'New application prerequisites met. Documents provided.' : 'Identity prerequisites met.', rule_id: 'HA_OK', warnings };
}
module.exports = { evaluate };