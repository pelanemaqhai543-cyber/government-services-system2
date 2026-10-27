import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../utils/api';

const SERVICES = {
  'Birth Certificate': {
    prefix: 'BC', icon: 'birth', department: 'Home Affairs',
    description: 'Register a birth and obtain a certificate',
    fields: [
      { name: 'subject_full_name', label: "Child's full name", type: 'text', required: true },
      { name: 'subject_date_of_birth', label: 'Date of birth', type: 'date', required: true },
      { name: 'subject_gender', label: 'Gender', type: 'select', options: ['Male', 'Female'], required: true },
      { name: 'subject_district', label: 'District of birth', type: 'text', required: true },
      { name: 'mother_name', label: "Mother's full name", type: 'text', required: true },
      { name: 'father_name', label: "Father's full name", type: 'text' },
      { name: 'place_of_birth', label: 'Place of birth', type: 'text' },
    ]
  },
  'National ID Registration': {
    prefix: 'ID', icon: 'id', department: 'Home Affairs',
    description: 'Apply for a first-time National ID',
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_date_of_birth', label: 'Date of birth', type: 'date', required: true },
      { name: 'subject_gender', label: 'Gender', type: 'select', options: ['Male', 'Female'], required: true },
      { name: 'subject_district', label: 'District', type: 'text', required: true },
      { name: 'subject_address', label: 'Address', type: 'textarea' },
    ]
  },
  'National ID Renewal': {
    prefix: 'IDR', icon: 'renew', department: 'Home Affairs',
    description: 'Renew an existing National ID',
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'Current National ID', type: 'text', required: true },
      { name: 'expiry_date', label: 'Expiry date', type: 'date' },
      { name: 'reason', label: 'Reason for renewal', type: 'textarea' },
    ]
  },
  'Death Certificate': {
    prefix: 'DC', icon: 'death', department: 'Home Affairs',
    description: 'Register a death and obtain a certificate',
    fields: [
      { name: 'subject_full_name', label: "Deceased's full name", type: 'text', required: true },
      { name: 'subject_date_of_birth', label: 'Date of birth', type: 'date', required: true },
      { name: 'date_of_death', label: 'Date of death', type: 'date', required: true },
      { name: 'place_of_death', label: 'Place of death', type: 'text', required: true },
      { name: 'cause_of_death', label: 'Cause of death', type: 'text' },
    ]
  },
  'Marriage Certificate': {
    prefix: 'MC', icon: 'marriage', department: 'Home Affairs',
    description: 'Register a marriage',
    fields: [
      { name: 'subject_full_name', label: 'Spouse 1 full name', type: 'text', required: true },
      { name: 'subject_date_of_birth', label: 'Spouse 1 date of birth', type: 'date', required: true },
      { name: 'spouse_name', label: 'Spouse 2 full name', type: 'text', required: true },
      { name: 'marriage_date', label: 'Date of marriage', type: 'date' },
      { name: 'marriage_place', label: 'Place of marriage', type: 'text' },
    ]
  },
  'Passport Application': {
    prefix: 'PP', icon: 'passport', department: 'Passport',
    description: 'Apply for a new passport',
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'National ID', type: 'text', required: true },
      { name: 'subject_date_of_birth', label: 'Date of birth', type: 'date', required: true },
      { name: 'place_of_birth', label: 'Place of birth', type: 'text' },
    ]
  },
  'Passport Renewal': {
    prefix: 'PPR', icon: 'passport', department: 'Passport',
    description: 'Renew an existing passport',
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'National ID', type: 'text', required: true },
      { name: 'old_passport_number', label: 'Old passport number', type: 'text' },
      { name: 'expiry_date', label: 'Current passport expiry', type: 'date' },
    ]
  },
  'Police Clearance': {
    prefix: 'PC', icon: 'shield', department: 'Police',
    description: 'Request a police clearance certificate',
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'National ID', type: 'text', required: true },
      { name: 'purpose', label: 'Purpose', type: 'text', required: true },
    ]
  },
  "Driver's Licence": {
    prefix: 'DL', icon: 'car', department: 'Traffic',
    description: "Apply for or renew a driver's licence",
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'National ID', type: 'text', required: true },
      { name: 'licence_type', label: 'Licence type', type: 'select', options: ['Learner', 'Class B', 'Class C'] },
    ]
  },
  'Vehicle Registration': {
    prefix: 'VR', icon: 'vehicle', department: 'Traffic',
    description: 'Register a vehicle',
    fields: [
      { name: 'vehicle_make', label: 'Make', type: 'text', required: true },
      { name: 'vehicle_model', label: 'Model', type: 'text', required: true },
      { name: 'vehicle_year', label: 'Year', type: 'text' },
      { name: 'vin', label: 'VIN / Chassis number', type: 'text', required: true },
    ]
  },
  'Tax Filing': {
    prefix: 'TX', icon: 'finance', department: 'Finance',
    description: 'File your taxes',
    fields: [
      { name: 'tax_year', label: 'Tax year', type: 'text', required: true },
      { name: 'income', label: 'Annual income', type: 'text' },
      { name: 'employer', label: 'Employer', type: 'text' },
    ]
  },
  'Pension Application': {
    prefix: 'PN', icon: 'pension', department: 'Pension',
    description: 'Apply for a state pension',
    fields: [
      { name: 'subject_full_name', label: 'Full name', type: 'text', required: true },
      { name: 'subject_national_id', label: 'National ID', type: 'text', required: true },
      { name: 'subject_date_of_birth', label: 'Date of birth', type: 'date', required: true },
      { name: 'employment_history', label: 'Employment history', type: 'textarea' },
    ]
  },
};

