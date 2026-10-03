import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const SERVICES = [
  { name: 'Traffic', code: 'TR', description: 'Licences and vehicle services' },
  { name: 'Finance', code: 'FN', description: 'Tax and revenue services' },
  { name: 'Pensions', code: 'PN', description: 'Pension applications' },
  { name: 'Police', code: 'PL', description: 'Clearance and background checks' },
  { name: 'Passport', code: 'PP', description: 'Applications and renewals' },
  { name: 'More services', code: '+', description: 'Explore all services' },
];

const Icon = ({ name, size = 19 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    search: <><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    document: <><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4M9 12h6M9 16h6" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    shield: <><path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

const styles = `
  .citizen-page { --blue:#00209F; --blue-dark:#00166f; --blue-soft:#edf2ff; --green:#009543; --green-dark:#007936; --green-soft:#eaf8f0; --black:#000; --ink:#172235; --muted:#718096; --border:#e5e9f0; --white:#fff; width:min(100%,1440px); margin:0 auto; padding:0 2px; color:var(--ink); }
  .citizen-page * { box-sizing:border-box; }.citizen-page button,.citizen-page input { font:inherit; }.citizen-page button { cursor:pointer; }.citizen-page h1,.citizen-page h2,.citizen-page h3,.citizen-page p { margin:0; }
  .citizen-page .hero { display:flex; align-items:flex-end; justify-content:space-between; gap:22px; margin-bottom:25px; }.citizen-page .eyebrow { display:flex; align-items:center; gap:9px; margin-bottom:9px; color:var(--blue); font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }.citizen-page .eyebrow span { width:8px; height:8px; border-radius:50%; background:var(--green); box-shadow:0 0 0 5px var(--green-soft); }.citizen-page h1 { color:var(--black); font-size:clamp(25px,3vw,34px); line-height:1.1; letter-spacing:-.04em; }.citizen-page .hero p { margin-top:9px; color:var(--muted); font-size:14px; line-height:1.55; }.citizen-page .search-wrap { position:relative; width:260px; }.citizen-page .search-wrap svg { position:absolute; top:50%; left:14px; color:var(--blue); transform:translateY(-50%); }.citizen-page .search { width:100%; min-height:42px; padding:0 15px 0 41px; color:var(--ink); border:1px solid var(--border); border-radius:10px; outline:none; background:var(--white); font-size:12px; }.citizen-page .search:focus { border-color:#a9bde9; box-shadow:0 0 0 3px var(--blue-soft); }.citizen-page .search::placeholder { color:#9aa6b8; }
  .citizen-page .profile-card { display:flex; align-items:center; justify-content:space-between; gap:18px; margin-bottom:25px; padding:18px 21px; border:1px solid var(--border); border-radius:15px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.045); }.citizen-page .profile-left { display:flex; align-items:center; gap:13px; min-width:0; }.citizen-page .avatar { display:grid; flex:0 0 auto; place-items:center; width:46px; height:46px; color:var(--white); border-radius:50%; background:var(--blue); font-size:16px; font-weight:900; }.citizen-page .profile-name { overflow:hidden; color:var(--black); font-size:15px; font-weight:800; text-overflow:ellipsis; white-space:nowrap; }.citizen-page .profile-label { margin-top:4px; color:var(--muted); font-size:11px; }.citizen-page .profile-status { display:flex; align-items:center; gap:8px; color:var(--green-dark); font-size:11px; font-weight:800; }.citizen-page .profile-status i { width:8px; height:8px; border-radius:50%; background:var(--green); }
  .citizen-page .section-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:14px; margin:25px 0 13px; }.citizen-page .section-heading h2 { color:var(--black); font-size:18px; letter-spacing:-.03em; }.citizen-page .section-heading p { margin-top:5px; color:var(--muted); font-size:12px; }.citizen-page .section-link { display:inline-flex; align-items:center; gap:6px; color:var(--blue); border:0; background:transparent; font-size:12px; font-weight:800; }
  .citizen-page .service-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:13px; }.citizen-page .service-card { display:flex; align-items:flex-start; gap:12px; min-height:105px; padding:16px; color:inherit; text-align:left; border:1px solid var(--border); border-radius:14px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.04); transition:.2s ease; }.citizen-page .service-card:hover { transform:translateY(-2px); border-color:#b9c9ee; box-shadow:0 12px 25px rgba(20,35,60,.08); }.citizen-page .service-icon { display:grid; flex:0 0 auto; place-items:center; width:39px; height:39px; color:var(--blue); border-radius:11px; background:var(--blue-soft); font-size:11px; font-weight:900; }.citizen-page .service-card:nth-child(2n) .service-icon { color:var(--green); background:var(--green-soft); }.citizen-page .service-card:nth-child(3n) .service-icon { color:var(--black); background:#f2f2f2; }.citizen-page .service-card h3 { color:var(--black); font-size:13px; }.citizen-page .service-card p { margin-top:5px; color:var(--muted); font-size:11px; line-height:1.4; }
  .citizen-page .overview-grid { display:grid; grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr); gap:17px; }.citizen-page .panel { min-width:0; border:1px solid var(--border); border-radius:15px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.04); }.citizen-page .panel-header { padding:18px 20px 0; }.citizen-page .panel-header h2 { color:var(--black); font-size:16px; }.citizen-page .panel-header p { margin-top:5px; color:var(--muted); font-size:11px; }.citizen-page .activity-list { padding:9px 20px 13px; }.citizen-page .activity-row { display:flex; align-items:center; justify-content:space-between; gap:14px; min-height:58px; border-bottom:1px solid #f0f2f5; }.citizen-page .activity-row:last-child { border-bottom:0; }.citizen-page .activity-info { display:flex; align-items:center; gap:10px; min-width:0; }.citizen-page .activity-icon { display:grid; flex:0 0 auto; place-items:center; width:31px; height:31px; color:var(--blue); border-radius:9px; background:var(--blue-soft); }.citizen-page .activity-name { overflow:hidden; color:var(--ink); font-size:12px; font-weight:800; text-overflow:ellipsis; white-space:nowrap; }.citizen-page .activity-meta { margin-top:3px; color:var(--muted); font-size:10px; }.citizen-page .empty { padding:33px 15px; color:var(--muted); text-align:center; font-size:12px; }
  .citizen-page .status-panel { min-height:215px; }.citizen-page .status-content { display:flex; align-items:center; justify-content:center; gap:18px; padding:20px; }.citizen-page .ring { position:relative; display:grid; place-items:center; width:125px; height:125px; border-radius:50%; }.citizen-page .ring::after { width:83px; height:83px; content:''; border-radius:50%; background:var(--white); }.citizen-page .ring-copy { position:absolute; z-index:1; display:grid; text-align:center; }.citizen-page .ring-copy strong { font-size:24px; letter-spacing:-.05em; }.citizen-page .ring-copy span { color:var(--muted); font-size:10px; font-weight:700; }.citizen-page .status-note { max-width:110px; color:var(--muted); font-size:11px; line-height:1.45; }.citizen-page .status-note strong { display:block; margin-bottom:4px; color:var(--ink); font-size:13px; }.citizen-page .view-all { display:inline-flex; align-items:center; justify-content:center; gap:6px; width:calc(100% - 40px); min-height:35px; margin:0 20px 17px; color:var(--blue); border:1px solid #cbd6f2; border-radius:9px; background:var(--white); font-size:11px; font-weight:800; }
  .citizen-main { min-width:0; width:calc(100% - 240px); min-height:100vh; margin-left:240px; padding:32px 40px; }
  @media (max-width:900px) { .citizen-page .service-grid { grid-template-columns:repeat(2,1fr); }.citizen-page .overview-grid { grid-template-columns:1fr; } }
  @media (max-width:600px) {
    .citizen-main { width:100%; margin-left:0; padding:22px 16px 32px; } .citizen-page { padding:0; }.citizen-page .hero { align-items:stretch; flex-direction:column; }.citizen-page .search-wrap { width:100%; }.citizen-page .profile-card { align-items:flex-start; flex-direction:column; }.citizen-page .service-grid { grid-template-columns:1fr; }.citizen-page .section-heading { align-items:flex-start; flex-direction:column; }.citizen-page .status-content { flex-direction:column; }.citizen-page .status-note { max-width:220px; text-align:center; } }
`;

const CitizenDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [profile, setProfile] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    API.get('/citizen/profile').then((response) => setProfile(response.data)).catch(() => {});
    API.get('/requests/my').then((response) => setRequests(Array.isArray(response.data) ? response.data : [])).catch(() => {});
  }, []);

  const visibleRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((request) => !query || String(request.service_type || '').toLowerCase().includes(query) || String(request.reference_number || '').toLowerCase().includes(query)).slice(0, 5);
  }, [requests, search]);

  const completed = requests.filter((request) => request.status === 'completed').length;
  const pending = requests.filter((request) => ['submitted', 'pending', 'review', 'in_review'].includes(request.status)).length;
  const progress = requests.length ? Math.round((completed / requests.length) * 100) : 0;
  const displayName = profile?.full_name || user?.full_name || 'Citizen';

  return (
    <div style={layoutStyles.layout}>
      <Sidebar />
      <main className="citizen-main">
        <style>{styles}</style>
        <div className="citizen-page">
          <header className="hero"><div><div className="eyebrow"><span /> Citizen services portal</div><h1>Welcome back, {displayName.split(' ')[0]}</h1><p>Access essential government services and keep track of your applications in one place.</p></div><div className="search-wrap"><Icon name="search" size={17} /><input className="search" placeholder="Search applications" value={search} onChange={(event) => setSearch(event.target.value)} /></div></header>

          <section className="profile-card"><div className="profile-left"><div className="avatar">{displayName.charAt(0).toUpperCase()}</div><div><div className="profile-name">{displayName}</div><div className="profile-label">Citizen account{user?.national_id ? ` · ${user.national_id}` : ''}</div></div></div><div className="profile-status"><i /> {profile?.verification_status || 'Verification pending'}</div></section>

          <div className="section-heading"><div><h2>Government services</h2><p>Start a new application with a department.</p></div><button className="section-link" type="button" onClick={() => navigate('/services')}>View all <Icon name="arrow" size={14} /></button></div>
          <section className="service-grid" aria-label="Government services">{SERVICES.map((service) => <button className="service-card" type="button" key={service.name} onClick={() => navigate(service.name === 'More services' ? '/services' : `/new-request?service=${service.name}`)}><span className="service-icon">{service.code}</span><span><h3>{service.name}</h3><p>{service.description}</p></span></button>)}</section>

          <div className="section-heading"><div><h2>Overview</h2><p>Your current application activity.</p></div></div>
          <section className="overview-grid"><article className="panel"><div className="panel-header"><h2>Recent activity</h2><p>Latest applications and status updates</p></div><div className="activity-list">{visibleRequests.length === 0 ? <div className="empty">No recent activity found.</div> : visibleRequests.map((request) => <div className="activity-row" key={request.id}><div className="activity-info"><span className="activity-icon"><Icon name="document" size={16} /></span><div><div className="activity-name">{request.service_type || 'Government service'}</div><div className="activity-meta">{request.reference_number || 'Application'}{request.created_at ? ` · ${new Date(request.created_at).toLocaleDateString()}` : ''}</div></div></div><StatusBadge status={request.status || 'pending'} /></div>)}</div></article><article className="panel status-panel"><div className="panel-header"><h2>Application progress</h2><p>Completion across your requests</p></div><div className="status-content"><div className="ring" style={{ background: `conic-gradient(var(--green) 0 ${progress}%,var(--blue-soft) ${progress}% 100%)` }}><div className="ring-copy"><strong>{progress}%</strong><span>complete</span></div></div><p className="status-note"><strong>Keep track</strong>{requests.length ? `${completed} completed and ${pending} still in progress.` : 'Your submitted applications will appear here.'}</p></div><button className="view-all" type="button" onClick={() => navigate('/track')}>Track applications <Icon name="arrow" size={14} /></button></article></section>
        </div>
      </main>
    </div>
  );
};

const layoutStyles = {
  layout: { display: 'flex', minHeight: '100vh', background: '#f7f9fc' },
};

export default CitizenDashboard;
