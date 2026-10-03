import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../utils/api';

const SERVICES = ['Traffic', 'Finance', 'Pensions', 'Police', 'Passport'];
const DEPARTMENTS = ['traffic', 'finance', 'pension', 'police', 'passport'];

const styles = `
  .renewal-page { --blue:#00209F; --blue-dark:#00166f; --blue-soft:#edf2ff; --green:#009543; --green-dark:#007936; --green-soft:#eaf8f0; --black:#000; --ink:#172235; --muted:#718096; --border:#e5e9f0; --white:#fff; width:min(100%,1440px); margin:0 auto; padding:0 2px; color:var(--ink); }
  .renewal-page * { box-sizing:border-box; }.renewal-page button,.renewal-page input,.renewal-page select,.renewal-page textarea { font:inherit; }.renewal-page button { cursor:pointer; }.renewal-page h1,.renewal-page h2,.renewal-page p { margin:0; }
  .renewal-page .hero { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:25px; }.renewal-page .eyebrow { display:flex; align-items:center; gap:9px; margin-bottom:9px; color:var(--blue); font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }.renewal-page .eyebrow span { width:8px; height:8px; border-radius:50%; background:var(--green); box-shadow:0 0 0 5px var(--green-soft); }.renewal-page h1 { color:var(--black); font-size:clamp(25px,3vw,34px); line-height:1.1; letter-spacing:-.04em; }.renewal-page .hero p { max-width:700px; margin-top:9px; color:var(--muted); font-size:14px; line-height:1.55; }
  .renewal-page .layout { display:grid; grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr); align-items:start; gap:18px; }.renewal-page .panel { border:1px solid var(--border); border-radius:16px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.045); }.renewal-page .form-panel { padding:24px; }.renewal-page .form-panel h2,.renewal-page .info-panel h2 { color:var(--black); font-size:17px; }.renewal-page .form-panel > p,.renewal-page .info-panel > p { margin-top:5px; color:var(--muted); font-size:12px; line-height:1.5; }
  .renewal-page .form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; margin-top:22px; }.renewal-page .field { display:grid; gap:7px; }.renewal-page .field.full { grid-column:1/-1; }.renewal-page .field label { color:var(--ink); font-size:11px; font-weight:800; }.renewal-page .field label b { color:var(--green); }.renewal-page input,.renewal-page select,.renewal-page textarea { width:100%; color:var(--ink); border:1px solid var(--border); border-radius:10px; outline:none; background:#fbfcff; font-size:12px; }.renewal-page input,.renewal-page select { min-height:44px; padding:0 13px; }.renewal-page textarea { min-height:105px; padding:12px 13px; resize:vertical; }.renewal-page input:focus,.renewal-page select:focus,.renewal-page textarea:focus { border-color:#a9bde9; box-shadow:0 0 0 3px var(--blue-soft); }.renewal-page .hint { color:var(--muted); font-size:10px; line-height:1.35; }.renewal-page .submit-row { display:flex; align-items:center; justify-content:space-between; gap:15px; margin-top:22px; padding-top:18px; border-top:1px solid #f0f2f5; }.renewal-page .primary-button,.renewal-page .secondary-button { min-height:42px; padding:0 17px; border-radius:10px; font-size:12px; font-weight:800; }.renewal-page .primary-button { color:var(--white); border:1px solid var(--blue); background:var(--blue); box-shadow:0 7px 16px rgba(0,32,159,.17); }.renewal-page .primary-button:hover { background:var(--blue-dark); }.renewal-page .secondary-button { color:var(--blue); border:1px solid #cbd6f2; background:var(--white); }.renewal-page .alert { margin-top:16px; padding:11px 13px; border-radius:10px; font-size:11px; line-height:1.45; }.renewal-page .alert.error { color:#9b3d3d; border:1px solid #f0caca; background:#fff3f3; }.renewal-page .alert.success { color:var(--green-dark); border:1px solid #bfe4cf; background:var(--green-soft); }
  .renewal-page .info-panel { padding:21px; }.renewal-page .info-list { display:grid; gap:13px; margin-top:20px; }.renewal-page .info-item { display:flex; align-items:flex-start; gap:10px; }.renewal-page .info-icon { display:grid; flex:0 0 auto; place-items:center; width:30px; height:30px; color:var(--blue); border-radius:9px; background:var(--blue-soft); font-size:12px; font-weight:900; }.renewal-page .info-item:nth-child(2) .info-icon { color:var(--green); background:var(--green-soft); }.renewal-page .info-item:nth-child(3) .info-icon { color:var(--black); background:#f2f2f2; }.renewal-page .info-item strong { display:block; color:var(--ink); font-size:12px; }.renewal-page .info-item p { margin-top:4px; color:var(--muted); font-size:10px; line-height:1.45; }.renewal-page .notice { margin-top:22px; padding:13px; color:var(--ink); border-left:3px solid var(--green); background:#f7fbf8; font-size:11px; line-height:1.5; }
  @media (max-width:900px) { .renewal-page .layout { grid-template-columns:1fr; } }.renewal-main { min-width:0; width:calc(100% - 240px); min-height:100vh; margin-left:240px; padding:32px 40px; }.renewal-main .renewal-page { max-width:1440px; }
  @media (max-width:600px) { .renewal-main { width:100%; margin-left:0; padding:22px 16px 32px; }.renewal-page { padding:0; }.renewal-page .hero { align-items:stretch; flex-direction:column; }.renewal-page .form-panel { padding:18px 16px; }.renewal-page .form-grid { grid-template-columns:1fr; gap:14px; }.renewal-page .field.full { grid-column:auto; }.renewal-page .submit-row { align-items:stretch; flex-direction:column-reverse; }.renewal-page .primary-button,.renewal-page .secondary-button { width:100%; } }
`;