const Icon = ({ name, size = 18 }) => {
  const c = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const p = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 20h14" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></>,
    file: <><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4" /></>,
    birth: <><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    id: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8" cy="12" r="2" /><path d="M13 10h5M13 14h4" /></>,
    renew: <><path d="M20 11a8 8 0 0 0-14.7-4L3 10" /><path d="M3 5v5h5M4 13a8 8 0 0 0 14.7 4L21 14" /><path d="M21 19v-5h-5" /></>,
    death: <><path d="M12 21s-7-4.3-7-10V5l7-2 7 2v6c0 5.7-7 10-7 10Z" /><path d="M9 12h6M12 9v6" /></>,
    marriage: <><path d="M12 20S4 15.5 4 9a4 4 0 0 1 7-2.5A4 4 0 0 1 18 9c0 6.5-6 9.5-6 11Z" /></>,
    passport: <><rect x="5" y="3" width="14" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M8 16h8" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
    car: <><path d="m5 16 1.5-6h11L19 16" /><path d="M4 16h16v3H4zM7 13h.01M17 13h.01" /></>,
    vehicle: <><path d="M5 16 6.5 9h11l1.5 7" /><path d="M4 16h16v3H4zM7 13h.01M17 13h.01" /></>,
    finance: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v10M15 9.5c-.6-.7-1.5-1-2.8-1-1.5 0-2.5.7-2.5 1.8 0 2.8 5.3 1 5.3 3.8 0 1.2-1 2-2.7 2-1.3 0-2.3-.4-3-1.2" /></>,
    pension: <><circle cx="12" cy="8" r="3" /><path d="M4 21a8 8 0 0 1 16 0M3 17h18" /></>,
  };
  return <svg {...c}>{p[name]}</svg>;
};

