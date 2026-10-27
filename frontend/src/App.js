import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// =====================================================
// PUBLIC PAGES
// =====================================================
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// =====================================================
// CITIZEN PAGES
// =====================================================
import CitizenDashboard from './pages/CitizenDashboard';
import Apply from './pages/Apply';
import Profile from './pages/Profile';
import NewRequest from './pages/NewRequest';
import Renewal from './pages/Renewal';
import TrackRequest from './pages/TrackRequest';
import GovernmentServices from './pages/GovernmentServices';

// =====================================================
// ADMIN PAGES
// =====================================================
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVerify from './pages/admin/AdminVerify';
import AdminRequests from './pages/admin/AdminRequests';
import AdminAccess from './pages/admin/AdminAccess';
import AdminApplications from './pages/admin/AdminApplications';
import ReportDeath from './pages/ReportDeath';

// =====================================================
// OFFICER PAGES
// =====================================================
import OfficerDashboard from './pages/officer/OfficerDashboard';
import OfficerApplications from './pages/officer/OfficerApplications';
import OfficerRequests from './pages/officer/OfficerRequests';
import OfficerSearch from './pages/officer/OfficerSearch';
import OfficerHistory from './pages/officer/OfficerHistory';

// Role groups (the backend gives admin the same access as home_affairs)
const CITIZEN = ['citizen'];
const ADMIN_ONLY = ['admin'];
const HOME_AFFAIRS_ROLES = ['home_affairs', 'admin'];
const OFFICER_ROLES = ['traffic', 'finance', 'pension', 'police', 'passport'];

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* =================================================
              HOME / LANDING PAGE
          ================================================== */}
          <Route path="/" element={<Home />} />

          {/* =================================================
              AUTHENTICATION
          ================================================== */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* =================================================
              CITIZEN PAGES
          ================================================== */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={CITIZEN}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/apply"
            element={
              <ProtectedRoute allowedRoles={CITIZEN}>
                <Apply />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={CITIZEN}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Legacy citizen pages */}
          <Route
            path="/new-request"
            element={
              <ProtectedRoute allowedRoles={CITIZEN}>
                <NewRequest />
              </ProtectedRoute>
            }
          />

          <Route
            path="/renewal"
            element={
              <ProtectedRoute allowedRoles={CITIZEN}>
                <Renewal />
              </ProtectedRoute>
            }
          />

          <Route
            path="/track"
            element={
              <ProtectedRoute allowedRoles={CITIZEN}>
                <TrackRequest />
              </ProtectedRoute>
            }
          />

          <Route
            path="/history"
            element={
              <ProtectedRoute allowedRoles={CITIZEN}>
                <TrackRequest />
              </ProtectedRoute>
            }
          />

          <Route
            path="/services"
            element={
              <ProtectedRoute allowedRoles={CITIZEN}>
                <GovernmentServices />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              ADMIN
              Role: admin
          ================================================== */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ONLY}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ONLY}>
                <AdminApplications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/verify"
            element={
              <ProtectedRoute allowedRoles={HOME_AFFAIRS_ROLES}>
                <AdminVerify />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ONLY}>
                <AdminRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/access"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ONLY}>
                <AdminAccess />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/report-death"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ONLY}>
                <ReportDeath />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              HOME AFFAIRS
              Roles: home_affairs, admin
          ================================================== */}
          <Route
            path="/home-affairs"
            element={
              <ProtectedRoute allowedRoles={HOME_AFFAIRS_ROLES}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/home-affairs/applications"
            element={
              <ProtectedRoute allowedRoles={HOME_AFFAIRS_ROLES}>
                <AdminApplications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/home-affairs/verify"
            element={
              <ProtectedRoute allowedRoles={HOME_AFFAIRS_ROLES}>
                <AdminVerify />
              </ProtectedRoute>
            }
          />

          <Route
            path="/home-affairs/requests"
            element={
              <ProtectedRoute allowedRoles={HOME_AFFAIRS_ROLES}>
                <AdminRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/home-affairs/access"
            element={
              <ProtectedRoute allowedRoles={HOME_AFFAIRS_ROLES}>
                <AdminAccess />
              </ProtectedRoute>
            }
          />

          <Route
            path="/home-affairs/report-death"
            element={
              <ProtectedRoute allowedRoles={HOME_AFFAIRS_ROLES}>
                <ReportDeath />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              DEPARTMENT OFFICERS
              Roles: traffic, finance, pension, police, passport
          ================================================== */}
          <Route
            path="/officer/dashboard"
            element={
              <ProtectedRoute allowedRoles={OFFICER_ROLES}>
                <OfficerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/officer/applications"
            element={
              <ProtectedRoute allowedRoles={OFFICER_ROLES}>
                <OfficerApplications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/officer/requests"
            element={
              <ProtectedRoute allowedRoles={OFFICER_ROLES}>
                <OfficerRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/officer/search"
            element={
              <ProtectedRoute allowedRoles={OFFICER_ROLES}>
                <OfficerSearch />
              </ProtectedRoute>
            }
          />

          <Route
            path="/officer/history"
            element={
              <ProtectedRoute allowedRoles={OFFICER_ROLES}>
                <OfficerHistory />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              UNKNOWN URL
          ================================================== */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;