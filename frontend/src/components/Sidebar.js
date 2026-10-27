import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_');

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const role = normalizeRole(user?.role);

  const citizenLinks = [
    { label: 'Dashboard', path: '/dashboard', end: true },
    { label: 'Apply for service', path: '/apply' },
    { label: 'Track applications', path: '/track' },
    { label: 'My profile', path: '/profile' },
  ];

  // Admin has its own menu so every link points to a route that allows admin.
  const adminLinks = [
    { label: 'Overview', path: '/admin', end: true },
    { label: 'Applications', path: '/admin/applications' },
    { label: 'Citizen directory', path: '/admin/verify' },
    { label: 'Requests', path: '/admin/requests' },
    { label: 'Access control', path: '/admin/access' },
    { label: 'Report death', path: '/admin/report-death' },
  ];

  const homeAffairsLinks = [
    { label: 'Overview', path: '/home-affairs', end: true },
    { label: 'Applications', path: '/home-affairs/applications' },
    { label: 'Citizen directory', path: '/home-affairs/verify' },
    { label: 'Access control', path: '/home-affairs/access' },
    { label: 'Report death', path: '/home-affairs/report-death' },
  ];

  const officerLinks = [
    { label: 'Dashboard', path: '/officer/dashboard', end: true },
    { label: 'Applications', path: '/officer/applications' },
    { label: 'Citizen search', path: '/officer/search' },
    { label: 'History', path: '/officer/history' },
  ];

  const links =
    role === 'citizen'
      ? citizenLinks
      : role === 'admin'
        ? adminLinks
        : role === 'home_affairs'
          ? homeAffairsLinks
          : officerLinks;

  const portalLabel =
    role === 'citizen'
      ? 'Citizen portal'
      : role === 'admin'
        ? 'Administrator'
        : role === 'home_affairs'
          ? 'Home Affairs portal'
          : 'Officer portal';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.full_name || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  const picture = user?.picture_data;

  return (
    <aside className="app-sidebar">
      <style>{styles}</style>

      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">LS</div>
        <div className="sidebar-brand-copy"><strong>Lesotho</strong><span>Government services</span></div>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">
          {picture ? (
            <img src={picture} alt="Profile" />
          ) : (
            initial
          )}
        </div>

        <div className="sidebar-user-copy">
          <strong title={displayName}>{displayName}</strong>
          <span>{portalLabel}</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.end === true}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            <i aria-hidden="true" />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        className="sidebar-logout"
        type="button"
        onClick={handleLogout}
      >
        Sign out
      </button>
    </aside>
  );
};

