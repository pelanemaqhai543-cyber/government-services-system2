import React, { useEffect, useState } from 'react';
import OfficerLayout from '../../components/OfficerLayout';
import API from '../../utils/api';
import AISummaryPanel from '../../components/AISummaryPanel';

const STATUS_COLORS = {
  submitted: { bg: '#ede9fe', color: '#6d28d9' },
  review:    { bg: '#fef3c7', color: '#b45309' },
  ready:     { bg: '#e0f2fe', color: '#0369a1' },
  completed: { bg: '#dcfce7', color: '#15803d' },
  rejected:  { bg: '#fee2e2', color: '#b91c1c' },
};

const DEPT_COLORS = {
  home_affairs: '#00209F',
  traffic: '#d97706',
  finance: '#0d9488',
  pension: '#7c3aed',
  police: '#1e3a8a',
  passport: '#b91c1c',
};

const Icon = ({ name, size = 18 }) => {
  const c = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const p = {
    close: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    doc: <><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4M9 12h6M9 16h6" /></>,
  };
  return <svg {...c}>{p[name]}</svg>;
};

const styles = `
  .admin-apps { --blue:#00209F; --blue-dark:#00166f; --blue-soft:#edf2ff; --green:#009543; --green-dark:#007936; --green-soft:#eaf8f0; --red:#bd4545; --red-soft:#fff1f1; --black:#000; --ink:#172235; --muted:#718096; --border:#e5e9f0; --white:#fff; width:100%; color:var(--ink); }
  .admin-apps * { box-sizing:border-box; }
  .admin-apps h1, .admin-apps h2, .admin-apps h3, .admin-apps p { margin:0; }
  .admin-apps button { font:inherit; cursor:pointer; }
  .admin-apps .hero { display:flex; align-items:flex-end; justify-content:space-between; gap:22px; margin-bottom:24px; flex-wrap:wrap; }
  .admin-apps .eyebrow { display:flex; align-items:center; gap:9px; margin-bottom:9px; color:var(--blue); font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }
  .admin-apps .eyebrow span { width:8px; height:8px; border-radius:50%; background:var(--green); box-shadow:0 0 0 5px var(--green-soft); }
  .admin-apps h1 { color:var(--black); font-size:clamp(25px,3vw,32px); letter-spacing:-.04em; }
  .admin-apps .hero p { margin-top:9px; color:var(--muted); font-size:14px; }
  .admin-apps .refresh { padding:10px 16px; color:var(--blue); border:1px solid #cbd6f2; background:#fff; border-radius:10px; font-size:12.5px; font-weight:800; }
  .admin-apps .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
  .admin-apps .stat { padding:16px 18px; background:#fff; border:1px solid var(--border); border-radius:14px; }
  .admin-apps .stat span { font-size:11px; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }
  .admin-apps .stat strong { display:block; margin-top:5px; font-size:24px; color:var(--black); }
  .admin-apps .filters { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:18px; }
  .admin-apps .search { flex:1; min-width:220px; padding:11px 14px; border:1px solid var(--border); border-radius:10px; font-size:13px; background:#fff; outline:none; }
  .admin-apps .search:focus { border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-soft); }
  .admin-apps .dept-chips { display:flex; gap:6px; flex-wrap:wrap; }
  .admin-apps .dept-chip { padding:7px 12px; border:1px solid var(--border); background:#fff; border-radius:99px; font-size:11px; font-weight:800; color:var(--muted); text-transform:capitalize; }
  .admin-apps .dept-chip.active { background:var(--blue); color:#fff; border-color:var(--blue); }
  .admin-apps .table-wrap { background:#fff; border:1px solid var(--border); border-radius:14px; overflow:hidden; }
  .admin-apps .table-head { display:grid; grid-template-columns:1.3fr 1.6fr 1.2fr 1fr 1fr 0.9fr; gap:12px; padding:14px 20px; background:#f7f9fc; border-bottom:1px solid var(--border); font-size:11px; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }
  .admin-apps .row { display:grid; grid-template-columns:1.3fr 1.6fr 1.2fr 1fr 1fr 0.9fr; gap:12px; padding:16px 20px; border-bottom:1px solid #f0f2f5; align-items:center; font-size:13px; }
  .admin-apps .row:hover { background:#fafbfe; }
  .admin-apps .ref { font-weight:800; color:var(--blue); }
  .admin-apps .citizen-cell { display:flex; align-items:center; gap:10px; min-width:0; }
  .admin-apps .mini-avatar { width:32px; height:32px; border-radius:50%; background:var(--blue); color:#fff; display:grid; place-items:center; font-size:12px; font-weight:800; overflow:hidden; flex-shrink:0; }
  .admin-apps .mini-avatar img { width:100%; height:100%; object-fit:cover; }
  .admin-apps .dept-tag { display:inline-block; padding:3px 9px; border-radius:99px; font-size:10.5px; font-weight:800; color:#fff; text-transform:capitalize; }
  .admin-apps .badge { display:inline-block; padding:4px 10px; border-radius:99px; font-size:11px; font-weight:800; text-transform:capitalize; }
  .admin-apps .view-btn { padding:7px 12px; background:var(--blue); color:#fff; border:none; border-radius:8px; font-size:11.5px; font-weight:800; }
  .admin-apps .empty { padding:60px 20px; text-align:center; color:var(--muted); font-size:13px; }
  .admin-apps .overlay { position:fixed; inset:0; background:rgba(10,20,40,.55); display:flex; align-items:center; justify-content:center; padding:20px; z-index:1000; }
  .admin-apps .modal { background:#fff; border-radius:18px; width:min(720px,100%); max-height:90vh; overflow-y:auto; box-shadow:0 30px 80px rgba(0,0,0,.25); }
  .admin-apps .modal-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:24px 26px 18px; border-bottom:1px solid var(--border); }
  .admin-apps .modal-head h2 { font-size:19px; }
  .admin-apps .modal-head p { margin-top:6px; color:var(--muted); font-size:12.5px; }
  .admin-apps .close { background:transparent; border:none; color:var(--muted); padding:6px; }
  .admin-apps .modal-body { padding:22px 26px; }
  .admin-apps .applicant-card { display:flex; align-items:center; gap:14px; padding:14px; background:#f7f9fc; border:1px solid var(--border); border-radius:12px; margin-bottom:20px; }
  .admin-apps .applicant-avatar { width:52px; height:52px; border-radius:50%; background:var(--blue); color:#fff; display:grid; place-items:center; font-size:20px; font-weight:800; overflow:hidden; flex-shrink:0; }
  .admin-apps .applicant-avatar img { width:100%; height:100%; object-fit:cover; }
  .admin-apps .applicant-name { font-size:15px; font-weight:800; color:var(--ink); }
  .admin-apps .applicant-meta { font-size:12px; color:var(--muted); margin-top:3px; }
  .admin-apps .detail-section { margin-bottom:20px; }
  .admin-apps .detail-section h3 { font-size:12px; font-weight:800; color:var(--blue); text-transform:uppercase; letter-spacing:.1em; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid var(--border); }
  .admin-apps .field-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
  .admin-apps .field label { display:block; font-size:11px; font-weight:800; color:var(--muted); margin-bottom:4px; text-transform:capitalize; }
  .admin-apps .field div { font-size:13.5px; color:var(--ink); }
  .admin-apps .doc-list { display:grid; gap:8px; }
  .admin-apps .doc { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:#f7f9fc; border:1px solid var(--border); border-radius:10px; font-size:12.5px; }
  .admin-apps .doc a { color:var(--blue); text-decoration:none; font-size:11.5px; font-weight:800; }
  .admin-apps .modal-foot { padding:18px 26px 22px; border-top:1px solid var(--border); display:flex; justify-content:flex-end; }
  .admin-apps .btn-secondary { padding:11px 20px; border-radius:10px; font-size:13px; font-weight:800; background:#fff; color:var(--blue); border:1px solid #cbd6f2; }
  @media (max-width:900px) {
    .admin-apps .stats { grid-template-columns:repeat(2,1fr); }
    .admin-apps .table-head, .admin-apps .row { grid-template-columns:1fr 1fr; }
    .admin-apps .table-head span:nth-child(n+3), .admin-apps .row > *:nth-child(n+3) { display:none; }
    .admin-apps .field-grid { grid-template-columns:1fr; }
  }
`;

