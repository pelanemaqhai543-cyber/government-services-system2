import React, { useEffect, useMemo, useState } from 'react';
import OfficerLayout from '../../components/OfficerLayout';
import API from '../../utils/api';

const STATUS_STYLES = {
  approved: { background: '#e8f7ef', color: '#007936' },
  completed: { background: '#e8f7ef', color: '#007936' },
  pending: { background: '#fff7df', color: '#9a6500' },
  rejected: { background: '#fff0f0', color: '#b4232f' },
  review: { background: '#eaf0ff', color: '#00209f' },
  in_review: { background: '#eaf0ff', color: '#00209f' },
  submitted: { background: '#eef1f5', color: '#3f4c5c' },
};

const styles = `
  .ai-command { --blue:#00209F; --green:#009543; --black:#000; --ink:#172235; --muted:#728096; --line:#e5eaf2; color:var(--ink); padding:4px 0 34px; }
  .ai-command * { box-sizing:border-box; }
  .ai-command button { font:inherit; cursor:pointer; }
  .ai-command h1,.ai-command h2,.ai-command h3,.ai-command p { margin:0; }
  .ai-hero { position:relative; overflow:hidden; display:flex; align-items:center; justify-content:space-between; gap:24px; min-height:190px; padding:30px 34px; border-radius:22px; background:linear-gradient(118deg,#00145f 0%,#00209f 58%,#003dbb 100%); box-shadow:0 18px 40px rgba(0,32,159,.18); }
  .ai-hero:after { position:absolute; right:-88px; bottom:-132px; width:320px; height:320px; content:''; border:45px solid rgba(0,149,67,.34); border-radius:50%; }
  .ai-hero-copy { position:relative; z-index:1; max-width:720px; }
  .ai-eyebrow { display:flex; align-items:center; gap:9px; margin-bottom:11px; color:#baf2cf; font-size:11px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; }
  .ai-eyebrow i { width:8px; height:8px; border-radius:50%; background:#20c778; box-shadow:0 0 0 5px rgba(32,199,120,.2); }
  .ai-hero h1 { color:#fff; font-size:clamp(28px,3vw,40px); letter-spacing:-.055em; }
  .ai-hero p { max-width:680px; margin-top:10px; color:rgba(255,255,255,.78); font-size:14px; line-height:1.6; }
  .ai-primary { position:relative; z-index:1; display:inline-flex; align-items:center; justify-content:center; min-height:44px; padding:0 18px; color:#063d22; border:1px solid #7ce4ad; border-radius:10px; background:#baf4d2; font-size:13px; font-weight:800; box-shadow:0 8px 18px rgba(0,0,0,.16); }
  .ai-primary:hover { color:#fff; border-color:var(--green); background:var(--green); }
  .ai-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin:20px 0; }
  .ai-stat { position:relative; overflow:hidden; min-height:112px; padding:20px; border:1px solid var(--line); border-radius:15px; background:#fff; box-shadow:0 9px 24px rgba(20,35,60,.06); }
  .ai-stat:before { position:absolute; top:0; left:0; right:0; height:4px; content:''; background:var(--blue); }
  .ai-stat:nth-child(2):before { background:#000; }
  .ai-stat:nth-child(3):before,.ai-stat:nth-child(4):before { background:var(--green); }
  .ai-stat-label { display:block; color:var(--muted); font-size:12px; font-weight:700; }
  .ai-stat-value { display:block; margin-top:8px; color:#000; font-size:30px; font-weight:800; letter-spacing:-.05em; }
  .ai-stat-note { display:block; margin-top:4px; color:var(--muted); font-size:11px; }
  .ai-error { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:13px 16px; margin-bottom:18px; color:#9f2633; border:1px solid #f3c8cc; border-radius:12px; background:#fff2f3; font-size:13px; }
  .ai-retry { padding:7px 12px; color:#9f2633; border:1px solid #e5a9af; border-radius:8px; background:#fff; font-size:12px; font-weight:800; }
  .ai-table-card { overflow:hidden; border:1px solid var(--line); border-radius:17px; background:#fff; box-shadow:0 11px 28px rgba(20,35,60,.07); }
  .ai-table-head { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; padding:22px 24px 17px; border-bottom:1px solid var(--line); }
  .ai-table-head h2 { color:#000; font-size:18px; letter-spacing:-.035em; }
  .ai-table-head p { margin-top:5px; color:var(--muted); font-size:12px; }
  .ai-table-wrap { overflow-x:auto; }
  .ai-table { width:100%; min-width:900px; border-collapse:collapse; text-align:left; font-size:13px; }
  .ai-table th { padding:13px 17px; color:#fff; background:var(--blue); font-size:10px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
  .ai-table td { padding:16px 17px; border-bottom:1px solid #eff2f6; vertical-align:top; }
  .ai-table tbody tr:hover td { background:#f7f9ff; }
  .ai-reference { color:var(--blue); font-weight:800; }
  .ai-citizen strong { display:block; color:#172235; font-size:13px; }
  .ai-citizen span { display:block; margin-top:4px; color:var(--muted); font-size:11px; }
  .ai-service { color:#26364b; font-weight:700; text-transform:capitalize; }
  .ai-summary { max-width:380px; color:#35445a; line-height:1.5; }
  .ai-instruction { margin-top:6px; color:#007936; font-size:11px; font-weight:800; line-height:1.45; }
  .ai-status { display:inline-flex; padding:6px 10px; border-radius:99px; font-size:11px; font-weight:800; text-transform:capitalize; white-space:nowrap; }
  .ai-view { padding:8px 13px; color:var(--blue); border:1px solid #cbd8fa; border-radius:8px; background:#edf2ff; font-size:12px; font-weight:800; }
  .ai-view:hover { color:#fff; background:var(--blue); }
  .ai-loading,.ai-empty { padding:58px 20px; color:var(--muted); text-align:center; font-size:13px; }
  .ai-loading strong { display:block; margin-bottom:6px; color:var(--blue); font-size:15px; }
  .ai-modal-backdrop { position:fixed; inset:0; z-index:1000; display:flex; align-items:center; justify-content:center; padding:24px; background:rgba(3,15,45,.7); }
  .ai-modal { width:100%; max-width:650px; max-height:90vh; overflow:auto; border-radius:18px; background:#fff; box-shadow:0 24px 70px rgba(0,0,0,.25); }
  .ai-modal-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:23px 25px; border-bottom:1px solid var(--line); }
  .ai-modal-head h2 { color:#000; font-size:21px; letter-spacing:-.04em; }
  .ai-modal-head p { margin-top:5px; color:var(--muted); font-size:12px; }
  .ai-close { width:34px; height:34px; color:#526176; border:1px solid var(--line); border-radius:9px; background:#fff; font-size:22px; line-height:1; }
  .ai-modal-body { padding:23px 25px; }
  .ai-analysis { padding:18px; margin-bottom:20px; border:1px solid #cbd8fa; border-left:5px solid var(--blue); border-radius:12px; background:linear-gradient(135deg,#f4f7ff,#fff); }
  .ai-analysis h3 { margin-bottom:10px; color:var(--blue); font-size:13px; letter-spacing:.04em; text-transform:uppercase; }
  .ai-analysis p { color:#35445a; line-height:1.65; }
  .ai-profile { display:grid; grid-template-columns:repeat(2,1fr); gap:11px; }
  .ai-profile-item { padding:12px; border:1px solid var(--line); border-radius:10px; background:#fbfcfe; }
  .ai-profile-item span { display:block; color:var(--muted); font-size:10px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; }
  .ai-profile-item strong { display:block; margin-top:5px; color:#172235; font-size:13px; word-break:break-word; }
  .ai-close-footer { width:100%; padding:12px; margin-top:21px; color:#fff; border:0; border-radius:10px; background:var(--blue); font-size:13px; font-weight:800; }
  @media(max-width:900px){.ai-stats{grid-template-columns:repeat(2,1fr)}.ai-hero{align-items:flex-start;flex-direction:column}.ai-primary{width:100%}}
  @media(max-width:560px){.ai-command{padding-bottom:20px}.ai-hero{padding:24px 20px}.ai-stats{gap:9px}.ai-stat{padding:15px}.ai-stat-value{font-size:25px}.ai-table-head{padding:18px}.ai-modal-body,.ai-modal-head{padding:19px}.ai-profile{grid-template-columns:1fr}}
`;

