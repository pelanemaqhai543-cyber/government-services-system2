
import React, { useCallback, useEffect, useState } from 'react';

const API_BASE =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const styles = {
  page: {
    minHeight: '100vh',
    padding: '28px',
    background: '#f3f6f8',
    color: '#172b3a',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box'
  },
  header: {
    background: '#064b78',
    color: '#fff',
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '24px'
  },
  title: {
    margin: '0 0 8px',
    fontSize: '25px'
  },
  subtitle: {
    margin: 0,
    color: '#e0edf5'
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(280px, 0.85fr) minmax(0, 1.7fr)',
    gap: '22px',
    alignItems: 'start'
  },
  panel: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 3px 14px rgba(0,0,0,0.06)',
    marginBottom: '20px',
    minWidth: 0
  },
  sectionTitle: {
    margin: '0 0 16px',
    fontSize: '18px',
    color: '#064b78'
  },
  application: {
    width: '100%',
    textAlign: 'left',
    border: '1px solid #dce5eb',
    background: '#fff',
    borderRadius: '9px',
    padding: '14px',
    marginBottom: '10px',
    cursor: 'pointer',
    color: '#172b3a'
  },
  selectedApplication: {
    border: '2px solid #087b55',
    background: '#effaf5'
  },
  label: {
    display: 'block',
    fontWeight: 'bold',
    fontSize: '13px',
    marginBottom: '7px',
    color: '#34495e'
  },
  input: {
    width: '100%',
    padding: '11px',
    border: '1px solid #ccd8df',
    borderRadius: '7px',
    boxSizing: 'border-box',
    fontSize: '14px',
    marginBottom: '16px',
    background: '#fff'
  },
  textarea: {
    width: '100%',
    minHeight: '105px',
    padding: '11px',
    border: '1px solid #ccd8df',
    borderRadius: '7px',
    boxSizing: 'border-box',
    fontSize: '14px',
    resize: 'vertical',
    marginBottom: '16px',
    fontFamily: 'Arial, sans-serif'
  },
  button: {
    padding: '11px 17px',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#fff',
    background: '#087b55'
  },
  secondaryButton: {
    padding: '10px 15px',
    border: '1px solid #ccd8df',
    borderRadius: '7px',
    cursor: 'pointer',
    background: '#fff',
    color: '#064b78',
    fontWeight: 'bold'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px'
  },
  info: {
    background: '#f5f8fa',
    padding: '12px',
    borderRadius: '8px',
    overflowWrap: 'anywhere'
  },
  muted: {
    color: '#64748b',
    fontSize: '13px'
  },
  badge: {
    display: 'inline-block',
    padding: '5px 9px',
    borderRadius: '20px',
    background: '#e5f3ec',
    color: '#087b55',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'capitalize'
  },
  error: {
    background: '#fff0f0',
    color: '#a32323',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '15px'
  },
  success: {
    background: '#e9f8ef',
    color: '#087b55',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '15px'
  },
  historyItem: {
    borderLeft: '3px solid #087b55',
    padding: '10px 14px',
    marginBottom: '12px',
    background: '#f7faf9',
    borderRadius: '0 8px 8px 0'
  }
};

