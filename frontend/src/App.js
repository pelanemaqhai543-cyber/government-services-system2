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

// =====================================================
// OFFICER PAGES
// =====================================================
import OfficerDashboard from './pages/officer/OfficerDashboard';
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
          <Route
            path="/"
            element={<Home />}
          />

          {/* =================================================
              AUTHENTICATION
          ================================================== */}
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

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
              NEW SERVICE REQUEST
          ================================================== */}
          <Route
            path="/new-request"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <NewRequest />
              </ProtectedRoute>
            }
          />


          {/* =================================================
              SERVICE RENEWAL
          ================================================== */}
          <Route
            path="/renewal"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <Renewal />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              TRACK REQUEST
          ================================================== */}
          <Route
            path="/track"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <TrackRequest />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              APPLICATION HISTORY
          ================================================== */}
          <Route
            path="/history"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <TrackRequest />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              GOVERNMENT SERVICES
          ================================================== */}
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
              
              Role:
              admin
          ================================================== */}

          {/* Admin Main Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin - Verify Citizens */}
          <Route
            path="/admin/verify"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminVerify />
              </ProtectedRoute>
            }
          />

          {/* Admin - Manage Requests */}
          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminRequests />
              </ProtectedRoute>
            }
          />

          {/* Admin - Manage Access */}
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
              
              Role:
              home_affairs
              
              Home Affairs gets its own admin-style interface.
          ================================================== */}

          {/* Home Affairs Dashboard */}
          <Route
            path="/home-affairs"
            element={
              <ProtectedRoute allowedRoles={['home_affairs']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Home Affairs - Verify */}
          <Route
            path="/home-affairs/verify"
            element={
              <ProtectedRoute allowedRoles={['home_affairs']}>
                <AdminVerify />
              </ProtectedRoute>
            }
          />

          {/* Home Affairs - Requests */}
          <Route
            path="/home-affairs/requests"
            element={
              <ProtectedRoute allowedRoles={['home_affairs']}>
                <AdminRequests />
              </ProtectedRoute>
            }
          />

          {/* Home Affairs - Access */}
          <Route
            path="/home-affairs/access"
            element={
              <ProtectedRoute allowedRoles={['home_affairs']}>
                <AdminAccess />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              DEPARTMENT OFFICERS
              
              Roles:
              traffic
              finance
              pension
              police
              passport
          ================================================== */}

          {/* Officer Dashboard */}
          <Route
            path="/officer/dashboard"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'traffic',
                  'finance',
                  'pension',
                  'police',
                  'passport'
                ]}
              >
                <OfficerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Officer Requests */}
          <Route
            path="/officer/requests"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'traffic',
                  'finance',
                  'pension',
                  'police',
                  'passport'
                ]}
              >
                <OfficerRequests />
              </ProtectedRoute>
            }
          />

          {/* Officer Search */}
          <Route
            path="/officer/search"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'traffic',
                  'finance',
                  'pension',
                  'police',
                  'passport'
                ]}
              >
                <OfficerSearch />
              </ProtectedRoute>
            }
          />

          {/* Officer History */}
          <Route
            path="/officer/history"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'traffic',
                  'finance',
                  'pension',
                  'police',
                  'passport'
                ]}
              >
                <OfficerHistory />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              UNKNOWN URL
              
              Send unknown pages back to Home.
          ================================================== */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;