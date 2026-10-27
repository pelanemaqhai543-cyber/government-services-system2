
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import OfficerLayout from '../../components/OfficerLayout';
import API from '../../utils/api';
import AISummaryPanel from '../../components/AISummaryPanel';

const STATUS_OPTIONS = [
  'pending',
  'submitted',
  'review',
  'ready',
  'approved',
  'rejected',
  'completed'
];

const statusClass = (status = '') =>
  `status-${String(status).toLowerCase().replace(/\s+/g, '-')}`;

const formatDate = (date) => {
  if (!date) return 'Not available';

  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? 'Not available'
    : parsed.toLocaleString();
};

const getDocumentName = (document) =>
  document?.file_name ||
  document?.original_name ||
  document?.name ||
  'Uploaded document';

const getDocumentUrl = (document) => {
  const value = document?.file_url || document?.file_path;

  if (!value || typeof value !== 'string') return '';

  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return value;
  if (value.startsWith('uploads/')) return `/${value}`;

  // Never expose server filesystem paths such as C:\...
  if (/^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('\\\\')) {
    return '';
  }

  return `/${value.replace(/^\.?\//, '')}`;
};

const isPreviewableDocument = (document) => {
  const name = getDocumentName(document).toLowerCase();
  const mime = String(
    document?.mime_type || document?.file_type || ''
  ).toLowerCase();

  return (
    mime === 'application/pdf' ||
    mime.startsWith('image/') ||
    /\.(pdf|png|jpe?g|gif|webp)$/i.test(name)
  );
};

const styles = {
  page: {
    padding: '24px',
    color: '#172033',
    fontFamily: 'Arial, sans-serif'
  },
  heading: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '20px'
  },
  muted: {
    color: '#64748b',
    fontSize: '14px'
  },
  controls: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '20px'
  },
  input: {
    padding: '11px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    minWidth: '220px',
    fontSize: '14px',
    background: '#fff'
  },
  button: {
    padding: '10px 14px',
    border: '0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600
  },
  primary: {
    background: '#126b4f',
    color: '#fff'
  },
  secondary: {
    background: '#e2e8f0',
    color: '#172033'
  },
  danger: {
    background: '#b91c1c',
    color: '#fff'
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '14px',
    marginBottom: '22px'
  },
  metric: {
    padding: '17px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px'
  },
  tableWrap: {
    width: '100%',
    overflowX: 'auto',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '780px'
  },
  th: {
    padding: '14px',
    background: '#f1f5f9',
    textAlign: 'left',
    fontSize: '13px',
    whiteSpace: 'nowrap'
  },
  td: {
    padding: '14px',
    borderTop: '1px solid #e2e8f0',
    fontSize: '14px',
    verticalAlign: 'top'
  },
  badge: {
    display: 'inline-block',
    padding: '5px 9px',
    borderRadius: '20px',
    background: '#e2e8f0',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'capitalize'
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'rgba(15, 23, 42, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px'
  },
  modal: {
    width: 'min(850px, 100%)',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: '14px',
    padding: '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,.25)'
  },
  section: {
    padding: '16px 0',
    borderBottom: '1px solid #e2e8f0'
  },
  document: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '9px',
    marginTop: '10px'
  }
};

