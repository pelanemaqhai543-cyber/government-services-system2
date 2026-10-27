// Shared catalogue of every government service, used by Apply.js and CitizenDashboard.js.
// Existing service names (e.g. "National ID Registration", "Birth Certificate") are kept
// exactly as before so the backend, rules and AI keep working.

/* ------------------------------------------------------------------ */
/*  Field helpers                                                      */
/* ------------------------------------------------------------------ */
const text = (name, label, required = false, extra = {}) => ({ name, label, type: 'text', required, ...extra });
const area = (name, label, required = false, extra = {}) => ({ name, label, type: 'textarea', required, ...extra });
const date = (name, label, required = false, extra = {}) => ({ name, label, type: 'date', required, ...extra });
const pick = (name, label, options, required = false, extra = {}) => ({ name, label, type: 'select', options, required, ...extra });
const nid = (name, label, required = true, extra = {}) => ({ name, label, type: 'nationalid', required, ...extra });
const check = (name, label) => ({ name, label, type: 'checkbox', required: false });

// Fields that are filled in automatically from the logged-in citizen (prefill = profile key)
const fullName = text('subject_full_name', 'Full name', true, { prefill: 'full_name' });
const myId = nid('subject_national_id', 'National ID', true, { prefill: 'national_id' });
const dob = date('subject_date_of_birth', 'Date of birth', true, { prefill: 'date_of_birth' });
const gender = pick('subject_gender', 'Gender', ['Male', 'Female', 'Other'], true, { prefill: 'gender' });
const district = text('subject_district', 'District', true, { prefill: 'district' });
const address = area('subject_address', 'Address', false, { prefill: 'address' });

/* ------------------------------------------------------------------ */
/*  Document helpers                                                   */
/* ------------------------------------------------------------------ */
const doc = (key, label, extra = {}) => ({ key, label, required: false, ...extra });
const req = (key, label, extra = {}) => doc(key, label, { required: true, ...extra });
const reqIf = (key, label, field, values, hint) =>
  doc(key, label, { requiredIf: (data) => values.includes(data[field]), hint });

export const isDocRequired = (d, formData = {}) =>
  Boolean(d.required || (d.requiredIf && d.requiredIf(formData)));

/* ------------------------------------------------------------------ */
/*  Departments                                                        */
/* ------------------------------------------------------------------ */
export const DEPARTMENTS = [
  {
    key: 'Home Affairs', title: 'Home Affairs', code: 'HA', color: '#00209F',
    purpose: 'Civil registration and identity documents.',
    workflow: ['Submitted', 'Under review', 'Additional documents required', 'Approved or rejected', 'Ready for collection'],
  },
  {
    key: 'Traffic', title: 'Traffic and Transport', code: 'TR', color: '#d97706',
    purpose: 'Driving licences, vehicle registration and road transport.',
    workflow: ['Submitted', 'Document verification', 'Inspection or test (if needed)', 'Approved or rejected', 'Ready for collection'],
  },
  {
    key: 'Pension', title: 'Pensions', code: 'PN', color: '#7c3aed',
    purpose: 'Pension applications, payments and records.',
    workflow: ['Submitted', 'Eligibility verification', 'Under review', 'Approved or rejected', 'Payment processing'],
  },
  {
    key: 'Passport', title: 'Passport Services', code: 'PP', color: '#b91c1c',
    purpose: 'Passport applications and related requests.',
    workflow: ['Submitted', 'Document verification', 'Officer review', 'Approved or rejected', 'Production', 'Ready for collection'],
  },
  {
    key: 'Police', title: 'Police Services', code: 'PL', color: '#1e3a8a',
    purpose: 'Clearance certificates, affidavits and reports.',
    workflow: ['Submitted', 'Verification', 'Officer review', 'Approved or rejected', 'Certificate or report ready'],
    note: 'Crime reports and evidence can only be seen by authorised police officers.',
  },
  {
    key: 'Finance', title: 'Finance and Revenue', code: 'FN', color: '#0d9488',
    purpose: 'Tax, payments and financial enquiries.',
    workflow: ['Submitted', 'Verification', 'Payment required (if needed)', 'Processing', 'Completed'],
  },
];

