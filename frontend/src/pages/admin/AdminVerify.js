import React, { useEffect, useState } from 'react';
import OfficerLayout from '../../components/OfficerLayout';
import API from '../../utils/api';

const Icon = ({ name, size = 20 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M15 5.5a3 3 0 0 1 0 5.8M17 14.5a5.5 5.5 0 0 1 3.5 5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    document: <><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4M9 12h6M9 16h6" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

const styles = `
  .verify-page { --ink:#172235; --muted:#738096; --border:#e7ebf2; --blue:#2764d8; --blue-soft:#edf3ff; --green:#118653; --green-soft:#eaf8f1; --red:#bd4545; --red-soft:#fff1f1; color:var(--ink); }
  .verify-page * { box-sizing:border-box; }.verify-page button { font:inherit; cursor:pointer; }
  .verify-page h1,.verify-page h2,.verify-page h3,.verify-page p { margin:0; }
  .verify-page .hero { display:flex; align-items:flex-end; justify-content:space-between; gap:22px; margin-bottom:26px; }
  .verify-page .eyebrow { display:flex; align-items:center; gap:8px; margin-bottom:10px; color:var(--blue); font-size:11px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
  .verify-page .eyebrow span { width:7px; height:7px; border-radius:50%; background:var(--blue); box-shadow:0 0 0 5px var(--blue-soft); }
  .verify-page h1 { font-size:clamp(26px,3vw,34px); line-height:1.1; letter-spacing:-.045em; }
  .verify-page .hero p { max-width:650px; margin-top:10px; color:var(--muted); font-size:14px; line-height:1.6; }
  .verify-page .refresh-button { display:inline-flex; align-items:center; gap:8px; min-height:42px; padding:0 15px; color:var(--blue); border:1px solid #cddafa; border-radius:10px; background:#fff; font-size:12px; font-weight:800; }
  .verify-page .refresh-button:hover { background:var(--blue-soft); }
  .verify-page .metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; }
  .verify-page .metric { display:flex; align-items:center; gap:14px; padding:18px; border:1px solid var(--border); border-radius:15px; background:#fff; box-shadow:0 7px 20px rgba(32,53,87,.05); }
  .verify-page .metric-icon { display:grid; place-items:center; width:40px; height:40px; color:var(--blue); border-radius:11px; background:var(--blue-soft); }
  .verify-page .metric:nth-child(2) .metric-icon { color:var(--green); background:var(--green-soft); }
  .verify-page .metric:nth-child(3) .metric-icon { color:var(--red); background:var(--red-soft); }
  .verify-page .metric-label { display:block; color:var(--muted); font-size:11px; font-weight:700; }
  .verify-page .metric-value { display:block; margin-top:3px; font-size:26px; letter-spacing:-.05em; }
  .verify-page .notice-banner { display:flex; align-items:flex-start; gap:12px; padding:16px 20px; margin-bottom:20px; background:var(--blue-soft); border-left:4px solid var(--blue); border-radius:8px; font-size:13px; color:#1e3a8a; line-height:1.6; }
  .verify-page .notice-banner svg { flex-shrink:0; margin-top:2px; }
  .verify-page .panel { border:1px solid var(--border); border-radius:16px; background:#fff; box-shadow:0 7px 20px rgba(32,53,87,.045); }
  .verify-page .section-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:15px; margin:25px 0 13px; }
  .verify-page .section-heading h2 { font-size:18px; letter-spacing:-.03em; }
  .verify-page .section-heading p { margin-top:5px; color:var(--muted); font-size:12px; }
  .verify-page .citizen-row { display:flex; align-items:center; gap:15px; padding:17px 22px; border-top:1px solid var(--border); }
  .verify-page .citizen-row:first-child { border-top:0; }
  .verify-page .avatar { display:grid; flex:0 0 auto; place-items:center; width:44px; height:44px; color:#fff; border-radius:50%; background:var(--blue); font-weight:800; font-size:15px; }
  .verify-page .avatar.deceased { background:var(--red); }
  .verify-page .citizen-info { flex:1; min-width:0; }
  .verify-page .citizen-info strong { display:block; overflow:hidden; font-size:13.5px; text-overflow:ellipsis; white-space:nowrap; }
  .verify-page .citizen-info span { display:block; overflow:hidden; margin-top:4px; color:var(--muted); font-size:11.5px; text-overflow:ellipsis; white-space:nowrap; }
  .verify-page .status-pill { padding:5px 12px; border-radius:99px; font-size:11px; font-weight:800; text-transform:capitalize; flex-shrink:0; }
  .verify-page .status-pill.active { color:var(--green); background:var(--green-soft); }
  .verify-page .status-pill.deceased { color:var(--red); background:var(--red-soft); }
  .verify-page .status-pill.suspended { color:#b45309; background:#fef3c7; }
  .verify-page .empty-state { padding:45px 22px; color:var(--muted); text-align:center; font-size:13px; }
  @media (max-width:620px) {
    .verify-page .hero { align-items:stretch; flex-direction:column; }
    .verify-page .refresh-button { width:100%; justify-content:center; }
    .verify-page .metrics { grid-template-columns:1fr; gap:9px; }
    .verify-page .citizen-row { flex-direction:column; align-items:flex-start; padding:15px 16px; }
  }
`;

const AdminVerify = () => {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCitizens = async () => {
    try {
      setLoading(true);
      const response = await API.get('/citizen/all');
      setCitizens(response.data || []);
    } catch (error) {
      console.error('Failed to load citizens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCitizens(); }, []);

  const activeCount = citizens.filter(c => c.status === 'active').length;
  const deceasedCount = citizens.filter(c => c.status === 'deceased').length;

  return (
    <OfficerLayout title="Citizen Directory">
      <style>{styles}</style>
      <div className="verify-page">
        <header className="hero">
          <div>
            <div className="eyebrow"><span /> Citizen registry</div>
            <h1>Citizen Directory</h1>
            <p>View all registered citizens. Accounts are auto-verified on registration — no manual approval is required.</p>
          </div>
          <button className="refresh-button" type="button" onClick={loadCitizens}>
            <Icon name="document" size={16} /> Refresh list
          </button>
        </header>

        <div className="notice-banner">
          <Icon name="shield" size={18} />
          <div>
            <strong>Auto-verification is active.</strong>
            Citizens are automatically verified when they register with a valid 13-digit National ID.
            Use <em>Report Death</em> to notify all departments when a citizen passes away.
          </div>
        </div>

        <section className="metrics" aria-label="Citizen metrics">
          <article className="metric">
            <span className="metric-icon"><Icon name="users" size={20} /></span>
            <span>
              <span className="metric-label">Total citizens</span>
              <strong className="metric-value">{loading ? '—' : citizens.length}</strong>
            </span>
          </article>
          <article className="metric">
            <span className="metric-icon"><Icon name="check" size={20} /></span>
            <span>
              <span className="metric-label">Active accounts</span>
              <strong className="metric-value">{loading ? '—' : activeCount}</strong>
            </span>
          </article>
          <article className="metric">
            <span className="metric-icon"><Icon name="document" size={20} /></span>
            <span>
              <span className="metric-label">Deceased</span>
              <strong className="metric-value">{loading ? '—' : deceasedCount}</strong>
            </span>
          </article>
        </section>

        <div className="section-heading">
          <div>
            <h2>All registered citizens</h2>
            <p>Complete directory of citizen accounts. This is a read-only view.</p>
          </div>
        </div>

        <section className="panel" aria-live="polite">
          {loading ? (
            <div className="empty-state">Loading citizens...</div>
          ) : citizens.length === 0 ? (
            <div className="empty-state">No citizens registered yet.</div>
          ) : (
            citizens.map((citizen) => {
              const name = citizen.full_name || 'Unnamed citizen';
              const status = citizen.status || 'active';
              return (
                <div className="citizen-row" key={citizen.id}>
                  <div className={`avatar ${status === 'deceased' ? 'deceased' : ''}`}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="citizen-info">
                    <strong>{name}</strong>
                    <span>National ID: {citizen.national_id || 'Not provided'}</span>
                    {citizen.email && <span>Email: {citizen.email}</span>}
                  </div>
                  <span className={`status-pill ${status}`}>{status}</span>
                </div>
              );
            })
          )}
        </section>
      </div>
    </OfficerLayout>
  );
};

export default AdminVerify;