const AdminApplications = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/requests/queue');
      setApps(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQueue(); }, []);

  const openApp = (id) => {
    const app = apps.find((a) => a.id === id);
    if (app) {
      setSelected(app);
    } else {
      alert('Application not found.');
    }
  };

  const filtered = apps.filter((a) => {
    if (deptFilter !== 'all' && a.department !== deptFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        String(a.reference_number || '').toLowerCase().includes(q) ||
        String(a.full_name || '').toLowerCase().includes(q) ||
        String(a.national_id || '').toLowerCase().includes(q) ||
        String(a.service_type || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const stats = {
    total: apps.length,
    homeAffairs: apps.filter((a) => a.department === 'home_affairs').length,
    otherDepts: apps.filter((a) => a.department !== 'home_affairs').length,
    completed: apps.filter((a) => a.status === 'completed').length,
  };

  return (
    <OfficerLayout
      title="All Applications"
      subtitle="Cross-department view of every citizen application submitted through the portal."
    >
      <style>{styles}</style>
      <div className="admin-apps">
        <header className="hero">
          <div>
            <div className="eyebrow"><span /> Home Affairs oversight</div>
            <h1>All Applications</h1>
            <p>Every application submitted across Home Affairs, Traffic, Finance, Pension, Police, and Passport.</p>
          </div>
          <button className="refresh" onClick={loadQueue}>↻ Refresh</button>
        </header>

        <section className="stats">
          <div className="stat"><span>Total</span><strong>{stats.total}</strong></div>
          <div className="stat"><span>Home Affairs</span><strong>{stats.homeAffairs}</strong></div>
          <div className="stat"><span>Other departments</span><strong>{stats.otherDepts}</strong></div>
          <div className="stat"><span>Completed</span><strong>{stats.completed}</strong></div>
        </section>

        <div className="filters">
          <input
            className="search"
            placeholder="Search by reference, citizen, service…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="dept-chips">
            {['all', 'home_affairs', 'traffic', 'finance', 'pension', 'police', 'passport'].map((d) => (
              <button
                key={d}
                className={`dept-chip ${deptFilter === d ? 'active' : ''}`}
                onClick={() => setDeptFilter(d)}
              >
                {d === 'all' ? 'All' : d.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {error && <div style={{ padding: 14, background: '#fbeff0', color: '#a23c3c', borderRadius: 10, marginBottom: 14 }}>⚠ {error}</div>}

        <div className="table-wrap">
          <div className="table-head">
            <span>Reference</span>
            <span>Citizen</span>
            <span>Service</span>
            <span>Department</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {loading ? (
            <div className="empty">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="empty">No applications found.</div>
          ) : (
            filtered.map((a) => (
              <div className="row" key={a.id}>
                <span className="ref">{a.reference_number}</span>
                <span className="citizen-cell">
                  <span className="mini-avatar">
                    {a.picture_data
                      ? <img src={a.picture_data} alt="" />
                      : (a.full_name || '?').charAt(0).toUpperCase()}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.full_name || a.national_id || '—'}
                  </span>
                </span>
                <span>{a.service_type}</span>
                <span>
                  <span className="dept-tag" style={{ background: DEPT_COLORS[a.department] || '#718096' }}>
                    {a.department?.replace('_', ' ')}
                  </span>
                </span>
                <span>
                  <span className="badge" style={STATUS_COLORS[a.status] || {}}>{a.status}</span>
                </span>
                <span><button className="view-btn" onClick={() => openApp(a.id)}>View →</button></span>
              </div>
            ))
          )}
        </div>

        {selected && (
          <div className="overlay" onClick={() => setSelected(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <div>
                  <h2>{selected.service_type}</h2>
                  <p>Ref: <strong>{selected.reference_number}</strong> · {selected.department?.replace('_', ' ')}</p>
                </div>
                <button className="close" onClick={() => setSelected(null)}><Icon name="close" size={20} /></button>
              </div>
              <div className="modal-body">
                <AISummaryPanel applicationId={selected.id} />
                
                <div className="applicant-card">
                  <div className="applicant-avatar">
                    {selected.picture_data
                      ? <img src={selected.picture_data} alt="" />
                      : (selected.full_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="applicant-name">{selected.full_name || '—'}</div>
                    <div className="applicant-meta">
                      {selected.national_id ? `ID: ${selected.national_id}` : ''}
                    </div>
                  </div>
                </div>

                {selected.form_data && Object.keys(selected.form_data).length > 0 && (
                  <div className="detail-section">
                    <h3>Details</h3>
                    <div className="field-grid">
                      {Object.entries(selected.form_data).map(([k, v]) => (
                        <div className="field" key={k}>
                          <label>{k.replace(/_/g, ' ')}</label>
                          <div>{String(v || '—')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selected.documents && selected.documents.length > 0 ? (
                  <div className="detail-section">
                    <h3>Supporting documents ({selected.documents.length})</h3>
                    <div className="doc-list">
                      {selected.documents.map((d) => (
                        <div className="doc" key={d.id}>
                          <span><Icon name="doc" size={14} /> <strong>{d.file_name}</strong></span>
                          <a href={d.file_data} download={d.file_name}>Download ↓</a>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="detail-section">
                    <h3>Supporting documents</h3>
                    <div style={{ padding: '14px', background: '#f7f9fc', border: '1px dashed #cbd5e1', borderRadius: '10px', color: '#718096', fontSize: '13px', textAlign: 'center' }}>
                      No supporting documents uploaded with this application.
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-foot">
                <button className="btn-secondary" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OfficerLayout>
  );
};

export default AdminApplications;