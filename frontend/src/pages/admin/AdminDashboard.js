
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OfficerLayout from '../../components/OfficerLayout';
import API from '../../utils/api';

const Icon = ({ name, size = 20 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    document: <><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4M9 12h6M9 16h6" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M15 5.5a3 3 0 0 1 0 5.8M17 14.5a5.5 5.5 0 0 1 3.5 5" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    alert: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
};

const STATUS_COLORS = {
  submitted: { background: '#ede9fe', color: '#6d28d9' },
  pending: { background: '#fef3c7', color: '#92400e' },
  review: { background: '#fef3c7', color: '#92400e' },
  in_review: { background: '#fef3c7', color: '#92400e' },
  ready: { background: '#e0f2fe', color: '#0369a1' },
  completed: { background: '#dcfce7', color: '#15803d' },
  rejected: { background: '#fee2e2', color: '#b91c1c' },
};

const styles = `
.ha-dashboard{--blue:#00209F;--green:#009543;--ink:#172235;--muted:#718096;--border:#e5e9f0;color:var(--ink);width:100%;max-width:1440px;margin:auto}
.ha-dashboard *{box-sizing:border-box}
.ha-dashboard button{font:inherit;cursor:pointer}
.ha-dashboard h1,.ha-dashboard h2,.ha-dashboard h3,.ha-dashboard p{margin:0}
.ha-dashboard .hero{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:26px}
.ha-dashboard .eyebrow{font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--blue);margin-bottom:10px}
.ha-dashboard .eyebrow span{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--green);margin-right:9px}
.ha-dashboard h1{font-size:clamp(25px,3vw,34px);color:#000;letter-spacing:-.04em}
.ha-dashboard .hero-copy p{max-width:690px;margin-top:10px;color:var(--muted);font-size:14px;line-height:1.6}
.ha-dashboard .primary-button,.ha-dashboard .secondary-button{display:inline-flex;align-items:center;justify-content:center;gap:9px;border-radius:10px;font-size:13px;font-weight:800;white-space:nowrap}
.ha-dashboard .primary-button{min-height:44px;padding:0 18px;color:white;border:1px solid var(--blue);background:var(--blue)}
.ha-dashboard .primary-button:hover{background:#00166f}
.ha-dashboard .secondary-button{min-height:34px;padding:0 12px;color:var(--blue);border:1px solid #cbd6f2;background:white}
.ha-dashboard .stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:22px}
.ha-dashboard .stat-card,.ha-dashboard .panel,.ha-dashboard .action-card{border:1px solid var(--border);border-radius:15px;background:white;box-shadow:0 7px 20px #14233c0b}
.ha-dashboard .stat-card{padding:20px;min-height:132px;position:relative;overflow:hidden}
.ha-dashboard .stat-top{display:flex;justify-content:space-between;align-items:center}
.ha-dashboard .stat-icon,.ha-dashboard .action-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:11px;color:var(--blue);background:#edf2ff}
.ha-dashboard .stat-trend{font-size:11px;font-weight:800;color:var(--green)}
.ha-dashboard .stat-label{display:block;margin-top:17px;color:var(--muted);font-size:12px;font-weight:700}
.ha-dashboard .stat-value{display:block;margin-top:5px;font-size:30px;color:#000;letter-spacing:-.05em}
.ha-dashboard .overview-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(280px,.85fr);gap:18px;margin-bottom:26px}
.ha-dashboard .panel{min-width:0}
.ha-dashboard .panel-header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:20px 22px 0}
.ha-dashboard .panel-header h2{font-size:17px;color:#000}
.ha-dashboard .panel-header p{font-size:12px;color:var(--muted);margin-top:5px}
.ha-dashboard .chart-panel{min-height:350px;overflow:hidden}
.ha-dashboard .chart-area{padding:20px 22px}
.ha-dashboard .chart-legend{display:flex;flex-wrap:wrap;gap:18px;margin-bottom:14px;color:var(--muted);font-size:11px;font-weight:700}
.ha-dashboard .legend-item{display:inline-flex;align-items:center;gap:6px}
.ha-dashboard .legend-dot{width:8px;height:8px;border-radius:50%}
.ha-dashboard .legend-dot.pending{background:#000}
.ha-dashboard .legend-dot.review{background:var(--blue)}
.ha-dashboard .legend-dot.completed{background:var(--green)}
.ha-dashboard .bar-chart{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:end;gap:20px;height:155px;padding:8px 10px 0;border-bottom:1px solid var(--border);background:repeating-linear-gradient(to bottom,transparent 0,transparent 45px,#f0f3f7 46px)}
.ha-dashboard .bar-group{display:flex;align-items:flex-end;justify-content:center;gap:7px;height:100%}
.ha-dashboard .bar{width:25px;max-height:147px;min-height:4px;border-radius:6px 6px 0 0;transition:height .3s}
.ha-dashboard .bar.pending{background:#000}
.ha-dashboard .bar.review{background:var(--blue)}
.ha-dashboard .bar.completed{background:var(--green)}
.ha-dashboard .bar-labels{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));padding:9px 10px 0;color:var(--muted);font-size:11px;font-weight:700;text-align:center}
.ha-dashboard .distribution{min-height:310px}
.ha-dashboard .distribution-body{display:flex;align-items:center;justify-content:center;gap:24px;padding:25px 18px}
.ha-dashboard .donut{position:relative;display:grid;place-items:center;flex:0 0 auto;width:145px;height:145px;border-radius:50%}
.ha-dashboard .donut:after{content:'';width:98px;height:98px;border-radius:50%;background:white}
.ha-dashboard .donut-center{position:absolute;z-index:1;display:grid;text-align:center}
.ha-dashboard .donut-center strong{font-size:27px;color:#000}
.ha-dashboard .donut-center span{font-size:10px;color:var(--muted)}
.ha-dashboard .distribution-list{display:grid;gap:14px;min-width:105px}
.ha-dashboard .distribution-item{display:grid;grid-template-columns:9px 1fr auto;align-items:center;gap:8px;font-size:12px}
.ha-dashboard .distribution-item i{width:9px;height:9px;border-radius:50%}
.ha-dashboard .distribution-item span{color:var(--muted)}
.ha-dashboard .section-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin:26px 0 13px}
.ha-dashboard .section-heading h2{font-size:18px;color:#000}
.ha-dashboard .section-heading p{font-size:12px;color:var(--muted);margin-top:5px}
.ha-dashboard .action-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.ha-dashboard .action-card{position:relative;display:flex;align-items:flex-start;gap:14px;min-height:115px;padding:20px 18px;text-align:left;color:inherit}
.ha-dashboard .action-card:hover{border-color:#b8c7eb;transform:translateY(-2px)}
.ha-dashboard .action-card h3{font-size:14px;color:#000}
.ha-dashboard .action-card p{font-size:12px;color:var(--muted);line-height:1.5;margin-top:6px}
.ha-dashboard .action-card.danger .action-icon{color:#bd4545;background:#fff1f1}
.ha-dashboard .table-panel{overflow-x:auto;padding:4px}
.ha-dashboard .table-panel table{width:100%;min-width:650px;border-collapse:collapse;font-size:13px}
.ha-dashboard .table-panel th{padding:14px 16px;text-align:left;background:#f7f9fc;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em}
.ha-dashboard .table-panel td{padding:15px 16px;border-bottom:1px solid #f0f2f5}
.ha-dashboard .empty-state{display:flex;align-items:center;justify-content:center;min-height:115px;padding:30px;color:var(--muted);font-size:13px;text-align:center}
@media(max-width:1100px){.ha-dashboard .overview-grid{grid-template-columns:1fr}}
@media(max-width:980px){.ha-dashboard .stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ha-dashboard .action-grid{grid-template-columns:1fr}}
@media(max-width:700px){.ha-dashboard .hero{align-items:stretch;flex-direction:column}.ha-dashboard .hero .primary-button{width:100%}.ha-dashboard .section-heading{align-items:flex-start;flex-direction:column}}
@media(max-width:500px){.ha-dashboard .distribution-body{flex-direction:column}.ha-dashboard .distribution-list{width:100%}.ha-dashboard .stat-card{padding:14px}.ha-dashboard .stat-value{font-size:25px}}

.ha-dashboard{padding-bottom:32px}
.ha-dashboard .hero{position:relative;overflow:hidden;align-items:center;min-height:188px;padding:30px 32px;margin-bottom:24px;border:1px solid #00166f;border-radius:22px;background:linear-gradient(118deg,#00145f 0%,#00209f 58%,#003bb8 100%);box-shadow:0 18px 40px rgba(0,32,159,.18)}
.ha-dashboard .hero:after{content:'';position:absolute;right:-90px;bottom:-120px;width:310px;height:310px;border:44px solid rgba(0,149,67,.35);border-radius:50%}
.ha-dashboard .hero-copy{position:relative;z-index:1}
.ha-dashboard .hero .eyebrow{color:#b9f3d0;margin-bottom:12px}
.ha-dashboard .hero .eyebrow span{background:#20c778;box-shadow:0 0 0 5px rgba(32,199,120,.18)}
.ha-dashboard .hero h1{color:#fff;font-size:clamp(28px,3.2vw,42px);letter-spacing:-.055em}
.ha-dashboard .hero-copy p{color:rgba(255,255,255,.78);max-width:710px}
.ha-dashboard .hero .primary-button{position:relative;z-index:1;color:#063d22;border-color:#7ce4ad;background:#baf4d2;box-shadow:0 8px 18px rgba(0,0,0,.16)}
.ha-dashboard .hero .primary-button:hover{color:#fff;border-color:#009543;background:#009543}
.ha-dashboard .stat-card{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
.ha-dashboard .stat-card:before{position:absolute;top:0;left:0;right:0;height:4px;content:'';background:#00209f}
.ha-dashboard .stat-card:nth-child(2):before{background:#000}
.ha-dashboard .stat-card:nth-child(3):before,.ha-dashboard .stat-card:nth-child(4):before{background:#009543}
.ha-dashboard .stat-card:hover{transform:translateY(-4px);border-color:#c6d3f4;box-shadow:0 15px 28px rgba(20,35,60,.11)}
.ha-dashboard .stat-icon{background:#edf2ff;box-shadow:inset 0 0 0 1px #dbe5ff}
.ha-dashboard .stat-card:nth-child(2) .stat-icon{color:#000;background:#f1f1f1}
.ha-dashboard .stat-card:nth-child(3) .stat-icon,.ha-dashboard .stat-card:nth-child(4) .stat-icon{color:#007b39;background:#eaf8f1}
.ha-dashboard .panel,.ha-dashboard .action-card{box-shadow:0 10px 26px rgba(20,35,60,.06)}
.ha-dashboard .panel-header h2,.ha-dashboard .section-heading h2{letter-spacing:-.035em}
.ha-dashboard .chart-panel,.ha-dashboard .distribution{background:linear-gradient(180deg,#fff 0%,#fbfdff 100%)}
.ha-dashboard .action-card{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
.ha-dashboard .action-card:hover{transform:translateY(-4px);border-color:#9bb3ee;box-shadow:0 14px 26px rgba(0,32,159,.1)}
.ha-dashboard .action-card:after{position:absolute;right:18px;bottom:16px;width:34px;height:3px;content:'';border-radius:99px;background:#009543}
.ha-dashboard .table-panel{box-shadow:0 10px 26px rgba(20,35,60,.06)}
.ha-dashboard .table-panel th{background:#00209f;color:#fff}
.ha-dashboard .table-panel tr:hover td{background:#f5f8ff}
`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await API.get('/requests/queue');
      if (!Array.isArray(response.data)) {
        throw new Error('The queue API did not return an array.');
      }
      setApps(response.data);
    } catch (err) {
      console.error('Failed to load dashboard queue:', {
        message: err.message,
        code: err.code,
        status: err.response?.status,
        response: err.response?.data,
        url: err.config?.url,
      });

      setError(
        err.code === 'ECONNABORTED'
          ? 'The application queue timed out. Check the backend logs and database query.'
          : err.response?.data?.message ||
            `Failed to load applications: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const metrics = useMemo(() => ({
    pending: apps.filter(a => ['submitted', 'pending'].includes(a.status)).length,
    review: apps.filter(a => ['review', 'in_review'].includes(a.status)).length,
    completed: apps.filter(a => a.status === 'completed').length,
  }), [apps]);

  const graphMax = Math.max(metrics.pending, metrics.review, metrics.completed, 1);
  const graphHeight = value =>
    `${Math.max(4, Math.round((value / graphMax) * 145))}px`;

  const totalForDonut = apps.length || 1;
  const pPending = Math.round(metrics.pending / totalForDonut * 100);
  const pReview = Math.round(metrics.review / totalForDonut * 100);
  const donutGradient = `conic-gradient(#000 0 ${pPending}%, #00209F ${pPending}% ${pPending + pReview}%, #009543 ${pPending + pReview}% 100%)`;

  const stats = [
    { title: 'Total applications', value: apps.length, icon: 'document', trend: 'All departments' },
    { title: 'Pending', value: metrics.pending, icon: 'clock', trend: 'Needs action' },
    { title: 'In review', value: metrics.review, icon: 'document', trend: 'Active queue' },
    { title: 'Completed', value: metrics.completed, icon: 'check', trend: 'Processed' },
  ];

  const recent = [...apps]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);

  return (
    <OfficerLayout title="Home Affairs">
      <style>{styles}</style>

      <div className="ha-dashboard">
        <header className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span />Operations overview</div>
            <h1>Home Affairs Administration</h1>
            <p>
              Oversee applications across government departments, manage access
              control, and record critical citizen events.
            </p>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() => navigate('/home-affairs/applications')}
          >
            Manage requests <Icon name="arrow" size={17} />
          </button>
        </header>

        {error && (
          <div role="alert" style={{
            padding: 14, background: '#fff1f1', color: '#a23c3c',
            borderRadius: 10, marginBottom: 20,
          }}>
            ⚠ {error}
            <button
              type="button"
              onClick={loadDashboard}
              style={{ marginLeft: 12, padding: '5px 10px' }}
            >
              Retry
            </button>
          </div>
        )}

        <section className="stat-grid" aria-label="Key performance indicators">
          {stats.map(stat => (
            <article className="stat-card" key={stat.title}>
              <div className="stat-top">
                <span className="stat-icon"><Icon name={stat.icon} size={19} /></span>
                <span className="stat-trend">{stat.trend}</span>
              </div>
              <span className="stat-label">{stat.title}</span>
              <strong className="stat-value">{loading ? '—' : stat.value}</strong>
            </article>
          ))}
        </section>

        <section className="overview-grid">
          <article className="panel chart-panel">
            <div className="panel-header">
              <div>
                <h2>Application overview</h2>
                <p>Current workload by processing stage</p>
              </div>
              <span className="secondary-button">Live data</span>
            </div>

            <div className="chart-area">
              <div className="chart-legend">
                <span className="legend-item"><i className="legend-dot pending" />Pending</span>
                <span className="legend-item"><i className="legend-dot review" />In review</span>
                <span className="legend-item"><i className="legend-dot completed" />Completed</span>
              </div>

              <div className="bar-chart" aria-label="Applications by status">
                {[0, 1, 2].map((group) => (
                  <div className="bar-group" key={group}>
                    <div className="bar pending" style={{ height: graphHeight(metrics.pending) }} />
                    <div className="bar review" style={{
                      height: graphHeight(group === 1 ? apps.length : metrics.review),
                    }} />
                    <div className="bar completed" style={{ height: graphHeight(metrics.completed) }} />
                  </div>
                ))}
              </div>

              <div className="bar-labels">
                <span>Requests</span>
                <span>Department load</span>
                <span>Current total</span>
              </div>
            </div>
          </article>

          <article className="panel distribution">
            <div className="panel-header">
              <div>
                <h2>Status mix</h2>
                <p>Application distribution</p>
              </div>
            </div>

            <div className="distribution-body">
              <div className="donut" style={{ background: donutGradient }}>
                <div className="donut-center">
                  <strong>{apps.length}</strong>
                  <span>applications</span>
                </div>
              </div>

              <div className="distribution-list">
                <div className="distribution-item">
                  <i style={{ background: '#000' }} /><span>Pending</span>
                  <strong>{metrics.pending}</strong>
                </div>
                <div className="distribution-item">
                  <i style={{ background: '#00209F' }} /><span>Review</span>
                  <strong>{metrics.review}</strong>
                </div>
                <div className="distribution-item">
                  <i style={{ background: '#009543' }} /><span>Done</span>
                  <strong>{metrics.completed}</strong>
                </div>
              </div>
            </div>
          </article>
        </section>

        <div className="section-heading">
          <div>
            <h2>Administration shortcuts</h2>
            <p>Frequently used tools for managing the public service system.</p>
          </div>
        </div>

        <section className="action-grid" aria-label="Administration shortcuts">
          <button className="action-card" type="button" onClick={() => navigate('/home-affairs/verify')}>
            <span className="action-icon"><Icon name="users" /></span>
            <span><h3>Citizen Directory</h3><p>View registered citizens and their status.</p></span>
          </button>

          <button className="action-card" type="button" onClick={() => navigate('/home-affairs/applications')}>
            <span className="action-icon"><Icon name="document" /></span>
            <span><h3>All applications</h3><p>Monitor submissions across departments.</p></span>
          </button>

          <button className="action-card" type="button" onClick={() => navigate('/home-affairs/access')}>
            <span className="action-icon"><Icon name="lock" /></span>
            <span><h3>Access control</h3><p>Manage authorized departmental information access.</p></span>
          </button>

          <button className="action-card danger" type="button" onClick={() => navigate('/home-affairs/report-death')}>
            <span className="action-icon"><Icon name="alert" /></span>
            <span><h3>Report death</h3><p>Record a death notification and process related requests.</p></span>
          </button>
        </section>

        <div className="section-heading">
          <div>
            <h2>Recent applications</h2>
            <p>Latest submissions across government departments.</p>
          </div>
          <button className="secondary-button" type="button" onClick={loadDashboard} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        <section className="panel table-panel">
          {loading ? (
            <div className="empty-state">Loading applications…</div>
          ) : recent.length === 0 ? (
            <div className="empty-state">No applications found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Citizen</th>
                  <th>Service</th>
                  <th>Department</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(a => {
                  const statusStyle = STATUS_COLORS[a.status] || {
                    background: '#f3f4f6', color: '#374151',
                  };

                  return (
                    <tr key={a.service_request_id || a.id || a.reference_number}>
                      <td style={{ fontWeight: 800, color: '#00209F' }}>
                        {a.reference_number}
                      </td>
                      <td>
                        {a.citizen_name || a.full_name || a.national_id ||
                          a.citizen_username || a.user_id || '—'}
                      </td>
                      <td>{a.service_type}</td>
                      <td style={{ textTransform: 'capitalize' }}>
                        {a.department?.replace(/_/g, ' ') || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{
                          ...statusStyle, padding: '4px 10px',
                          borderRadius: 99, fontSize: 11,
                          fontWeight: 800, textTransform: 'capitalize',
                        }}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </OfficerLayout>
  );
};

export default AdminDashboard;
