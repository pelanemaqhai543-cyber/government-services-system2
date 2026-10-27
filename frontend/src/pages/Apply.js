
import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// MyGov Lesotho: royal blue, green and white.
const THEME = {
  blue: '#00209f',
  blueDark: '#00166f',
  green: '#009543',
};

const DOCUMENTS = {
  birth: {
    label: 'Birth certificate',
    description: 'Official birth certificate.',
  },
  birthEvidence: {
    label: 'Birth notification or birth record',
    description: 'Hospital birth notification or another accepted birth record.',
  },
  nationalId: {
    label: 'National ID',
    description: 'Clear copy of the applicant’s National ID.',
  },
  policeAffidavit: {
    label: 'Police affidavit/report',
    description: 'Police report or affidavit documenting the loss.',
  },
  chiefLetter: {
    label: "Village chief's letter",
    description: 'Official letter from the village chief.',
  },
  existingPassport: {
    label: 'Existing passport',
    description: 'Copy of the current passport.',
  },
  marriageProof: {
    label: 'Marriage supporting document',
    description: 'Marriage record or other accepted marriage evidence.',
  },
  deathNotification: {
    label: 'Death notification or medical confirmation',
    description: 'Official notification or medical confirmation of death.',
  },
  identityProof: {
    label: 'Additional identity evidence',
    description: 'Other accepted identity or civil-registration evidence.',
  },
  vehicleProof: {
    label: 'Vehicle ownership documents',
    description: 'Accepted proof of ownership or purchase.',
  },
  paymentProof: {
    label: 'Payment proof',
    description: 'Receipt or other accepted proof of payment.',
  },
  taxRecords: {
    label: 'Tax or financial records',
    description: 'Tax records relevant to the application.',
  },
  pensionProof: {
    label: 'Pension supporting documents',
    description: 'Records relevant to pension eligibility or payment.',
  },
  other: {
    label: 'Additional supporting document',
    description: 'Supplementary evidence. This does not replace a required document.',
  },
};