export default function OfficerApplications() {
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await API.get('/requests/queue');
      const data = response.data;

      setApplications(Array.isArray(data) ? data : data?.applications || []);
    } catch (err) {
      console.error('Loading officer queue failed:', err);
      setError(
        err.response?.data?.message ||
        'Could not load applications. Check your login and backend.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus =
        statusFilter === 'all' ||
        String(application.status || '').toLowerCase() === statusFilter;

      const searchableText = [
        application.reference_number,
        application.full_name,
        application.national_id,
        application.email,
        application.service_type,
        application.department
      ].filter(Boolean).join(' ').toLowerCase();

      return matchesStatus && searchableText.includes(query);
    });
  }, [applications, search, statusFilter]);

  const metrics = useMemo(() => {
    const count = (status) =>
      applications.filter(
        (application) =>
          String(application.status || '').toLowerCase() === status
      ).length;

    return {
      total: applications.length,
      pending: count('pending'),
      review: count('review'),
      approved: count('approved'),
      rejected: count('rejected')
    };
  }, [applications]);

  const openApplication = async (application) => {
    setSelected(application);
    setNewStatus(String(application.status || 'pending').toLowerCase());
    setRejectionReason('');
    setNotice('');
    setError('');
    setOpening(true);

    try {
      const response = await API.get(`/requests/${application.id}`);
      const detail = response.data;

      setSelected({
        ...application,
        ...detail,
        documents: Array.isArray(detail.documents)
          ? detail.documents
          : application.documents || []
      });
      setNewStatus(String(detail.status || application.status || 'pending').toLowerCase());
    } catch (err) {
      // Queue data can still be reviewed if detail retrieval fails.
      console.warn('Detail request failed:', err);
      setSelected(application);
    } finally {
      setOpening(false);
    }
  };

  const closeApplication = () => {
    if (saving) return;
    setSelected(null);
    setError('');
    setNotice('');
  };

  const saveStatus = async (event) => {
    event.preventDefault();

    if (!selected) return;

    if (
      newStatus === 'rejected' &&
      !rejectionReason.trim()
    ) {
      setError('Enter a rejection reason before rejecting this application.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      await API.put(`/requests/${selected.id}/status`, {
        status: newStatus,
        rejection_reason: rejectionReason.trim()
      });

      setNotice('Application status updated successfully.');

      setApplications((current) =>
        current.map((application) =>
          application.id === selected.id
            ? { ...application, status: newStatus }
            : application
        )
      );

      setSelected((current) =>
        current ? { ...current, status: newStatus } : current
      );

      await loadApplications();
    } catch (err) {
      console.error('Updating application failed:', err);
      setError(
        err.response?.data?.message ||
        'Could not update application status.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <OfficerLayout>
      <main style={styles.page}>
        <header style={styles.heading}>
          <div>
            <h1 style={{ margin: '0 0 7px' }}>Officer Applications</h1>
            <p style={styles.muted}>
              Review applications, inspect supporting documents, and record decisions.
            </p>
          </div>

          <button
            type="button"
            style={{ ...styles.button, ...styles.primary }}
            onClick={loadApplications}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh queue'}
          </button>
        </header>

        {error && (
          <div role="alert" style={{
            padding: '12px',
            borderRadius: '8px',
            background: '#fee2e2',
            color: '#991b1b',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <section style={styles.metrics}>
          {[
            ['Total applications', metrics.total],
            ['Pending', metrics.pending],
            ['Under review', metrics.review],
            ['Approved', metrics.approved],
            ['Rejected', metrics.rejected]
          ].map(([label, value]) => (
            <div key={label} style={styles.metric}>
              <div style={styles.muted}>{label}</div>
              <div style={{ fontSize: '27px', fontWeight: 700, marginTop: '7px' }}>
                {value}
              </div>
            </div>
          ))}
        </section>

        <section style={styles.controls}>
          <input
            aria-label="Search applications"
            style={styles.input}
            placeholder="Search reference, name, ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            aria-label="Filter by status"
            style={styles.input}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option value={status} key={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </section>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Reference</th>
                <th style={styles.th}>Applicant</th>
                <th style={styles.th}>Service</th>
                <th style={styles.th}>Submitted</th>
                <th style={styles.th}>Documents</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td style={styles.td} colSpan="7">Loading applications...</td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan="7">
                    No applications match your search.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((application) => (
                  <tr key={application.id}>
                    <td style={styles.td}>
                      <strong>{application.reference_number || `#${application.id}`}</strong>
                    </td>
                    <td style={styles.td}>
                      <strong>{application.full_name || 'Unknown applicant'}</strong>
                      <div style={styles.muted}>
                        {application.national_id || 'No ID recorded'}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {application.service_type || 'Not specified'}
                      <div style={styles.muted}>
                        {application.department || ''}
                      </div>
                    </td>
                    <td style={styles.td}>{formatDate(application.created_at)}</td>
                    <td style={styles.td}>
                      {Number(application.document_count ?? application.documents?.length ?? 0)}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.badge} className={statusClass(application.status)}>
                        {application.status || 'pending'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        type="button"
                        style={{ ...styles.button, ...styles.primary }}
                        onClick={() => openApplication(application)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <div
            style={styles.modalBackdrop}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeApplication();
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="application-review-title"
              style={styles.modal}
            >
              <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <div>
                  <h2 id="application-review-title" style={{ marginTop: 0 }}>
                    Review application
                  </h2>
                  <div style={styles.muted}>
                    Reference: {selected.reference_number || `#${selected.id}`}
                  </div>
                </div>

                <button
                  type="button"
                  style={{ ...styles.button, ...styles.secondary }}
                  onClick={closeApplication}
                  disabled={saving}
                >
                  Close
                </button>
              </header>

              {opening && <p style={styles.muted}>Loading application details...</p>}

              {notice && (
                <p role="status" style={{ color: '#166534' }}>{notice}</p>
              )}

              {error && (
                <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>
              )}

              <section style={styles.section}>
                <h3>Applicant details</h3>
                <p><strong>Name:</strong> {selected.full_name || 'Not available'}</p>
                <p><strong>National ID:</strong> {selected.national_id || 'Not available'}</p>
                <p><strong>Email:</strong> {selected.email || 'Not available'}</p>
                <p><strong>Date of birth:</strong> {selected.date_of_birth || 'Not available'}</p>
                <p><strong>Service:</strong> {selected.service_type || 'Not specified'}</p>
                <p><strong>Department:</strong> {selected.department || 'Not specified'}</p>
                <p><strong>Submitted:</strong> {formatDate(selected.created_at)}</p>
                <p><strong>Current status:</strong> {selected.status || 'pending'}</p>
                <p>
                  <strong>Application notes:</strong><br />
                  {selected.notes || 'No notes provided.'}
                </p>
              </section>

              <section style={styles.section}>
                <h3>Supporting documents</h3>

                {Array.isArray(selected.documents) && selected.documents.length > 0 ? (
                  selected.documents.map((document, index) => {
                    const url = getDocumentUrl(document);
                    const name = getDocumentName(document);

                    return (
                      <div
                        key={document.id || `${name}-${index}`}
                        style={styles.document}
                      >
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ overflowWrap: 'anywhere' }}>{name}</strong>
                          <div style={styles.muted}>
                            Uploaded: {formatDate(document.uploaded_at)}
                          </div>
                        </div>

                        {url ? (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {isPreviewableDocument(document) && (
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  ...styles.button,
                                  ...styles.secondary,
                                  textDecoration: 'none'
                                }}
                              >
                                View
                              </a>
                            )}

                            <a
                              href={url}
                              download={name}
                              style={{
                                ...styles.button,
                                ...styles.primary,
                                textDecoration: 'none'
                              }}
                            >
                              Download
                            </a>
                          </div>
                        ) : (
                          <span style={{ ...styles.muted, color: '#b91c1c' }}>
                            File link unavailable
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p style={styles.muted}>
                    No documents are linked to this application.
                  </p>
                )}
              </section>

              {selected.ai_summary && (
                <section style={styles.section}>
                  <h3>AI review summary</h3>
                  <AISummaryPanel application={selected} />
                </section>
              )}

              <form onSubmit={saveStatus} style={styles.section}>
                <h3>Officer decision</h3>

                <label htmlFor="application-status">
                  Application status
                </label>

                <select
                  id="application-status"
                  style={{ ...styles.input, display: 'block', marginTop: '8px' }}
                  value={newStatus}
                  onChange={(event) => setNewStatus(event.target.value)}
                  disabled={saving || opening}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option value={status} key={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>

                {newStatus === 'rejected' && (
                  <div style={{ marginTop: '15px' }}>
                    <label htmlFor="rejection-reason">
                      Rejection reason (required)
                    </label>
                    <textarea
                      id="rejection-reason"
                      rows="4"
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      placeholder="Explain why the application is being rejected..."
                      required
                      style={{
                        ...styles.input,
                        display: 'block',
                        boxSizing: 'border-box',
                        width: '100%',
                        marginTop: '8px'
                      }}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving || opening}
                  style={{
                    ...styles.button,
                    ...styles.primary,
                    marginTop: '16px',
                    opacity: saving || opening ? 0.6 : 1
                  }}
                >
                  {saving ? 'Saving...' : 'Save decision'}
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </OfficerLayout>
  );
}
