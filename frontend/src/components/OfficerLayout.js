import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_');

const getNavForRole = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === 'home_affairs' || normalizedRole === 'admin') {
    return [
      { label: 'Overview', path: '/home-affairs', end: true },
      { label: 'Requests', path: '/home-affairs/requests', end: true },
      { label: 'Verify Citizens', path: '/home-affairs/verify', end: true },
      { label: 'Access Control', path: '/home-affairs/access', end: true },
    ];
  }

  return [
    { label: 'Overview', path: '/officer/dashboard', end: true },
    { label: 'Requests', path: '/officer/requests', end: true },
    { label: 'Citizen Search', path: '/officer/search', end: true },
    { label: 'History', path: '/officer/history', end: true },
  ];
};

const DEPARTMENT_NAMES = {
  home_affairs: 'Home Affairs',
  admin: 'Home Affairs',
  traffic: 'Traffic',
  finance: 'Finance',
  pension: 'Pensions',
  police: 'Police',
  passport: 'Passport Services',
};

const FLAG = {
  blue: '#00209F',
  blueSoft: '#edf2ff',
  green: '#009543',
  greenSoft: '#eaf8f0',
  black: '#000000',
  ink: '#172235',
  muted: '#718096',
  border: '#e5e9f0',
  white: '#ffffff',
};

const OfficerLayout = ({ children, title, subtitle, actions }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const role = normalizeRole(user?.role);
  const deptName = DEPARTMENT_NAMES[role] || 'Department';
  const navItems = getNavForRole(role);
  const isHomeAffairs = role === 'home_affairs' || role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!user) {
    return <div style={styles.loading}>Loading your workspace...</div>;
  }

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.flagStripe} aria-hidden="true" />
        <div style={styles.sidebarBrand}>
          <div
            style={{
              ...styles.brandMark,
              background: FLAG.blue,
              color: FLAG.white,
            }}
          >
            {deptName.charAt(0)}
          </div>

          <div>
            <div style={styles.brandName}>{deptName}</div>
            <div style={styles.brandSub}>Officer Portal</div>
          </div>
        </div>

        <nav style={styles.nav} aria-label="Officer navigation">
          {navItems.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={({ isActive }) =>
                `officer-nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="officer-nav-mark" aria-hidden="true" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userChip}>
            <div
              style={{
                ...styles.avatar,
                background: isHomeAffairs ? FLAG.green : FLAG.blue,
              }}
            >
              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            <div style={styles.userInfo}>
              <div style={styles.userName}>
                {user.full_name || 'Signed-in officer'}
              </div>
              <div style={styles.userRole}>
                {user.national_id || deptName}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={styles.logoutBtn}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>{title}</h1>
            {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
          </div>

          <div style={styles.actions}>{actions}</div>
        </header>

        <div style={styles.body}>{children}</div>
      </main>

      <style>{`
        .officer-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          box-sizing: border-box;
          width: 100%;
          min-height: 45px;
          padding: 0 13px;
          color: #4b5563;
          text-align: left;
          text-decoration: none;
          border: 1px solid transparent;
          border-radius: 12px;
          background: transparent;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: color .18s ease, background .18s ease,
                      border-color .18s ease, transform .18s ease;
        }

        .officer-nav-item:hover {
          color: #00209F;
          background: #edf2ff;
          transform: translateX(2px);
        }

        .officer-nav-item.active {
          color: #00209F;
          border-color: #c5d4f5;
          background: linear-gradient(90deg, #edf2ff, #f7f9ff);
          box-shadow: 0 5px 12px rgba(0,32,159,.06);
        }

        .officer-nav-mark {
          display: block;
          flex: 0 0 7px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #cbd5e1;
        }

        .officer-nav-item.active .officer-nav-mark {
          background: #009543;
          box-shadow: 0 0 0 4px #eaf8f0;
        }

        .officer-nav-item:focus-visible {
          outline: 2px solid #009543;
          outline-offset: 3px;
        }

        @media (max-width: 700px) {
          .officer-nav-item {
            min-height: 38px;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f7f9fc',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },

  sidebar: {
    boxSizing: 'border-box',
    width: 260,
    flex: '0 0 260px',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    position: 'sticky',
    top: 0,
    height: '100vh',
    background: 'linear-gradient(180deg, #ffffff 0%, #fbfcff 100%)',
    borderRight: `1px solid ${FLAG.border}`,
    boxShadow: '8px 0 25px rgba(18,35,62,.05)',
    overflow: 'hidden',
  },

  flagStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    background: 'linear-gradient(90deg, #00209F 0 42%, #000 42% 58%, #009543 58% 100%)',
  },

  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 8px 22px',
    marginBottom: 20,
    borderBottom: '1px solid #edf0f5',
  },

  brandMark: {
    width: 42,
    height: 42,
    display: 'grid',
    placeItems: 'center',
    borderRadius: 12,
    fontWeight: 900,
    fontSize: 15,
    boxShadow: '0 5px 12px rgba(0,32,159,.2)',
  },

  brandName: {
    color: FLAG.black,
    fontSize: 14,
    fontWeight: 800,
  },

  brandSub: {
    marginTop: 3,
    color: FLAG.green,
    fontSize: 10,
    fontWeight: 700,
  },

  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    flex: 1,
    minHeight: 0,
  },

  sidebarFooter: {
    paddingTop: 16,
    borderTop: '1px solid #edf0f5',
  },

  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 9,
    marginBottom: 10,
    borderRadius: 11,
    background: '#f7f9fc',
  },

  avatar: {
    width: 38,
    height: 38,
    display: 'grid',
    placeItems: 'center',
    flex: '0 0 38px',
    color: FLAG.white,
    borderRadius: '50%',
    fontWeight: 800,
    fontSize: 14,
    boxShadow: '0 0 0 3px #eaf8f0',
  },

  userInfo: {
    minWidth: 0,
    flex: 1,
  },

  userName: {
    overflow: 'hidden',
    color: FLAG.black,
    fontSize: 12,
    fontWeight: 800,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  userRole: {
    overflow: 'hidden',
    marginTop: 2,
    color: FLAG.muted,
    fontSize: 10,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  logoutBtn: {
    width: '100%',
    minHeight: 41,
    padding: 9,
    color: FLAG.blue,
    border: '1px solid #cbd6f2',
    borderRadius: 10,
    background: FLAG.white,
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all .18s ease',
  },

  main: {
    minWidth: 0,
    flex: 1,
    padding: '32px 40px',
  },

  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 24,
    flexWrap: 'wrap',
    marginBottom: 30,
  },

  title: {
    color: FLAG.black,
    fontSize: 26,
    fontWeight: 850,
    letterSpacing: '-.02em',
  },

  subtitle: {
    marginTop: 6,
    color: FLAG.muted,
    fontSize: 14,
  },

  actions: {
    display: 'flex',
    gap: 10,
  },

  body: {
    minHeight: '60vh',
    width: '100%',
  },

  loading: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    color: FLAG.blue,
    fontFamily: 'system-ui, sans-serif',
    fontSize: 14,
    fontWeight: 700,
  },
};

export default OfficerLayout;