// Each service explicitly declares its required and optional documents.
// "other" is never accepted as a replacement for a required document.
const SERVICES = {
  'Birth Certificate': {
    prefix: 'BC',
    icon: 'birth',
    department: 'Home Affairs',
    description: 'Register a birth and request a birth certificate.',
    requiredDocs: ['birthEvidence', 'chiefLetter'],
    optionalDocs: ['identityProof', 'other'],
    fields: [
      { name: 'subject_full_name', label: "Child's full name", type: 'text', required: true },
      { name: 'subject_date_of_birth', label: 'Date of birth', type: 'date', required: true },
      { name: 'subject_gender', label: 'Gender', type: 'select', options: ['Male', 'Female'], required: true },
      { name: 'subject_district', label: 'District of birth', type: 'text', required: true },
      { name: 'mother_name', label: "Mother's full name", type: 'text', required: true },
      { name: 'father_name', label: "Father's full name", type: 'text' },
      { name: 'place_of_birth', label: 'Place of birth', type: 'text', required: true },
    ],
  },

  'National ID Registration': {
    prefix: 'ID',
    icon: 'id',
    department: 'Home Affairs',
    description: 'Apply for your first National ID.',
    requiredDocs: ['birth', 'chiefLetter'],
    optionalDocs: ['identityProof', 'other'],
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_date_of_birth', label: 'Date of birth', type: 'date', required: true },
      { name: 'subject_gender', label: 'Gender', type: 'select', options: ['Male', 'Female'], required: true },
      { name: 'subject_district', label: 'District', type: 'text', required: true },
      { name: 'subject_address', label: 'Residential address', type: 'textarea', required: true },
    ],
  },

  'National ID Renewal': {
    prefix: 'IDR',
    icon: 'renew',
    department: 'Home Affairs',
    description: 'Renew an existing National ID.',
    requiredDocs: ['nationalId'],
    optionalDocs: ['other'],
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'Current National ID', type: 'text', required: true },
      { name: 'expiry_date', label: 'Expiry date', type: 'date' },
      { name: 'reason', label: 'Reason for renewal', type: 'textarea' },
    ],
  },

  'Lost National ID Replacement': {
    prefix: 'IDL',
    icon: 'id',
    department: 'Home Affairs',
    description: 'Replace a lost National ID.',
    requiredDocs: ['policeAffidavit'],
    optionalDocs: ['nationalId', 'identityProof', 'other'],
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'National ID number, if known', type: 'text' },
      { name: 'date_lost', label: 'Date lost', type: 'date', required: true },
      { name: 'reason', label: 'Circumstances of loss', type: 'textarea', required: true },
    ],
  },

  'Death Certificate': {
    prefix: 'DC',
    icon: 'death',
    department: 'Home Affairs',
    description: 'Register a death and request a death certificate.',
    requiredDocs: ['deathNotification', 'identityProof'],
    optionalDocs: ['nationalId', 'other'],
    fields: [
      { name: 'deceased_national_id', label: "Deceased person's National ID", type: 'text', required: true },
      { name: 'subject_full_name', label: "Deceased's full name", type: 'text', required: true },
      { name: 'subject_date_of_birth', label: 'Date of birth', type: 'date', required: true },
      { name: 'date_of_death', label: 'Date of death', type: 'date', required: true },
      { name: 'place_of_death', label: 'Place of death', type: 'text', required: true },
      { name: 'cause_of_death', label: 'Cause of death, if known', type: 'text' },
    ],
  },

  'Marriage Certificate': {
    prefix: 'MC',
    icon: 'marriage',
    department: 'Home Affairs',
    description: 'Register a marriage or request a marriage certificate.',
    requiredDocs: ['nationalId', 'marriageProof'],
    optionalDocs: ['other'],
    fields: [
      { name: 'subject_full_name', label: 'First spouse full name', type: 'text', required: true },
      { name: 'subject_date_of_birth', label: 'First spouse date of birth', type: 'date', required: true },
      { name: 'spouse_name', label: 'Second spouse full name', type: 'text', required: true },
      { name: 'marriage_date', label: 'Date of marriage', type: 'date', required: true },
      { name: 'marriage_place', label: 'Place of marriage', type: 'text', required: true },
    ],
  },

  'Passport Application': {
    prefix: 'PP',
    icon: 'passport',
    department: 'Passport',
    description: 'Apply for a new passport.',
    requiredDocs: ['nationalId', 'birth'],
    optionalDocs: ['other'],
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'National ID', type: 'text', required: true },
      { name: 'subject_date_of_birth', label: 'Date of birth', type: 'date', required: true },
      { name: 'place_of_birth', label: 'Place of birth', type: 'text', required: true },
    ],
  },

  'Passport Renewal': {
    prefix: 'PPR',
    icon: 'passport',
    department: 'Passport',
    description: 'Renew an existing passport.',
    requiredDocs: ['nationalId', 'existingPassport'],
    optionalDocs: ['other'],
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'National ID', type: 'text', required: true },
      { name: 'old_passport_number', label: 'Current passport number', type: 'text', required: true },
      { name: 'expiry_date', label: 'Passport expiry date', type: 'date' },
    ],
  },

  'Lost Passport Replacement': {
    prefix: 'PPL',
    icon: 'passport',
    department: 'Passport',
    description: 'Replace a lost passport. A police affidavit/report is required.',
    requiredDocs: ['nationalId', 'policeAffidavit'],
    optionalDocs: ['other'],
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'National ID', type: 'text', required: true },
      { name: 'old_passport_number', label: 'Lost passport number, if known', type: 'text' },
      { name: 'date_lost', label: 'Date lost', type: 'date', required: true },
      { name: 'reason', label: 'Circumstances of loss', type: 'textarea', required: true },
    ],
  },

  'Police Clearance': {
    prefix: 'PC',
    icon: 'shield',
    department: 'Police',
    description: 'Apply for a police clearance certificate.',
    requiredDocs: ['nationalId'],
    optionalDocs: ['other'],
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'National ID', type: 'text', required: true },
      { name: 'purpose', label: 'Purpose of clearance', type: 'text', required: true },
    ],
  },

  'Report Crime': {
    prefix: 'CR',
    icon: 'shield',
    department: 'Police',
    description: 'Submit a crime report for review by an authorised officer.',
    requiredDocs: [],
    optionalDocs: ['other'],
    fields: [
      { name: 'incident_type', label: 'Incident type', type: 'text', required: true },
      { name: 'incident_date', label: 'Date of incident', type: 'date', required: true },
      { name: 'location', label: 'Incident location', type: 'text', required: true },
      { name: 'description', label: 'Description of incident', type: 'textarea', required: true },
    ],
  },

  'Lost Document Affidavit': {
    prefix: 'AF',
    icon: 'shield',
    department: 'Police',
    description: 'Request assistance with documenting a lost document.',
    requiredDocs: ['nationalId'],
    optionalDocs: ['other'],
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'National ID', type: 'text', required: true },
      { name: 'document_type', label: 'Type of document lost', type: 'text', required: true },
      { name: 'date_lost', label: 'Date lost', type: 'date', required: true },
      { name: 'description', label: 'Circumstances of loss', type: 'textarea', required: true },
    ],
  },

  "Driver's Licence": {
    prefix: 'DL',
    icon: 'car',
    department: 'Traffic',
    description: "Apply for a learner's or driving licence.",
    requiredDocs: ['nationalId'],
    optionalDocs: ['paymentProof', 'other'],
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'National ID', type: 'text', required: true },
      { name: 'licence_type', label: 'Licence type', type: 'select', options: ['Learner', 'Class B', 'Class C'], required: true },
    ],
  },

  'Driving Licence Renewal': {
    prefix: 'DLR',
    icon: 'car',
    department: 'Traffic',
    description: 'Renew an existing driving licence.',
    requiredDocs: ['nationalId'],
    optionalDocs: ['paymentProof', 'other'],
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'National ID', type: 'text', required: true },
      { name: 'current_licence_number', label: 'Current licence number', type: 'text', required: true },
      { name: 'expiry_date', label: 'Expiry date', type: 'date' },
    ],
  },

  'Vehicle Registration': {
    prefix: 'VR',
    icon: 'vehicle',
    department: 'Traffic',
    description: 'Submit an application to register a vehicle.',
    requiredDocs: ['nationalId', 'vehicleProof'],
    optionalDocs: ['paymentProof', 'other'],
    fields: [
      { name: 'vehicle_make', label: 'Vehicle make', type: 'text', required: true },
      { name: 'vehicle_model', label: 'Vehicle model', type: 'text', required: true },
      { name: 'vehicle_year', label: 'Manufacturing year', type: 'number', required: true },
      { name: 'vin', label: 'VIN / chassis number', type: 'text', required: true },
      { name: 'owner_name', label: "Owner's full name", type: 'text', required: true },
    ],
  },

  'Tax Filing': {
    prefix: 'TX',
    icon: 'finance',
    department: 'Finance',
    description: 'Submit a tax filing application or enquiry.',
    requiredDocs: ['nationalId', 'taxRecords'],
    optionalDocs: ['paymentProof', 'other'],
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'National ID / taxpayer number', type: 'text', required: true },
      { name: 'tax_year', label: 'Tax year', type: 'number', required: true },
      { name: 'income', label: 'Annual income', type: 'number' },
      { name: 'employer', label: 'Employer', type: 'text' },
    ],
  },

  'Tax Clearance': {
    prefix: 'TXC',
    icon: 'finance',
    department: 'Finance',
    description: 'Request a tax clearance certificate.',
    requiredDocs: ['nationalId', 'taxRecords'],
    optionalDocs: ['paymentProof', 'other'],
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'National ID / taxpayer number', type: 'text', required: true },
      { name: 'tax_year', label: 'Tax year', type: 'number', required: true },
      { name: 'purpose', label: 'Purpose of clearance', type: 'text', required: true },
    ],
  },

  'Pension Application': {
    prefix: 'PN',
    icon: 'pension',
    department: 'Pensions',
    description: 'Apply for an eligible state pension.',
    requiredDocs: ['nationalId', 'pensionProof'],
    optionalDocs: ['other'],
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'National ID', type: 'text', required: true },
      { name: 'subject_date_of_birth', label: 'Date of birth', type: 'date', required: true },
      { name: 'subject_address', label: 'Residential address', type: 'textarea', required: true },
      { name: 'employment_history', label: 'Employment history, if applicable', type: 'textarea' },
    ],
  },

  'Pension Payment Enquiry': {
    prefix: 'PNE',
    icon: 'pension',
    department: 'Pensions',
    description: 'Enquire about pension payment status.',
    requiredDocs: ['nationalId'],
    optionalDocs: ['pensionProof', 'other'],
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'National ID', type: 'text', required: true },
      { name: 'pension_number', label: 'Pension number, if available', type: 'text' },
      { name: 'payment_period', label: 'Payment period', type: 'text', required: true },
      { name: 'description', label: 'Enquiry details', type: 'textarea', required: true },
    ],
  },
};

