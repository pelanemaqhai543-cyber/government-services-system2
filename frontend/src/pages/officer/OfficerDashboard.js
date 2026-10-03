import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import OfficerLayout from '../../components/OfficerLayout';
import RequestTable from '../../components/RequestTable';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const SERVICE_INFO = {
  traffic: { name: 'Traffic', description: "Manage driver's licence and vehicle services.", code: 'TR' },
  finance: { name: 'Finance', description: 'Manage tax and revenue related services.', code: 'FN' },
  pension: { name: 'Pension', description: 'Manage pension applications and eligibility.', code: 'PN' },
  police: { name: 'Police', description: 'Manage police clearance and background checks.', code: 'PL' },
  passport: { name: 'Passport', description: 'Manage passport applications and renewals.', code: 'PP' },
};

const Icon = ({ name, size = 20 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    document: <><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4M9 12h6M9 16h6" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v6h6M12 7v5l3 2" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

const styles = `
  .officer-page { --blue:#00209F; --blue-dark:#00166f; --blue-soft:#edf2ff; --green:#009543; --green-dark:#007936; --green-soft:#eaf8f0; --black:#000; --ink:#172235; --muted:#718096; --border:#e5e9f0; --white:#fff; width:min(100%,1440px); margin:0 auto; padding:0 2px; color:var(--ink); }
  .officer-page * { box-sizing:border-box; }.officer-page button { font:inherit; cursor:pointer; }.officer-page h1,.officer-page h2,.officer-page h3,.officer-page p { margin:0; }
  .officer-page .hero { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; margin-bottom:28px; }.officer-page .department-heading { display:flex; align-items:center; gap:15px; min-width:0; }.officer-page .department-badge { display:grid; flex:0 0 auto; place-items:center; width:56px; height:56px; color:var(--white); border-radius:15px; background:var(--blue); font-size:14px; font-weight:900; box-shadow:0 8px 18px rgba(0,32,159,.18); }.officer-page .eyebrow { display:flex; align-items:center; gap:9px; margin-bottom:9px; color:var(--blue); font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }.officer-page .eyebrow span { width:8px; height:8px; border-radius:50%; background:var(--green); box-shadow:0 0 0 5px var(--green-soft); }.officer-page h1 { color:var(--black); font-size:clamp(25px,3vw,34px); line-height:1.1; letter-spacing:-.04em; }.officer-page .hero p { margin-top:9px; color:var(--muted); font-size:14px; line-height:1.5; }.officer-page .primary-button,.officer-page .secondary-button { display:inline-flex; align-items:center; justify-content:center; gap:8px; border-radius:10px; font-size:13px; font-weight:800; white-space:nowrap; }.officer-page .primary-button { min-height:44px; padding:0 17px; color:var(--white); border:1px solid var(--blue); background:var(--blue); box-shadow:0 8px 18px rgba(0,32,159,.18); }.officer-page .primary-button:hover { background:var(--blue-dark); }.officer-page .secondary-button { min-height:36px; padding:0 13px; color:var(--blue); border:1px solid #cbd6f2; background:var(--white); }.officer-page .secondary-button:hover { background:var(--blue-soft); }
  .officer-page .stats-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin-bottom:22px; }.officer-page .stat-card { position:relative; overflow:hidden; min-height:130px; padding:19px; border:1px solid var(--border); border-radius:16px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.05); }.officer-page .stat-card::after { position:absolute; right:-34px; bottom:-48px; width:120px; height:120px; content:''; border-radius:50%; background:var(--blue-soft); }.officer-page .stat-card:nth-child(3)::after { background:var(--green-soft); }.officer-page .stat-card:nth-child(4)::after { background:#f2f2f2; }.officer-page .stat-icon { position:relative; z-index:1; display:grid; place-items:center; width:38px; height:38px; color:var(--blue); border-radius:11px; background:var(--blue-soft); }.officer-page .stat-card:nth-child(4) .stat-icon { color:var(--green); background:var(--green-soft); }.officer-page .stat-label { position:relative; z-index:1; display:block; margin-top:17px; color:var(--muted); font-size:11px; font-weight:700; }.officer-page .stat-value { position:relative; z-index:1; display:block; margin-top:4px; color:var(--black); font-size:29px; line-height:1; letter-spacing:-.05em; }
  .officer-page .overview-grid { display:grid; grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr); gap:18px; margin-bottom:26px; }.officer-page .panel { min-width:0; border:1px solid var(--border); border-radius:16px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.045); }.officer-page .panel-header { padding:20px 22px 0; }.officer-page .panel-header h2 { color:var(--black); font-size:17px; letter-spacing:-.02em; }.officer-page .panel-header p { margin-top:5px; color:var(--muted); font-size:12px; }.officer-page .chart-area { padding:22px; }.officer-page .legend { display:flex; gap:17px; margin-bottom:13px; color:var(--muted); font-size:11px; font-weight:700; }.officer-page .legend span { display:inline-flex; align-items:center; gap:6px; }.officer-page .legend i { width:8px; height:8px; border-radius:50%; }.officer-page .legend .pending { background:var(--blue); }.officer-page .legend .review { background:var(--black); }.officer-page .legend .ready { background:var(--green); }.officer-page .bar-chart { display:grid; grid-template-columns:repeat(4,1fr); align-items:end; gap:14px; height:160px; padding:8px 6px 0; border-bottom:1px solid var(--border); background:repeating-linear-gradient(to bottom,transparent 0,transparent 38px,#f0f2f5 39px); }.officer-page .bar-group { display:flex; align-items:flex-end; justify-content:center; gap:6px; height:100%; }.officer-page .bar { width:22px; min-height:8px; border-radius:6px 6px 0 0; }.officer-page .bar.pending { background:var(--blue); }.officer-page .bar.review { background:var(--black); }.officer-page .bar.ready { background:var(--green); }.officer-page .bar-labels { display:grid; grid-template-columns:repeat(4,1fr); padding-top:9px; color:var(--muted); font-size:10px; font-weight:700; text-align:center; }.officer-page .summary { display:flex; flex-direction:column; min-height:280px; }.officer-page .summary-body { display:flex; flex:1; align-items:center; justify-content:center; gap:17px; padding:20px; }.officer-page .ring { position:relative; display:grid; place-items:center; width:140px; height:140px; flex:0 0 auto; border-radius:50%; }.officer-page .ring::after { width:96px; height:96px; content:''; border-radius:50%; background:var(--white); }.officer-page .ring-copy { position:absolute; z-index:1; display:grid; text-align:center; }.officer-page .ring-copy strong { font-size:26px; letter-spacing:-.05em; }.officer-page .ring-copy span { color:var(--muted); font-size:10px; font-weight:700; }.officer-page .summary-note { max-width:115px; color:var(--muted); font-size:11px; line-height:1.45; }.officer-page .summary-note strong { display:block; margin-bottom:4px; color:var(--ink); font-size:13px; }
  .officer-page .section-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:15px; margin:25px 0 13px; }.officer-page .section-heading h2 { color:var(--black); font-size:18px; letter-spacing:-.03em; }.officer-page .section-heading p { margin-top:5px; color:var(--muted); font-size:12px; }.officer-page .action-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }.officer-page .action-card { display:flex; align-items:flex-start; gap:13px; min-height:112px; padding:17px; color:inherit; text-align:left; border:1px solid var(--border); border-radius:14px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.04); transition:.2s ease; }.officer-page .action-card:hover { transform:translateY(-2px); border-color:#c5d2ed; }.officer-page .action-icon { display:grid; flex:0 0 auto; place-items:center; width:40px; height:40px; color:var(--blue); border-radius:11px; background:var(--blue-soft); }.officer-page .action-card:nth-child(2) .action-icon { color:var(--black); background:#f2f2f2; }.officer-page .action-card:nth-child(3) .action-icon { color:var(--green); background:var(--green-soft); }.officer-page .action-card h3 { font-size:14px; }.officer-page .action-card p { margin-top:6px; color:var(--muted); font-size:11px; line-height:1.45; }.officer-page .queue-panel { overflow:auto; padding:4px; }.officer-page .queue-panel > * { min-width:650px; }.officer-page .empty-state { padding:42px 20px; color:var(--muted); text-align:center; font-size:13px; }
  @media (max-width:980px) { .officer-page .stats-grid { grid-template-columns:repeat(2,1fr); }.officer-page .overview-grid { grid-template-columns:1fr; }.officer-page .action-grid { grid-template-columns:1fr; } }
  @media (max-width:620px) { .officer-page { padding:0; }.officer-page .hero { align-items:stretch; flex-direction:column; }.officer-page .primary-button { width:100%; }.officer-page .department-heading { align-items:flex-start; }.officer-page .department-badge { width:48px; height:48px; }.officer-page .stats-grid { gap:9px; }.officer-page .stat-card { min-height:116px; padding:14px; }.officer-page .stat-value { font-size:24px; }.officer-page .panel-header,.officer-page .chart-area { padding-left:16px; padding-right:16px; }.officer-page .bar-chart { gap:8px; }.officer-page .bar { width:16px; }.officer-page .summary-body { flex-direction:column; }.officer-page .summary-note { max-width:220px; text-align:center; }.officer-page .section-heading { align-items:flex-start; flex-direction:column; } }
`;

const OfficerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const department = user?.role;
  const departmentInfo = SERVICE_INFO[department] || { name: 'Department', description: 'Government department services.', code: 'DP' };

  const loadRequests = async () => {
    try { setLoading(true); const response = await API.get('/requests/queue'); setRequests(response.data || []); }
    catch (error) { console.error('Failed to load department requests:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadRequests(); }, [department]);

  const metrics = useMemo(() => ({
    submitted: requests.filter((item) => ['submitted', 'pending'].includes(item.status)).length,
    review: requests.filter((item) => ['review', 'in_review'].includes(item.status)).length,
    ready: requests.filter((item) => item.status === 'ready').length,
    completed: requests.filter((item) => item.status === 'completed').length,
  }), [requests]);
  const chartMax = Math.max(metrics.submitted, metrics.review, metrics.ready, metrics.completed, 1);
  const barHeight = (value) => `${Math.max(10, Math.round((value / chartMax) * 135))}px`;
  const completionPercent = requests.length ? Math.round((metrics.completed / requests.length) * 100) : 0;

  const handleStatusChange = async (requestId, status) => {
    try { await API.put(`/requests/${requestId}/status`, { status }); setRequests((current) => current.map((request) => request.id === requestId ? { ...request, status } : request)); }
    catch (error) { console.error('Unable to update request:', error); }
  };

  const stats = [
    { label: 'Total applications', value: requests.length, icon: 'document' },
    { label: 'Pending', value: metrics.submitted, icon: 'clock' },
    { label: 'In review', value: metrics.review, icon: 'search' },
    { label: 'Completed', value: metrics.completed, icon: 'check' },
  ];

  return (
    <OfficerLayout title={`${departmentInfo.name} Department`}>
      <style>{styles}</style>
      <div className="officer-page">
        <header className="hero"><div className="department-heading"><span className="department-badge">{departmentInfo.code}</span><div><div className="eyebrow"><span /> Department workspace</div><h1>{departmentInfo.name} Department</h1><p>{departmentInfo.description}</p></div></div><button className="primary-button" type="button" onClick={() => navigate('/officer/search')}>Search citizen <Icon name="search" size={16} /></button></header>

        <section className="stats-grid" aria-label="Department application metrics">{stats.map((stat) => <article className="stat-card" key={stat.label}><span className="stat-icon"><Icon name={stat.icon} size={19} /></span><span className="stat-label">{stat.label}</span><strong className="stat-value">{loading ? '—' : stat.value}</strong></article>)}</section>

        <section className="overview-grid" aria-label="Department overview"><article className="panel"><div className="panel-header"><h2>Application overview</h2><p>Current workload by processing stage</p></div><div className="chart-area"><div className="legend"><span><i className="pending" />Pending</span><span><i className="review" />In review</span><span><i className="ready" />Ready</span></div><div className="bar-chart">{[[metrics.submitted,metrics.review,metrics.ready],[metrics.review,metrics.ready,metrics.completed],[metrics.submitted,metrics.ready,metrics.completed],[metrics.completed,metrics.review,metrics.submitted]].map((group,index) => <div className="bar-group" key={index}>{group.map((value,barIndex) => <div className={`bar ${['pending','review','ready'][barIndex]}`} style={{ height: barHeight(value) }} key={`${index}-${barIndex}`} />)}</div>)}</div><div className="bar-labels"><span>Queue</span><span>Review</span><span>Ready</span><span>Completed</span></div></div></article><article className="panel summary"><div className="panel-header"><h2>Completion rate</h2><p>Department progress</p></div><div className="summary-body"><div className="ring" style={{ background: `conic-gradient(var(--green) 0 ${completionPercent}%, var(--blue-soft) ${completionPercent}% 100%)` }}><div className="ring-copy"><strong>{completionPercent}%</strong><span>complete</span></div></div><p className="summary-note"><strong>Service progress</strong>{requests.length ? `${metrics.completed} of ${requests.length} applications completed.` : 'No applications are currently in the queue.'}</p></div></article></section>

        <div className="section-heading"><div><h2>Department services</h2><p>Access services available to the {departmentInfo.name} department.</p></div></div><section className="action-grid"><button className="action-card" type="button" onClick={() => navigate('/officer/requests')}><span className="action-icon"><Icon name="document" /></span><span><h3>Process applications</h3><p>Review and process department applications.</p></span></button><button className="action-card" type="button" onClick={() => navigate('/officer/search')}><span className="action-icon"><Icon name="search" /></span><span><h3>Search citizens</h3><p>Find authorized citizen information.</p></span></button><button className="action-card" type="button" onClick={() => navigate('/officer/history')}><span className="action-icon"><Icon name="history" /></span><span><h3>Application history</h3><p>View previously processed applications.</p></span></button></section>

        <div className="section-heading"><div><h2>Application queue</h2><p>Applications available to your department.</p></div><button className="secondary-button" type="button" onClick={() => navigate('/officer/requests')}>View all <Icon name="arrow" size={14} /></button></div><section className="panel queue-panel">{loading ? <div className="empty-state">Loading applications...</div> : requests.length === 0 ? <div className="empty-state">No applications are currently available.</div> : <RequestTable requests={requests.slice(0,6)} showDepartment={false} onStatusChange={handleStatusChange} />}</section>
      </div>
    </OfficerLayout>
  );
};

export default OfficerDashboard;
