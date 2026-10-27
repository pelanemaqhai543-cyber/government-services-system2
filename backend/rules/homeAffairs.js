const { yearsBetween } = require('./utils');

function evaluate(application, citizen) {
  const warnings = [];
  const service = String(application.service_type || '').toLowerCase();
  const formData = application.form_data || {};
  const docs = application.documents || [];
  
  // Get all document filenames in lowercase
  const docNames = docs.map(d => (d.file_name || d.document_type || d.name || '').toLowerCase());
  const isNewApplicant = service.includes('birth') || service.includes('new') || service.includes('registration');

  // 1. Check if citizen is deceased
  if (citizen.status === 'deceased') {
    return { 
      eligible: false, 
      reason: 'Citizen is marked as deceased.', 
      rule_id: 'HA_DECEASED', 
      warnings 
    };
  }

  // 2. Death Certificate: Must include deceased ID
  if (service.includes('death')) {
    const deceasedId = formData.deceased_national_id || formData.subject_national_id;
    if (!deceasedId || String(deceasedId).length !== 13) {
      return {
        eligible: false,
        reason: "Death Certificate requires the deceased person's 13-digit National ID.",
        rule_id: 'HA_DEATH_NO_ID',
        warnings
      };
    }
  }

  // 3. Standard ID check (ONLY if NOT a new applicant, birth, or death cert)
  if (!isNewApplicant && !service.includes('death')) {
    if (!citizen.national_id || String(citizen.national_id).length !== 13) {
      return { 
        eligible: false, 
        reason: 'Citizen does not have a valid 13-digit National ID on file.', 
        rule_id: 'HA_ID_13', 
        warnings 
      };
    }
  }

  // 4. New ID Registration: Must have Birth Certificate
  if (service.includes('id') && (service.includes('new') || service.includes('registration'))) {
    const hasBirthCert = docNames.some(n => n.includes('birth') || n.includes('bc-'));
    if (!hasBirthCert) {
      return {
        eligible: false,
        reason: "New ID application requires a Birth Certificate.",
        rule_id: 'HA_NEW_ID_NO_BIRTHCERT',
        warnings
      };
    }
  }

  // 5. Birth Certificate: Chief's letter required
  if (service.includes('birth')) {
    const hasChiefLetter = docNames.some(n => n.includes('chief') || n.includes('village'));
    if (!hasChiefLetter && docs.length > 0) {
      return {
        eligible: false,
        reason: "Birth Certificate requires a letter from your village chief.",
        rule_id: 'HA_BIRTH_NO_CHIEF_LETTER',
        warnings
      };
    }
  }

  // 6. Age check
  if (/identity|id registration/i.test(application.service_type)) {
    const age = yearsBetween(citizen.date_of_birth);
    if (age !== null && age < 16) { 
      warnings.push(`Applicant is ${age} years old.`); 
    }
  }

  return { 
    eligible: true, 
    reason: 'Prerequisites met.', 
    rule_id: 'HA_OK', 
    warnings 
  };
}
module.exports = { evaluate };