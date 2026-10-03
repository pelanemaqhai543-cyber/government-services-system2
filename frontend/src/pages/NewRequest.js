import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../utils/api';

const DEPARTMENTS = ['traffic', 'finance', 'pension', 'police', 'passport'];

const Icon = ({ name, size = 19 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    document: <><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4M9 12h6M9 16h6" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 20h14" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

const styles = `
  .request-page { --blue:#00209F; --blue-dark:#00166f; --blue-soft:#edf2ff; --green:#009543; --green-dark:#007936; --green-soft:#eaf8f0; --black:#000; --ink:#172235; --muted:#718096; --border:#e5e9f0; --white:#fff; width:min(100%,1440px); margin:0 auto; padding:0 2px; color:var(--ink); }
  .request-page * { box-sizing:border-box; }.request-page button,.request-page input,.request-page select,.request-page textarea { font:inherit; }.request-page button { cursor:pointer; }.request-page h1,.request-page h2,.request-page p { margin:0; }
  .request-page .hero { display:flex; align-items:flex-end; justify-content:space-between; gap:22px; margin-bottom:25px; }.request-page .eyebrow { display:flex; align-items:center; gap:9px; margin-bottom:9px; color:var(--blue); font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }.request-page .eyebrow span { width:8px; height:8px; border-radius:50%; background:var(--green); box-shadow:0 0 0 5px var(--green-soft); }.request-page h1 { color:var(--black); font-size:clamp(25px,3vw,34px); line-height:1.1; letter-spacing:-.04em; }.request-page .hero p { margin-top:9px; color:var(--muted); font-size:14px; line-height:1.55; }
  .request-page .request-layout { display:grid; grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr); align-items:start; gap:18px; }.request-page .panel { min-width:0; border:1px solid var(--border); border-radius:16px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.045); }.request-page .form-panel { padding:24px; }.request-page .form-panel h2,.request-page .guide-panel h2 { color:var(--black); font-size:17px; }.request-page .form-panel > p,.request-page .guide-panel > p { margin-top:5px; color:var(--muted); font-size:12px; line-height:1.5; }.request-page .form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; margin-top:22px; }.request-page .field { display:grid; gap:7px; }.request-page .field.full { grid-column:1/-1; }.request-page .field label { color:var(--ink); font-size:11px; font-weight:800; }.request-page .field label b { color:var(--green); }.request-page input,.request-page select,.request-page textarea { width:100%; color:var(--ink); border:1px solid var(--border); border-radius:10px; outline:none; background:#fbfcff; font-size:12px; }.request-page input,.request-page select { min-height:44px; padding:0 13px; }.request-page textarea { min-height:105px; padding:12px 13px; resize:vertical; }.request-page input:focus,.request-page select:focus,.request-page textarea:focus { border-color:#a9bde9; box-shadow:0 0 0 3px var(--blue-soft); }.request-page .upload-box { display:flex; align-items:center; justify-content:center; min-height:105px; padding:16px; border:1px dashed #aebde8; border-radius:10px; background:var(--blue-soft); }.request-page .upload-label { display:flex; align-items:center; gap:8px; color:var(--blue); font-size:12px; font-weight:800; cursor:pointer; }.request-page .file-name { margin-top:6px; color:var(--green-dark); font-size:10px; text-align:center; }.request-page .message { margin-top:17px; padding:11px 13px; border-radius:10px; font-size:11px; line-height:1.45; }.request-page .message.success { color:var(--green-dark); border:1px solid #bfe4cf; background:var(--green-soft); }.request-page .message.error { color:#9b3d3d; border:1px solid #f0caca; background:#fff3f3; }.request-page .form-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:22px; padding-top:18px; border-top:1px solid #f0f2f5; }.request-page .primary-button,.request-page .secondary-button { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:42px; padding:0 17px; border-radius:10px; font-size:12px; font-weight:800; }.request-page .primary-button { color:var(--white); border:1px solid var(--blue); background:var(--blue); box-shadow:0 7px 16px rgba(0,32,159,.17); }.request-page .primary-button:hover { background:var(--blue-dark); }.request-page .secondary-button { color:var(--blue); border:1px solid #cbd6f2; background:var(--white); }
  .request-page .guide-panel { padding:21px; }.request-page .guide-list { display:grid; gap:14px; margin-top:20px; }.request-page .guide-item { display:flex; align-items:flex-start; gap:10px; }.request-page .guide-number { display:grid; flex:0 0 auto; place-items:center; width:30px; height:30px; color:var(--blue); border-radius:9px; background:var(--blue-soft); font-size:12px; font-weight:900; }.request-page .guide-item:nth-child(2) .guide-number { color:var(--green); background:var(--green-soft); }.request-page .guide-item:nth-child(3) .guide-number { color:var(--black); background:#f2f2f2; }.request-page .guide-item strong { display:block; color:var(--ink); font-size:12px; }.request-page .guide-item p { margin-top:4px; color:var(--muted); font-size:10px; line-height:1.45; }.request-page .notice { margin-top:22px; padding:13px; color:var(--ink); border-left:3px solid var(--green); background:#f7fbf8; font-size:11px; line-height:1.5; }
  .request-main { min-width:0; width:calc(100% - 240px); min-height:100vh; margin-left:240px; padding:32px 40px; }.request-main .request-page { max-width:1440px; }
  @media (max-width:900px) { .request-page .request-layout { grid-template-columns:1fr; } }.request-page .request-main { width:100%; }
  @media (max-width:600px) { .request-main { width:100%; margin-left:0; padding:22px 16px 32px; }.request-page { padding:0; }.request-page .hero { align-items:stretch; flex-direction:column; }.request-page .form-panel { padding:18px 16px; }.request-page .form-grid { grid-template-columns:1fr; gap:14px; }.request-page .field.full { grid-column:auto; }.request-page .form-actions { flex-direction:column-reverse; }.request-page .primary-button,.request-page .secondary-button { width:100%; } }
`;

const NewRequest = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ service_type: params.get('service') || '', department: '', notes: '' });
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setMsg({ type: '', text: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.service_type || !form.department) {
      setMsg({ type: 'error', text: 'Please select a service type and department.' });
      return;
    }
    try {
      setLoading(true);
      const response = await API.post('/requests', form);
      setMsg({ type: 'success', text: `Request submitted successfully. Reference: ${response.data?.reference_number || 'created'}.` });
      setTimeout(() => navigate('/track'), 1800);
    } catch (error) {
      setMsg({ type: 'error', text: error.response?.data?.message || 'Submission failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={layoutStyles.layout}><Sidebar /><main className="request-main"><style>{styles}</style><div className="request-page">
      <header className="hero"><div><div className="eyebrow"><span /> Citizen services</div><h1>New request</h1><p>Submit an application for a government service and track its progress from your dashboard.</p></div></header>
      <div className="request-layout">
        <section className="panel form-panel"><h2>Request details</h2><p>Complete the form below and the responsible department will review your application.</p><form onSubmit={handleSubmit} noValidate><div className="form-grid"><div className="field"><label htmlFor="service_type">Service type <b>*</b></label><input id="service_type" name="service_type" placeholder="e.g. Driver's licence" value={form.service_type} onChange={handleChange} required /></div><div className="field"><label htmlFor="department">Department <b>*</b></label><select id="department" name="department" value={form.department} onChange={handleChange} required><option value="">Select department</option>{DEPARTMENTS.map((department) => <option key={department} value={department}>{department.charAt(0).toUpperCase() + department.slice(1)}</option>)}</select></div><div className="field full"><label>Supporting documents</label><div className="upload-box"><input id="file-upload" type="file" hidden onChange={(event) => setFile(event.target.files?.[0] || null)} /><label className="upload-label" htmlFor="file-upload"><Icon name="upload" size={18} />{file ? file.name : 'Choose a supporting file'}</label></div></div><div className="field full"><label htmlFor="notes">Notes</label><textarea id="notes" name="notes" placeholder="Add any details that may help with your request" value={form.notes} onChange={handleChange} /></div></div>{msg.text && <div className={`message ${msg.type}`} role={msg.type === 'error' ? 'alert' : 'status'}>{msg.text}</div>}<div className="form-actions"><button className="secondary-button" type="button" onClick={() => navigate('/dashboard')}>Cancel</button><button className="primary-button" type="submit" disabled={loading}>{loading ? 'Submitting...' : <>Submit request <Icon name="arrow" size={16} /></>}</button></div></form></section>
        <aside className="panel guide-panel"><h2>How it works</h2><p>Prepare your information before submitting.</p><div className="guide-list"><div className="guide-item"><span className="guide-number">1</span><div><strong>Choose a service</strong><p>Select the service and department that should handle your request.</p></div></div><div className="guide-item"><span className="guide-number">2</span><div><strong>Add supporting details</strong><p>Include documents and notes that help explain your application.</p></div></div><div className="guide-item"><span className="guide-number">3</span><div><strong>Track progress</strong><p>Use Track applications to follow the request after submission.</p></div></div></div><div className="notice">Only submit information required for your government service. Your request will be handled by the authorized department.</div></aside>
      </div>
    </div></main></div>
  );
};

const layoutStyles = { layout: { display: 'flex', minHeight: '100vh', background: '#f7f9fc' } };

export default NewRequest;