const DEPT_ORDER = [
  'Home Affairs',
  'Traffic',
  'Pensions',
  'Passport',
  'Police',
  'Finance',
];

const DEPARTMENTS = {
  'Home Affairs': {
    code: 'HA',
    color: '#173ea5',
    description: 'Identity, civil registration and personal records.',
  },
  Traffic: {
    code: 'TR',
    color: '#b76b08',
    description: 'Driving licences and vehicle registration.',
  },
  Pensions: {
    code: 'PN',
    color: '#7044b8',
    description: 'Pension applications and payment enquiries.',
  },
  Passport: {
    code: 'PP',
    color: '#b42332',
    description: 'Passport applications, renewals and replacements.',
  },
  Police: {
    code: 'PL',
    color: '#243e70',
    description: 'Police clearance and reporting services.',
  },
  Finance: {
    code: 'FN',
    color: '#087d76',
    description: 'Tax services and government financial enquiries.',
  },
};

const Icon = ({ name, size = 20 }) => {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 20h14" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></>,
    file: <><path d="M6 3.5h8l4 4v13H6z" /><path d="M14 3.5v4h4" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    back: <><path d="m15 18-6-6 6-6" /><path d="M9 12h12" /></>,
    birth: <><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    id: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8" cy="12" r="2" /><path d="M13 10h5M13 14h4" /></>,
    renew: <><path d="M20 11a8 8 0 0 0-14.7-4L3 10" /><path d="M3 5v5h5M4 13a8 8 0 0 0 14.7 4L21 14" /><path d="M21 19v-5h-5" /></>,
    death: <><path d="M12 21s-7-4.3-7-10V5l7-2 7 2v6c0 5.7-7 10-7 10Z" /><path d="M9 12h6M12 9v6" /></>,
    marriage: <path d="M12 20S4 15.5 4 9a4 4 0 0 1 7-2.5A4 4 0 0 1 18 9c0 6.5-6 9.5-6 11Z" />,
    passport: <><rect x="5" y="3" width="14" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M8 16h8" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
    car: <><path d="m5 16 1.5-6h11L19 16" /><path d="M4 16h16v3H4zM7 13h.01M17 13h.01" /></>,
    vehicle: <><path d="M5 16 6.5 9h11l1.5 7" /><path d="M4 16h16v3H4zM7 13h.01M17 13h.01" /></>,
    finance: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v10M15 9.5c-.6-.7-1.5-1-2.8-1-1.5 0-2.5.7-2.5 1.8 0 2.8 5.3 1 5.3 3.8 0 1.2-1 2-2.7 2-1.3 0-2.3-.4-3-1.2" /></>,
    pension: <><circle cx="12" cy="8" r="3" /><path d="M4 21a8 8 0 0 1 16 0M3 17h18" /></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.file}
    </svg>
  );
};