export default function AdminAIQueue() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const loadQueue = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/ai/master-queue');
      const payload = response.data || {};
      setApps(Array.isArray(payload) ? payload : payload.applications || payload.rows || []);
    } catch (err) {
      console.error('Failed to load AI queue:', err);
      setError(err.response?.data?.message || 'Failed to load AI queue. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQueue(); }, []);

  const metrics = useMemo(() => ({
    total: apps.length,
    pending: apps.filter((app) => ['submitted', 'pending'].includes(String(app.status).toLowerCase())).length,
    review: apps.filter((app) => ['review', 'in_review'].includes(String(app.status).toLowerCase())).length,
    completed: apps.filter((app) => ['completed', 'approved'].includes(String(app.status).toLowerCase())).length,
  }), [apps]);

  return (
    <OfficerLayout title="AI Command Center">
      <style>{styles}</style>
      <div className="ai-command">
        <section className="ai-hero">
          <div className="ai-hero-copy">
            <div className="ai-eyebrow"><i /> Intelligent application operations</div>
            <h1>AI Application Command Center</h1>
            <p>Review automated application analysis, eligibility signals, and recommended next steps from one professional workspace.</p>
          </div>
          <button className="ai-primary" type="button" onClick={loadQueue}>Run AI analysis</button>
        </section>

        <section className="ai-stats" aria-label="AI queue statistics">
          <article className="ai-stat"><span className="ai-stat-label">Total applications</span><strong className="ai-stat-value">{loading ? '—' : metrics.total}</strong><span className="ai-stat-note">All departments</span></article>
          <article className="ai-stat"><span className="ai-stat-label">Pending review</span><strong className="ai-stat-value">{loading ? '—' : metrics.pending}</strong><span className="ai-stat-note">Awaiting action</span></article>
          <article className="ai-stat"><span className="ai-stat-label">In review</span><strong className="ai-stat-value">{loading ? '—' : metrics.review}</strong><span className="ai-stat-note">Active assessments</span></article>
          <article className="ai-stat"><span className="ai-stat-label">Completed</span><strong className="ai-stat-value">{loading ? '—' : metrics.completed}</strong><span className="ai-stat-note">Processed cases</span></article>
        </section>

        {error && <div className="ai-error" role="alert"><span>{error}</span><button className="ai-retry" type="button" onClick={loadQueue}>Try again</button></div>}

        <section className="ai-table-card">
          <div className="ai-table-head"><div><h2>AI-reviewed applications</h2><p>Automated recommendations are advisory; the responsible officer makes the final decision.</p></div><span className="ai-stat-note">{apps.length} records</span></div>
          {loading ? <div className="ai-loading"><strong>AI analysis in progress</strong>Reading documents and evaluating application rules…</div> : apps.length === 0 ? <div className="ai-empty">No AI-reviewed applications are available.</div> : (
            <div className="ai-table-wrap"><table className="ai-table"><thead><tr><th>Reference</th><th>Citizen profile</th><th>Service</th><th>AI decision and instructions</th><th>Status</th><th>Action</th></tr></thead><tbody>
              {apps.map((app) => {
                const status = String(app.status || 'submitted').toLowerCase();
                const badge = STATUS_STYLES[status] || STATUS_STYLES.submitted;
                return <tr key={app.id}>
                  <td><span className="ai-reference">{app.reference_number || `APP-${app.id}`}</span></td>
                  <td className="ai-citizen"><strong>{app.full_name || 'Unnamed citizen'}</strong><span>ID: {app.national_id || 'Not provided'}</span><span>{app.email || 'Email not provided'}</span></td>
                  <td className="ai-service">{app.service_type || 'Service request'}</td>
                  <td><div className="ai-summary">{app.ai_summary || 'No AI summary available yet.'}</div><div className="ai-instruction">{app.ai_instructions || app.ai_recommendation || 'Officer review required'}</div></td>
                  <td><span className="ai-status" style={badge}>{app.status || 'submitted'}</span></td>
                  <td><button className="ai-view" type="button" onClick={() => setSelected(app)}>View</button></td>
                </tr>;
              })}
            </tbody></table></div>
          )}
        </section>

        {selected && <div className="ai-modal-backdrop" onClick={() => setSelected(null)}><div className="ai-modal" onClick={(event) => event.stopPropagation()}>
          <div className="ai-modal-head"><div><h2>Application details</h2><p>{selected.reference_number || `APP-${selected.id}`} · {selected.service_type || 'Service request'}</p></div><button className="ai-close" type="button" onClick={() => setSelected(null)} aria-label="Close">×</button></div>
          <div className="ai-modal-body">
            <div className="ai-analysis"><h3>AI analysis</h3><p>{selected.ai_summary || 'No AI summary has been generated for this application.'}</p><p style={{ marginTop: 10, fontWeight: 800, color: selected.ai_recommendation === 'approve' ? '#007936' : '#9a6500' }}>{selected.ai_instructions || selected.ai_recommendation || 'Officer review required'}</p></div>
            <div className="ai-profile"><div className="ai-profile-item"><span>Full name</span><strong>{selected.full_name || '—'}</strong></div><div className="ai-profile-item"><span>National ID</span><strong>{selected.national_id || '—'}</strong></div><div className="ai-profile-item"><span>Email</span><strong>{selected.email || '—'}</strong></div><div className="ai-profile-item"><span>Department</span><strong>{selected.department || '—'}</strong></div><div className="ai-profile-item"><span>Service</span><strong>{selected.service_type || '—'}</strong></div><div className="ai-profile-item"><span>Status</span><strong>{selected.status || '—'}</strong></div></div>
            <button className="ai-close-footer" type="button" onClick={() => setSelected(null)}>Close review</button>
          </div>
        </div></div>}
      </div>
    </OfficerLayout>
  );
}