const styles = `
  .apply-page { --blue:#00209F; --blue-dark:#00166f; --blue-soft:#edf2ff; --green:#009543; --green-dark:#007936; --green-soft:#eaf8f0; --black:#000; --ink:#172235; --muted:#718096; --border:#e5e9f0; --white:#fff; max-width:1100px; margin:0 auto; color:var(--ink); }
  .apply-page * { box-sizing:border-box; }.apply-page button,.apply-page input,.apply-page select,.apply-page textarea { font:inherit; }.apply-page button { cursor:pointer; }.apply-page h1,.apply-page h2,.apply-page h3,.apply-page p { margin:0; }
  .apply-page .hero { margin-bottom:25px; }.apply-page .eyebrow { display:flex; align-items:center; gap:9px; margin-bottom:9px; color:var(--blue); font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }.apply-page .eyebrow span { width:8px; height:8px; border-radius:50%; background:var(--green); box-shadow:0 0 0 5px var(--green-soft); }.apply-page h1 { color:var(--black); font-size:clamp(25px,3vw,32px); letter-spacing:-.04em; }.apply-page .hero p { margin-top:9px; color:var(--muted); font-size:14px; }
  .apply-page .services-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:12px; padding-bottom:40px; }
  .apply-page .service-card { text-align:left; padding:18px; background:#fff; border:1px solid var(--border); border-radius:14px; cursor:pointer; transition:.2s; }
  .apply-page .service-card:hover { border-color:var(--blue); transform:translateY(-3px); box-shadow:0 12px 25px rgba(0,32,159,.08); }
  .apply-page .service-icon { width:46px; height:46px; color:var(--blue); display:grid; place-items:center; background:var(--blue-soft); border-radius:11px; font-size:22px; margin-bottom:12px; }
  .apply-page .service-card h3 { font-size:14.5px; font-weight:800; margin-bottom:6px; }
  .apply-page .service-card p { font-size:12px; color:var(--muted); line-height:1.5; }
  .apply-page .service-dept { display:inline-block; margin-top:10px; padding:3px 9px; background:var(--green-soft); color:var(--green-dark); font-size:10px; font-weight:800; border-radius:99px; text-transform:uppercase; letter-spacing:.04em; }
  .apply-page .form-wrap { max-width:820px; margin:0 auto; padding:40px 24px 80px; }
  .apply-page .form-header { text-align:center; margin-bottom:32px; }.apply-page .selected-service-icon { width:64px; height:64px; margin:0 auto 14px; display:grid; place-items:center; color:var(--blue); border:1px solid #cbd6f2; border-radius:16px; background:var(--blue-soft); box-shadow:0 8px 18px rgba(0,32,159,.08); }
  .apply-page .form-header h2 { font-size:26px; font-weight:800; margin-bottom:8px; }
  .apply-page .form-header p { font-size:14px; color:var(--muted); }
  .apply-page .form-card { background:#fff; border:1px solid var(--border); border-radius:18px; padding:32px; box-shadow:0 8px 25px rgba(20,35,60,.05); }
  .apply-page .form-section { margin-bottom:28px; }
  .apply-page .form-section-title { font-size:13px; font-weight:800; color:var(--blue); text-transform:uppercase; letter-spacing:.1em; padding-bottom:10px; margin-bottom:18px; border-bottom:1px solid var(--border); }
  .apply-page .form-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
  .apply-page .form-field { display:flex; flex-direction:column; gap:7px; }
  .apply-page .form-field.full { grid-column:1 / -1; }
  .apply-page .form-field label { font-size:12px; font-weight:800; color:var(--ink); }
  .apply-page .form-field label b { color:#dc2626; }
  .apply-page .form-field input,.apply-page .form-field select,.apply-page .form-field textarea { padding:12px 14px; border:1px solid var(--border); border-radius:10px; font-size:13.5px; outline:none; background:#fbfcff; color:var(--ink); transition:border .2s; }
  .apply-page .form-field input:focus,.apply-page .form-field select:focus,.apply-page .form-field textarea:focus { border-color:var(--blue); box-shadow:0 0 0 3px rgba(0,32,159,.08); }
  .apply-page .form-field textarea { min-height:80px; resize:vertical; font-family:inherit; }
  .apply-page .upload-box { border:2px dashed #cbd5e1; border-radius:12px; padding:26px 20px; text-align:center; cursor:pointer; transition:.2s; background:#fbfcff; display:block; }
  .apply-page .upload-box:hover { border-color:var(--blue); background:var(--blue-soft); }
  .apply-page .upload-box svg { color:var(--blue); margin-bottom:8px; }
  .apply-page .upload-box p { font-size:13px; color:var(--ink); font-weight:700; }
  .apply-page .upload-box small { font-size:11.5px; color:var(--muted); }
  .apply-page .file-list { margin-top:12px; display:grid; gap:8px; }
  .apply-page .file-item { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 14px; background:#f7f9fc; border:1px solid var(--border); border-radius:10px; font-size:12.5px; }
  .apply-page .file-item strong { font-weight:700; }
  .apply-page .file-item button { color:#dc2626; border:0; background:transparent; padding:4px; border-radius:6px; }
  .apply-page .actions { display:flex; gap:12px; margin-top:24px; }
  .apply-page .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:13px 22px; border-radius:10px; font-size:13.5px; font-weight:800; cursor:pointer; transition:.2s; border:1px solid transparent; }
  .apply-page .btn-primary { background:var(--blue); color:#fff; border-color:var(--blue); }
  .apply-page .btn-primary:hover { background:var(--blue-dark); }
  .apply-page .btn-primary:disabled { opacity:.6; cursor:not-allowed; }
  .apply-page .btn-secondary { background:#fff; color:var(--blue); border-color:#cbd6f2; }
  .apply-page .alert { padding:14px 16px; border-radius:10px; font-size:13px; line-height:1.5; margin-bottom:18px; display:flex; gap:10px; align-items:flex-start; }
  .apply-page .alert-error { background:#fbeff0; color:#a23c3c; border:1px solid #f0d8da; }
  .apply-page .alert-success { background:#eaf8f0; color:#007936; border:1px solid #bfe4cf; }
  .apply-main { min-width:0; width:calc(100% - 240px); min-height:100vh; margin-left:240px; padding:32px 40px; }
  @media (max-width:900px) { .apply-page .form-grid { grid-template-columns:1fr; }.apply-main { width:100%; } }
  @media (max-width:600px) { .apply-main { width:100%; margin-left:0; padding:22px 16px 32px; }.apply-page .form-card { padding:22px 18px; }.apply-page .actions { flex-direction:column-reverse; }.apply-page .btn { width:100%; } }

.apply-page{padding-bottom:35px}
.apply-page .hero{position:relative;overflow:hidden;padding:30px 32px;margin-bottom:26px;border:1px solid #00166f;border-radius:22px;background:linear-gradient(118deg,#00145f 0%,#00209f 58%,#003dbb 100%);box-shadow:0 18px 40px rgba(0,32,159,.18)}
.apply-page .hero:after{position:absolute;right:-88px;bottom:-132px;width:320px;height:320px;content:'';border:45px solid rgba(0,149,67,.34);border-radius:50%}
.apply-page .hero>*{position:relative;z-index:1}
.apply-page .hero .eyebrow{color:#baf2cf}
.apply-page .hero .eyebrow span{background:#20c778;box-shadow:0 0 0 5px rgba(32,199,120,.2)}
.apply-page .hero h1{color:#fff;font-size:clamp(28px,3.2vw,42px);letter-spacing:-.055em}
.apply-page .hero p{color:rgba(255,255,255,.78);max-width:720px}
.apply-page .service-card{position:relative;overflow:hidden;min-height:178px;border-radius:16px;box-shadow:0 8px 20px rgba(20,35,60,.05);transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
.apply-page .service-card:before{position:absolute;top:0;left:0;right:0;height:4px;content:'';background:#00209f}
.apply-page .service-card:nth-child(3n+2):before{background:#009543}
.apply-page .service-card:nth-child(3n):before{background:#000}
.apply-page .service-card:hover{transform:translateY(-5px);border-color:#9bb3ee;box-shadow:0 16px 30px rgba(0,32,159,.11)}
.apply-page .service-icon{box-shadow:inset 0 0 0 1px #dbe5ff}
.apply-page .service-card:nth-child(3n+2) .service-icon{color:#007936;background:#eaf8f0}
.apply-page .service-card:nth-child(3n) .service-icon{color:#000;background:#f2f2f2}
.apply-page .service-dept{letter-spacing:.06em}
.apply-page .form-wrap{padding-top:10px}
.apply-page .form-header{padding:24px 28px;margin-bottom:22px;border-radius:20px;background:linear-gradient(135deg,#f1f5ff,#effaf4);border:1px solid #dce5f4}
.apply-page .selected-service-icon{background:#00209f;color:#fff;border:0;box-shadow:0 8px 18px rgba(0,32,159,.18)}
.apply-page .form-header h2{color:#000;letter-spacing:-.04em}
.apply-page .form-card{box-shadow:0 12px 30px rgba(20,35,60,.08)}
.apply-page .form-section-title{color:#00209f}
.apply-page .form-field input:focus,.apply-page .form-field select:focus,.apply-page .form-field textarea:focus{border-color:#009543;box-shadow:0 0 0 3px rgba(0,149,67,.1)}
.apply-page .upload-box{border-color:#aebfdf;background:linear-gradient(135deg,#fbfcff,#f2f6ff)}
.apply-page .upload-box:hover{border-color:#009543;background:#effaf4}
.apply-page .btn-primary{background:#00209f;box-shadow:0 7px 15px rgba(0,32,159,.16)}
.apply-page .btn-primary:hover{background:#009543;border-color:#009543}
.apply-page .alert-success{border-left:4px solid #009543}
@media(max-width:600px){.apply-page .hero{padding:24px 20px}.apply-page .form-header{padding:20px 15px}}
`;