const styles = `
.apply-page {
  --blue:#00209f;
  --blue-dark:#00166f;
  --blue-soft:#edf2ff;
  --green:#009543;
  --green-soft:#eaf8f0;
  --ink:#172235;
  --muted:#718096;
  --border:#e3e8f0;
  color:var(--ink);
  max-width:1240px;
  margin:0 auto;
  padding-bottom:44px;
}
.apply-page * { box-sizing:border-box; }
.apply-page button,.apply-page input,.apply-page select,.apply-page textarea { font:inherit; }
.apply-page button { cursor:pointer; }
.apply-page h1,.apply-page h2,.apply-page h3,.apply-page p { margin:0; }
.apply-main { min-width:0; width:calc(100% - 240px); min-height:100vh; margin-left:240px; padding:32px 40px; }
.apply-page .hero { position:relative; overflow:hidden; padding:34px; margin-bottom:30px; border:1px solid #00166f; border-radius:22px; background:linear-gradient(118deg,#00145f,#00209f 58%,#0754c5); box-shadow:0 18px 40px rgba(0,32,159,.15); }
.apply-page .hero:after { position:absolute; right:-85px; bottom:-145px; width:320px; height:320px; content:''; border:42px solid rgba(0,149,67,.3); border-radius:50%; pointer-events:none; }
.apply-page .hero-content { position:relative; z-index:1; max-width:760px; }
.apply-page .eyebrow { display:flex; align-items:center; gap:9px; margin-bottom:12px; color:#baf2cf; font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }
.apply-page .eyebrow span { width:8px; height:8px; border-radius:50%; background:#20c778; box-shadow:0 0 0 5px rgba(32,199,120,.2); }
.apply-page .hero h1 { color:#fff; font-size:clamp(28px,3.2vw,42px); letter-spacing:-.045em; line-height:1.12; }
.apply-page .hero p { color:rgba(255,255,255,.82); margin-top:12px; font-size:14px; line-height:1.7; }
.apply-page .hero-note { display:inline-flex; align-items:center; gap:8px; margin-top:22px; padding:9px 12px; color:#fff; border:1px solid rgba(255,255,255,.25); border-radius:9px; background:rgba(255,255,255,.09); font-size:12px; }
.apply-page .toolbar { display:flex; justify-content:space-between; align-items:center; gap:14px; margin:0 0 26px; }
.apply-page .search-box { display:flex; align-items:center; gap:10px; flex:1; max-width:540px; padding:0 14px; border:1px solid var(--border); border-radius:12px; background:#fff; color:var(--muted); box-shadow:0 4px 12px rgba(20,35,60,.03); }
.apply-page .search-box input { width:100%; min-width:0; padding:13px 0; border:0; outline:0; background:transparent; color:var(--ink); font-size:13px; }
.apply-page .search-box:focus-within { border-color:#7d9ae7; box-shadow:0 0 0 3px rgba(0,32,159,.08); }
.apply-page .service-count { color:var(--muted); font-size:12px; white-space:nowrap; }
.apply-page .dept-section { margin-bottom:34px; }
.apply-page .dept-head { display:flex; align-items:center; gap:12px; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--border); }
.apply-page .dept-badge { width:46px; height:46px; display:grid; place-items:center; color:#fff; border-radius:13px; font-weight:900; font-size:13px; flex-shrink:0; }
.apply-page .dept-head h2 { font-size:19px; font-weight:800; color:#101828; }
.apply-page .dept-head p { font-size:12px; color:var(--muted); margin-top:4px; }
.apply-page .services-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:14px; }
.apply-page .service-card { position:relative; display:flex; flex-direction:column; align-items:flex-start; width:100%; min-height:185px; padding:20px; text-align:left; background:#fff; border:1px solid var(--border); border-radius:15px; transition:transform .18s,border-color .18s,box-shadow .18s; box-shadow:0 5px 18px rgba(20,35,60,.035); }
.apply-page .service-card:before { position:absolute; top:0; left:0; right:0; height:3px; content:''; background:var(--dept-color,#00209f); border-radius:15px 15px 0 0; }
.apply-page .service-card:hover { transform:translateY(-3px); border-color:#a9bce9; box-shadow:0 14px 26px rgba(0,32,159,.09); }
.apply-page .service-card:focus-visible,.apply-page .btn:focus-visible { outline:3px solid #8ab5ff; outline-offset:3px; }
.apply-page .service-icon { width:44px; height:44px; color:var(--dept-color,#00209f); display:grid; place-items:center; background:var(--blue-soft); border-radius:12px; margin-bottom:15px; }
.apply-page .service-card h3 { font-size:14px; font-weight:800; margin-bottom:7px; line-height:1.45; color:#101828; }
.apply-page .service-card p { font-size:12px; color:var(--muted); line-height:1.6; flex:1; }
.apply-page .card-action { display:flex; align-items:center; gap:7px; margin-top:16px; color:var(--blue); font-size:12px; font-weight:800; }
.apply-page .empty-state { padding:36px 20px; border:1px dashed #cbd5e1; border-radius:14px; background:#fff; text-align:center; color:var(--muted); font-size:13px; }
.apply-page .form-wrap { max-width:850px; margin:0 auto; }
.apply-page .back-button { display:inline-flex; align-items:center; gap:8px; padding:9px 0; margin-bottom:14px; border:0; background:transparent; color:var(--blue); font-size:13px; font-weight:800; }
.apply-page .form-header { text-align:center; padding:27px 25px; margin-bottom:20px; border-radius:18px; background:linear-gradient(135deg,#f1f5ff,#effaf4); border:1px solid #dce5f4; }
.apply-page .selected-service-icon { width:60px; height:60px; margin:0 auto 14px; display:grid; place-items:center; color:#fff; background:var(--blue); border-radius:16px; }
.apply-page .form-header h2 { font-size:25px; font-weight:850; margin-bottom:8px; color:#101828; }
.apply-page .form-header p { font-size:13px; color:var(--muted); line-height:1.6; }
.apply-page .form-meta { display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin-top:14px; }
.apply-page .meta-pill { padding:6px 10px; border:1px solid #d8e1f2; border-radius:100px; background:#fff; color:#42526a; font-size:11px; font-weight:700; }
.apply-page .form-card { background:#fff; border:1px solid var(--border); border-radius:17px; padding:30px; box-shadow:0 12px 30px rgba(20,35,60,.055); }
.apply-page .form-section { margin-bottom:30px; }
.apply-page .form-section:last-child { margin-bottom:0; }
.apply-page .form-section-title { font-size:12px; font-weight:850; color:var(--blue); text-transform:uppercase; letter-spacing:.1em; padding-bottom:12px; margin-bottom:18px; border-bottom:1px solid var(--border); }
.apply-page .section-description { margin:-7px 0 16px; color:var(--muted); font-size:12px; line-height:1.6; }
.apply-page .form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:17px; }
.apply-page .form-field { display:flex; flex-direction:column; gap:7px; min-width:0; }
.apply-page .form-field.full { grid-column:1/-1; }
.apply-page .form-field label { font-size:12px; font-weight:800; color:#263449; }
.apply-page .form-field label b { color:#dc2626; }
.apply-page .form-field input,.apply-page .form-field select,.apply-page .form-field textarea { width:100%; padding:12px 13px; border:1px solid #dce2eb; border-radius:10px; font-size:13px; outline:none; background:#fbfcff; color:var(--ink); transition:border .18s,box-shadow .18s; }
.apply-page .form-field input:focus,.apply-page .form-field select:focus,.apply-page .form-field textarea:focus { border-color:var(--green); box-shadow:0 0 0 3px rgba(0,149,67,.09); }
.apply-page .form-field textarea { min-height:90px; resize:vertical; }
.apply-page .field-hint { color:var(--muted); font-size:11px; line-height:1.5; }
.apply-page .upload-instructions { padding:13px 15px; margin-bottom:15px; border:1px solid #dce5f4; border-radius:11px; background:#f7f9ff; color:#43516a; font-size:12px; line-height:1.7; }
.apply-page .required-docs { display:grid; gap:8px; margin-bottom:17px; }
.apply-page .required-doc { display:flex; align-items:flex-start; gap:10px; padding:11px 12px; border:1px solid var(--border); border-radius:10px; background:#fff; font-size:12px; }
.apply-page .required-doc .doc-icon { color:var(--blue); margin-top:1px; }
.apply-page .required-doc strong { display:block; font-size:12px; margin-bottom:3px; }
.apply-page .required-doc small { display:block; color:var(--muted); line-height:1.5; }
.apply-page .required-doc .doc-status { margin-left:auto; color:#8a4b08; font-size:10px; font-weight:800; white-space:nowrap; }
.apply-page .required-doc .doc-status.done { color:#007936; }
.apply-page .upload-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:12px; }
.apply-page .upload-select { display:flex; flex-direction:column; gap:7px; }
.apply-page .upload-select label { font-size:12px; font-weight:800; }
.apply-page .upload-select select { width:100%; padding:11px 12px; border:1px solid #dce2eb; border-radius:10px; background:#fbfcff; color:var(--ink); font-size:12px; }
.apply-page .upload-box { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:150px; padding:20px; text-align:center; border:2px dashed #aebfdf; border-radius:12px; cursor:pointer; background:linear-gradient(135deg,#fbfcff,#f2f6ff); transition:border .18s,background .18s; }
.apply-page .upload-box:hover { border-color:var(--green); background:#effaf4; }
.apply-page .upload-box svg { color:var(--blue); margin-bottom:9px; }
.apply-page .upload-box p { font-size:13px; color:var(--ink); font-weight:800; }
.apply-page .upload-box small { font-size:11px; color:var(--muted); margin-top:5px; }
.apply-page .file-list { margin-top:13px; display:grid; gap:9px; }
.apply-page .file-item { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:11px 12px; background:#f8fafc; border:1px solid var(--border); border-radius:10px; font-size:12px; }
.apply-page .file-info { display:flex; align-items:flex-start; gap:9px; min-width:0; }
.apply-page .file-info strong { display:block; overflow-wrap:anywhere; }
.apply-page .file-info small { display:block; margin-top:4px; color:var(--muted); }
.apply-page .file-item button { display:grid; place-items:center; flex-shrink:0; padding:7px; border:0; border-radius:7px; background:#fff0f0; color:#b42318; }
.apply-page .alert { padding:13px 15px; border-radius:10px; font-size:12px; line-height:1.6; margin-bottom:16px; display:flex; gap:10px; align-items:flex-start; }
.apply-page .alert-error { background:#fff1f1; color:#a12323; border:1px solid #f0d4d4; }
.apply-page .alert-success { background:#eaf8f0; color:#007936; border:1px solid #bfe4cf; }
.apply-page .actions { display:flex; justify-content:flex-end; gap:12px; margin-top:24px; }
.apply-page .btn { display:inline-flex; align-items:center; justify-content:center; gap:9px; padding:12px 19px; border-radius:10px; font-size:12px; font-weight:850; transition:background .18s,border .18s; border:1px solid transparent; }
.apply-page .btn-primary { background:var(--blue); color:#fff; border-color:var(--blue); }
.apply-page .btn-primary:hover { background:var(--green); border-color:var(--green); }
.apply-page .btn-primary:disabled { opacity:.65; cursor:not-allowed; }
.apply-page .btn-secondary { background:#fff; color:var(--blue); border-color:#cbd6f2; }
.apply-page .btn-secondary:hover { background:#f4f6ff; }
.apply-page .success-card { text-align:center; padding:38px 28px; }
.apply-page .success-mark { width:70px; height:70px; margin:0 auto 18px; display:grid; place-items:center; background:var(--green-soft); color:#007936; border-radius:50%; }
.apply-page .reference-box { max-width:440px; margin:22px auto; padding:18px; border:1px dashed #b7c5dd; border-radius:12px; background:#f7f9fc; }
.apply-page .reference-box small { display:block; color:var(--muted); text-transform:uppercase; letter-spacing:.08em; font-size:10px; font-weight:850; }
.apply-page .reference-box strong { display:block; margin-top:8px; color:var(--blue); font-size:22px; overflow-wrap:anywhere; }
.apply-page .success-message { color:var(--muted); font-size:13px; line-height:1.7; }
@media(max-width:1100px) { .apply-main { padding:26px 24px; } .apply-page .services-grid { grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); } }
@media(max-width:900px) { .apply-main { width:100%; margin-left:0; } }
@media(max-width:600px) { .apply-main { width:100%; margin-left:0; padding:20px 14px 30px; } .apply-page .hero { padding:25px 20px; border-radius:16px; } .apply-page .toolbar { align-items:stretch; flex-direction:column; } .apply-page .search-box { max-width:none; } .apply-page .service-count { white-space:normal; } .apply-page .services-grid { grid-template-columns:1fr; } .apply-page .service-card { min-height:150px; } .apply-page .form-card { padding:21px 16px; } .apply-page .form-header { padding:21px 15px; } .apply-page .form-grid,.apply-page .upload-grid { grid-template-columns:1fr; } .apply-page .actions { flex-direction:column-reverse; } .apply-page .btn { width:100%; } .apply-page .form-header h2 { font-size:22px; } }
`;

