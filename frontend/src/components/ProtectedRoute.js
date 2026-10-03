import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const normalizeRole = (role) => String(role || '').trim().toLowerCase().replace(/[-\s]+/g, '_');

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const auth = useAuth();
  const location = useLocation();
  const user = auth?.user;
  const authLoading = auth?.loading ?? auth?.isLoading ?? false;

  // Do not redirect while AuthContext is restoring the saved session.
  if (authLoading) {
    return (
      <div style={styles.loading} role="status" aria-live="polite">
        Checking your session...
      </div>
    );
  }

  // Only unauthenticated users should be sent to the login page.
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
  const permittedRoles = allowedRoles.map(normalizeRole);
  const hasRoleRestriction = permittedRoles.length > 0;
  const roleAllowed = !hasRoleRestriction || permittedRoles.includes(userRole);

  // An authenticated user with the wrong role is not a login failure.
  // Send them to a safe page instead of creating a sign-in redirect loop.
  if (!roleAllowed) {
    const fallbackPath = userRole === 'home_affairs' || userRole === 'admin'
      ? '/home-affairs'
      : '/officer/dashboard';

    return <Navigate to={fallbackPath} replace state={{ unauthorized: true }} />;
  }

  return children;
};

const styles = {
  loading: {
    minHeight: '40vh',
    display: 'grid',
    placeItems: 'center',
    color: '#00209F',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 14,
    fontWeight: 700,
  },
};

export default ProtectedRoute;