export const DEPT_BY_KEY = Object.fromEntries(DEPARTMENTS.map((d) => [d.key, d]));
export const toApiDepartment = (department) => department.toLowerCase().replace(/\s+/g, '_');

/* ------------------------------------------------------------------ */
/*  Services                                                           */
/*  limit: 'open' (default) = blocked while an application is open     */
/*         'once'           = blocked once approved too                */
/*         'none'           = enquiries/reports, can be sent any time  */
/* ------------------------------------------------------------------ */
const svc = (name, department, icon, emoji, description, fields, docs = [], opts = {}) =>
  ({ name, department, icon, emoji, description, fields, docs, limit: 'open', ...opts });

const LIST = [
  /* ---------------- HOME AFFAIRS ---------------- */
  svc('National ID Registration', 'Home Affairs', 'id', '🪪', 'Apply for a first-time National ID',
    [fullName, dob, gender, district, address],
    [req('birth_certificate', 'Birth certificate')],
    { limit: 'once', blockIfHasId: true }),

  svc('National ID Renewal', 'Home Affairs', 'renew', '🔁', 'Renew an existing National ID',
    [fullName, nid('subject_national_id', 'Current National ID', true, { prefill: 'national_id' }),
      date('expiry_date', 'Expiry date'), area('reason', 'Reason for renewal')],
    [doc('current_id', 'Copy of current National ID')]),

  svc('National ID Replacement', 'Home Affairs', 'id', '📋', 'Replace a lost, stolen or damaged National ID',
    [fullName, myId, pick('replacement_reason', 'Reason for replacement', ['Lost', 'Stolen', 'Damaged'], true),
      area('details', 'What happened?')],
    [reqIf('police_affidavit', 'Police affidavit or report', 'replacement_reason', ['Lost', 'Stolen'], 'Required when the ID was lost or stolen'),
      reqIf('damaged_id', 'The damaged ID', 'replacement_reason', ['Damaged'], 'Required when the ID is damaged')]),

  svc('Birth Certificate', 'Home Affairs', 'birth', '📄', 'Register a birth and obtain a certificate',
    [text('subject_full_name', "Child's full name", true), date('subject_date_of_birth', 'Date of birth', true),
      pick('subject_gender', 'Gender', ['Male', 'Female'], true), text('subject_district', 'District of birth', true),
      text('mother_name', "Mother's full name", true), text('father_name', "Father's full name"),
      text('place_of_birth', 'Place of birth'),
      check('request_police_stamp', "Send the chief's letter to the police for a stamp")],
    [req('chief_letter', "Letter from the village chief", { hint: 'Mandatory for every birth certificate application' }),
      doc('hospital_record', 'Hospital birth record', { hint: 'If the birth happened in a hospital or clinic' })]),

  svc('Marriage Certificate', 'Home Affairs', 'marriage', '💍', 'Register a marriage',
    [text('subject_full_name', 'Spouse 1 full name', true, { prefill: 'full_name' }),
      date('subject_date_of_birth', 'Spouse 1 date of birth', true, { prefill: 'date_of_birth' }),
      text('spouse_name', 'Spouse 2 full name', true), date('marriage_date', 'Date of marriage'),
      text('marriage_place', 'Place of marriage')],
    [req('marriage_docs', 'Marriage registration details and supporting documents', { multiple: true })]),

  svc('Death Certificate', 'Home Affairs', 'death', '⚰️', 'Register a death and obtain a certificate',
    [nid('deceased_national_id', "Deceased person's National ID number", true),
      text('subject_full_name', "Deceased's full name", true), date('subject_date_of_birth', 'Date of birth', true),
      date('date_of_death', 'Date of death', true), text('place_of_death', 'Place of death', true),
      text('cause_of_death', 'Cause of death')],
    [req('death_notification', 'Death notification', { hint: 'From the hospital, clinic or village chief' }),
      doc('supporting_docs', 'Other supporting documents', { multiple: true })]),

  svc('Change of Personal Details', 'Home Affairs', 'edit', '✏️', 'Update personal details on your records',
    [fullName, myId, text('detail_to_change', 'Detail to change', true), text('current_value', 'Current value'),
      text('new_value', 'New value', true)],
    [req('existing_id', 'Existing ID'), req('proof_of_change', 'Document proving the change', { multiple: true })]),

  svc('Citizenship Application', 'Home Affairs', 'id', '🏛️', 'Apply for Lesotho citizenship',
    [fullName, dob, text('current_nationality', 'Current nationality', true),
      text('years_resident', 'Years living in Lesotho'), address],
    [req('identity_docs', 'Identity documents', { multiple: true }),
      req('eligibility_proof', 'Proof of eligibility', { multiple: true })],
    { limit: 'once' }),

  svc('Civil Record Correction', 'Home Affairs', 'edit', '🛠️', 'Correct an error on a civil registration record',
    [fullName, pick('record_type', 'Record to correct', ['Birth certificate', 'Marriage certificate', 'Death certificate', 'National ID'], true),
      text('incorrect_detail', 'What is wrong?', true), text('correct_detail', 'What it should say', true)],
    [req('existing_certificate', 'Existing certificate'),
      req('evidence', 'Evidence supporting the correction', { multiple: true })]),

  /* ---------------- TRAFFIC AND TRANSPORT ---------------- */
  svc("Learner's Licence", 'Traffic', 'car', '📘', "Apply for a learner's licence",
    [fullName, myId, dob, pick('licence_class', 'Licence class', ['Motorcycle', 'Light vehicle', 'Heavy vehicle'], true)],
    [doc('photo', 'Passport-size photo')]),

  svc("Driver's Licence", 'Traffic', 'car', '🚗', 'Apply for a driving licence',
    [fullName, myId, pick('licence_type', 'Licence type', ['Learner', 'Class B', 'Class C']),
      text('learner_licence_number', "Learner's licence number")],
    [doc('learner_licence', "Learner's licence", { hint: 'Where applicable' }), doc('photo', 'Passport-size photo')]),

  svc('Driving Licence Renewal', 'Traffic', 'renew', '🔁', 'Renew your driving licence',
    [fullName, myId, text('licence_number', 'Licence number', true), date('expiry_date', 'Licence expiry date')],
    [req('existing_licence', 'Existing driving licence')]),

  svc('Driving Licence Replacement', 'Traffic', 'car', '🪪', 'Replace a lost, stolen or damaged licence',
    [fullName, myId, text('licence_number', 'Licence number'),
      pick('replacement_reason', 'Reason for replacement', ['Lost', 'Stolen', 'Damaged'], true)],
    [reqIf('police_affidavit', 'Police report or affidavit', 'replacement_reason', ['Lost', 'Stolen'], 'Required when the licence was lost or stolen'),
      reqIf('damaged_licence', 'The damaged licence', 'replacement_reason', ['Damaged'], 'Required when the licence is damaged')]),

  svc('Vehicle Registration', 'Traffic', 'vehicle', '🚙', 'Register a vehicle',
    [text('vehicle_make', 'Make', true), text('vehicle_model', 'Model', true), text('vehicle_year', 'Year'),
      text('vin', 'VIN / Chassis number', true)],
    [req('ownership_proof', 'Proof of ownership'), req('vehicle_docs', 'Vehicle documentation', { multiple: true })]),

  svc('Vehicle Ownership Transfer', 'Traffic', 'vehicle', '🔄', 'Transfer a vehicle to a new owner',
    [text('vehicle_registration', 'Vehicle registration number', true), text('seller_name', 'Seller full name', true),
      nid('seller_national_id', 'Seller National ID', true), text('buyer_name', 'Buyer full name', true),
      nid('buyer_national_id', 'Buyer National ID', true)],
    [req('ownership_docs', 'Ownership documents', { multiple: true }),
      req('party_ids', 'Seller and buyer identification', { multiple: true })]),

  svc('Roadworthiness Inspection Booking', 'Traffic', 'car', '🔧', 'Book a vehicle roadworthiness inspection',
    [text('vehicle_registration', 'Vehicle registration number', true),
      date('preferred_date', 'Preferred inspection date', true), text('inspection_centre', 'Preferred inspection centre')],
    [], { limit: 'none' }),

  svc('Vehicle Registration Certificate Replacement', 'Traffic', 'vehicle', '📑', 'Replace a vehicle registration certificate',
    [fullName, myId, text('vehicle_registration', 'Vehicle registration number', true),
      pick('replacement_reason', 'Reason for replacement', ['Lost', 'Stolen', 'Damaged'], true)]),

  svc('Public Transport Permit', 'Traffic', 'car', '🚌', 'Apply for a public transport permit',
    [fullName, myId, text('business_name', 'Business or operator name'),
      text('vehicle_registration', 'Vehicle registration number', true), text('route', 'Route or area of operation', true)],
    [req('vehicle_docs', 'Vehicle documents', { multiple: true }),
      req('permit_docs', 'Permit application documents', { multiple: true })]),

  svc('Traffic Fine Enquiry and Payment', 'Traffic', 'finance', '🧾', 'Check or pay a traffic fine',
    [pick('request_type', 'What do you need?', ['Fine enquiry', 'Fine payment'], true),
      text('fine_reference', 'Fine reference or vehicle registration number', true), text('amount', 'Amount (if paying)')],
    [], { limit: 'none' }),

  /* ---------------- PENSIONS ---------------- */
  svc('Pension Application', 'Pension', 'pension', '👴', 'Apply for the old-age pension',
    [fullName, myId, dob, area('employment_history', 'Employment history')],
    [req('proof_of_age', 'Proof of age', { hint: 'For example your birth certificate or ID' })],
    { limit: 'once' }),

  svc('Pension Payment Enquiry', 'Pension', 'pension', '💬', 'Ask about a pension payment',
    [fullName, myId, text('pension_number', 'Pension number'), area('enquiry', 'Your enquiry', true)],
    [], { limit: 'none' }),

  svc('Pension Payment Status', 'Pension', 'search', '🔎', 'Check the status of a pension payment',
    [myId, text('pension_reference', 'Pension number or application reference', true)],
    [], { limit: 'none' }),

  svc('Update Pension Personal Details', 'Pension', 'edit', '✏️', 'Change your personal details on your pension record',
    [fullName, myId, text('detail_to_change', 'Detail to change', true), text('new_value', 'New value', true)],
    [req('supporting_docs', 'Supporting documents', { multiple: true })]),

  svc('Update Banking Details', 'Pension', 'finance', '🏦', 'Update where your pension is paid',
    [fullName, myId, text('bank_name', 'Bank name', true), text('account_holder', 'Account holder name', true),
      text('account_number', 'Account number', true)],
    [req('bank_proof', 'Bank letter or statement', { hint: 'Shows the account holder and account number' })]),

  svc('Report Missing Pension Payment', 'Pension', 'alert', '⚠️', 'Report a pension payment you did not receive',
    [fullName, myId, text('pension_number', 'Pension number', true), text('payment_period', 'Payment month and year', true),
      area('details', 'Details')],
    [], { limit: 'none' }),

  svc('Report Deceased Pension Recipient', 'Pension', 'death', '🕊️', 'Report that a pension recipient has died',
    [text('reporter_name', 'Your full name', true, { prefill: 'full_name' }),
      text('relationship', 'Your relationship to the person', true),
      nid('deceased_national_id', "Deceased person's National ID number", true),
      text('deceased_name', "Deceased person's full name", true), date('date_of_death', 'Date of death', true)],
    [req('death_certificate', 'Death certificate')]),

  svc('Pension Record Correction', 'Pension', 'edit', '🛠️', 'Correct an error on your pension record',
    [fullName, myId, text('pension_number', 'Pension number', true), text('incorrect_detail', 'What is wrong?', true),
      text('correct_detail', 'What it should say', true)],
    [req('evidence', 'Supporting evidence', { multiple: true })]),

  svc('Pension Application Appeal', 'Pension', 'file', '⚖️', 'Appeal a rejected pension application',
    [fullName, myId, text('previous_reference', 'Previous application reference', true),
      area('appeal_reason', 'Why are you appealing?', true)],
    [doc('supporting_docs', 'Supporting documents', { multiple: true })]),

  svc('Pension Beneficiary Enquiry', 'Pension', 'pension', '👥', 'Ask about pension beneficiaries',
    [fullName, myId, text('pension_number', 'Pension number'), area('enquiry', 'Your enquiry', true)],
    [], { limit: 'none' }),

  /* ---------------- PASSPORT SERVICES ---------------- */
  svc('Passport Application', 'Passport', 'passport', '🛂', 'Apply for a new passport',
    [fullName, myId, dob, text('place_of_birth', 'Place of birth')],
    [req('birth_certificate', 'Birth certificate'), req('passport_photo', 'Passport-size photo')]),

  svc('Passport Renewal', 'Passport', 'passport', '📘', 'Renew an existing passport',
    [fullName, myId, text('old_passport_number', 'Old passport number'), date('expiry_date', 'Current passport expiry')],
    [req('old_passport', 'Existing passport')]),

  svc('Lost Passport', 'Passport', 'passport', '📕', 'Replace a lost passport',
    [fullName, myId, text('old_passport_number', 'Passport number (if known)'), date('date_lost', 'Date lost', true),
      text('place_lost', 'Where it was lost', true)],
    [req('police_affidavit', 'Police affidavit or report', { hint: 'Get this from the police first. It is mandatory.' })]),

  svc('Damaged Passport Replacement', 'Passport', 'passport', '📗', 'Replace a damaged passport',
    [fullName, myId, text('old_passport_number', 'Passport number', true), area('damage_details', 'What damage occurred?')],
    [req('damaged_passport', 'The damaged passport')]),

  svc('Passport Application Status', 'Passport', 'search', '🔎', 'Check the status of a passport application',
    [myId, text('application_reference', 'Application reference number', true)],
    [], { limit: 'none' }),

  svc('Passport Collection Appointment', 'Passport', 'passport', '📅', 'Book a time to collect your passport',
    [fullName, text('application_reference', 'Approved application reference', true),
      date('preferred_date', 'Preferred collection date', true)],
    [], { limit: 'none' }),

  svc('Passport Details Correction', 'Passport', 'edit', '✏️', 'Correct details on a passport',
    [fullName, myId, text('passport_number', 'Passport number', true), text('incorrect_detail', 'What is wrong?', true),
      text('correct_detail', 'What it should say', true)],
    [req('existing_passport', 'Existing passport'),
      req('evidence', 'Evidence of the correct details', { multiple: true })]),

  svc('Report a Passport Problem', 'Passport', 'alert', '⚠️', 'Report a problem with a passport or application',
    [fullName, text('reference', 'Passport or application reference', true), area('problem', 'Describe the problem', true)],
    [], { limit: 'none' }),

  svc('Passport Application Appeal', 'Passport', 'file', '⚖️', 'Appeal a rejected passport application',
    [fullName, myId, text('previous_reference', 'Previous application reference', true),
      area('appeal_reason', 'Why are you appealing?', true)],
    [doc('supporting_docs', 'Supporting documents', { multiple: true })]),

  /* ---------------- POLICE SERVICES ---------------- */
  svc('Police Clearance', 'Police', 'shield', '🛡️', 'Request a police clearance certificate',
    [fullName, myId, text('purpose', 'Purpose', true)]),

  svc('Report Lost National ID', 'Police', 'id', '🪪', 'Report a lost National ID to the police',
    [fullName, nid('subject_national_id', 'National ID (if known)', false, { prefill: 'national_id' }),
      date('date_lost', 'Date lost', true), text('place_lost', 'Where it was lost', true),
      area('circumstances', 'What happened?')]),

  svc('Report Lost Passport', 'Police', 'passport', '📕', 'Report a lost passport to the police',
    [fullName, nid('subject_national_id', 'National ID (if known)', false, { prefill: 'national_id' }),
      text('passport_number', 'Passport number (if known)'), date('date_lost', 'Date lost', true),
      text('place_lost', 'Where it was lost', true), area('circumstances', 'What happened?')]),

  svc('Police Affidavit', 'Police', 'file', '📝', 'Apply for a police affidavit',
    [fullName, myId, pick('affidavit_purpose', 'What is the affidavit for?', ['Lost document', 'Stolen document', 'Other'], true),
      area('statement', 'Statement of circumstances', true)]),

  svc('Report a Stolen Document', 'Police', 'alert', '🚫', 'Report a stolen document',
    [fullName, myId, pick('document_type', 'Document stolen', ['National ID', 'Passport', "Driver's licence", 'Vehicle registration', 'Other'], true),
      text('document_number', 'Document number (if known)'), date('date_stolen', 'Date stolen', true),
      text('place_stolen', 'Where it was stolen', true), area('details', 'Details')]),

  svc('Report Crime', 'Police', 'alert', '🚨', 'Report a crime',
    [fullName, myId, text('incident_type', 'Type of incident', true), date('incident_date', 'Date of incident', true),
      text('incident_location', 'Location', true), area('description', 'Describe what happened', true),
      area('suspect_details', 'Suspect details (if any)')],
    [doc('evidence', 'Supporting evidence (photos, documents)', { multiple: true })],
    { limit: 'none', sensitive: true }),

  svc('Report a Traffic Accident', 'Police', 'car', '💥', 'Report a traffic accident',
    [fullName, myId, date('accident_date', 'Date of accident', true), text('accident_location', 'Location', true),
      text('vehicle_registration', 'Your vehicle registration', true),
      area('other_parties', 'Other drivers and vehicles involved'), area('description', 'What happened?', true)],
    [doc('accident_photos', 'Photos of the scene', { multiple: true })], { limit: 'none' }),

  svc('Request a Police Report', 'Police', 'file', '📄', 'Request a copy of a police report',
    [fullName, myId, text('case_number', 'Police case or reference number', true),
      text('purpose', 'Why do you need the report?')],
    [], { limit: 'none' }),

  svc('Submit Additional Evidence', 'Police', 'file', '📎', 'Add evidence to an existing case',
    [fullName, text('case_reference', 'Existing case reference', true), area('description', 'What does this evidence show?', true)],
    [req('evidence', 'Evidence files', { multiple: true })], { limit: 'none', sensitive: true }),

  svc('Track Police Clearance Application', 'Police', 'search', '🔎', 'Check the status of a police clearance',
    [text('application_reference', 'Application reference number', true)],
    [], { limit: 'none' }),

  /* ---------------- FINANCE AND REVENUE ---------------- */
  svc('Tax Filing', 'Finance', 'finance', '💰', 'File your tax return',
    [text('tax_year', 'Tax year', true), text('income', 'Annual income'), text('employer', 'Employer'),
      text('tax_number', 'Tax number (if you have one)')],
    [req('financial_records', 'Financial records, such as payslips', { multiple: true })]),

  svc('Tax Registration', 'Finance', 'finance', '🗂️', 'Register as a taxpayer',
    [fullName, myId, pick('registration_type', 'Register as', ['Individual', 'Business'], true),
      text('business_name', 'Business name'), text('business_registration', 'Business registration number')],
    [doc('business_docs', 'Business registration documents', { multiple: true })],
    { limit: 'once' }),

  svc('Tax Clearance', 'Finance', 'finance', '📊', 'Apply for a tax clearance certificate',
    [fullName, myId, text('tax_number', 'Tax number', true), text('purpose', 'Purpose', true)],
    [req('tax_records', 'Tax records', { multiple: true })]),

  svc('Tax Clearance Status Enquiry', 'Finance', 'search', '🔎', 'Check the status of a tax clearance',
    [fullName, text('reference', 'Application reference or tax number', true)],
    [], { limit: 'none' }),

  svc('Tax Payment', 'Finance', 'finance', '💳', 'Record a tax payment',
    [fullName, text('tax_number', 'Tax account or reference number', true), text('amount', 'Amount', true),
      pick('payment_method', 'Payment method', ['Bank transfer', 'Mobile money', 'Cash at office'], true),
      date('payment_date', 'Payment date')],
    [doc('payment_proof', 'Proof of payment')], { limit: 'none' }),

  svc('Government Service Fee Payment', 'Finance', 'finance', '💵', 'Pay a fee for a government service',
    [fullName, text('application_reference', 'Application reference', true), text('amount', 'Fee amount', true),
      pick('payment_method', 'Payment method', ['Bank transfer', 'Mobile money', 'Cash at office'], true)],
    [doc('payment_proof', 'Proof of payment')], { limit: 'none' }),

  svc('Payment Receipt Request', 'Finance', 'file', '🧾', 'Get a receipt for a payment',
    [fullName, text('transaction_reference', 'Transaction or reference number', true)],
    [], { limit: 'none' }),

  svc('Tax Account Enquiry', 'Finance', 'finance', '💬', 'Ask about your tax account',
    [fullName, myId, text('tax_number', 'Tax number'), area('enquiry', 'Your enquiry', true)],
    [], { limit: 'none' }),

  svc('Tax Refund Enquiry', 'Finance', 'finance', '↩️', 'Ask about a tax refund',
    [fullName, myId, text('tax_number', 'Tax number', true), text('tax_year', 'Tax year'),
      text('refund_reference', 'Refund reference (if you have one)')],
    [], { limit: 'none' }),

  svc('Report a Payment Problem', 'Finance', 'alert', '⚠️', 'Report a problem with a payment',
    [fullName, text('transaction_reference', 'Transaction reference', true), area('problem', 'Describe the problem', true)],
    [req('payment_evidence', 'Payment evidence', { multiple: true })], { limit: 'none' }),
];