const Apply = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({});
  const [notes, setNotes] = useState('');
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelectService = (name) => {
    setSelectedService(name);
    setFormData({});
    setNotes('');
    setDocuments([]);
    setError('');
    setSuccess(null);
  };

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileAdd = (event) => {
    const files = Array.from(event.target.files || []);
    const MAX_MB = 5;
    const tooBig = files.find((f) => f.size > MAX_MB * 1024 * 1024);
    if (tooBig) {
      setError(`File "${tooBig.name}" is larger than ${MAX_MB}MB.`);
      return;
    }
    Promise.all(files.map((file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_data: reader.result,
      });
      reader.readAsDataURL(file);
    }))).then((docs) => {
      setDocuments((prev) => [...prev, ...docs]);
      setError('');
    });
  };

  const handleRemoveDoc = (index) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const serviceDef = SERVICES[selectedService];
    if (!serviceDef) return;

    for (const field of serviceDef.fields) {
      if (field.required && !formData[field.name]) {
        setError(`Please fill in: ${field.label}`);
        return;
      }
    }

    setLoading(true);
    try {
      const department = serviceDef.department.toLowerCase().replace(/\s+/g, '_');
      const response = await API.post('/requests', {
        service_type: selectedService,
        department,
        form_data: formData,
        notes,
        documents,
      });
      setSuccess(response.data);
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f9fc' }}>
      <Sidebar />
      <main className="apply-main">
        <style>{styles}</style>
        <div className="apply-page">

          {!selectedService && (
            <>
              <header className="hero">
                <div className="eyebrow"><span /> Government services</div>
                <h1>Start a government service application</h1>
                <p>Choose a service below and provide the information required for your application.</p>
              </header>

              <section className="services-grid">
                {Object.entries(SERVICES).map(([name, def]) => (
                  <button key={name} type="button" className="service-card" onClick={() => handleSelectService(name)}>
                    <div className="service-icon"><Icon name={def.icon} size={23} /></div>
                    <h3>{name}</h3>
                    <p>{def.description}</p>
                    <span className="service-dept">{def.department}</span>
                  </button>
                ))}
              </section>
            </>
          )}

          {selectedService && !success && (
            <div className="form-wrap">
              <div className="form-header">
                <div className="selected-service-icon"><Icon name={SERVICES[selectedService].icon} size={30} /></div>
                <h2>{selectedService}</h2>
                <p>{SERVICES[selectedService].description}</p>
              </div>

              <div className="form-card">
                <form onSubmit={handleSubmit}>
                  <div className="form-section">
                    <div className="form-section-title">Application details</div>
                    <div className="form-grid">
                      {SERVICES[selectedService].fields.map((field) => (
                        <div key={field.name} className={`form-field ${field.type === 'textarea' ? 'full' : ''}`}>
                          <label>{field.label} {field.required && <b>*</b>}</label>
                          {field.type === 'select' ? (
                            <select value={formData[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} required={field.required}>
                              <option value="">Select</option>
                              {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : field.type === 'textarea' ? (
                            <textarea value={formData[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} required={field.required} />
                          ) : (
                            <input type={field.type} value={formData[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} required={field.required} />
                          )}
                        </div>
                      ))}
                      <div className="form-field full">
                        <label>Additional notes</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else the officer should know?" />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <div className="form-section-title">Supporting documents</div>
                    <label className="upload-box">
                      <input type="file" multiple hidden onChange={handleFileAdd} />
                      <Icon name="upload" size={28} />
                      <p>Click to upload files</p>
                      <small>PDF, JPG, PNG · Max 5MB each</small>
                    </label>
                    {documents.length > 0 && (
                      <div className="file-list">
                        {documents.map((doc, i) => (
                          <div key={i} className="file-item">
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Icon name="file" size={14} />
                              <strong>{doc.file_name}</strong>
                              <small style={{ color: '#718096' }}>({(doc.file_size / 1024).toFixed(0)} KB)</small>
                            </span>
                            <button type="button" onClick={() => handleRemoveDoc(i)}><Icon name="trash" size={14} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {error && <div className="alert alert-error"><span>⚠</span><span>{error}</span></div>}

                  <div className="actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setSelectedService(null)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Submitting...' : <>Submit application <Icon name="arrow" size={14} /></>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {success && (
            <div className="form-wrap">
              <div className="form-card" style={{ textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, margin: '0 auto 18px', display: 'grid', placeItems: 'center', background: '#eaf8f0', color: '#007936', borderRadius: '50%' }}>
                  <Icon name="check" size={32} />
                </div>
                <h2 style={{ fontSize: 22, marginBottom: 8 }}>Application submitted</h2>
                <p style={{ color: '#718096', fontSize: 14, marginBottom: 22 }}>Keep your reference number safe to track progress.</p>
                <div style={{ background: '#f7f9fc', border: '1px dashed #cbd5e1', borderRadius: 10, padding: 18, marginBottom: 22 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '.08em' }}>Reference number</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#00209F', marginTop: 6 }}>{success.reference_number}</div>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Apply;
