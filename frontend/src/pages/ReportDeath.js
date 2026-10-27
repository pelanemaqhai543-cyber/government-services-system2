import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OfficerLayout from '../components/OfficerLayout';
import API from '../utils/api';

const styles = `
  .death-page { --blue:#00209F; --blue-dark:#00166f; --blue-soft:#edf2ff; --green:#009543; --green-dark:#007936; --green-soft:#eaf8f0; --red:#bd4545; --red-dark:#8a2424; --red-soft:#fff1f1; --black:#000; --ink:#172235; --muted:#718096; --border:#e5e9f0; --white:#fff; width:min(100%,1000px); margin:0 auto; padding:0 2px; color:var(--ink); }
  .death-page * { box-sizing:border-box; }
  .death-page h1,.death-page h2,.death-page h3,.death-page p { margin:0; }
  .death-page button,.death-page input,.death-page textarea { font:inherit; }
  .death-page button { cursor:pointer; }

  .death-page .hero { margin-bottom:26px; }
  .death-page .eyebrow { display:flex; align-items:center; gap:9px; margin-bottom:9px; color:var(--red); font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }
  .death-page .eyebrow span { width:8px; height:8px; border-radius:50%; background:var(--red); box-shadow:0 0 0 5px var(--red-soft); }
  .death-page h1 { color:var(--black); font-size:clamp(25px,3vw,32px); line-height:1.15; letter-spacing:-.04em; }
  .death-page .hero p { margin-top:10px; color:var(--muted); font-size:14px; line-height:1.6; max-width:720px; }

  .death-page .warning { display:flex; gap:14px; padding:16px 20px; margin-bottom:22px; background:var(--red-soft); border:1px solid #f0caca; border-left:4px solid var(--red); border-radius:12px; font-size:13px; line-height:1.6; color:#6b1f1f; }
  .death-page .warning-icon { flex:0 0 auto; color:var(--red-dark); font-size:22px; }

  .death-page .card { padding:26px 28px; border:1px solid var(--border); border-radius:16px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.045); }

  .death-page .field { display:grid; gap:7px; margin-bottom:16px; }
  .death-page .field label { color:var(--ink); font-size:12px; font-weight:800; }
  .death-page .field label b { color:var(--red); }
  .death-page .field input,.death-page .field textarea { width:100%; padding:13px 14px; color:var(--ink); border:1px solid var(--border); border-radius:10px; outline:none; background:#fbfcff; font-size:13px; font-family:inherit; }
  .death-page .field input:focus,.death-page .field textarea:focus { border-color:#a9bde9; box-shadow:0 0 0 3px var(--blue-soft); }
  .death-page .field textarea { min-height:100px; resize:vertical; }
  .death-page .hint { color:var(--muted); font-size:11px; line-height:1.4; margin-top:2px; }

  .death-page .actions { display:flex; gap:10px; justify-content:flex-end; margin-top:22px; padding-top:18px; border-top:1px solid #f0f2f5; }
  .death-page .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:44px; padding:0 20px; border-radius:10px; font-size:13px; font-weight:800; }
  .death-page .btn-secondary { color:var(--blue); border:1px solid #cbd6f2; background:var(--white); }
  .death-page .btn-secondary:hover { background:var(--blue-soft); }
  .death-page .btn-danger { color:#fff; border:1px solid var(--red); background:var(--red); box-shadow:0 7px 16px rgba(189,69,69,.2); }
  .death-page .btn-danger:hover { background:var(--red-dark); border-color:var(--red-dark); }
  .death-page .btn-danger:disabled { opacity:.6; cursor:not-allowed; }

  .death-page .alert { display:flex; gap:10px; margin-top:16px; padding:13px 16px; border-radius:10px; font-size:12.5px; line-height:1.55; }
  .death-page .alert.error { color:#a23c3c; background:#fbeff0; border:1px solid #f0d8da; }
  .death-page .alert.success { color:var(--green-dark); background:var(--green-soft); border:1px solid #bfe4cf; }
  .death-page .alert strong { font-weight:800; }
  .death-page .alert .alert-icon { flex:0 0 auto; margin-top:2px; }

  .death-page .info-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:22px; }
  .death-page .info-tile { padding:16px 18px; border:1px solid var(--border); border-radius:12px; background:#fbfcff; }
  .death-page .info-tile strong { display:block; font-size:12.5px; margin-bottom:6px; color:var(--ink); }
  .death-page .info-tile p { color:var(--muted); font-size:11.5px; line-height:1.5; }

  @media (max-width:700px) {
    .death-page .info-grid { grid-template-columns:1fr; }
    .death-page .actions { flex-direction:column-reverse; }
    .death-page .btn { width:100%; }
  }

.death-page{padding-bottom:35px}
.death-page .hero{position:relative;overflow:hidden;padding:30px 32px;margin-bottom:24px;border:1px solid #00166f;border-radius:22px;background:linear-gradient(118deg,#00145f 0%,#00209f 58%,#003dbb 100%);box-shadow:0 18px 40px rgba(0,32,159,.18)}
.death-page .hero:after{position:absolute;right:-88px;bottom:-132px;width:320px;height:320px;content:'';border:45px solid rgba(189,69,69,.34);border-radius:50%}
.death-page .hero>*{position:relative;z-index:1}
.death-page .hero .eyebrow{color:#ffd0d0}
.death-page .hero .eyebrow span{background:#ff8b8b;box-shadow:0 0 0 5px rgba(255,139,139,.2)}
.death-page .hero h1{color:#fff;font-size:clamp(28px,3.2vw,42px);letter-spacing:-.055em}
.death-page .hero p{color:rgba(255,255,255,.8);max-width:750px}
.death-page .warning{box-shadow:0 9px 20px rgba(189,69,69,.07)}
.death-page .info-tile{position:relative;overflow:hidden;min-height:106px;box-shadow:0 7px 18px rgba(20,35,60,.04);transition:transform .18s ease,box-shadow .18s ease}
.death-page .info-tile:before{position:absolute;top:0;left:0;right:0;height:4px;content:'';background:#00209f}
.death-page .info-tile:nth-child(2):before{background:#009543}
.death-page .info-tile:nth-child(3):before{background:#000}
.death-page .info-tile:hover{transform:translateY(-3px);box-shadow:0 12px 24px rgba(20,35,60,.09)}
.death-page .card{position:relative;overflow:hidden;padding:28px 30px;box-shadow:0 11px 28px rgba(20,35,60,.07)}
.death-page .card:before{position:absolute;top:0;left:0;right:0;height:4px;content:'';background:#bd4545}
.death-page .field input:focus,.death-page .field textarea:focus{border-color:#00209f;box-shadow:0 0 0 3px rgba(0,32,159,.1)}
.death-page .btn-danger{box-shadow:0 8px 18px rgba(189,69,69,.23)}
.death-page .btn-danger:hover{transform:translateY(-2px)}
.death-page .alert.success{border-left:4px solid #009543}
.death-page .alert.error{border-left:4px solid #bd4545}
@media(max-width:700px){.death-page .hero{padding:24px 20px}.death-page .card{padding:22px 18px}}
`;

