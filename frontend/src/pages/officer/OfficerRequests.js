
import React, { useEffect, useMemo, useState } from 'react';
import OfficerLayout from '../../components/OfficerLayout';
import API from '../../utils/api';
import AISummaryPanel from '../../components/AISummaryPanel';

const STATUSES = [
  'all', 'submitted', 'pending', 'review',
  'ready', 'approved', 'completed', 'rejected'
];

const STATUS_COLORS = {
  submitted: { bg: '#ede9fe', color: '#6d28d9' },
  pending: { bg: '#fef3c7', color: '#b45309' },
  review: { bg: '#fef3c7', color: '#b45309' },
  ready: { bg: '#e0f2fe', color: '#0369a1' },
  approved: { bg: '#dcfce7', color: '#15803d' },
  completed: { bg: '#dcfce7', color: '#15803d' },
  rejected: { bg: '#fee2e2', color: '#b91c1c' }
};

const Icon = ({ name, size = 18 }) => {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };

  const paths = {
    search: <>
      <circle cx="10.8" cy="10.8" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>,
    refresh: <>
      <path d="M20 11a8 8 0 0 0-14.8-3L3 11" />
      <path d="M3 5v6h6" />
      <path d="M4 13a8 8 0 0 0 14.8 3L21 13" />
      <path d="M21 19v-6h-6" />
    </>,
    doc: <>
      <path d="M6 3.5h8l4 4V20.5H6z" />
      <path d="M14 3.5v4h4M9 12h6M9 16h6" />
    </>,
    clock: <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
    </>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  };

  return <svg {...props}>{paths[name]}</svg>;
};

