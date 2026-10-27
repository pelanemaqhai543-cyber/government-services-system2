function evaluate(application, citizen) {
  const warnings = [];
  
  if (citizen.status === 'deceased') {
    return { eligible: false, reason: 'Citizen deceased', rule_id: 'PP_DECEASED', warnings };
  }
  
  if (citizen.status === 'suspended') {
    return { eligible: false, reason: 'Citizen suspended', rule_id: 'PP_SUSPENDED', warnings };
  }
  
  const service = String(application.service_type || '').toLowerCase();
  const docs = application.documents || [];
  const docNames = docs.map(d => (d.file_name || d.document_type || d.name || '').toLowerCase());
  
  // Photo is required for ALL passport applications
  const hasPhoto = docNames.some(n => n.includes('photo') || n.includes('jpg') || n.includes('jpeg') || n.includes('png'));
  if (!hasPhoto) {
    return { eligible: false, reason: 'Passport photo missing', rule_id: 'PP_NO_PHOTO', warnings };
  }

  // Lost passport replacement requires a police affidavit
  if (service.includes('lost') || service.includes('replacement')) {
    const hasAffidavit = docNames.some(n => n.includes('affidavit') || n.includes('police') || n.includes('lost'));
    if (!hasAffidavit) {
      return {
        eligible: false,
        reason: "Lost passport replacement requires a police affidavit. Please upload it.",
        rule_id: 'PP_LOST_NO_AFFIDAVIT',
        warnings
      };
    }
  }
  
  if (/renew/i.test(application.service_type) && !(application.form_data && application.form_data.old_passport_number)) {
    warnings.push('Renewal: old passport number not provided');
  }
  
  return { eligible: true, reason: 'Passport prerequisites met', rule_id: 'PP_OK', warnings };
}
module.exports = { evaluate };