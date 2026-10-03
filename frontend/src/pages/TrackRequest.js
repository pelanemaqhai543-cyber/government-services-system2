import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import API from '../utils/api';

const STATUS_LABELS = { submitted: 'Submitted', pending: 'Pending', review: 'Under review', in_review: 'Under review', ready: 'Ready for pickup', rejected: 'Rejected', completed: 'Completed' };

const Icon = ({ name, size = 18 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    search: <><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    document: <><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4M9 12h6M9 16h6" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

const styles = `
  .track-page { --blue:#00209F; --blue-dark:#00166f; --blue-soft:#edf2ff; --green:#009543; --green-dark:#007936; --green-soft:#eaf8f0; --black:#000; --ink:#172235; --muted:#718096; --border:#e5e9f0; --white:#fff; width:min(100%,1440px); margin:0 auto; padding:0 2px; color:var(--ink); }.track-page * { box-sizing:border-box; }.track-page button,.track-page input { font:inherit; }.track-page button { cursor:pointer; }.track-page h1,.track-page h2,.track-page p { margin:0; }
  .track-page .hero { display:flex; align-items:flex-end; justify-content:space-between; gap:22px; margin-bottom:25px; }.track-page .eyebrow { display:flex; align-items:center; gap:9px; margin-bottom:9px; color:var(--blue); font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }.track-page .eyebrow span { width:8px; height:8px; border-radius:50%; background:var(--green); box-shadow:0 0 0 5px var(--green-soft); }.track-page h1 { color:var(--black); font-size:clamp(25px,3vw,34px); line-height:1.1; letter-spacing:-.04em; }.track-page .hero p { margin-top:9px; color:var(--muted); font-size:14px; line-height:1.55; }.track-page .search-wrap { position:relative; width:270px; }.track-page .search-wrap svg { position:absolute; top:50%; left:14px; color:var(--blue); transform:translateY(-50%); }.track-page .search { width:100%; min-height:42px; padding:0 14px 0 41px; color:var(--ink); border:1px solid var(--border); border-radius:10px; outline:none; background:var(--white); font-size:12px; }.track-page .search:focus { border-color:#a9bde9; box-shadow:0 0 0 3px var(--blue-soft); }
  .track-page .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:13px; margin-bottom:20px; }.track-page .summary-card { display:flex; align-items:center; gap:11px; min-height:83px; padding:15px; border:1px solid var(--border); border-radius:14px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.04); }.track-page .summary-icon { display:grid; place-items:center; width:36px; height:36px; color:var(--blue); border-radius:10px; background:var(--blue-soft); }.track-page .summary-card:nth-child(3) .summary-icon,.track-page .summary-card:nth-child(4) .summary-icon { color:var(--green); background:var(--green-soft); }.track-page .summary-card span { display:block; color:var(--muted); font-size:10px; font-weight:700; }.track-page .summary-card strong { display:block; margin-top:3px; color:var(--black); font-size:22px; }
  .track-page .timeline-panel { padding:21px; border:1px solid var(--border); border-radius:16px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.045); }.track-page .panel-header { display:flex; align-items:flex-end; justify-content:space-between; gap:15px; padding-bottom:14px; border-bottom:1px solid #f0f2f5; }.track-page .panel-header h2 { color:var(--black); font-size:17px; }.track-page .panel-header p { margin-top:5px; color:var(--muted); font-size:11px; }.track-page .result-count { color:var(--blue); font-size:11px; font-weight:800; }.track-page .timeline { position:relative; display:grid; gap:14px; padding:20px 0 4px; }.track-page .timeline::before { position:absolute; top:28px; bottom:28px; left:15px; width:1px; content:''; background:#cbd6f2; }.track-page .timeline-item { position:relative; display:flex; align-items:flex-start; gap:14px; }.track-page .dot { z-index:1; flex:0 0 auto; width:31px; height:31px; display:grid; place-items:center; color:var(--blue); border:1px solid #cbd6f2; border-radius:50%; background:var(--white); }.track-page .timeline-item.completed .dot { color:var(--white); border-color:var(--green); background:var(--green); }.track-page .timeline-card { flex:1; min-width:0; padding:15px 17px; border:1px solid var(--border); border-radius:13px; background:#fbfcff; }.track-page .timeline-card:hover { border-color:#b9c9ee; }.track-page .timeline-header { display:flex; align-items:center; justify-content:space-between; gap:12px; }.track-page .timeline-title { color:var(--black); font-size:13px; font-weight:800; }.track-page .timeline-sub { margin-top:6px; color:var(--muted); font-size:11px; }.track-page .empty { padding:48px 15px; color:var(--muted); text-align:center; font-size:12px; }.track-page .empty-icon { display:grid; place-items:center; width:42px; height:42px; margin:0 auto 10px; color:var(--blue); border-radius:12px; background:var(--blue-soft); }
  .track-main { min-width:0; width:calc(100% - 240px); min-height:100vh; margin-left:240px; padding:32px 40px; }.track-main .track-page { max-width:1440px; }
  @media (max-width:900px) { .track-page .summary-grid { grid-template-columns:repeat(2,1fr); } }.track-page .track-main { width:100%; }
  @media (max-width:600px) { .track-main { width:100%; margin-left:0; padding:22px 16px 32px; }.track-page { padding:0; }.track-page .hero { align-items:stretch; flex-direction:column; }.track-page .search-wrap { width:100%; }.track-page .summary-grid { gap:9px; }.track-page .summary-card { align-items:flex-start; flex-direction:column; gap:7px; min-height:105px; padding:12px; }.track-page .panel-header { align-items:flex-start; flex-direction:column; }.track-page .timeline-header { align-items:flex-start; flex-direction:column; gap:7px; } }
`;

const TrackRequest = () => {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/requests/my').then((response) => setRequests(Array.isArray(response.data) ? response.data : [])).catch(() => setRequests([]));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((request) => !query || String(request.service_type || '').toLowerCase().includes(query) || String(request.reference_number || '').toLowerCase().includes(query));
  }, [requests, search]);

  const completed = requests.filter((request) => request.status === 'completed').length;
  const active = requests.filter((request) => ['submitted', 'pending', 'review', 'in_review', 'ready'].includes(request.status)).length;
  const rejected = requests.filter((request) => request.status === 'rejected').length;
  const summary = [{ label: 'Total requests', value: requests.length, icon: 'document' }, { label: 'In progress', value: active, icon: 'clock' }, { label: 'Completed', value: completed, icon: 'check' }, { label: 'Rejected', value: rejected, icon: 'document' }];

  return <div style={layoutStyles.layout}><Sidebar /><main className="track-main"><style>{styles}</style><div className="track-page">
    <header className="hero"><div><div className="eyebrow"><span /> Application tracking</div><h1>Track your requests</h1><p>Follow the progress of your government applications and see the latest status updates.</p></div><div className="search-wrap"><Icon name="search" size={17} /><input className="search" placeholder="Search by service or reference" value={search} onChange={(event) => setSearch(event.target.value)} /></div></header>
    <section className="summary-grid" aria-label="Request summary">{summary.map((card) => <article className="summary-card" key={card.label}><span className="summary-icon"><Icon name={card.icon} size={17} /></span><span><span>{card.label}</span><strong>{card.value}</strong></span></article>)}</section>
    <section className="timeline-panel"><div className="panel-header"><div><h2>Request timeline</h2><p>Latest applications appear at the top.</p></div><span className="result-count">{filtered.length} result{filtered.length === 1 ? '' : 's'}</span></div>{filtered.length === 0 ? <div className="empty"><div className="empty-icon"><Icon name="document" size={19} /></div><p>{requests.length ? 'No requests match your search.' : 'No requests yet.'}</p></div> : <div className="timeline">{filtered.map((request) => { const status = request.status || 'submitted'; const date = request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Date unavailable'; return <div className={`timeline-item${status === 'completed' ? ' completed' : ''}`} key={request.id}><div className="dot"><Icon name={status === 'completed' ? 'check' : 'clock'} size={15} /></div><div className="timeline-card"><div className="timeline-header"><span className="timeline-title">{STATUS_LABELS[status] || status}</span><StatusBadge status={status} /></div><p className="timeline-sub">{request.service_type || 'Government service'} · Ref: {request.reference_number || 'Not assigned'}</p><p className="timeline-sub">Submitted {date}</p></div></div>; })}</div>}</section>
  </div></main></div>;
};

const layoutStyles = { layout: { display: 'flex', minHeight: '100vh', background: '#f7f9fc' } };

export default TrackRequest;