const Apply = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [selectedService, setSelectedService] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({});
  const [notes, setNotes] = useState('');
  const [documents, setDocuments] = useState([]);
  const [uploadType, setUploadType] = useState('other');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const groupedServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return DEPT_ORDER.map((dept) => {
      const definition = DEPARTMENTS[dept];

      const services = Object.entries(SERVICES).filter(([name, service]) => {
        const matchesDepartment = service.department === dept;
        const matchesSearch =
          !query ||
          name.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query) ||
          dept.toLowerCase().includes(query);

        return matchesDepartment && matchesSearch;
      });

      return { dept, ...definition, services };
    }).filter((group) => group.services.length > 0);
  }, [search]);

  const totalVisibleServices = groupedServices.reduce(
    (total, group) => total + group.services.length,
    0
  );

  const selectedDefinition = selectedService ? SERVICES[selectedService] : null;

  const requiredDocuments = selectedDefinition?.requiredDocs || [];
  const optionalDocuments = selectedDefinition?.optionalDocs || [];
  const allowedDocumentTypes = [...requiredDocuments, ...optionalDocuments];

  const isDocumentUploaded = (type) =>
    documents.some((document) => document.document_type === type);

  const handleSelectService = (name) => {
    const definition = SERVICES[name];
    const prefilled = {};

    if (user) {
      const possibleValues = {
        subject_full_name: user.full_name || '',
        subject_national_id: user.national_id || '',
        subject_date_of_birth: user.date_of_birth
          ? String(user.date_of_birth).slice(0, 10)
          : '',
        subject_gender: user.gender || '',
        subject_address: user.address || '',
        subject_district: user.district || '',
      };

      definition.fields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(possibleValues, field.name)) {
          prefilled[field.name] = possibleValues[field.name];
        }
      });
    }

    setSelectedService(name);
    setFormData(prefilled);
    setNotes('');
    setDocuments([]);
    setUploadType(
      definition.requiredDocs[0] || definition.optionalDocs[0] || 'other'
    );
    setError('');
    setSuccess(null);
  };

  const handleFieldChange = (name, value) => {
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleFileAdd = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (!files.length) return;
    setError('');

    if (documents.length + files.length > MAX_FILES) {
      setError(`You can upload a maximum of ${MAX_FILES} files per application.`);
      return;
    }

    if (!allowedDocumentTypes.includes(uploadType)) {
      setError('Please select a document category allowed for this service.');
      return;
    }

    const invalidType = files.find((file) => !ALLOWED_TYPES.includes(file.type));
    if (invalidType) {
      setError(`"${invalidType.name}" is not supported. Upload PDF, JPG or PNG files only.`);
      return;
    }

    const tooLarge = files.find((file) => file.size > MAX_FILE_SIZE);
    if (tooLarge) {
      setError(`"${tooLarge.name}" is larger than 5 MB.`);
      return;
    }

    const duplicate = files.find((file) =>
      documents.some(
        (existing) =>
          existing.file_name === file.name &&
          existing.file_size === file.size &&
          existing.document_type === uploadType
      )
    );

    if (duplicate) {
      setError(`"${duplicate.name}" has already been uploaded under this document type.`);
      return;
    }

    try {
      const converted = await Promise.all(
        files.map((file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve({
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              file_data: reader.result,
              document_type: uploadType,
            });

            reader.onerror = () =>
              reject(new Error(`Could not read "${file.name}". Please try again.`));

            reader.readAsDataURL(file);
          })
        )
      );

      setDocuments((previous) => [...previous, ...converted]);
    } catch (err) {
      setError(err.message || 'Could not read the selected files.');
    }
  };

  const handleRemoveDoc = (index) => {
    setDocuments((previous) => previous.filter((_, i) => i !== index));
    setError('');
  };

  const validateApplication = () => {
    if (!selectedDefinition) return 'Please select a service.';

    for (const field of selectedDefinition.fields) {
      const value = formData[field.name];

      if (
        field.required &&
        (value === undefined || String(value).trim() === '')
      ) {
        return `Please complete the required field: ${field.label}.`;
      }

      if (
        field.type === 'number' &&
        value !== undefined &&
        String(value).trim() !== '' &&
        !Number.isFinite(Number(value))
      ) {
        return `${field.label} must be a valid number.`;
      }

      if (
        field.type === 'number' &&
        value !== undefined &&
        String(value).trim() !== '' &&
        Number(value) < 0
      ) {
        return `${field.label} cannot be negative.`;
      }
    }

    if (
      selectedService === 'Vehicle Registration' &&
      Number(formData.vehicle_year) > new Date().getFullYear() + 1
    ) {
      return 'Manufacturing year cannot be more than one year in the future.';
    }

    for (const type of requiredDocuments) {
      if (!isDocumentUploaded(type)) {
        return `Please upload the required document: ${DOCUMENTS[type].label}.`;
      }
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!selectedDefinition || loading) return;

    const validationMessage = validateApplication();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setLoading(true);

    try {
      const department = selectedDefinition.department
        .toLowerCase()
        .replace(/\s+/g, '_');

      // Existing API endpoint and payload structure are preserved.
      const response = await API.post('/requests', {
        service_type: selectedService,
        department,
        form_data: formData,
        notes,
        documents,
      });

      const result = response.data || {};

      // Do not claim success if the server did not confirm a reference.
      if (!result.reference_number) {
        setError(
          'The server did not return an application reference number. Check your dashboard before trying again.'
        );
        return;
      }

      setSuccess(result);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Your application could not be submitted. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedService(null);
    setFormData({});
    setNotes('');
    setDocuments([]);
    setUploadType('other');
    setError('');
    setSuccess(null);
  };

  const referenceNumber = success?.reference_number;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f9fc' }}>
      <Sidebar />

      <main className="apply-main">
        <style>{styles}</style>

        <div className="apply-page">
          {!selectedService && (
            <>
              <header className="hero">
                <div className="hero-content">
                  <div className="eyebrow">
                    <span />
                    MyGov Lesotho · Government services
                  </div>

                  <h1>How can we help you today?</h1>

                  <p>
                    Access government services in one place. Select a department,
                    complete your application, upload supporting documents, and
                    track progress from your citizen dashboard.
                  </p>

                  <div className="hero-note">
                    <Icon name="check" size={15} />
                    Secure applications · Reference-based tracking
                  </div>
                </div>
              </header>

              <div className="toolbar">
                <div className="search-box">
                  <Icon name="search" size={19} />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search services, e.g. National ID or pension..."
                    aria-label="Search government services"
                  />
                </div>

                <div className="service-count" aria-live="polite">
                  Showing {totalVisibleServices} service
                  {totalVisibleServices !== 1 ? 's' : ''}
                </div>
              </div>

              {groupedServices.length === 0 && (
                <div className="empty-state">
                  No services match your search. Try a different keyword.
                </div>
              )}

              {groupedServices.map((group) => (
                <section key={group.dept} className="dept-section">
                  <div className="dept-head">
                    <span className="dept-badge" style={{ background: group.color }}>
                      {group.code}
                    </span>

                    <div>
                      <h2>{group.dept}</h2>
                      <p>
                        {group.description} · {group.services.length} service
                        {group.services.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="services-grid">
                    {group.services.map(([name, definition]) => (
                      <button
                        key={name}
                        type="button"
                        className="service-card"
                        style={{ '--dept-color': group.color }}
                        onClick={() => handleSelectService(name)}
                      >
                        <div className="service-icon">
                          <Icon name={definition.icon} size={23} />
                        </div>

                        <h3>{name}</h3>
                        <p>{definition.description}</p>

                        <span className="card-action">
                          Start application
                          <Icon name="arrow" size={14} />
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </>
          )}

          {selectedService && !success && (
            <div className="form-wrap">
              <button type="button" className="back-button" onClick={resetForm}>
                <Icon name="back" size={17} />
                All government services
              </button>

              <div className="form-header">
                <div className="selected-service-icon">
                  <Icon name={selectedDefinition.icon} size={29} />
                </div>

                <h2>{selectedService}</h2>
                <p>{selectedDefinition.description}</p>

                <div className="form-meta">
                  <span className="meta-pill">
                    Department: {selectedDefinition.department}
                  </span>
                  <span className="meta-pill">
                    {selectedDefinition.fields.filter((field) => field.required).length} required fields
                  </span>
                  <span className="meta-pill">
                    {requiredDocuments.length} required documents
                  </span>
                  <span className="meta-pill">Maximum 5 MB per file</span>
                </div>
              </div>

              <div className="form-card">
                <form onSubmit={handleSubmit} noValidate>
                  <section className="form-section">
                    <h3 className="form-section-title">01 · Application details</h3>

                    <p className="section-description">
                      Complete all required fields. An asterisk (*) marks
                      mandatory information. Available profile details are
                      filled in automatically.
                    </p>

                    <div className="form-grid">
                      {selectedDefinition.fields.map((field) => (
                        <div
                          key={field.name}
                          className={`form-field ${field.type === 'textarea' ? 'full' : ''}`}
                        >
                          <label htmlFor={`field-${field.name}`}>
                            {field.label} {field.required && <b>*</b>}
                          </label>

                          {field.type === 'select' ? (
                            <select
                              id={`field-${field.name}`}
                              value={formData[field.name] || ''}
                              onChange={(event) =>
                                handleFieldChange(field.name, event.target.value)
                              }
                              required={field.required}
                            >
                              <option value="">Select an option</option>
                              {field.options.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : field.type === 'textarea' ? (
                            <textarea
                              id={`field-${field.name}`}
                              value={formData[field.name] || ''}
                              onChange={(event) =>
                                handleFieldChange(field.name, event.target.value)
                              }
                              required={field.required}
                            />
                          ) : (
                            <input
                              id={`field-${field.name}`}
                              type={field.type}
                              value={formData[field.name] ?? ''}
                              onChange={(event) =>
                                handleFieldChange(field.name, event.target.value)
                              }
                              required={field.required}
                              min={
                                field.type === 'number' &&
                                field.name === 'vehicle_year' ? 1900 : undefined
                              }
                              max={
                                field.type === 'number' &&
                                field.name === 'vehicle_year'
                                  ? new Date().getFullYear() + 1
                                  : undefined
                              }
                            />
                          )}
                        </div>
                      ))}

                      <div className="form-field full">
                        <label htmlFor="application-notes">Additional notes</label>
                        <textarea
                          id="application-notes"
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                          placeholder="Include any additional information relevant to this application."
                        />
                      </div>
                    </div>
                  </section>

                  <section className="form-section">
                    <h3 className="form-section-title">02 · Supporting documents</h3>

                    <p className="section-description">
                      Documents marked REQUIRED must be uploaded before
                      submission. Optional documents may provide additional
                      evidence but cannot replace mandatory documents.
                    </p>

                    <div className="upload-instructions">
                      <strong>Accepted formats:</strong> PDF, JPG and PNG.
                      <br />
                      <strong>Maximum size:</strong> 5 MB per file.
                      <br />
                      <strong>Maximum files:</strong> {MAX_FILES}.
                      <br />
                      <strong>Important:</strong> Select the correct document
                      category. A file uploaded under the wrong category will
                      not satisfy the requirement.
                    </div>

                    <div className="required-docs">
                      {allowedDocumentTypes.map((type) => {
                        const document = DOCUMENTS[type];
                        const uploaded = isDocumentUploaded(type);
                        const required = requiredDocuments.includes(type);

                        return (
                          <div className="required-doc" key={type}>
                            <span className="doc-icon">
                              <Icon name={uploaded ? 'check' : 'file'} size={18} />
                            </span>

                            <div>
                              <strong>{document.label}</strong>
                              <small>{document.description}</small>
                            </div>

                            <span className={`doc-status ${uploaded ? 'done' : ''}`}>
                              {uploaded
                                ? 'UPLOADED'
                                : required ? 'REQUIRED' : 'OPTIONAL'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="upload-grid">
                      <div className="upload-select">
                        <label htmlFor="document-category">Document category</label>

                        <select
                          id="document-category"
                          value={uploadType}
                          onChange={(event) => setUploadType(event.target.value)}
                        >
                          {allowedDocumentTypes.map((type) => (
                            <option key={type} value={type}>
                              {DOCUMENTS[type].label}
                              {requiredDocuments.includes(type) ? ' (Required)' : ' (Optional)'}
                            </option>
                          ))}
                        </select>

                        <span className="field-hint">
                          Choose the category matching the file you are uploading.
                        </span>
                      </div>

                      <label className="upload-box" htmlFor="supporting-files">
                        <input
                          ref={fileInputRef}
                          id="supporting-files"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          multiple
                          hidden
                          onChange={handleFileAdd}
                        />
                        <Icon name="upload" size={27} />
                        <p>Select supporting files</p>
                        <small>PDF, JPG or PNG · Up to 5 MB each</small>
                      </label>
                    </div>

                    {documents.length > 0 && (
                      <div className="file-list">
                        {documents.map((document, index) => (
                          <div
                            key={`${document.file_name}-${document.document_type}-${index}`}
                            className="file-item"
                          >
                            <div className="file-info">
                              <Icon name="file" size={17} />
                              <div>
                                <strong>{document.file_name}</strong>
                                <small>
                                  {DOCUMENTS[document.document_type]?.label}
                                  {' · '}
                                  {(document.file_size / 1024).toFixed(0)} KB
                                </small>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveDoc(index)}
                              aria-label={`Remove ${document.file_name}`}
                              title="Remove file"
                            >
                              <Icon name="trash" size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {error && (
                    <div className="alert alert-error" role="alert">
                      <span aria-hidden="true">⚠</span>
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={loading}
                      onClick={resetForm}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        'Submitting application...'
                      ) : (
                        <>
                          Submit application
                          <Icon name="arrow" size={15} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {success && (
            <div className="form-wrap">
              <div className="form-card success-card">
                <div className="success-mark">
                  <Icon name="check" size={32} />
                </div>

                <h2 style={{ fontSize: 23, marginBottom: 10 }}>
                  Application submitted
                </h2>

                <p className="success-message">
                  Your application has been accepted by the server. Keep your
                  reference number to track its progress from your citizen
                  dashboard.
                </p>

                <div className="reference-box">
                  <small>Application reference number</small>
                  <strong>{referenceNumber}</strong>
                </div>

                <div className="actions" style={{ justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetForm}
                  >
                    Apply for another service
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate('/dashboard')}
                  >
                    Go to dashboard
                    <Icon name="arrow" size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Apply;
