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
    plus: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    download: <><path d="M12 3v13M7 11l5 5 5-5M5 21h14" /></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

const styles = `
  .citizen-page { --blue:#00209F; --blue-soft:#edf2ff; --green:#009543; --green-soft:#eaf8f0; --muted:#718096; --border:#e5e9f0; --ink:#172235; width:min(100%,1440px); margin:0 auto; color:var(--ink); padding-bottom:35px; }
  .citizen-page * { box-sizing:border-box; }
  .citizen-page h1,.citizen-page h2,.citizen-page h3,.citizen-page p { margin:0; }
  .citizen-page .hero { position:relative; overflow:hidden; display:flex; align-items:center; justify-content:space-between; gap:22px; min-height:188px; padding:30px 32px; margin-bottom:24px; border:1px solid #00166f; border-radius:22px; background:linear-gradient(118deg,#00145f 0%,#00209f 58%,#003dbb 100%); box-shadow:0 18px 40px rgba(0,32,159,.18); }
  .citizen-page .eyebrow { display:flex; align-items:center; gap:9px; margin-bottom:9px; color:#baf2cf; font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }
  .citizen-page .eyebrow span { width:8px; height:8px; border-radius:50%; background:#20c778; }
  .citizen-page h1 { color:#fff; font-size:clamp(28px,3.2vw,42px); letter-spacing:-.055em; }
  .citizen-page .hero p { margin-top:9px; color:rgba(255,255,255,.78); font-size:14px; }
  .citizen-page .profile-card { display:flex; align-items:center; justify-content:space-between; gap:18px; margin-bottom:25px; padding:18px 21px; border:1px solid var(--border); border-radius:15px; background:#fff; box-shadow:0 10px 25px rgba(20,35,60,.07); }
  .citizen-page .profile-left { display:flex; align-items:center; gap:13px; }
  .citizen-page .avatar { display:grid; place-items:center; width:52px; height:52px; color:#fff; border-radius:50%; background:#00209f; font-size:18px; font-weight:900; overflow:hidden; }
  .citizen-page .profile-name { font-size:15px; font-weight:800; }
  .citizen-page .profile-label { margin-top:4px; color:var(--muted); font-size:11px; }
  .citizen-page .profile-status { display:flex; align-items:center; gap:8px; color:#007936; font-size:11px; font-weight:800; padding:7px 11px; border-radius:99px; background:#eaf8f0; }
  .citizen-page .profile-status i { width:8px; height:8px; border-radius:50%; background:#009543; }
  .citizen-page .id-card { display:flex; align-items:center; justify-content:space-between; gap:20px; padding:20px; border:1px solid #2755bc; border-radius:16px; background:linear-gradient(118deg,#00145f,#00209f 62%,#003dbb); color:#fff; margin-bottom:25px; box-shadow:0 14px 30px rgba(0,32,159,.2); }
  .citizen-page .id-card h3 { margin:0 0 8px 0; font-size:14px; text-transform:uppercase; letter-spacing:0.05em; opacity:0.8; }
  .citizen-page .id-card .id-number { font-size:22px; font-weight:900; letter-spacing:2px; margin-bottom:4px; }
  .citizen-page .id-card .id-bc { font-size:12px; opacity:0.8; }
  .citizen-page .id-card button { display:flex; align-items:center; gap:8px; padding:12px 18px; background:#fff; color:#00209F; border:none; border-radius:8px; font-weight:800; font-size:13px; cursor:pointer; }
  
  .citizen-page .notifications-panel { padding:18px 20px; background:#fff; border:1px solid var(--border); border-radius:15px; box-shadow:0 10px 26px rgba(20,35,60,.06); margin-bottom:25px; }
  .citizen-page .notifications-panel h2 { font-size:16px; margin-bottom:14px; color:#000; display:flex; align-items:center; gap:8px; }
  
  .citizen-page .notification-item { position:relative; padding:12px 40px 12px 14px; border-left:4px solid #00209F; background:#f7f9fc; border-radius:8px; margin-bottom:10px; font-size:13px; color:#172235; line-height:1.5; }
  .citizen-page .notification-item:last-child { margin-bottom:0; }
  .citizen-page .notification-meta { font-size:10px; color:#718096; margin-top:6px; }
  .citizen-page .delete-notif { position:absolute; top:10px; right:10px; background:transparent; border:none; color:#b91c1c; opacity:0.4; cursor:pointer; padding:4px; border-radius:50%; transition:0.2s; display:flex; align-items:center; justify-content:center; }
  .citizen-page .delete-notif:hover { opacity:1; background:#fee2e2; }

  .citizen-page .section-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:14px; margin:25px 0 13px; }
  .citizen-page .section-heading h2 { color:#000; font-size:18px; }
  .citizen-page .section-heading p { margin-top:5px; color:var(--muted); font-size:12px; }
  .citizen-page .section-link { display:inline-flex; align-items:center; gap:6px; color:var(--blue); border:0; background:transparent; font-size:12px; font-weight:800; cursor:pointer; }
  .citizen-page .service-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:13px; }
  .citizen-page .service-card { display:flex; align-items:flex-start; gap:12px; min-height:117px; padding:16px; border:1px solid var(--border); border-radius:14px; background:#fff; box-shadow:0 8px 20px rgba(20,35,60,.05); cursor:pointer; text-align:left; }
  .citizen-page .service-icon { display:grid; place-items:center; width:39px; height:39px; color:var(--blue); border-radius:11px; background:var(--blue-soft); }
  .citizen-page .service-card h3 { font-size:13px; color:#000; }
  .citizen-page .service-card p { margin-top:5px; color:var(--muted); font-size:11px; }
  .citizen-page .overview-grid { display:grid; grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr); gap:17px; }
  .citizen-page .panel { border:1px solid var(--border); border-radius:15px; background:#fff; box-shadow:0 10px 26px rgba(20,35,60,.06); }
  .citizen-page .panel-header { padding:18px 20px 0; }
  .citizen-page .panel-header h2 { font-size:16px; color:#000; }
  .citizen-page .panel-header p { margin-top:5px; color:var(--muted); font-size:11px; }
  .citizen-page .activity-list { padding:9px 20px 13px; }
  .citizen-page .activity-row { display:flex; align-items:center; justify-content:space-between; gap:14px; min-height:58px; border-bottom:1px solid #f0f2f5; }
  .citizen-page .activity-row:last-child { border-bottom:0; }
  .citizen-page .activity-info { display:flex; align-items:center; gap:10px; }
  .citizen-page .activity-icon { display:grid; place-items:center; width:31px; height:31px; color:var(--blue); border-radius:9px; background:var(--blue-soft); }
  .citizen-page .activity-name { font-size:12px; font-weight:800; }
  .citizen-page .activity-meta { margin-top:3px; color:var(--muted); font-size:10px; }
  .citizen-page .empty { padding:33px 15px; color:var(--muted); text-align:center; font-size:12px; }
  .citizen-main { min-width:0; width:calc(100% - 240px); min-height:100vh; margin-left:240px; padding:32px 40px; }
  @media (max-width:900px) { .citizen-page .service-grid { grid-template-columns:repeat(2,1fr); } .citizen-page .overview-grid { grid-template-columns:1fr; } }
  @media (max-width:600px) { .citizen-main { width:100%; margin-left:0; padding:22px 16px 32px; } .citizen-page .hero { flex-direction:column; padding:24px 20px; } .citizen-page .profile-card { flex-direction:column; align-items:flex-start; } .citizen-page .service-grid { grid-template-columns:1fr; } .citizen-page .id-card { flex-direction:column; align-items:flex-start; text-align:left; } }
`;

const CitizenDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    API.get('/citizen/profile').then((response) => setProfile(response.data)).catch(() => {});
    API.get('/applications/my').then((response) => setApplications(Array.isArray(response.data) ? response.data : [])).catch(() => {});
    API.get('/applications/notifications').then((response) => setNotifications(Array.isArray(response.data) ? response.data : [])).catch(() => {});
  }, []);

  const handleDeleteNotification = (id) => {
    // Optimistically remove from UI
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    // Send request to backend
    API.delete(`/applications/notifications/${id}`).catch((err) => {
      console.error('Failed to delete notification:', err);
    });
  };

  const visible = useMemo(() => applications.slice(0, 5), [applications]);
  const completed = applications.filter((a) => ['completed', 'approved'].includes(a.status)).length;
  const active = applications.filter((a) => ['submitted', 'pending', 'review', 'ready'].includes(a.status)).length;
  const displayName = profile?.full_name || user?.full_name || 'Citizen';
  const initial = displayName.charAt(0).toUpperCase();
  const picture = profile?.picture_data || user?.picture_data;
  
  const nationalId = profile?.national_id || user?.national_id;
  const birthCertNumber = profile?.birth_certificate_number || user?.birth_certificate_number;
  const otherDocNumber = profile?.other_document_number;
  const otherDocType = profile?.other_document_type;
  const userId = profile?.id || user?.id;

  const handleDownloadCertificate = () => {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/documents/birth-certificate/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => { if (!res.ok) throw new Error('Failed to download'); return res.blob(); })
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
          </header>

          <section className="profile-card">
            <div className="profile-left">
              <div className="avatar">{picture ? <img src={picture} alt="Profile" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : initial}</div>
              <div>
                <div className="profile-name">{displayName}</div>
                <div className="profile-label">{nationalId ? `National ID · ${nationalId}` : 'Citizen account'}</div>
              </div>
            </div>
            <div className="profile-status"><i /> Active</div>
          </section>

          {(nationalId || birthCertNumber || otherDocNumber) && (
            <section className="id-card">
              <div>
                <h3>Official Government Documents</h3>
                {nationalId && <div className="id-number">ID: {nationalId}</div>}
                {birthCertNumber && <div className="id-bc">Birth Certificate: {birthCertNumber}</div>}
                {otherDocNumber && (
                  <div className="id-bc" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    {otherDocType || 'Document'}: {otherDocNumber}
                  </div>
                )}
              </div>
              {birthCertNumber && (
                <button onClick={handleDownloadCertificate}>
                  <Icon name="download" size={16} /> Download Certificate
                </button>
              )}
            </section>
          )}

          {notifications.length > 0 && (
            <section className="notifications-panel">
              <h2><Icon name="bell" size={18} /> Recent Notifications</h2>
              {notifications.slice(0, 4).map((n) => (
                <div key={n.id} className="notification-item">
                  <button 
                    className="delete-notif" 
                    onClick={() => handleDeleteNotification(n.id)}
                    aria-label="Dismiss notification"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                  {n.message}
                  <div className="notification-meta">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
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
              <span><h3>Apply for a service</h3><p>Submit a new application</p></span>
            </button>
            <button className="service-card" onClick={() => navigate('/track')}>
              <span className="service-icon"><Icon name="search" size={18} /></span>
              <span><h3>Track applications</h3><p>See status of everything submitted</p></span>
            </button>
            <button className="service-card" onClick={() => navigate('/profile')}>
              <span className="service-icon"><Icon name="user" size={18} /></span>
              <span><h3>My profile</h3><p>Update your information</p></span>
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
                  <div className="empty">No applications yet.</div>
                ) : (
                  visible.map((app) => (
                    <div className="activity-row" key={app.id}>
                      <div className="activity-info">
                        <span className="activity-icon"><Icon name="document" size={16} /></span>
                        <div>
                          <div className="activity-name">{app.service_type}</div>
                          <div className="activity-meta">{app.reference_number}</div>
                        </div>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  ))
                )}
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