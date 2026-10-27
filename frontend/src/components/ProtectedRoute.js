import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const normalizeRole = (role) =>
  String(role || '').trim().toLowerCase().replace(/[-\s]+/g, '_');

const homeFor = (role) => {
  const r = normalizeRole(role);
  if (r === 'citizen') return '/dashboard';
  if (r === 'home_affairs') return '/home-affairs';
  if (r === 'admin') return '/admin';
  return '/officer/dashboard';
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const auth = useAuth();
  const location = useLocation();
  const user = auth?.user;
  const authLoading = auth?.loading ?? auth?.isLoading ?? false;

  if (authLoading) {
    return (
      <div style={styles.loading} role="status" aria-live="polite">
        Checking your session...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  const userRole = normalizeRole(user.role);
  const permitted = allowedRoles.map(normalizeRole);
  const roleAllowed = permitted.length === 0 || permitted.includes(userRole);

  if (!roleAllowed) {
    const target = homeFor(userRole);

    // Already on their own home page but still not allowed: stop, don't loop.
    if (location.pathname === target) {
      return (
        <div style={styles.loading} role="alert">
          Your account does not have access to this page. Please contact an administrator.
        </div>
      );
    }
    return <Navigate to={target} replace state={{ unauthorized: true }} />;
  }

  return children;
};

const styles = {
  loading: {
    minHeight: '40vh',
    display: 'grid',
    placeItems: 'center',
    textAlign: 'center',
    padding: 24,
    color: '#00209F',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 14,
    fontWeight: 700,
  },
};

export default ProtectedRoute;