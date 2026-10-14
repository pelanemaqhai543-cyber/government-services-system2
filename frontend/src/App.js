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
import EmployeeDashboard from './pages/EmployeeDashboard';

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
              CITIZEN DASHBOARD
          ================================================== */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              APPLY FOR SERVICE
          ================================================== */}
          <Route
            path="/apply"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <Apply />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              MY PROFILE
          ================================================== */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              LEGACY CITIZEN PAGES
          ================================================== */}
          <Route
            path="/new-request"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <NewRequest />
              </ProtectedRoute>
            }
          />

          <Route
            path="/renewal"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <Renewal />
              </ProtectedRoute>
            }
          />

          <Route
            path="/track"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <TrackRequest />
              </ProtectedRoute>
            }
          />

          <Route
            path="/history"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <TrackRequest />
              </ProtectedRoute>
            }
          />

          <Route
            path="/services"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <GovernmentServices />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              ADMIN DASHBOARD
              Role: admin
          ================================================== */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/verify"
            element={
              <ProtectedRoute allowedRoles={['admin', 'home_affairs']}>
                <AdminVerify />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/access"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAccess />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              HOME AFFAIRS ADMIN / OFFICER
              Role: home_affairs
          ================================================== */}
          <Route
            path="/home-affairs"
            element={
              <ProtectedRoute allowedRoles={['home_affairs']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Home Affairs — Cross-department applications view (NEW) */}
          <Route
            path="/home-affairs/applications"
            element={
              <ProtectedRoute allowedRoles={['home_affairs']}>
                <AdminApplications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/home-affairs/verify"
            element={
              <ProtectedRoute allowedRoles={['home_affairs']}>
                <AdminVerify />
              </ProtectedRoute>
            }
          />

          <Route
            path="/home-affairs/requests"
            element={
              <ProtectedRoute allowedRoles={['home_affairs']}>
                <AdminRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/home-affairs/access"
            element={
              <ProtectedRoute allowedRoles={['home_affairs']}>
                <AdminAccess />
              </ProtectedRoute>
            }
          />

          {/* Home Affairs - Report Citizen Death */}
          <Route
            path="/home-affairs/report-death"
            element={
              <ProtectedRoute allowedRoles={['home_affairs']}>
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
              <ProtectedRoute allowedRoles={['traffic', 'finance', 'pension', 'police', 'passport']}>
                <OfficerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Officer — Citizen applications queue (NEW) */}
          <Route
            path="/officer/applications"
            element={
              <ProtectedRoute allowedRoles={['traffic', 'finance', 'pension', 'police', 'passport']}>
                <OfficerApplications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/officer/requests"
            element={
              <ProtectedRoute allowedRoles={['traffic', 'finance', 'pension', 'police', 'passport']}>
                <OfficerRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/officer/search"
            element={
              <ProtectedRoute allowedRoles={['traffic', 'finance', 'pension', 'police', 'passport']}>
                <OfficerSearch />
              </ProtectedRoute>
            }
          />

          <Route
            path="/officer/history"
            element={
              <ProtectedRoute allowedRoles={['traffic', 'finance', 'pension', 'police', 'passport']}>
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