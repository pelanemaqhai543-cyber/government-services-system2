function evaluate(application, citizen) {
  const warnings = [];
  if (citizen.status === 'deceased') return { eligible:false, reason:'Citizen deceased', rule_id:'PP_DECEASED', warnings };
  const hasPhoto = (application.documents||[]).some(d => d.document_type==='photo' || /photo|jpg|jpeg|png/i.test(d.file_name||''));
  if (!hasPhoto) return { eligible:false, reason:'Passport photo missing', rule_id:'PP_NO_PHOTO', warnings };
  if (/renew/i.test(application.service_type) && !(application.form_data && application.form_data.old_passport_number)) {
    warnings.push('Renewal: old passport number not provided');
  }
  if (citizen.status === 'suspended') return { eligible:false, reason:'Citizen suspended', rule_id:'PP_SUSPENDED', warnings };
  return { eligible:true, reason:'Passport prerequisites met', rule_id:'PP_OK', warnings };
}
module.exports = { evaluate };