export const SERVICE_LIST = LIST;
export const SERVICES = Object.fromEntries(LIST.map((s) => [s.name, s]));
export const servicesFor = (departmentKey) => LIST.filter((s) => s.department === departmentKey);

/* ------------------------------------------------------------------ */
/*  Application state helpers                                          */
/* ------------------------------------------------------------------ */
export const normaliseStatus = (status) =>
  String(status || '').trim().toLowerCase().replace(/[\s-]+/g, '_');

export const OPEN_STATUSES = ['submitted', 'pending', 'review', 'in_review', 'ready'];
export const DONE_STATUSES = ['approved', 'completed'];

export const shortText = (value, max = 160) => {
  const s = String(value || '').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1).trim()}…` : s;
};

// applications must be sorted newest first
export const getServiceState = (service, applications = [], person = {}) => {
  if (!service) return { state: 'available' };

  if (service.blockIfHasId && person?.national_id) {
    return { state: 'has_id', message: `You already have a National ID (${person.national_id}).` };
  }
  if (service.limit === 'none') return { state: 'available' };

  const mine = applications.filter((a) => a.service_type === service.name);

  const open = mine.find((a) => OPEN_STATUSES.includes(normaliseStatus(a.status)));
  if (open) {
    return {
      state: 'open',
      application: open,
      message: `You already have an application in progress (${open.reference_number}).`,
    };
  }

  if (service.limit === 'once') {
    const done = mine.find((a) => DONE_STATUSES.includes(normaliseStatus(a.status)));
    if (done) {
      return {
        state: 'done',
        application: done,
        message: `This application was already approved (${done.reference_number}).`,
      };
    }
  }

  const latest = mine[0];
  if (latest && normaliseStatus(latest.status) === 'rejected') {
    return {
      state: 'rejected',
      application: latest,
      message: 'Your previous application was rejected. You can update it and apply again.',
    };
  }

  return { state: 'available' };
};