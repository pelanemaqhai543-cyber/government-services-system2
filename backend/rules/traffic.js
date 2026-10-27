const { yearsBetween } = require('./utils');
function evaluate(application, citizen) {
  const warnings = [];
  const age = yearsBetween(citizen.date_of_birth);
  if (age === null) return { eligible:false, reason:'DOB missing', rule_id:'TR_NO_DOB', warnings };
  if (age < 18) return { eligible:false, reason:`Age ${age} < 18`, rule_id:'TR_AGE_18', warnings };
  const hasMedical = (application.documents||[]).some(d => /medical/i.test(d.file_name||'') || d.document_type==='medical_certificate');
  if (!hasMedical) return { eligible:false, reason:'Medical certificate missing', rule_id:'TR_NO_MEDICAL', warnings };
  return { eligible:true, reason:'Licence prerequisites met', rule_id:'TR_OK', warnings };
}
module.exports = { evaluate };