const Renewal = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ service: 'Passport', department: 'passport', reference: '', expiryDate: '', reason: '', notes: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setStatus({ type: '', message: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.service || !form.department || !form.expiryDate || !form.reason) {
      setStatus({ type: 'error', message: 'Please select a service and department, then complete the required fields before submitting.' });
      return;
    }

    try {
      setSubmitting(true);
      await API.post('/requests', {
        service_type: `${form.service} Renewal`,
        department: form.department,
        reference_number: form.reference || undefined,
        expiry_date: form.expiryDate,
        reason: form.reason,
        notes: form.notes,
        request_type: 'renewal',
      });
      setStatus({ type: 'success', message: 'Your renewal request was submitted successfully.' });
      setForm({ service: 'Passport', department: 'passport', reference: '', expiryDate: '', reason: '', notes: '' });
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || 'Unable to submit the renewal request. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={layoutStyles.layout}>
      <Sidebar />
      <main className="renewal-main">
        <style>{styles}</style>
        <div className="renewal-page">
          <header className="hero"><div><div className="eyebrow"><span /> Citizen services</div><h1>Renew a service</h1><p>Submit a renewal request for an existing government document or service.</p></div></header>
          <div className="layout">
            <section className="panel form-panel"><h2>Renewal details</h2><p>Provide the information below so the responsible department can review your request.</p><form onSubmit={handleSubmit} noValidate><div className="form-grid"><div className="field"><label htmlFor="renewal-service">Service to renew <b>*</b></label><select id="renewal-service" name="service" value={form.service} onChange={handleChange}>{SERVICES.map((service) => <option key={service} value={service}>{service}</option>)}</select></div><div className="field"><label htmlFor="renewal-department">Department <b>*</b></label><select id="renewal-department" name="department" value={form.department} onChange={handleChange}><option value="">Select department</option>{DEPARTMENTS.map((department) => <option key={department} value={department}>{department.charAt(0).toUpperCase() + department.slice(1)}</option>)}</select></div><div className="field"><label htmlFor="renewal-expiry">Current expiry date <b>*</b></label><input id="renewal-expiry" name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} required /></div><div className="field full"><label htmlFor="renewal-reference">Existing reference number</label><input id="renewal-reference" name="reference" placeholder="Enter your current document or application reference" value={form.reference} onChange={handleChange} /><span className="hint">If you have an existing reference number, include it to help us find your records faster.</span></div><div className="field full"><label htmlFor="renewal-reason">Reason for renewal <b>*</b></label><textarea id="renewal-reason" name="reason" placeholder="Tell us why you need to renew this service" value={form.reason} onChange={handleChange} required /></div><div className="field full"><label htmlFor="renewal-notes">Additional notes</label><textarea id="renewal-notes" name="notes" placeholder="Add any other information the department should know" value={form.notes} onChange={handleChange} /></div></div>{status.message && <div className={`alert ${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</div>}<div className="submit-row"><button className="secondary-button" type="button" onClick={() => navigate('/dashboard')}>Cancel</button><button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit renewal request'}</button></div></form></section>
            <aside className="panel info-panel"><h2>Before you submit</h2><p>Make sure your details are accurate and up to date.</p><div className="info-list"><div className="info-item"><span className="info-icon">1</span><div><strong>Choose the service</strong><p>Select the document or service you want to renew.</p></div></div><div className="info-item"><span className="info-icon">2</span><div><strong>Check your expiry date</strong><p>Use the expiry date shown on your current document.</p></div></div><div className="info-item"><span className="info-icon">3</span><div><strong>Track your request</strong><p>After submission, monitor progress from Track applications.</p></div></div></div><div className="notice">Renewal requests are reviewed by the responsible government department. You may be contacted if additional information is needed.</div></aside>
          </div>
        </div>
      </main>
    </div>
  );
};

const layoutStyles = { layout: { display: 'flex', minHeight: '100vh', background: '#f7f9fc' } };

export default Renewal;
