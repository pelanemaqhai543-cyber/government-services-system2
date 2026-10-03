import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import OfficerLayout from '../components/OfficerLayout';
import StatCard from '../components/StatCard';
import RequestTable from '../components/RequestTable';

import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const DEPARTMENT_INFO = {
  traffic: {
    name: 'Traffic',
    icon: '🚗',
    description:
      "Process driver's licence and vehicle-related government services.",
    services: [
      'Driver Licence Applications',
      'Driver Licence Renewals',
      'Vehicle Registration',
      'Vehicle Services'
    ]
  },

  finance: {
    name: 'Finance',
    icon: '💰',
    description:
      'Process tax, revenue and financial government services.',
    services: [
      'Tax Applications',
      'Tax Registration',
      'Revenue Services',
      'Financial Records'
    ]
  },

  pension: {
    name: 'Pension',
    icon: '🏦',
    description:
      'Process pension applications and verify pension eligibility.',
    services: [
      'Pension Applications',
      'Eligibility Verification',
      'Retirement Benefits',
      'Pension Records'
    ]
  },

  police: {
    name: 'Police',
    icon: '🛡️',
    description:
      'Process police clearance and authorized background checks.',
    services: [
      'Police Clearance',
      'Background Checks',
      'Clearance Verification',
      'Police Records'
    ]
  },

  passport: {
    name: 'Passport',
    icon: '🛂',
    description:
      'Process passport applications, renewals and document reviews.',
    services: [
      'New Passport',
      'Passport Renewal',
      'Document Review',
      'Passport Applications'
    ]
  }
};

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const department = user?.role;

  const departmentInfo =
    DEPARTMENT_INFO[department] || {
      name: 'Government Department',
      icon: '🏛️',
      description: 'Government employee dashboard.',
      services: []
    };

  const loadRequests = async () => {
    try {
      setLoading(true);

      const response = await API.get('/requests/queue');

      setRequests(response.data || []);
    } catch (error) {
      console.error(
        'Failed to load employee requests:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [department]);

  /*
   * REQUEST STATISTICS
   */

  const pendingRequests = requests.filter(
    request =>
      request.status === 'submitted' ||
      request.status === 'pending'
  ).length;

  const inReviewRequests = requests.filter(
    request =>
      request.status === 'review' ||
      request.status === 'in_review'
  ).length;

  const readyRequests = requests.filter(
    request => request.status === 'ready'
  ).length;

  const completedRequests = requests.filter(
    request => request.status === 'completed'
  ).length;

  /*
   * UPDATE REQUEST STATUS
   */

  const handleStatusChange = async (
    requestId,
    status
  ) => {
    try {
      await API.put(
        `/requests/${requestId}/status`,
        {
          status
        }
      );

      setRequests(currentRequests =>
        currentRequests.map(request =>
          request.id === requestId
            ? {
                ...request,
                status
              }
            : request
        )
      );
    } catch (error) {
      console.error(
        'Failed to update request status:',
        error
      );
    }
  };

  return (
    <OfficerLayout
      title={`${departmentInfo.name} Employee`}
    >

      <div className="dashboard-page">

        {/* ================= HEADER ================= */}

        <div className="page-header">

          <div className="department-heading">

            <div className="department-large-icon">
              {departmentInfo.icon}
            </div>

            <div>

              <h1>
                {departmentInfo.name} Department
              </h1>

              <p>
                {departmentInfo.description}
              </p>

            </div>

          </div>

          <button
            className="primary-button"
            onClick={() =>
              navigate('/officer/search')
            }
          >
            Search Citizen
          </button>

        </div>

        {/* ================= EMPLOYEE INFO ================= */}

        <div className="employee-info-card">

          <div className="employee-avatar">
            {(user?.first_name ||
              user?.name ||
              'E')
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="employee-details">

            <h3>
              {user?.first_name
                ? `${user.first_name} ${
                    user.last_name || ''
                  }`
                : user?.name || 'Government Employee'}
            </h3>

            <p>
              Department:{' '}
              <strong>
                {departmentInfo.name}
              </strong>
            </p>

            <p>
              Role:{' '}
              <strong>Department Employee</strong>
            </p>

          </div>

          <div className="employee-status">
            <span className="online-dot"></span>
            Active
          </div>

        </div>

        {/* ================= STATISTICS ================= */}

        <div className="stats-grid">

          <StatCard
            title="Total Applications"
            value={requests.length}
            icon="▣"
          />

          <StatCard
            title="Pending"
            value={pendingRequests}
            icon="◷"
          />

          <StatCard
            title="In Review"
            value={inReviewRequests}
            icon="🔎"
          />

          <StatCard
            title="Completed"
            value={completedRequests}
            icon="✓"
          />

        </div>

        {/* ================= QUICK ACTIONS ================= */}

        <div className="section-header">

          <div>
            <h2>Quick Actions</h2>

            <p>
              Manage your department's government
              services.
            </p>
          </div>

        </div>

        <div className="employee-action-grid">

          <button
            className="employee-action-card"
            onClick={() =>
              navigate('/officer/requests')
            }
          >

            <div className="employee-action-icon">
              📋
            </div>

            <div>
              <h3>Applications</h3>

              <p>
                Review and process citizen
                applications.
              </p>
            </div>

          </button>

          <button
            className="employee-action-card"
            onClick={() =>
              navigate('/officer/search')
            }
          >

            <div className="employee-action-icon">
              🔎
            </div>

            <div>
              <h3>Search Citizen</h3>

              <p>
                Search authorized citizen
                information.
              </p>
            </div>

          </button>

          <button
            className="employee-action-card"
            onClick={() =>
              navigate('/officer/history')
            }
          >

            <div className="employee-action-icon">
              🕘
            </div>

            <div>
              <h3>Application History</h3>

              <p>
                View previously processed
                applications.
              </p>
            </div>

          </button>

        </div>

        {/* ================= DEPARTMENT SERVICES ================= */}

        <div className="section-header">

          <div>
            <h2>
              {departmentInfo.name} Services
            </h2>

            <p>
              Services available to your department.
            </p>
          </div>

        </div>

        <div className="employee-services-grid">

          {departmentInfo.services.map(
            (service, index) => (
              <div
                className="employee-service-card"
                key={index}
              >

                <div className="service-number">
                  {index + 1}
                </div>

                <div>
                  <h3>{service}</h3>

                  <p>
                    Authorized {departmentInfo.name.toLowerCase()}{' '}
                    department service.
                  </p>
                </div>

              </div>
            )
          )}

        </div>

        {/* ================= APPLICATION QUEUE ================= */}

        <div className="section-header">

          <div>

            <h2>Application Queue</h2>

            <p>
              Applications available for processing
              by your department.
            </p>

          </div>

          <button
            className="secondary-button"
            onClick={() =>
              navigate('/officer/requests')
            }
          >
            View All
          </button>

        </div>

        <div className="dashboard-panel">

          {loading ? (

            <div className="empty-state">
              Loading applications...
            </div>

          ) : requests.length === 0 ? (

            <div className="empty-state">
              No applications are currently
              available.
            </div>

          ) : (

            <RequestTable
              requests={requests.slice(0, 6)}
              showDepartment={false}
              onStatusChange={
                handleStatusChange
              }
            />

          )}

        </div>

        {/* ================= WORK SUMMARY ================= */}

        <div className="section-header">

          <div>

            <h2>Work Summary</h2>

            <p>
              Current workload for your department.
            </p>

          </div>

        </div>

        <div className="work-summary-grid">

          <div className="summary-card">

            <div className="summary-icon">
              📥
            </div>

            <div>

              <span>Pending Applications</span>

              <strong>
                {pendingRequests}
              </strong>

            </div>

          </div>

          <div className="summary-card">

            <div className="summary-icon">
              🔎
            </div>

            <div>

              <span>Applications In Review</span>

              <strong>
                {inReviewRequests}
              </strong>

            </div>

          </div>

          <div className="summary-card">

            <div className="summary-icon">
              📦
            </div>

            <div>

              <span>Ready Applications</span>

              <strong>
                {readyRequests}
              </strong>

            </div>

          </div>

          <div className="summary-card">

            <div className="summary-icon">
              ✅
            </div>

            <div>

              <span>Completed Applications</span>

              <strong>
                {completedRequests}
              </strong>

            </div>

          </div>

        </div>

      </div>

    </OfficerLayout>
  );
};

export default EmployeeDashboard;