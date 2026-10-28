const { yearsBetween } = require('./utils');
const db = require('../config/db');

async function evaluate(application, citizen) {
  const warnings = [];
  const service = String(application.service_type || '').toLowerCase();
  const formData = application.form_data || {};
  const docs = application.documents || [];
  const docNames = docs.map(d => (d.file_name || d.document_type || d.name || '').toLowerCase());
  const isNewApplicant = service.includes('birth') || service.includes('new') || service.includes('registration');

  if (citizen.status === 'deceased') {
    return { eligible: false, reason: 'Citizen is marked as deceased.', rule_id: 'HA_DECEASED', warnings };
  }

  // 1. Parents' IDs Required for New National ID
  if (service.includes('id') && (service.includes('new') || service.includes('registration'))) {
    const motherId = formData.mother_id;
    const fatherId = formData.father_id;

    if (!motherId || String(motherId).length !== 13) {
      return { eligible: false, reason: "A valid 13-digit Mother's National ID is required.", rule_id: 'HA_NO_MOTHER_ID', warnings };
    }
    if (!fatherId || String(fatherId).length !== 13) {
      return { eligible: false, reason: "A valid 13-digit Father's National ID is required.", rule_id: 'HA_NO_FATHER_ID', warnings };
    }

    try {
      const [mother] = await db.query('SELECT id FROM users WHERE national_id = ?', [motherId]);
      const [father] = await db.query('SELECT id FROM users WHERE national_id = ?', [fatherId]);
      
      if (mother.length === 0) return { eligible: false, reason: "Mother's National ID not found in the system.", rule_id: 'HA_MOTHER_NOT_FOUND', warnings };
      if (father.length === 0) return { eligible: false, reason: "Father's National ID not found in the system.", rule_id: 'HA_FATHER_NOT_FOUND', warnings };
    } catch (err) {
      console.error('Parent verification failed:', err.message);
    }
  }

  // 2. Death Certificate Check
  if (service.includes('death')) {
    const deceasedId = formData.deceased_national_id || formData.subject_national_id;
    if (!deceasedId || String(deceasedId).length !== 13) {
      return { eligible: false, reason: "Death Certificate requires the deceased person's 13-digit National ID.", rule_id: 'HA_DEATH_NO_ID', warnings };
    }
  }

  // 3. New ID Requires Birth Certificate
  if (service.includes('id') && (service.includes('new') || service.includes('registration'))) {
    const hasBirthCert = docNames.some(n => n.includes('birth') || n.includes('bc-'));
    if (!hasBirthCert) {
      return { eligible: false, reason: "New ID application requires a Birth Certificate.", rule_id: 'HA_NEW_ID_NO_BIRTHCERT', warnings };
    }
  }

  // 4. Birth Certificate Requires Chief's Letter
  if (service.includes('birth')) {
    const hasChiefLetter = docNames.some(n => n.includes('chief') || n.includes('village'));
    if (!hasChiefLetter && docs.length > 0) {
      return { eligible: false, reason: "Birth Certificate requires a letter from your village chief.", rule_id: 'HA_BIRTH_NO_CHIEF_LETTER', warnings };
    }
  }

  // 5. Age Check
  if (/identity|id registration/i.test(application.service_type)) {
    const age = yearsBetween(citizen.date_of_birth);
    if (age !== null && age < 16) { warnings.push(`Applicant is ${age} years old.`); }
  }

  return { eligible: true, reason: 'Prerequisites met.', rule_id: 'HA_OK', warnings };
}
module.exports = { evaluate };