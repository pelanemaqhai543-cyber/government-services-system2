const { yearsBetween } = require('./utils');
function evaluate(application, citizen) {
  const warnings = [];
  if (citizen.status === 'deceased') {
    return { eligible:false, reason:`Citizen marked deceased (${citizen.deceased_reason||'no reason'})`, rule_id:'PEN_DECEASED', warnings };
  }
  const age = yearsBetween(citizen.date_of_birth);
  if (age === null) return { eligible:false, reason:'DOB missing', rule_id:'PEN_NO_DOB', warnings };
  if (age < 60) return { eligible:false, reason:`Age ${age} < 60`, rule_id:'PEN_AGE_60', warnings };
  const hasBank = (application.documents||[]).some(d => d.document_type==='bank_statement' || /bank/i.test(d.file_name||''));
  if (!hasBank) return { eligible:false, reason:'Bank statement missing', rule_id:'PEN_NO_BANK', warnings };
  return { eligible:true, reason:`Eligible: age ${age}, all docs present`, rule_id:'PEN_OK', warnings };
}
module.exports = { evaluate };