const ReportDeath = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ national_id: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{13}$/.test(form.national_id)) {
      setError('National ID must be exactly 13 digits.');
      return;
    }
    if (!form.reason || form.reason.trim().length < 10) {
      setError('Please provide a reason with at least 10 characters.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to mark citizen ${form.national_id} as deceased?\n\n` +
      `This will:\n` +
      `• Cancel all their pending service requests\n` +
      `• Notify all government departments\n` +
      `• Prevent them from logging in\n\n` +
      `This action is logged and cannot be easily undone.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await API.post('/citizen/report-death', form);
      setResult(response.data);
      setForm({ national_id: '', reason: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report death. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OfficerLayout title="Report Death">
      <style>{styles}</style>
      <div className="death-page">

        <header className="hero">
          <div className="eyebrow"><span /> Critical event</div>
          <h1>Report a Citizen's Death</h1>
          <p>
            Record the passing of a citizen to notify all government departments and cancel any
            pending service requests. This action is reserved for Home Affairs staff.
          </p>
        </header>

        <div className="warning">
          <span className="warning-icon">⚠</span>
          <div>
            <strong>Important — please verify before submitting.</strong><br />
            This action notifies the Departments of Traffic, Finance, Pensions, Police, and Passport.
            It cannot be undone from this screen. Please ensure you have the correct National ID and
            a valid death certificate before proceeding.
          </div>
        </div>

        <div className="info-grid">
          <div className="info-tile">
            <strong>1. Requests cancelled</strong>
            <p>All in-progress service requests for this citizen will be cancelled.</p>
          </div>
          <div className="info-tile">
            <strong>2. Departments notified</strong>
            <p>Traffic, Finance, Pensions, Police, and Passport receive the update.</p>
          </div>
          <div className="info-tile">
            <strong>3. Login disabled</strong>
            <p>The citizen's account will no longer be able to sign in.</p>
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="national_id">Citizen National ID <b>*</b></label>
              <input
                id="national_id"
                name="national_id"
                value={form.national_id}
                onChange={handleChange}
                inputMode="numeric"
                maxLength={13}
                pattern="[0-9]{13}"
                placeholder="Enter the 13-digit National ID"
                required
              />
              <span className="hint">Exactly 13 digits, no letters or symbols.</span>
            </div>

            <div className="field">
              <label htmlFor="reason">Reason / Additional details <b>*</b></label>
              <textarea
                id="reason"
                name="reason"
                value={form.reason}
                onChange={handleChange}
                placeholder="e.g. Death certificate #12345 issued by Maseru District Hospital on 2026-10-12."
                required
              />
              <span className="hint">At least 10 characters. Include reference to the death certificate when available.</span>
            </div>

            {error && (
              <div className="alert error" role="alert">
                <span className="alert-icon">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="alert success" role="status">
                <span className="alert-icon">✓</span>
                <span>
                  <strong>Citizen marked as deceased.</strong><br />
                  {result.message}<br />
                  <em>Cancelled requests: {result.cancelled_requests}</em>
                </span>
              </div>
            )}

            <div className="actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/home-affairs')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-danger" disabled={loading}>
                {loading ? 'Processing…' : 'Confirm death report'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </OfficerLayout>
  );
};

export default ReportDeath;