const styles = `
  .app-sidebar {
    --blue: #00209F;
    --blue-soft: #edf2ff;
    --green: #009543;
    --green-soft: #eaf8f0;
    --black: #000;
    --muted: #718096;
    --border: #e5e9f0;

    position: fixed;
    z-index: 20;
    top: 0;
    bottom: 0;
    left: 0;

    display: flex;
    flex-direction: column;
    width: 240px;
    padding: 28px 16px;

    background: #fff;
    border-right: 1px solid var(--border);
    font-family: 'Inter', 'Segoe UI', sans-serif;
  }

  .sidebar-user {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 0;
    margin: 0 7px 35px;
    padding-bottom: 22px;
    border-bottom: 1px solid #f0f2f5;
  }

  .sidebar-avatar {
    display: grid;
    flex: 0 0 39px;
    place-items: center;
    width: 39px;
    height: 39px;
    overflow: hidden;
    color: #fff;
    border-radius: 50%;
    background: var(--blue);
    font-size: 14px;
    font-weight: 900;
  }

  .sidebar-avatar img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .sidebar-user-copy {
    display: grid;
    flex: 1;
    min-width: 0;
    gap: 3px;
  }

  .sidebar-user-copy strong {
    overflow: hidden;
    color: var(--black);
    font-size: 13px;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sidebar-user-copy span {
    color: var(--muted);
    font-size: 10px;
  }

  .sidebar-nav {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 5px;
    min-height: 0;
  }

  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 43px;
    box-sizing: border-box;
    padding: 0 12px;

    color: #526071;
    text-decoration: none;
    text-align: left;

    border: 1px solid transparent;
    border-radius: 10px;
    background: transparent;

    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: color .18s ease, background .18s ease,
                border-color .18s ease;
  }

  .sidebar-link span {
    min-width: 0;
  }

  .sidebar-link:hover {
    color: var(--blue);
    background: var(--blue-soft);
  }

  .sidebar-link:focus-visible,
  .sidebar-logout:focus-visible {
    outline: 2px solid var(--green);
    outline-offset: 3px;
  }

  .sidebar-link i {
    display: block;
    flex: 0 0 6px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #cbd5e1;
  }

  .sidebar-link.active,
  .sidebar-link.active:hover {
    color: var(--blue);
    border-color: #c7d5f2;
    background: var(--blue-soft);
  }

  .sidebar-link.active i {
    background: var(--green);
    box-shadow: 0 0 0 3px var(--green-soft);
  }

  .sidebar-logout {
    flex: 0 0 auto;
    min-height: 39px;
    margin-top: 20px;
    color: var(--blue);
    border: 1px solid #cbd6f2;
    border-radius: 10px;
    background: #fff;
    font-family: inherit;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: color .18s ease, background .18s ease;
  }

  .sidebar-logout:hover {
    color: #fff;
    border-color: var(--blue);
    background: var(--blue);
  }

  @media (max-width: 700px) {
    .app-sidebar {
      position: relative;
      top: auto;
      bottom: auto;
      left: auto;
      width: 100%;
      box-sizing: border-box;
      min-height: auto;
      padding: 14px 16px;
      border-right: 0;
      border-bottom: 1px solid var(--border);
    }

    .sidebar-user {
      margin-bottom: 12px;
      padding-bottom: 12px;
    }

    .sidebar-nav {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 5px;
    }

    .sidebar-link {
      min-height: 38px;
    }

    .sidebar-logout {
      margin-top: 12px;
    }
  }

  .app-sidebar{overflow:hidden;padding:22px 15px;background:linear-gradient(180deg,#fff 0%,#fbfcff 100%);box-shadow:8px 0 25px rgba(18,35,62,.05)}
  .app-sidebar:before{position:absolute;top:0;left:0;right:0;height:5px;content:'';background:linear-gradient(90deg,#00209F 0 42%,#000 42% 58%,#009543 58% 100%)}
  .sidebar-brand{display:flex;align-items:center;gap:10px;margin:7px 7px 22px;padding-bottom:20px;border-bottom:1px solid #edf0f5}
  .sidebar-brand-mark{display:grid;place-items:center;width:38px;height:38px;color:#fff;border-radius:11px;background:#00209F;font-size:11px;font-weight:900;letter-spacing:.04em;box-shadow:0 5px 12px rgba(0,32,159,.2)}
  .sidebar-brand-copy{display:grid;gap:2px}
  .sidebar-brand-copy strong{color:#000;font-size:14px;letter-spacing:-.02em}
  .sidebar-brand-copy span{color:#718096;font-size:9px;font-weight:600}
  .sidebar-user{margin-bottom:25px;padding:0 5px 20px;border-bottom:1px solid #edf0f5}
  .sidebar-avatar{width:42px;height:42px;flex-basis:42px;border:3px solid #e6edff;background:#00209F;box-shadow:0 0 0 2px #009543;font-size:15px}
  .sidebar-user-copy strong{font-size:13px}
  .sidebar-user-copy span{font-size:10px;color:#009543;font-weight:700}
  .sidebar-nav{gap:6px}
  .sidebar-link{min-height:45px;padding:0 13px;border-radius:12px;font-size:13px}
  .sidebar-link i{width:7px;height:7px;flex-basis:7px;transition:transform .18s ease,background .18s ease}
  .sidebar-link:hover i{transform:scale(1.25);background:#00209F}
  .sidebar-link.active,.sidebar-link.active:hover{border-color:#c5d4f5;background:linear-gradient(90deg,#edf2ff,#f7f9ff);box-shadow:0 5px 12px rgba(0,32,159,.06)}
  .sidebar-link.active i{background:#009543;box-shadow:0 0 0 4px #e5f7ed}
  .sidebar-logout{min-height:42px;border-color:#c9d6f2;background:#fff;box-shadow:0 4px 10px rgba(20,35,60,.04)}
  .sidebar-logout:hover{border-color:#009543;background:#00209F;box-shadow:0 7px 14px rgba(0,32,159,.16)}
  @media (max-width:700px){.app-sidebar{padding:14px 16px}.app-sidebar:before{height:4px}.sidebar-brand{margin:4px 0 12px;padding-bottom:12px}.sidebar-user{margin-bottom:12px;padding-bottom:12px}}
`;

export default Sidebar;