const styles = `
.requests-page {
  --blue:#00209F;
  --blue-dark:#00166f;
  --blue-soft:#edf2ff;
  --green:#009543;
  --green-soft:#eaf8f0;
  --ink:#172235;
  --muted:#718096;
  --border:#e5e9f0;
  color:var(--ink);
  width:min(100%,1440px);
  margin:0 auto;
  padding:0 2px 32px;
}
.requests-page * { box-sizing:border-box; }
.requests-page button,.requests-page input,.requests-page select,.requests-page textarea { font:inherit; }
.requests-page button { cursor:pointer; }
.requests-page h1,.requests-page h2,.requests-page p { margin:0; }

.requests-page .hero {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:20px;
  min-height:188px;
  padding:30px 32px;
  margin-bottom:24px;
  border-radius:22px;
  background:linear-gradient(118deg,#00145f,#00209f 58%,#003dbb);
  box-shadow:0 18px 40px rgba(0,32,159,.18);
  color:#fff;
}
.requests-page .eyebrow {
  display:flex;
  align-items:center;
  gap:9px;
  margin-bottom:10px;
  color:#baf2cf;
  font-size:11px;
  font-weight:800;
  letter-spacing:.13em;
  text-transform:uppercase;
}
.requests-page .eyebrow span {
  width:8px;
  height:8px;
  border-radius:50%;
  background:#20c778;
}
.requests-page h1 {
  color:#fff;
  font-size:clamp(28px,3.2vw,42px);
  letter-spacing:-.055em;
}
.requests-page .hero p {
  margin-top:9px;
  color:rgba(255,255,255,.78);
  font-size:14px;
  line-height:1.55;
}
.requests-page .refresh-button {
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  min-height:40px;
  padding:0 14px;
  color:#063d22;
  border:1px solid #7ce4ad;
  border-radius:10px;
  background:#baf4d2;
  font-size:12px;
  font-weight:800;
}
.requests-page .summary-grid {
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:13px;
  margin-bottom:20px;
}
.requests-page .summary-card {
  position:relative;
  display:flex;
  align-items:center;
  gap:12px;
  min-height:88px;
  padding:16px;
  border:1px solid var(--border);
  border-radius:14px;
  background:#fff;
  box-shadow:0 7px 20px rgba(20,35,60,.045);
}
.requests-page .summary-icon {
  display:grid;
  place-items:center;
  width:38px;
  height:38px;
  color:var(--blue);
  border-radius:10px;
  background:var(--blue-soft);
}
.requests-page .summary-card span {
  display:block;
  color:var(--muted);
  font-size:11px;
  font-weight:700;
}
.requests-page .summary-card strong {
  display:block;
  margin-top:3px;
  color:#000;
  font-size:23px;
}
.requests-page .filter-panel,.requests-page .table-panel {
  padding:18px;
  border:1px solid var(--border);
  border-radius:15px;
  background:#fff;
  box-shadow:0 10px 26px rgba(20,35,60,.06);
}
.requests-page .filter-heading,.requests-page .table-heading {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:15px;
}
.requests-page .filter-heading { margin-bottom:13px; }
.requests-page .filter-heading h2,.requests-page .table-heading h2 {
  color:#000;
  font-size:16px;
}
.requests-page .filter-heading span,.requests-page .table-heading p {
  color:var(--muted);
  font-size:12px;
}
.requests-page .search-wrap { position:relative; }
.requests-page .search-wrap svg {
  position:absolute;
  top:50%;
  left:14px;
  color:var(--blue);
  transform:translateY(-50%);
}
.requests-page .search {
  width:100%;
  min-height:44px;
  padding:0 16px 0 42px;
  color:var(--ink);
  outline:none;
  border:1px solid var(--border);
  border-radius:10px;
  background:#fbfcff;
  font-size:13px;
}
.requests-page .search:focus {
  border-color:#a9bde9;
  box-shadow:0 0 0 3px var(--blue-soft);
}
.requests-page .chips {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-top:13px;
}
.requests-page .chip {
  min-height:34px;
  padding:0 13px;
  color:var(--muted);
  border:1px solid var(--border);
  border-radius:99px;
  background:#fff;
  font-size:11px;
  font-weight:800;
  text-transform:capitalize;
}
.requests-page .chip.active {
  color:#fff;
  border-color:var(--blue);
  background:var(--blue);
}
.requests-page .table-heading { margin:24px 0 12px; }
.requests-page .table-heading p { margin-top:5px; }
.requests-page .table-panel { overflow:auto; padding:4px; }
.requests-page .empty-state {
  padding:44px 20px;
  color:var(--muted);
  text-align:center;
  font-size:13px;
}
.requests-page table {
  width:100%;
  min-width:800px;
  border-collapse:collapse;
  font-size:13px;
}
.requests-page th {
  padding:14px 16px;
  color:#fff;
  background:#00209f;
  text-align:left;
  font-size:11px;
  text-transform:uppercase;
}
.requests-page td {
  padding:16px;
  border-bottom:1px solid #f0f2f5;
}
.requests-page tbody tr:hover { background:#f6f9ff; }

/* REVIEW MODAL */
.requests-page .overlay {
  position:fixed;
  inset:0;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:20px;
  background:rgba(10,20,40,.65);
  z-index:1000;
}
.requests-page .modal {
  width:min(850px,100%);
  max-height:92vh;
  overflow-y:auto;
  border:1px solid #cbd8fa;
  border-radius:18px;
  background:#fff;
  box-shadow:0 28px 80px rgba(0,0,0,.28);
}
.requests-page .modal-head {
  position:sticky;
  top:0;
  z-index:2;
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:16px;
  padding:22px 26px;
  border-bottom:1px solid var(--border);
  background:#f8faff;
}
.requests-page .modal-head h2 { font-size:19px; color:#00209f; }
.requests-page .modal-head p { margin-top:6px; color:var(--muted); font-size:12px; }
.requests-page .close {
  padding:6px;
  border:0;
  background:transparent;
  color:var(--muted);
}
.requests-page .modal-body { padding:22px 26px; }
.requests-page .applicant-card {
  display:flex;
  align-items:center;
  gap:14px;
  padding:14px;
  margin-bottom:20px;
  border:1px solid var(--border);
  border-radius:12px;
  background:linear-gradient(100deg,#edf2ff,#f5fbf7);
}
.requests-page .applicant-avatar {
  display:grid;
  place-items:center;
  flex-shrink:0;
  width:52px;
  height:52px;
  overflow:hidden;
  border-radius:50%;
  background:#00209f;
  color:#fff;
  font-size:20px;
  font-weight:800;
}
.requests-page .applicant-avatar img {
  width:100%;
  height:100%;
  object-fit:cover;
}
.requests-page .applicant-name { font-size:15px; font-weight:800; }
.requests-page .applicant-meta { margin-top:3px; color:var(--muted); font-size:12px; }
.requests-page .detail-section { margin-bottom:24px; }
.requests-page .detail-section h3 {
  margin-bottom:12px;
  padding-bottom:8px;
  border-bottom:1px solid var(--border);
  color:#00209f;
  font-size:12px;
  font-weight:800;
  letter-spacing:.1em;
  text-transform:uppercase;
}
.requests-page .field-grid {
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:14px;
}
.requests-page .field label {
  display:block;
  margin-bottom:4px;
  color:var(--muted);
  font-size:11px;
  font-weight:800;
  text-transform:capitalize;
}
.requests-page .field div { font-size:13.5px; overflow-wrap:anywhere; }
.requests-page .doc-list { display:grid; gap:8px; }
.requests-page .doc {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  padding:10px 14px;
  border:1px solid var(--border);
  border-radius:10px;
  background:#f7f9fc;
  font-size:12.5px;
}
.requests-page .doc a {
  color:#00209f;
  text-decoration:none;
  font-size:11.5px;
  font-weight:800;
}
.requests-page .review-label {
  display:block;
  margin-bottom:8px;
  color:#26364b;
  font-size:12px;
  font-weight:800;
}
.requests-page .review-input {
  display:block;
  width:100%;
  min-height:44px;
  padding:12px;
  margin-bottom:18px;
  border:1px solid #d5dce8;
  border-radius:9px;
  background:#fff;
  color:#172235;
  font-size:13px;
}
.requests-page textarea.review-input {
  min-height:110px;
  resize:vertical;
  font-family:Arial,sans-serif;
}
.requests-page .review-input:focus {
  outline:none;
  border-color:#8ba7e8;
  box-shadow:0 0 0 3px #edf2ff;
}
.requests-page .notice {
  padding:13px;
  margin-bottom:18px;
  border-radius:9px;
  background:#edf2ff;
  color:#00209f;
  font-size:12px;
  line-height:1.5;
}
.requests-page .review-error,.requests-page .review-success {
  padding:12px;
  margin-bottom:15px;
  border-radius:9px;
  font-size:13px;
}
.requests-page .review-error { background:#fee2e2; color:#b91c1c; }
.requests-page .review-success { background:#dcfce7; color:#15803d; }
.requests-page .submit-decision {
  width:100%;
  padding:14px;
  border:0;
  border-radius:9px;
  background:#00209f;
  color:#fff;
  font-size:13px;
  font-weight:800;
}
.requests-page .submit-decision:disabled {
  cursor:not-allowed;
  opacity:.6;
}
.requests-page .modal-foot {
  display:flex;
  justify-content:flex-end;
  gap:10px;
  padding:18px 26px 22px;
  border-top:1px solid var(--border);
}
.requests-page .btn {
  padding:11px 20px;
  border:1px solid #cbd6f2;
  border-radius:10px;
  background:#fff;
  color:#00209f;
  font-size:13px;
  font-weight:800;
}
@media(max-width:900px) {
  .requests-page .summary-grid { grid-template-columns:repeat(2,1fr); }
}
@media(max-width:600px) {
  .requests-page .hero { align-items:stretch; flex-direction:column; padding:24px 20px; }
  .requests-page .refresh-button { width:100%; }
  .requests-page .summary-card { min-height:100px; padding:12px; }
  .requests-page .filter-panel { padding:14px; }
  .requests-page .field-grid { grid-template-columns:1fr; }
  .requests-page .modal-body { padding:18px; }
  .requests-page .modal-head { padding:18px; }
  .requests-page .modal-foot { padding:15px 18px; }
}
`;