function getToken() {
  return localStorage.getItem('token');
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

function formatDate(value) {
  if (!value) return 'Not available';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString();
}

function OfficerApplications() {
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);

  const [decision, setDecision] = useState('review');
  const [recommendation, setRecommendation] = useState('');
  const [citizenMessage, setCitizenMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/requests/queue');

      if (!Array.isArray(data)) {
        throw new Error('The server returned an invalid application list.');
      }

      setApplications(data);

      setSelected(current => {
        if (!current) return null;
        return data.find(item => item.id === current.id) || null;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async (id) => {
    try {
      const data = await apiRequest(`/requests/${id}/history`);
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setHistory([]);
      setError(`Unable to load decision history: ${err.message}`);
    }
  }, []);

  const selectApplication = async (application) => {
    setSelected(application);
    setHistory([]);
    setError('');
    setSuccess('');

    setDecision('review');
    setRecommendation('');
    setCitizenMessage('');

    try {
      const details = await apiRequest(`/requests/${application.id}`);

      setSelected(details);
      await loadHistory(application.id);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleDecision = async (event) => {
    event.preventDefault();

    if (!selected) return;

    if (!citizenMessage.trim() && decision !== 'review') {
      setError('Enter a message for the citizen.');
      return;
    }

    if (
      decision === 'reject' &&
      !citizenMessage.trim()
    ) {
      setError('A rejection reason or citizen message is required.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const result = await apiRequest(
        `/requests/${selected.id}/status`,
        {
          method: 'PUT',
          body: JSON.stringify({
            decision,
            officer_recommendation: recommendation,
            citizen_message: citizenMessage
          })
        }
      );

      setSuccess(result.message || 'Decision saved successfully.');

      setSelected(current => ({
        ...current,
        status: result.status,
        officer_decision: result.decision,
        officer_recommendation: result.officer_recommendation,
        officer_feedback: result.citizen_message,
        officer_reviewed_at: result.reviewed_at
      }));

      setCitizenMessage('');
      setRecommendation('');

      await loadApplications();
      await loadHistory(selected.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const infoField = (label, value) => (
    <div style={styles.info} key={label}>
      <div style={styles.muted}>{label}</div>
      <div style={{ fontWeight: 'bold', marginTop: '5px' }}>
        {value || 'Not supplied'}
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>MyGov Lesotho | Officer Review</h1>
        <p style={styles.subtitle}>
          Review citizen applications, assess documents and record official
          officer decisions.
        </p>
      </header>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.layout}>
        {/* APPLICATION QUEUE */}
        <section style={styles.panel}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px'
          }}>
            <h2 style={styles.sectionTitle}>Application Queue</h2>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={loadApplications}
            >
              Refresh
            </button>
          </div>

          <p style={styles.muted}>
            {applications.length} application(s) available to your department.
          </p>

          {loading ? (
            <p>Loading applications...</p>
          ) : applications.length === 0 ? (
            <p>No applications found.</p>
          ) : (
            applications.map(application => {
              const active = selected?.id === application.id;

              return (
                <button
                  type="button"
                  key={application.id}
                  onClick={() => selectApplication(application)}
                  style={{
                    ...styles.application,
                    ...(active ? styles.selectedApplication : {})
                  }}
                >
                  <strong>
                    {application.reference_number}
                  </strong>

                  <div style={{ marginTop: '7px' }}>
                    {application.full_name || 'Unknown applicant'}
                  </div>

                  <div style={styles.muted}>
                    {application.service_type}
                  </div>

                  <div style={{ marginTop: '9px' }}>
                    <span style={styles.badge}>
                      {application.status}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </section>

        {/* APPLICATION REVIEW */}
        <main>
          {!selected ? (
            <section style={styles.panel}>
              <h2 style={styles.sectionTitle}>Application Details</h2>
              <p>Select an application from the queue to begin reviewing it.</p>
            </section>
          ) : (
            <>
              {/* APPLICANT INFORMATION */}
              <section style={styles.panel}>
                <h2 style={styles.sectionTitle}>Applicant Information</h2>

                <div style={styles.grid}>
                  {infoField('Reference number', selected.reference_number)}
                  {infoField('Applicant name', selected.full_name)}
                  {infoField('National ID', selected.national_id)}
                  {infoField('Email', selected.email)}
                  {infoField('Date of birth', selected.date_of_birth)}
                  {infoField('Gender', selected.gender)}
                  {infoField('District', selected.district)}
                  {infoField('Address', selected.address)}
                  {infoField('Service', selected.service_type)}
                  {infoField('Department', selected.department)}
                  {infoField('Application status', selected.status)}
                  {infoField('Submitted', formatDate(selected.created_at))}
                </div>

                <h3 style={{ marginTop: '22px' }}>Application Notes</h3>
                <div style={styles.info}>
                  {selected.notes || 'No application notes supplied.'}
                </div>
              </section>

              {/* DOCUMENTS */}
              <section style={styles.panel}>
                <h2 style={styles.sectionTitle}>Uploaded Documents</h2>

                {selected.documents?.length ? (
                  selected.documents.map(document => (
                    <div
                      key={document.id}
                      style={{
                        ...styles.info,
                        marginBottom: '10px'
                      }}
                    >
                      <strong>{document.file_name}</strong>

                      <div style={styles.muted}>
                        Uploaded: {formatDate(document.uploaded_at)}
                      </div>

                      <div style={styles.muted}>
                        Stored path: {document.file_path || 'Not available'}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No documents have been uploaded.</p>
                )}
              </section>

              {/* AI ASSESSMENT */}
              <section style={styles.panel}>
                <h2 style={styles.sectionTitle}>AI Assessment</h2>

                <div style={styles.grid}>
                  {infoField('AI recommendation', selected.ai_recommendation)}
                  {infoField('AI risk score', selected.ai_risk_score)}
                  {infoField('AI processed', formatDate(selected.ai_processed_at))}
                </div>

                <h3>AI Summary</h3>
                <div style={styles.info}>
                  {selected.ai_summary || 'No AI summary available.'}
                </div>

                <h3>AI Findings</h3>
                <div style={styles.info}>
                  <pre style={{
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    margin: 0,
                    fontFamily: 'Arial, sans-serif'
                  }}>
                    {selected.ai_findings
                      ? typeof selected.ai_findings === 'string'
                        ? selected.ai_findings
                        : JSON.stringify(selected.ai_findings, null, 2)
                      : 'No AI findings available.'}
                  </pre>
                </div>

                <p style={styles.muted}>
                  AI assessment is advisory. The authorized officer makes
                  the final application decision.
                </p>
              </section>

              {/* OFFICER DECISION */}
              <section style={styles.panel}>
                <h2 style={styles.sectionTitle}>Officer Review and Decision</h2>

                <form onSubmit={handleDecision}>
                  <label style={styles.label}>
                    Officer recommendation (internal)
                  </label>

                  <textarea
                    style={styles.textarea}
                    value={recommendation}
                    onChange={event => setRecommendation(event.target.value)}
                    placeholder="Enter your internal assessment and recommendation..."
                  />

                  <label style={styles.label}>
                    Decision
                  </label>

                  <select
                    style={styles.input}
                    value={decision}
                    onChange={event => setDecision(event.target.value)}
                  >
                    <option value="review">Continue reviewing</option>
                    <option value="request_info">Request more information</option>
                    <option value="approve">Approve application</option>
                    <option value="reject">Reject application</option>
                  </select>

                  <label style={styles.label}>
                    Message to citizen
                  </label>

                  <textarea
                    style={styles.textarea}
                    value={citizenMessage}
                    onChange={event => setCitizenMessage(event.target.value)}
                    placeholder="Write the message the applicant will receive..."
                  />

                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      ...styles.button,
                      opacity: saving ? 0.6 : 1
                    }}
                  >
                    {saving ? 'Saving decision...' : 'Submit Officer Decision'}
                  </button>
                </form>
              </section>

              {/* PREVIOUS OFFICER DECISION */}
              <section style={styles.panel}>
                <h2 style={styles.sectionTitle}>Previous Officer Review</h2>

                {infoField('Last decision', selected.officer_decision)}
                {infoField(
                  'Officer recommendation',
                  selected.officer_recommendation
                )}
                {infoField(
                  'Citizen message',
                  selected.officer_feedback
                )}
                {infoField(
                  'Reviewed date',
                  formatDate(selected.officer_reviewed_at)
                )}
              </section>

              {/* DECISION HISTORY */}
              <section style={styles.panel}>
                <h2 style={styles.sectionTitle}>Decision History</h2>

                {history.length === 0 ? (
                  <p>No previous officer decisions recorded.</p>
                ) : (
                  history.map(item => (
                    <div key={item.id} style={styles.historyItem}>
                      <strong>
                        {item.decision || item.new_status}
                      </strong>

                      <div style={styles.muted}>
                        Officer: {item.officer_name || item.officer_id}
                      </div>

                      <div style={styles.muted}>
                        {formatDate(item.created_at)}
                      </div>

                      <p>
                        Status: {item.previous_status || 'New'} →{' '}
                        {item.new_status}
                      </p>

                      <p>
                        <strong>Internal recommendation:</strong><br />
                        {item.officer_recommendation || 'None'}
                      </p>

                      <p>
                        <strong>Citizen message:</strong><br />
                        {item.citizen_message || 'None'}
                      </p>
                    </div>
                  ))
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default OfficerApplications;
