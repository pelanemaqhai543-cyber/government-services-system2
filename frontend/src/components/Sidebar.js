import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const normalizeRole = (role) => String(role || '').trim().toLowerCase().replace(/[-\s]+/g, '_');

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const role = normalizeRole(user?.role);

  const citizenLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'New request', path: '/new-request' },
    { label: 'Renewal', path: '/renewal' },
    { label: 'Track', path: '/track' },
    { label: 'History', path: '/history' },
  ];

  const homeAffairsLinks = [
    { label: 'Overview', path: '/home-affairs' },
    { label: 'Requests', path: '/home-affairs/requests' },
    { label: 'Verify citizens', path: '/home-affairs/verify' },
    { label: 'Access control', path: '/home-affairs/access' },
  ];

  const officerLinks = [
    { label: 'Dashboard', path: '/officer/dashboard' },
    { label: 'Requests', path: '/officer/requests' },
    { label: 'Citizen search', path: '/officer/search' },
    { label: 'History', path: '/officer/history' },
  ];

  const links = role === 'citizen'
    ? citizenLinks
    : role === 'home_affairs' || role === 'admin'
      ? homeAffairsLinks
      : officerLinks;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="app-sidebar">
      <style>{styles}</style>
      <div className="sidebar-user">
        <div className="sidebar-avatar">{user?.full_name?.charAt(0)?.toUpperCase() || 'U'}</div>
        <div className="sidebar-user-copy"><strong>{user?.full_name || 'User'}</strong><span>{role === 'citizen' ? 'Citizen portal' : 'Officer portal'}</span></div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {links.map((link) => {
          const active = location.pathname === link.path || location.pathname.startsWith(`${link.path}/`);
          return <button key={link.path} type="button" className={`sidebar-link${active ? ' active' : ''}`} onClick={() => navigate(link.path)}><i />{link.label}</button>;
        })}
      </nav>

      <button className="sidebar-logout" type="button" onClick={handleLogout}>Sign out</button>
    </aside>
  );
};

const styles = `
  .app-sidebar { --blue:#00209F; --blue-soft:#edf2ff; --green:#009543; --green-soft:#eaf8f0; --black:#000; --muted:#718096; --border:#e5e9f0; position:fixed; z-index:20; top:0; bottom:0; left:0; display:flex; width:240px; flex-direction:column; padding:28px 16px; background:#fff; border-right:1px solid var(--border); font-family:'Inter','Segoe UI',sans-serif; }
  .sidebar-user { display:flex; align-items:center; gap:11px; min-width:0; margin:0 7px 35px; padding-bottom:22px; border-bottom:1px solid #f0f2f5; }.sidebar-avatar { display:grid; flex:0 0 auto; place-items:center; width:39px; height:39px; color:#fff; border-radius:50%; background:var(--blue); font-size:14px; font-weight:900; }.sidebar-user-copy { display:grid; min-width:0; gap:3px; }.sidebar-user-copy strong { overflow:hidden; color:var(--black); font-size:13px; font-weight:800; text-overflow:ellipsis; white-space:nowrap; }.sidebar-user-copy span { color:var(--muted); font-size:10px; }
  .sidebar-nav { display:flex; flex:1; flex-direction:column; gap:5px; }.sidebar-link { display:flex; align-items:center; gap:10px; width:100%; min-height:43px; padding:0 12px; color:#526071; text-align:left; border:1px solid transparent; border-radius:10px; background:transparent; font-size:13px; font-weight:700; cursor:pointer; transition:.18s ease; }.sidebar-link:hover { color:var(--blue); background:var(--blue-soft); }.sidebar-link i { width:6px; height:6px; flex:0 0 6px; border-radius:50%; background:#cbd5e1; }.sidebar-link.active { color:var(--blue); border-color:#c7d5f2; background:var(--blue-soft); }.sidebar-link.active i { background:var(--green); box-shadow:0 0 0 3px var(--green-soft); }.sidebar-logout { min-height:39px; margin-top:20px; color:var(--blue); border:1px solid #cbd6f2; border-radius:10px; background:#fff; font-size:12px; font-weight:800; cursor:pointer; }.sidebar-logout:hover { color:#fff; border-color:var(--blue); background:var(--blue); }
  @media (max-width:700px) { .app-sidebar { position:relative; width:100%; min-height:auto; padding:14px 16px; border-right:0; border-bottom:1px solid var(--border); }.sidebar-user { margin-bottom:12px; padding-bottom:12px; }.sidebar-nav { display:grid; grid-template-columns:repeat(2,1fr); gap:5px; }.sidebar-link { min-height:38px; }.sidebar-logout { margin-top:12px; } }
`;

export default Sidebar;