const OfficerRequests = () => {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  // Officer review form
  const [decision, setDecision] = useState('review');
  const [recommendation, setRecommendation] = useState('');
  const [citizenMessage, setCitizenMessage] = useState('');
  const [savingDecision, setSavingDecision] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewError, setReviewError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await API.get('/ai/master-queue');
      const data = response.data.applications || [];

      setRows(data.map(row => ({
        ...row,
        citizen_name: row.full_name || row.citizen_name,
        citizen_id: row.national_id || row.citizen_id,
        citizen_picture: row.picture_data
      })));
    } catch (err) {
      console.error('Failed to load request queue:', err);
      setError(
        err.response?.data?.message ||
        'Unable to load the request queue. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openApp = async (id) => {
    const row = rows.find(item => item.id === id);
    if (!row) return;

    setSelected(row);
    setDecision('review');
    setRecommendation('');
    setCitizenMessage('');
    setReviewError('');
    setReviewMessage('');

    // Try to get the latest full application details.
    try {
      const response = await API.get(`/requests/${id}`);

      const details = response.data.request || response.data;

      setSelected(current => {
        if (!current || current.id !== id) return current;

        return {
          ...current,
          ...details,
          citizen_name:
            details.full_name ||
            details.citizen_name ||
            current.citizen_name,
          citizen_id:
            details.national_id ||
            details.citizen_id ||
            current.citizen_id,
          documents:
            details.documents ||
            current.documents ||
            []
        };
      });
    } catch (err) {
      // Keep the master-queue record visible if detail loading fails.
      console.warn('Could not load additional application details:', err);
    }
  };

  const closeApp = () => {
    if (savingDecision) return;

    setSelected(null);
    setRecommendation('');
    setCitizenMessage('');
    setReviewError('');
    setReviewMessage('');
  };

  const submitOfficerDecision = async (event) => {
    event.preventDefault();

    if (!selected) return;

    if (decision !== 'review' && !citizenMessage.trim()) {
      setReviewError('Please enter a message for the citizen.');
      return;
    }

    setSavingDecision(true);
    setReviewError('');
    setReviewMessage('');

    try {
      const response = await API.put(
        `/requests/${selected.id}/status`,
        {
          decision,
          officer_recommendation: recommendation,
          citizen_message: citizenMessage
        }
      );

      const result = response.data || {};

      const updatedStatus =
        result.status ||
        (decision === 'approve'
          ? 'approved'
          : decision === 'reject'
            ? 'rejected'
            : 'review');

      setSelected(current => ({
        ...current,
        status: updatedStatus,
        officer_decision: decision,
        officer_recommendation: recommendation,
        officer_feedback: citizenMessage,
        officer_reviewed_at: result.reviewed_at || new Date().toISOString()
      }));

      setRows(current =>
        current.map(row =>
          row.id === selected.id
            ? { ...row, status: updatedStatus }
            : row
        )
      );

      setReviewMessage(
        result.message || 'Officer decision saved successfully.'
      );

      setRecommendation('');
      setCitizenMessage('');

      // Refresh queue in the background.
      try {
        const refreshed = await API.get('/ai/master-queue');
        const applications = refreshed.data.applications || [];

        setRows(applications.map(row => ({
          ...row,
          citizen_name: row.full_name || row.citizen_name,
          citizen_id: row.national_id || row.citizen_id,
          citizen_picture: row.picture_data
        })));
      } catch (refreshError) {
        console.warn('Queue refresh failed:', refreshError);
      }

    } catch (err) {
      setReviewError(
        err.response?.data?.message ||
        'Unable to save the officer decision. Please try again.'
      );
    } finally {
      setSavingDecision(false);
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter(row => {
      const matchesStatus =
        status === 'all' || row.status === status;

      const matchesSearch =
        !query ||
        String(row.citizen_name || '').toLowerCase().includes(query) ||
        String(row.citizen_id || '').toLowerCase().includes(query) ||
        String(row.reference_number || '').toLowerCase().includes(query) ||
        String(row.service_type || '').toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [rows, status, search]);

  const summary = {
    total: rows.length,
    pending: rows.filter(row =>
      ['submitted', 'pending'].includes(row.status)
    ).length,
    review: rows.filter(row =>
      ['review', 'in_review'].includes(row.status)
    ).length,
    completed: rows.filter(row =>
      ['completed', 'approved'].includes(row.status)
    ).length
  };

  const summaryCards = [
    { label: 'Total requests', value: summary.total, icon: 'doc' },
    { label: 'Pending', value: summary.pending, icon: 'clock' },
    { label: 'In review', value: summary.review, icon: 'search' },
    { label: 'Completed', value: summary.completed, icon: 'check' }
  ];

  const field = (label, value) => (
    <div className="field" key={label}>
      <label>{label}</label>
      <div>{value || 'Not supplied'}</div>
    </div>
  );

  const formatDate = value => {
    if (!value) return 'Not available';

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleString();
  };

  return (
    <OfficerLayout
      title="Request Queue"
      subtitle="Filter, review and update applications assigned to your department."
    >
      <style>{styles}</style>

      <div className="requests-page">

        {/* PAGE HEADER */}
        <header className="hero">
          <div>
            <div className="eyebrow">
              <span />
              Application operations
            </div>

            <h1>Request Queue</h1>

            <p>
              Review citizen applications, assess supporting documents
              and record your official decisions.
            </p>
          </div>

          <button
            className="refresh-button"
            type="button"
            onClick={load}
            disabled={loading}
          >
            <Icon name="refresh" size={16} />
            {loading ? 'Refreshing...' : 'Refresh queue'}
          </button>
        </header>

        {/* SUMMARY */}
        <section className="summary-grid">
          {summaryCards.map(card => (
            <article className="summary-card" key={card.label}>
              <span className="summary-icon">
                <Icon name={card.icon} size={18} />
              </span>

              <span>
                <span>{card.label}</span>
                <strong>{loading ? '—' : card.value}</strong>
              </span>
            </article>
          ))}
        </section>

        {/* SEARCH AND FILTERS */}
        <section className="filter-panel">
          <div className="filter-heading">
            <h2>Find an application</h2>
            <span>
              {filtered.length} result{filtered.length === 1 ? '' : 's'} shown
            </span>
          </div>

          <div className="search-wrap">
            <Icon name="search" size={17} />

            <input
              className="search"
              placeholder="Search by name, National ID, or reference number"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>

          <div className="chips">
            {STATUSES.map(value => (
              <button
                key={value}
                type="button"
                className={`chip${status === value ? ' active' : ''}`}
                onClick={() => setStatus(value)}
              >
                {value === 'all'
                  ? 'All requests'
                  : value.replace('_', ' ')}
              </button>
            ))}
          </div>
        </section>

        {/* APPLICATION TABLE */}
        <div className="table-heading">
          <div>
            <h2>Applications</h2>
            <p>
              Select Review to open the application and complete the officer
              assessment.
            </p>
          </div>
        </div>

        <section className="table-panel">
          {error ? (
            <div className="empty-state">
              <p>{error}</p>
              <button
                className="refresh-button"
                type="button"
                onClick={load}
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="empty-state">
              Loading applications...
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              No applications found.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Citizen</th>
                  <th>Service</th>
                  <th>AI Instructions</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(application => {
                  const badge =
                    STATUS_COLORS[application.status] ||
                    { bg: '#edf2f7', color: '#475569' };

                  return (
                    <tr key={application.id}>
                      <td style={{
                        fontWeight: 800,
                        color: '#00209F'
                      }}>
                        {application.reference_number}
                      </td>

                      <td>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10
                        }}>
                          <span style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#00209F',
                            color: '#fff',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 12,
                            fontWeight: 800,
                            overflow: 'hidden',
                            flexShrink: 0
                          }}>
                            {application.citizen_picture ? (
                              <img
                                src={application.citizen_picture}
                                alt=""
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              (application.citizen_name || '?')
                                .charAt(0)
                                .toUpperCase()
                            )}
                          </span>

                          {application.citizen_name ||
                            application.citizen_id ||
                            '—'}
                        </div>
                      </td>

                      <td>{application.service_type || '—'}</td>

                      <td style={{ maxWidth: 300 }}>
                        <div style={{
                          fontWeight: 700,
                          marginBottom: 4,
                          fontSize: 12
                        }}>
                          {application.ai_summary || 'No AI summary'}
                        </div>

                        <div style={{
                          fontSize: 11.5,
                          color: application.ai_recommendation === 'approve'
                            ? '#15803d'
                            : '#b45309',
                          fontWeight: 600
                        }}>
                          {application.ai_instructions ||
                            application.ai_recommendation ||
                            'No AI instruction'}
                        </div>
                      </td>

                      <td>
                        <span style={{
                          padding: '5px 10px',
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 800,
                          textTransform: 'capitalize',
                          background: badge.bg,
                          color: badge.color
                        }}>
                          {application.status || 'Unknown'}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() => openApp(application.id)}
                          style={{
                            padding: '8px 13px',
                            background: '#00209F',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            fontSize: 11.5,
                            fontWeight: 800
                          }}
                        >
                          Review →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* APPLICATION REVIEW MODAL */}
        {selected && (
          <div
            className="overlay"
            onClick={closeApp}
          >
            <div
              className="modal"
              onClick={event => event.stopPropagation()}
            >
              <div className="modal-head">
                <div>
                  <h2>{selected.service_type || 'Application Review'}</h2>
                  <p>
                    Reference:
                    <strong> {selected.reference_number}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  className="close"
                  onClick={closeApp}
                  disabled={savingDecision}
                  aria-label="Close review"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>

              <div className="modal-body">

                {/* AI ASSESSMENT */}
                <div className="detail-section">
                  <h3>AI Assessment</h3>
                  <AISummaryPanel applicationId={selected.id} />
                </div>

                {/* APPLICANT */}
                <div className="applicant-card">
                  <div className="applicant-avatar">
                    {selected.citizen_picture ? (
                      <img
                        src={selected.citizen_picture}
                        alt=""
                      />
                    ) : (
                      (selected.citizen_name || '?')
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="applicant-name">
                      {selected.citizen_name ||
                        selected.full_name ||
                        'Unknown applicant'}
                    </div>

                    <div className="applicant-meta">
                      {selected.citizen_id
                        ? `National ID: ${selected.citizen_id}`
                        : 'National ID not available'}

                      {selected.citizen_username
                        ? ` · @${selected.citizen_username}`
                        : ''}
                    </div>
                  </div>
                </div>

                {/* APPLICANT INFORMATION */}
                <div className="detail-section">
                  <h3>Applicant Information</h3>

                  <div className="field-grid">
                    {field('Full name',
                      selected.full_name || selected.citizen_name)}
                    {field('National ID',
                      selected.national_id || selected.citizen_id)}
                    {field('Email', selected.email)}
                    {field('Phone', selected.phone)}
                    {field('Date of birth', selected.date_of_birth)}
                    {field('Gender', selected.gender)}
                    {field('District', selected.district)}
                    {field('Address', selected.address)}
                    {field('Department', selected.department)}
                    {field('Service', selected.service_type)}
                    {field('Current status', selected.status)}
                    {field('Submitted', formatDate(selected.created_at))}
                  </div>
                </div>

                {/* APPLICATION FORM DETAILS */}
                {selected.form_data &&
                  Object.keys(selected.form_data).length > 0 && (
                    <div className="detail-section">
                      <h3>Application Details</h3>

                      <div className="field-grid">
                        {Object.entries(selected.form_data).map(([key, value]) =>
                          field(
                            key.replace(/_/g, ' '),
                            typeof value === 'object'
                              ? JSON.stringify(value)
                              : String(value ?? '—')
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* APPLICATION NOTES */}
                <div className="detail-section">
                  <h3>Applicant Notes</h3>
                  <div style={{
                    padding: 14,
                    borderRadius: 10,
                    background: '#f7f9fc',
                    fontSize: 13,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selected.notes ||
                      selected.application_notes ||
                      'No additional notes supplied.'}
                  </div>
                </div>

                {/* DOCUMENTS */}
                <div className="detail-section">
                  <h3>
                    Supporting Documents (
                    {selected.documents?.length || 0})
                  </h3>

                  {selected.documents?.length > 0 ? (
                    <div className="doc-list">
                      {selected.documents.map(document => (
                        <div className="doc" key={document.id}>
                          <span>
                            <Icon name="doc" size={14} />
                            {' '}
                            <strong>{document.file_name}</strong>
                          </span>

                          {document.file_url ? (
                            <a
                              href={document.file_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open document
                            </a>
                          ) : (
                            <span style={{ color: '#718096' }}>
                              File path: {document.file_path || 'Unavailable'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      padding: 14,
                      border: '1px dashed #cbd5e1',
                      borderRadius: 10,
                      color: '#718096',
                      fontSize: 13,
                      textAlign: 'center'
                    }}>
                      No supporting documents uploaded with this application.
                    </div>
                  )}
                </div>

                {/* OFFICER DECISION FORM */}
                <div className="detail-section">
                  <h3>Officer Review and Decision</h3>

                  {reviewError && (
                    <div className="review-error">
                      {reviewError}
                    </div>
                  )}

                  {reviewMessage && (
                    <div className="review-success">
                      {reviewMessage}
                    </div>
                  )}

                  <form onSubmit={submitOfficerDecision}>

                    <label className="review-label">
                      Internal Officer Recommendation
                    </label>

                    <textarea
                      className="review-input"
                      value={recommendation}
                      onChange={event =>
                        setRecommendation(event.target.value)
                      }
                      placeholder="Enter your findings, assessment and recommendation. This is for authorized officers."
                      rows={4}
                    />

                    <label className="review-label">
                      Application Decision
                    </label>

                    <select
                      className="review-input"
                      value={decision}
                      onChange={event =>
                        setDecision(event.target.value)
                      }
                    >
                      <option value="review">
                        Keep Under Review
                      </option>

                      <option value="request_info">
                        Request More Information
                      </option>

                      <option value="approve">
                        Approve Application
                      </option>

                      <option value="reject">
                        Reject Application
                      </option>
                    </select>

                    <label className="review-label">
                      Message to Citizen
                    </label>

                    <textarea
                      className="review-input"
                      value={citizenMessage}
                      onChange={event =>
                        setCitizenMessage(event.target.value)
                      }
                      placeholder="Write the message the applicant will receive..."
                      rows={4}
                    />

                    <div className="notice">
                      <strong>Officer notice:</strong> The internal
                      recommendation is intended for authorized officers.
                      The citizen-facing message should contain the
                      information the applicant needs to know.
                    </div>

                    <button
                      type="submit"
                      className="submit-decision"
                      disabled={savingDecision}
                    >
                      {savingDecision
                        ? 'Submitting Decision...'
                        : 'Submit Officer Decision'}
                    </button>

                  </form>
                </div>

                {/* PREVIOUS REVIEW */}
                <div className="detail-section">
                  <h3>Previous Officer Review</h3>

                  <div className="field-grid">
                    {field(
                      'Previous decision',
                      selected.officer_decision
                    )}

                    {field(
                      'Officer recommendation',
                      selected.officer_recommendation
                    )}

                    {field(
                      'Citizen message',
                      selected.officer_feedback
                    )}

                    {field(
                      'Reviewed date',
                      formatDate(selected.officer_reviewed_at)
                    )}
                  </div>
                </div>

              </div>

              <div className="modal-foot">
                <button
                  type="button"
                  className="btn"
                  onClick={closeApp}
                  disabled={savingDecision}
                >
                  Close Review
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </OfficerLayout>
  );
};

export default OfficerRequests;
