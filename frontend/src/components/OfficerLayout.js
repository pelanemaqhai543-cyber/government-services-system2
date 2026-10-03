import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const normalizeRole = (role) => String(role || '').trim().toLowerCase().replace(/[-\s]+/g, '_');

const getNavForRole = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === 'home_affairs' || normalizedRole === 'admin') {
    return [
      { label: 'Overview', path: '/home-affairs' },
      { label: 'Requests', path: '/home-affairs/requests' },
      { label: 'Verify Citizens', path: '/home-affairs/verify' },
      { label: 'Access Control', path: '/home-affairs/access' },
    ];
  }

  return [
    { label: 'Overview', path: '/officer/dashboard' },
    { label: 'Requests', path: '/officer/requests' },
    { label: 'Citizen Search', path: '/officer/search' },
    { label: 'History', path: '/officer/history' },
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
  const location = useLocation();
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
        <div style={styles.sidebarBrand}>
          <div style={{ ...styles.brandMark, background: FLAG.blue, color: FLAG.white }}>
            {deptName.charAt(0)}
          </div>
          <div><div style={styles.brandName}>{deptName}</div><div style={styles.brandSub}>Officer Portal</div></div>
        </div>

        <nav style={styles.nav} aria-label="Officer navigation">
          {navItems.map((link) => {
            const active = location.pathname === link.path || location.pathname.startsWith(`${link.path}/`);
            return (
              <button key={link.path} type="button" onClick={() => navigate(link.path)} style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}>
                <span style={{ ...styles.navMark, ...(active ? styles.navMarkActive : {}) }} />
                {link.label}
              </button>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userChip}>
            <div style={{ ...styles.avatar, background: isHomeAffairs ? FLAG.green : FLAG.blue }}>{user?.full_name?.charAt(0)?.toUpperCase() || 'U'}</div>
            <div style={styles.userInfo}><div style={styles.userName}>{user?.full_name || 'Signed-in officer'}</div><div style={styles.userRole}>{user?.national_id || deptName}</div></div>
          </div>
          <button type="button" onClick={handleLogout} style={styles.logoutBtn}>Sign out</button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}><div><h1 style={styles.title}>{title}</h1>{subtitle && <p style={styles.subtitle}>{subtitle}</p>}</div><div style={styles.actions}>{actions}</div></header>
        <div style={styles.body}>{children}</div>
      </main>
    </div>
  );
};

const styles = {
  page: { display: 'flex', minHeight: '100vh', background: '#f7f9fc', fontFamily: "'Inter', 'Segoe UI', sans-serif" },
  sidebar: { width: 260, flex: '0 0 260px', display: 'flex', flexDirection: 'column', padding: '24px 16px', position: 'sticky', top: 0, height: '100vh', background: FLAG.white, borderRight: `1px solid ${FLAG.border}` },
  sidebarBrand: { display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px 24px', marginBottom: 20, borderBottom: '1px solid #f0f2f5' },
  brandMark: { width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: 11, fontWeight: 900, fontSize: 16 },
  brandName: { color: FLAG.black, fontSize: 14, fontWeight: 800 },
  brandSub: { marginTop: 3, color: FLAG.muted, fontSize: 11 },
  nav: { display: 'flex', flexDirection: 'column', gap: 5, flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 13px', color: '#4b5563', textAlign: 'left', border: '1px solid transparent', borderRadius: 10, background: 'transparent', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  navItemActive: { color: FLAG.blue, borderColor: '#cbd8f4', background: FLAG.blueSoft },
  navMark: { width: 6, height: 6, flex: '0 0 6px', borderRadius: '50%', background: '#cbd5e1' },
  navMarkActive: { background: FLAG.green, boxShadow: `0 0 0 3px ${FLAG.greenSoft}` },
  sidebarFooter: { paddingTop: 16, borderTop: '1px solid #f0f2f5' },
  userChip: { display: 'flex', alignItems: 'center', gap: 10, padding: 8, marginBottom: 10, borderRadius: 10, background: '#f7f9fc' },
  avatar: { width: 34, height: 34, display: 'grid', placeItems: 'center', flex: '0 0 34px', color: FLAG.white, borderRadius: '50%', fontWeight: 800, fontSize: 13 },
  userInfo: { minWidth: 0, flex: 1 },
  userName: { overflow: 'hidden', color: FLAG.black, fontSize: 12, fontWeight: 800, textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userRole: { overflow: 'hidden', marginTop: 2, color: FLAG.muted, fontSize: 10, textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logoutBtn: { width: '100%', padding: '9px', color: FLAG.blue, border: `1px solid #cbd6f2`, borderRadius: 10, background: FLAG.white, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' },
  main: { minWidth: 0, flex: 1, padding: '32px 40px' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 30 },
  title: { color: FLAG.black, fontSize: 26, fontWeight: 850, letterSpacing: '-.02em' },
  subtitle: { marginTop: 6, color: FLAG.muted, fontSize: 14 },
  actions: { display: 'flex', gap: 10 },
  body: { minHeight: '60vh', width: '100%' },
  loading: { minHeight: '100vh', display: 'grid', placeItems: 'center', color: FLAG.blue, fontFamily: 'system-ui, sans-serif', fontSize: 14, fontWeight: 700 },
};

export default OfficerLayout;
