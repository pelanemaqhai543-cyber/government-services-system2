import React, { useEffect, useMemo, useState } from 'react';

import OfficerLayout from '../../components/OfficerLayout';
import API from '../../utils/api';

const Icon = ({ name, size = 20 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M15 5.5a3 3 0 0 1 0 5.8M17 14.5a5.5 5.5 0 0 1 3.5 5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    document: <><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4M9 12h6M9 16h6" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

const styles = `
  .verify-page { --ink:#172235; --muted:#738096; --border:#e7ebf2; --blue:#2764d8; --blue-soft:#edf3ff; --green:#118653; --green-soft:#eaf8f1; --amber:#d49325; --amber-soft:#fff7e7; color:var(--ink); }
  .verify-page * { box-sizing:border-box; }.verify-page button { font:inherit; cursor:pointer; }
  .verify-page h1,.verify-page h2,.verify-page h3,.verify-page p { margin:0; }
  .verify-page .hero { display:flex; align-items:flex-end; justify-content:space-between; gap:22px; margin-bottom:26px; }
  .verify-page .eyebrow { display:flex; align-items:center; gap:8px; margin-bottom:10px; color:var(--blue); font-size:11px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }.verify-page .eyebrow span { width:7px; height:7px; border-radius:50%; background:var(--blue); box-shadow:0 0 0 5px var(--blue-soft); }
  .verify-page h1 { font-size:clamp(26px,3vw,34px); line-height:1.1; letter-spacing:-.045em; }.verify-page .hero p { max-width:650px; margin-top:10px; color:var(--muted); font-size:14px; line-height:1.6; }
  .verify-page .refresh-button { display:inline-flex; align-items:center; gap:8px; min-height:42px; padding:0 15px; color:var(--blue); border:1px solid #cddafa; border-radius:10px; background:#fff; font-size:12px; font-weight:800; }.verify-page .refresh-button:hover { background:var(--blue-soft); }
  .verify-page .metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; }.verify-page .metric { display:flex; align-items:center; gap:14px; padding:18px; border:1px solid var(--border); border-radius:15px; background:#fff; box-shadow:0 7px 20px rgba(32,53,87,.05); }.verify-page .metric-icon { display:grid; place-items:center; width:40px; height:40px; color:var(--blue); border-radius:11px; background:var(--blue-soft); }.verify-page .metric:nth-child(2) .metric-icon { color:var(--green); background:var(--green-soft); }.verify-page .metric:nth-child(3) .metric-icon { color:var(--amber); background:var(--amber-soft); }.verify-page .metric-label { display:block; color:var(--muted); font-size:11px; font-weight:700; }.verify-page .metric-value { display:block; margin-top:3px; font-size:26px; letter-spacing:-.05em; }
  .verify-page .overview { display:grid; grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr); gap:18px; margin-bottom:25px; }.verify-page .panel { border:1px solid var(--border); border-radius:16px; background:#fff; box-shadow:0 7px 20px rgba(32,53,87,.045); }.verify-page .panel-header { padding:20px 22px 0; }.verify-page .panel-header h2 { font-size:17px; letter-spacing:-.025em; }.verify-page .panel-header p { margin-top:5px; color:var(--muted); font-size:12px; }
  .verify-page .readiness-chart { padding:25px 22px 22px; }.verify-page .readiness-row { display:grid; grid-template-columns:130px 1fr 42px; align-items:center; gap:13px; margin-bottom:19px; font-size:12px; font-weight:700; }.verify-page .readiness-row:last-child { margin-bottom:0; }.verify-page .readiness-track { height:12px; overflow:hidden; border-radius:99px; background:#eef1f5; }.verify-page .readiness-fill { height:100%; border-radius:99px; transition:width .35s ease; }.verify-page .readiness-fill.complete { background:var(--green); }.verify-page .readiness-fill.followup { background:var(--amber); }.verify-page .readiness-row strong { text-align:right; font-size:13px; }
  .verify-page .summary { display:flex; flex-direction:column; min-height:220px; }.verify-page .summary-body { display:flex; flex:1; align-items:center; justify-content:center; gap:18px; padding:18px; }.verify-page .ring { position:relative; display:grid; place-items:center; width:130px; height:130px; border-radius:50%; background:conic-gradient(var(--green) 0 72%,#edf0f4 72% 100%); }.verify-page .ring::after { width:88px; height:88px; content:''; border-radius:50%; background:#fff; }.verify-page .ring-copy { position:absolute; z-index:1; display:grid; text-align:center; }.verify-page .ring-copy strong { font-size:25px; letter-spacing:-.05em; }.verify-page .ring-copy span { color:var(--muted); font-size:10px; font-weight:700; }.verify-page .summary-note { max-width:120px; color:var(--muted); font-size:11px; line-height:1.5; }.verify-page .summary-note strong { display:block; margin-bottom:4px; color:var(--ink); font-size:13px; }
  .verify-page .section-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:15px; margin:25px 0 13px; }.verify-page .section-heading h2 { font-size:18px; letter-spacing:-.03em; }.verify-page .section-heading p { margin-top:5px; color:var(--muted); font-size:12px; }
  .verify-page .verification-row { display:flex; align-items:center; justify-content:space-between; gap:18px; padding:17px 22px; border-top:1px solid var(--border); }.verify-page .verification-row:first-child { border-top:0; }.verify-page .citizen-info { display:flex; align-items:center; gap:12px; min-width:0; }.verify-page .avatar { display:grid; flex:0 0 auto; place-items:center; width:42px; height:42px; color:var(--blue); border-radius:50%; background:var(--blue-soft); font-weight:800; }.verify-page .citizen-copy { display:grid; gap:5px; min-width:0; }.verify-page .citizen-copy strong { overflow:hidden; font-size:13px; text-overflow:ellipsis; white-space:nowrap; }.verify-page .citizen-copy span { overflow:hidden; color:var(--muted); font-size:11px; text-overflow:ellipsis; white-space:nowrap; }.verify-page .verification-actions { display:flex; flex:0 0 auto; flex-wrap:wrap; justify-content:flex-end; gap:8px; min-width:0; }.verify-page .approve-button,.verify-page .reject-button { min-width:104px; min-height:36px; padding:0 13px; border-radius:8px; font-size:11px; font-weight:800; white-space:nowrap; }.verify-page .approve-button { color:var(--green); border:1px solid #bce4cf; background:var(--green-soft); }.verify-page .reject-button { color:#bb4c4c; border:1px solid #f0caca; background:#fff3f3; }.verify-page .empty-state { padding:45px 22px; color:var(--muted); text-align:center; font-size:13px; }
  @media (max-width:900px) { .verify-page .overview { grid-template-columns:1fr; }.verify-page .summary { min-height:190px; } }
  @media (max-width:760px) { .verify-page .verification-row { align-items:flex-start; flex-direction:column; gap:13px; }.verify-page .verification-actions { width:100%; justify-content:stretch; }.verify-page .approve-button,.verify-page .reject-button { flex:1 1 140px; } }
  @media (max-width:620px) { .verify-page .hero { align-items:stretch; flex-direction:column; }.verify-page .refresh-button { width:100%; justify-content:center; }.verify-page .metrics { gap:9px; }.verify-page .metric { align-items:flex-start; flex-direction:column; gap:9px; padding:14px; }.verify-page .metric-value { font-size:23px; }.verify-page .panel-header { padding:17px 16px 0; }.verify-page .readiness-chart { padding:20px 16px; }.verify-page .readiness-row { grid-template-columns:105px 1fr 30px; gap:8px; font-size:10px; }.verify-page .summary-body { flex-direction:column; }.verify-page .summary-note { max-width:220px; text-align:center; }.verify-page .verification-row { align-items:flex-start; flex-direction:column; padding:15px 16px; }.verify-page .verification-actions { width:100%; }.verify-page .approve-button,.verify-page .reject-button { flex:1 1 0; min-width:0; width:100%; } }
`;

const AdminVerify = () => {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCitizens = async () => {
    try {
      setLoading(true);
      const response = await API.get('/citizen/pending-verifications');
      setCitizens(response.data || []);
    } catch (error) {
      console.error('Failed to load citizens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCitizens(); }, []);

  const readiness = useMemo(() => {
    const complete = citizens.filter((citizen) => citizen.national_id && citizen.email && (citizen.first_name || citizen.full_name)).length;
    return { complete, followup: Math.max(citizens.length - complete, 0) };
  }, [citizens]);

  const readinessMax = Math.max(readiness.complete, readiness.followup, 1);
  const completionPercent = citizens.length ? Math.round((readiness.complete / citizens.length) * 100) : 0;

  const verifyCitizen = async (id, status) => {
    try {
      await API.post('/citizen/verify', { userId: id, status });
      setCitizens((current) => current.filter((citizen) => citizen.id !== id));
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  return (
    <OfficerLayout title="Citizen Verification">
      <style>{styles}</style>
      <div className="verify-page">
        <header className="hero">
          <div><div className="eyebrow"><span /> Identity operations</div><h1>Citizen Verification</h1><p>Review citizen profiles, validate identity details, and approve or reject verification requests securely.</p></div>
          <button className="refresh-button" type="button" onClick={loadCitizens}><Icon name="document" size={16} /> Refresh queue</button>
        </header>

        <section className="metrics" aria-label="Verification metrics">
          <article className="metric"><span className="metric-icon"><Icon name="users" size={20} /></span><span><span className="metric-label">Awaiting review</span><strong className="metric-value">{loading ? '—' : citizens.length}</strong></span></article>
          <article className="metric"><span className="metric-icon"><Icon name="check" size={20} /></span><span><span className="metric-label">Profile-ready</span><strong className="metric-value">{loading ? '—' : readiness.complete}</strong></span></article>
          <article className="metric"><span className="metric-icon"><Icon name="clock" size={20} /></span><span><span className="metric-label">Needs follow-up</span><strong className="metric-value">{loading ? '—' : readiness.followup}</strong></span></article>
        </section>

        <section className="overview" aria-label="Verification overview">
          <article className="panel"><div className="panel-header"><h2>Verification readiness</h2><p>Identity information completeness across the current queue.</p></div><div className="readiness-chart"><div className="readiness-row"><span>Profile-ready</span><div className="readiness-track"><div className="readiness-fill complete" style={{ width: `${(readiness.complete / readinessMax) * 100}%` }} /></div><strong>{readiness.complete}</strong></div><div className="readiness-row"><span>Needs follow-up</span><div className="readiness-track"><div className="readiness-fill followup" style={{ width: `${(readiness.followup / readinessMax) * 100}%` }} /></div><strong>{readiness.followup}</strong></div></div></article>
          <article className="panel summary"><div className="panel-header"><h2>Queue health</h2><p>Ready for decision</p></div><div className="summary-body"><div className="ring" style={{ background: `conic-gradient(var(--green) 0 ${completionPercent}%, #edf0f4 ${completionPercent}% 100%)` }}><div className="ring-copy"><strong>{completionPercent}%</strong><span>ready</span></div></div><p className="summary-note"><strong>Review quality</strong>{readiness.followup ? 'Some profiles need additional information before approval.' : 'All profiles have the required identity information.'}</p></div></article>
        </section>

        <div className="section-heading"><div><h2>Pending verification requests</h2><p>Citizens currently waiting for Home Affairs approval.</p></div></div>
        <section className="panel" aria-live="polite">
          {loading ? <div className="empty-state">Loading verification requests...</div> : citizens.length === 0 ? <div className="empty-state">No pending verification requests.</div> : citizens.map((citizen) => {
            const name = `${citizen.first_name || ''} ${citizen.last_name || ''}`.trim() || citizen.full_name || 'Unnamed citizen';
            return <div className="verification-row" key={citizen.id}><div className="citizen-info"><div className="avatar">{name.charAt(0).toUpperCase()}</div><div className="citizen-copy"><strong>{name}</strong><span>National ID: {citizen.national_id || 'Not provided'}</span><span>Email: {citizen.email || 'Not provided'}</span></div></div><div className="verification-actions"><button className="approve-button" type="button" onClick={() => verifyCitizen(citizen.id, 'verified')}>Approve</button><button className="reject-button" type="button" onClick={() => verifyCitizen(citizen.id, 'rejected')}>Reject</button></div></div>;
          })}
        </section>
      </div>
    </OfficerLayout>
  );
};

export default AdminVerify;
