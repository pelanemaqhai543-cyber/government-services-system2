import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Icon = ({ name, size = 19 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    search: <><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    document: <><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4M9 12h6M9 16h6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    plus: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    download: <><path d="M12 3v13M7 11l5 5 5-5M5 21h14" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

const styles = `
  .citizen-page { --blue:#00209F; --blue-dark:#00166f; --blue-soft:#edf2ff; --green:#009543; --green-dark:#007936; --green-soft:#eaf8f0; --black:#000; --ink:#172235; --muted:#718096; --border:#e5e9f0; --white:#fff; width:min(100%,1440px); margin:0 auto; padding:0 2px; color:var(--ink); }
  .citizen-page * { box-sizing:border-box; }.citizen-page button,.citizen-page input { font:inherit; }.citizen-page button { cursor:pointer; }.citizen-page h1,.citizen-page h2,.citizen-page h3,.citizen-page p { margin:0; }
  .citizen-page .hero { display:flex; align-items:flex-end; justify-content:space-between; gap:22px; margin-bottom:25px; }.citizen-page .eyebrow { display:flex; align-items:center; gap:9px; margin-bottom:9px; color:var(--blue); font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }.citizen-page .eyebrow span { width:8px; height:8px; border-radius:50%; background:var(--green); box-shadow:0 0 0 5px var(--green-soft); }.citizen-page h1 { color:var(--black); font-size:clamp(25px,3vw,34px); line-height:1.1; letter-spacing:-.04em; }.citizen-page .hero p { margin-top:9px; color:var(--muted); font-size:14px; line-height:1.55; }.citizen-page .hero-actions { display:flex; gap:10px; flex-wrap:wrap; }
  .citizen-page .btn-primary { display:inline-flex; align-items:center; gap:8px; padding:12px 20px; background:var(--blue); color:#fff; border:1px solid var(--blue); border-radius:10px; font-size:13px; font-weight:800; transition:.2s; }.citizen-page .btn-primary:hover { background:var(--blue-dark); transform:translateY(-2px); }.citizen-page .btn-secondary { display:inline-flex; align-items:center; gap:8px; padding:12px 20px; background:#fff; color:var(--blue); border:1px solid #cbd6f2; border-radius:10px; font-size:13px; font-weight:800; transition:.2s; }.citizen-page .btn-secondary:hover { background:var(--blue-soft); transform:translateY(-2px); }
  .citizen-page .profile-card { display:flex; align-items:center; justify-content:space-between; gap:18px; margin-bottom:25px; padding:18px 21px; border:1px solid var(--border); border-radius:15px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.045); }.citizen-page .profile-left { display:flex; align-items:center; gap:13px; min-width:0; }.citizen-page .avatar { display:grid; flex:0 0 auto; place-items:center; width:52px; height:52px; color:var(--white); border-radius:50%; background:var(--blue); font-size:18px; font-weight:900; overflow:hidden; }.citizen-page .avatar img { width:100%; height:100%; object-fit:cover; }.citizen-page .profile-name { overflow:hidden; color:var(--black); font-size:15px; font-weight:800; text-overflow:ellipsis; white-space:nowrap; }.citizen-page .profile-label { margin-top:4px; color:var(--muted); font-size:11px; }.citizen-page .profile-status { display:flex; align-items:center; gap:8px; color:var(--green-dark); font-size:11px; font-weight:800; }.citizen-page .profile-status i { width:8px; height:8px; border-radius:50%; background:var(--green); }
  .citizen-page .section-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:14px; margin:25px 0 13px; }.citizen-page .section-heading h2 { color:var(--black); font-size:18px; letter-spacing:-.03em; }.citizen-page .section-heading p { margin-top:5px; color:var(--muted); font-size:12px; }.citizen-page .section-link { display:inline-flex; align-items:center; gap:6px; color:var(--blue); border:0; background:transparent; font-size:12px; font-weight:800; }
  .citizen-page .service-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:13px; }.citizen-page .service-card { display:flex; align-items:flex-start; gap:12px; min-height:105px; padding:16px; color:inherit; text-align:left; border:1px solid var(--border); border-radius:14px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.04); transition:.2s ease; }.citizen-page .service-card:hover { transform:translateY(-2px); border-color:#b9c9ee; box-shadow:0 12px 25px rgba(20,35,60,.08); }.citizen-page .service-icon { display:grid; flex:0 0 auto; place-items:center; width:39px; height:39px; color:var(--blue); border-radius:11px; background:var(--blue-soft); font-size:11px; font-weight:900; }.citizen-page .service-card:nth-child(2n) .service-icon { color:var(--green); background:var(--green-soft); }.citizen-page .service-card:nth-child(3n) .service-icon { color:var(--black); background:#f2f2f2; }.citizen-page .service-card h3 { color:var(--black); font-size:13px; }.citizen-page .service-card p { margin-top:5px; color:var(--muted); font-size:11px; line-height:1.4; }
  .citizen-page .overview-grid { display:grid; grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr); gap:17px; }.citizen-page .panel { min-width:0; border:1px solid var(--border); border-radius:15px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.04); }.citizen-page .panel-header { padding:18px 20px 0; }.citizen-page .panel-header h2 { color:var(--black); font-size:16px; }.citizen-page .panel-header p { margin-top:5px; color:var(--muted); font-size:11px; }.citizen-page .activity-list { padding:9px 20px 13px; }.citizen-page .activity-row { display:flex; align-items:center; justify-content:space-between; gap:14px; min-height:58px; border-bottom:1px solid #f0f2f5; }.citizen-page .activity-row:last-child { border-bottom:0; }.citizen-page .activity-info { display:flex; align-items:center; gap:10px; min-width:0; }.citizen-page .activity-icon { display:grid; flex:0 0 auto; place-items:center; width:31px; height:31px; color:var(--blue); border-radius:9px; background:var(--blue-soft); }.citizen-page .activity-name { overflow:hidden; color:var(--ink); font-size:12px; font-weight:800; text-overflow:ellipsis; white-space:nowrap; }.citizen-page .activity-meta { margin-top:3px; color:var(--muted); font-size:10px; }.citizen-page .empty { padding:33px 15px; color:var(--muted); text-align:center; font-size:12px; }
  .citizen-page .view-all { display:inline-flex; align-items:center; justify-content:center; gap:6px; width:calc(100% - 40px); min-height:35px; margin:0 20px 17px; color:var(--blue); border:1px solid #cbd6f2; border-radius:9px; background:var(--white); font-size:11px; font-weight:800; }
  .citizen-main { min-width:0; width:calc(100% - 240px); min-height:100vh; margin-left:240px; padding:32px 40px; }
  .citizen-page .id-card { display:flex; align-items:center; justify-content:space-between; gap:20px; padding:20px; background:linear-gradient(135deg, #00209F, #00166f); border-radius:16px; color:#fff; margin-bottom:25px; box-shadow:0 10px 25px rgba(0,32,159,0.2); }
  .citizen-page .id-card h3 { margin:0 0 8px 0; font-size:14px; text-transform:uppercase; letter-spacing:0.05em; opacity:0.8; }
  .citizen-page .id-card .id-number { font-size:22px; font-weight:900; letter-spacing:2px; margin-bottom:4px; }
  .citizen-page .id-card .id-bc { font-size:12px; opacity:0.8; }
  .citizen-page .id-card button { display:flex; align-items:center; gap:8px; padding:12px 18px; background:#fff; color:#00209F; border:none; border-radius:8px; font-weight:800; font-size:13px; cursor:pointer; transition:0.2s; }
  .citizen-page .id-card button:hover { transform:translateY(-2px); background:#edf2ff; }
  @media (max-width:900px) { .citizen-page .service-grid { grid-template-columns:repeat(2,1fr); }.citizen-page .overview-grid { grid-template-columns:1fr; } }
  @media (max-width:600px) { .citizen-main { width:100%; margin-left:0; padding:22px 16px 32px; }.citizen-page { padding:0; }.citizen-page .hero { align-items:stretch; flex-direction:column; }.citizen-page .profile-card { align-items:flex-start; flex-direction:column; }.citizen-page .service-grid { grid-template-columns:1fr; }.citizen-page .section-heading { align-items:flex-start; flex-direction:column; }.citizen-page .id-card { flex-direction:column; align-items:flex-start; text-align:left; } }

.citizen-page{padding-bottom:35px}
.citizen-page .hero{position:relative;overflow:hidden;align-items:center;min-height:188px;padding:30px 32px;margin-bottom:24px;border:1px solid #00166f;border-radius:22px;background:linear-gradient(118deg,#00145f 0%,#00209f 58%,#003dbb 100%);box-shadow:0 18px 40px rgba(0,32,159,.18)}
.citizen-page .hero:after{position:absolute;right:-88px;bottom:-132px;width:320px;height:320px;content:'';border:45px solid rgba(0,149,67,.34);border-radius:50%}
.citizen-page .hero>div{position:relative;z-index:1}
.citizen-page .hero .eyebrow{color:#baf2cf}
.citizen-page .hero .eyebrow span{background:#20c778;box-shadow:0 0 0 5px rgba(32,199,120,.2)}
.citizen-page .hero h1{color:#fff;font-size:clamp(28px,3.2vw,42px);letter-spacing:-.055em}
.citizen-page .hero p{color:rgba(255,255,255,.78);max-width:680px}
.citizen-page .hero-actions{position:relative;z-index:1}
.citizen-page .hero .btn-primary{color:#063d22;border-color:#7ce4ad;background:#baf4d2;box-shadow:0 8px 18px rgba(0,0,0,.16)}
.citizen-page .hero .btn-primary:hover{color:#fff;border-color:#009543;background:#009543}
.citizen-page .hero .btn-secondary{color:#fff;border-color:rgba(255,255,255,.45);background:rgba(255,255,255,.1)}
.citizen-page .hero .btn-secondary:hover{color:#00209f;background:#fff}
.citizen-page .profile-card{position:relative;overflow:hidden;box-shadow:0 10px 25px rgba(20,35,60,.07)}
.citizen-page .profile-card:before{position:absolute;top:0;left:0;right:0;height:4px;content:'';background:#009543}
.citizen-page .avatar{box-shadow:0 0 0 4px #e3ecff,0 7px 16px rgba(0,32,159,.12);background:#00209f}
.citizen-page .profile-status{padding:7px 11px;border-radius:99px;background:#eaf8f0}
.citizen-page .id-card{position:relative;overflow:hidden;border:1px solid #2755bc;background:linear-gradient(118deg,#00145f,#00209f 62%,#003dbb);box-shadow:0 14px 30px rgba(0,32,159,.2)}
.citizen-page .id-card:after{position:absolute;right:-45px;bottom:-85px;width:210px;height:210px;content:'';border:30px solid rgba(0,149,67,.35);border-radius:50%}
.citizen-page .id-card>div,.citizen-page .id-card button{position:relative;z-index:1}
.citizen-page .id-card button{box-shadow:0 8px 18px rgba(0,0,0,.16)}
.citizen-page .service-card{position:relative;overflow:hidden;min-height:117px;box-shadow:0 8px 20px rgba(20,35,60,.05)}
.citizen-page .service-card:before{position:absolute;top:0;left:0;right:0;height:4px;content:'';background:#00209f}
.citizen-page .service-card:nth-child(2):before{background:#009543}
.citizen-page .service-card:nth-child(3):before{background:#000}
.citizen-page .service-card:hover{transform:translateY(-5px);border-color:#9bb3ee;box-shadow:0 15px 28px rgba(0,32,159,.1)}
.citizen-page .panel{box-shadow:0 10px 26px rgba(20,35,60,.06)}
.citizen-page .activity-row{transition:background .16s ease;padding-left:4px;padding-right:4px}
.citizen-page .activity-row:hover{background:#f6f9ff}
.citizen-page .section-link:hover{color:#009543}
@media(max-width:600px){.citizen-page .hero{padding:24px 20px}.citizen-page .hero-actions{width:100%;display:grid;grid-template-columns:1fr 1fr}.citizen-page .hero-actions .btn-primary,.citizen-page .hero-actions .btn-secondary{justify-content:center;padding-left:10px;padding-right:10px}}
`;

const CitizenDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    API.get('/citizen/profile').then((response) => setProfile(response.data)).catch(() => {});
    API.get('/applications/my').then((response) => setApplications(Array.isArray(response.data) ? response.data : [])).catch(() => {});
  }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return applications
      .filter((a) => !query || String(a.service_type || '').toLowerCase().includes(query) || String(a.reference_number || '').toLowerCase().includes(query))
      .slice(0, 5);
  }, [applications, search]);

  const completed = applications.filter((a) => ['completed', 'approved'].includes(a.status)).length;
  const active = applications.filter((a) => ['submitted', 'pending', 'review', 'ready'].includes(a.status)).length;
  const displayName = profile?.full_name || user?.full_name || 'Citizen';
  const initial = displayName.charAt(0).toUpperCase();
  const picture = profile?.picture_data || user?.picture_data;
  
  // Checks for generated identifiers
  const nationalId = profile?.national_id || user?.national_id;
  const birthCertNumber = profile?.birth_certificate_number || user?.birth_certificate_number;
  const userId = profile?.id || user?.id;

  const handleDownloadCertificate = () => {
    const token = localStorage.getItem('token');
    // Use fetch to get the blob and force download, ensuring Authorization header is passed
    fetch(`http://localhost:5000/api/documents/birth-certificate/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to download');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BirthCertificate_${birthCertNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => alert('Error downloading certificate: ' + err.message));
  };

  return (
    <div style={layoutStyles.layout}>
      <Sidebar />
      <main className="citizen-main">
        <style>{styles}</style>
        <div className="citizen-page">
          <header className="hero">
            <div>
              <div className="eyebrow"><span /> Citizen services portal</div>
              <h1>Welcome back, {displayName.split(' ')[0]}</h1>
              <p>Apply for services, upload documents, and track every application in one place.</p>
            </div>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => navigate('/apply')}>
                <Icon name="plus" size={16} /> Apply for service
              </button>
              <button className="btn-secondary" onClick={() => navigate('/profile')}>
                <Icon name="user" size={16} /> My profile
              </button>
            </div>
          </header>

          <section className="profile-card">
            <div className="profile-left">
              <div className="avatar">
                {picture ? <img src={picture} alt="Profile" /> : initial}
              </div>
              <div>
                <div className="profile-name">{displayName}</div>
                <div className="profile-label">
                  {nationalId ? `National ID · ${nationalId}` : user?.username ? `Username · ${user.username}` : 'Citizen account'}
                </div>
              </div>
            </div>
            <div className="profile-status">
              <i /> {profile?.status === 'active' ? 'Active' : 'Verified'}
            </div>
          </section>

          {/* NEW: Official Documents Panel */}
          {(nationalId || birthCertNumber) && (
            <section className="id-card">
              <div>
                <h3>Official Government Documents</h3>
                {nationalId && <div className="id-number">ID: {nationalId}</div>}
                {birthCertNumber && <div className="id-bc">Birth Certificate: {birthCertNumber}</div>}
                {!nationalId && <div className="id-bc">National ID: Pending Generation</div>}
              </div>
              {birthCertNumber && (
                <button onClick={handleDownloadCertificate}>
                  <Icon name="download" size={16} /> Download Certificate
                </button>
              )}
            </section>
          )}

          <div className="section-heading">
            <div>
              <h2>Quick actions</h2>
              <p>Most common tasks</p>
            </div>
          </div>

          <section className="service-grid" aria-label="Quick actions">
            <button className="service-card" onClick={() => navigate('/apply')}>
              <span className="service-icon"><Icon name="plus" size={18} /></span>
              <span>
                <h3>Apply for a service</h3>
                <p>Submit a new application with supporting documents</p>
              </span>
            </button>
            <button className="service-card" onClick={() => navigate('/track')}>
              <span className="service-icon"><Icon name="search" size={18} /></span>
              <span>
                <h3>Track applications</h3>
                <p>See the status of everything you've submitted</p>
              </span>
            </button>
            <button className="service-card" onClick={() => navigate('/profile')}>
              <span className="service-icon"><Icon name="user" size={18} /></span>
              <span>
                <h3>My profile</h3>
                <p>Update your picture and personal information</p>
              </span>
            </button>
          </section>

          <div className="section-heading">
            <div>
              <h2>Recent applications</h2>
              <p>Your latest submissions</p>
            </div>
            <button className="section-link" onClick={() => navigate('/track')}>
              View all <Icon name="arrow" size={14} />
            </button>
          </div>

          <section className="overview-grid">
            <article className="panel">
              <div className="panel-header">
                <h2>Applications</h2>
                <p>{applications.length} total · {active} active · {completed} completed</p>
              </div>
              <div className="activity-list">
                {visible.length === 0 ? (
                  <div className="empty">No applications yet. Click "Apply for service" to get started.</div>
                ) : (
                  visible.map((app) => (
                    <div className="activity-row" key={app.id}>
                      <div className="activity-info">
                        <span className="activity-icon"><Icon name="document" size={16} /></span>
                        <div>
                          <div className="activity-name">{app.service_type}</div>
                          <div className="activity-meta">
                            {app.reference_number}
                            {app.created_at ? ` · ${new Date(app.created_at).toLocaleDateString()}` : ''}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="panel" style={{ padding: 22 }}>
              <h2 style={{ fontSize: 16, marginBottom: 12 }}>Application progress</h2>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 130, height: 130, borderRadius: '50%',
                  background: `conic-gradient(var(--green) 0 ${applications.length ? Math.round((completed / applications.length) * 100) : 0}%, var(--blue-soft) ${applications.length ? Math.round((completed / applications.length) * 100) : 0}% 100%)`,
                  display: 'grid', placeItems: 'center'
                }}>
                  <div style={{
                    width: 88, height: 88, borderRadius: '50%', background: '#fff',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <strong style={{ fontSize: 22 }}>{applications.length ? Math.round((completed / applications.length) * 100) : 0}%</strong>
                    <span style={{ fontSize: 10, color: '#718096' }}>complete</span>
                  </div>
                </div>
                <button className="view-all" onClick={() => navigate('/track')} style={{ margin: 0, width: '100%' }}>
                  Track applications <Icon name="arrow" size={14} />
                </button>
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
};

const layoutStyles = { layout: { display: 'flex', minHeight: '100vh', background: '#f7f9fc' } };

export default CitizenDashboard;