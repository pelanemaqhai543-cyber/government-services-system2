
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import AISummaryPanel from '../components/AISummaryPanel';
import API from '../utils/api';

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f4f6fa',
  },
  main: {
    flex: 1,
    minWidth: 0,
    marginLeft: '240px',
    padding: '32px 40px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '20px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1a1a2e',
    margin: 0,
  },
  searchBox: {
    padding: '10px 16px',
    borderRadius: '999px',
    border: '1px solid #e5e7eb',
    background: '#fff',
    fontSize: '13px',
    width: '240px',
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  filterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '20px',
    gap: '12px',
  },
  citizenSearch: {
    flex: 1,
    padding: '12px 18px',
    borderRadius: '10px',
    border: '1.5px solid #d5dbe7',
    background: '#fff',
    fontSize: '14px',
    maxWidth: '420px',
    minWidth: '180px',
    boxSizing: 'border-box',
  },
  refreshBtn: {
    padding: '11px 18px',
    borderRadius: '10px',
    border: 'none',
    background: '#1a1a2e',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  tableCard: {
    background: '#fff',
    border: '1px solid #e1e6ef',
    borderRadius: '16px',
    padding: '8px 20px',
    overflowX: 'auto',
  },
  tableHeader: {
    display: 'flex',
    minWidth: '650px',
    gap: '16px',
    padding: '14px 0',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '12px',
    color: '#718096',
    fontWeight: 700,
  },
  tableRow: {
    display: 'flex',
    minWidth: '650px',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid #f0f2f5',
    fontSize: '13px',
  },
  cell: {
    flex: 1,
    minWidth: 0,
    overflowWrap: 'anywhere',
  },
  selectedRow: {
    background: '#f0f5ff',
  },
  reviewBtn: {
    padding: '8px 12px',
    borderRadius: '7px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#1a1a2e',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  error: {
    padding: '12px 16px',
    borderRadius: '8px',
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    color: '#9f1239',
    marginBottom: '16px',
    fontSize: '13px',
  },
  notice: {
    padding: '12px 16px',
    borderRadius: '8px',
    background: '#fffbeb',
    border: '1px solid #fde68a',
    color: '#92400e',
    marginBottom: '16px',
    fontSize: '13px',
    lineHeight: 1.6,
  },
  reviewCard: {
    marginTop: '24px',
    padding: '20px',
    background: '#fff',
    border: '1px solid #e1e6ef',
    borderRadius: '16px',
  },
  reviewTitle: {
    fontSize: '19px',
    color: '#1a1a2e',
    marginTop: 0,
    marginBottom: '8px',
  },
  empty: {
    padding: '30px',
    textAlign: 'center',
    color: '#718096',
    fontSize: '13px',
  },
};

function getRequestId(record) {
  // Prefer an explicitly supplied service request ID.
  const id =
    record.service_request_id ??
    record.serviceRequestId ??
    record.request_id ??
    record.requestId;

  if (id === undefined || id === null || id === '') {
    return null;
  }

  const numericId = Number(id);

  return Number.isSafeInteger(numericId) && numericId > 0
    ? numericId
    : null;
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'An unexpected error occurred.'
  );
}

const OfficerQueue = () => {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await API.get('/requests/queue');

      // Support either a direct array or a wrapped list response.
      const data = response.data;
      const queue = Array.isArray(data)
        ? data
        : Array.isArray(data?.requests)
          ? data.requests
          : Array.isArray(data?.rows)
            ? data.rows
            : Array.isArray(data?.data)
              ? data.data
              : null;

      if (!queue) {
        throw new Error(
          'The queue endpoint did not return a list. Check GET /requests/queue.'
        );
      }

      setRows(queue);

      // Keep the selected row synchronized with the latest queue data.
      setSelected((previous) => {
        if (!previous) return null;

        return (
          queue.find(
            (row) =>
              String(row.id) === String(previous.id)
          ) || null
        );
      });
    } catch (requestError) {
      setError(
        `Could not load the officer queue: ${getErrorMessage(requestError)}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return rows;

    return rows.filter((row) => {
      const values = [
        row.national_id,
        row.user_id,
        row.reference_number,
        row.service_type,
        row.status,
        row.department,
      ];

      return values.some(
        (value) =>
          value != null &&
          String(value).toLowerCase().includes(term)
      );
    });
  }, [rows, search]);

  const handleStatusChange = async (row, status) => {
    // This queue uses /requests/:id/status. Its ID must match
    // the identifier expected by that backend endpoint.
    if (row.id == null) {
      setError('This queue record has no request ID.');
      return;
    }

    setUpdatingId(row.id);
    setError('');

    try {
      await API.put(`/requests/${row.id}/status`, { status });
      await loadQueue();
    } catch (requestError) {
      setError(
        `Could not update the request: ${getErrorMessage(requestError)}`
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const openReview = (row) => {
    setSelected(row);
    setError('');
  };

  const serviceRequestId = selected
    ? getRequestId(selected)
    : null;

  return (
    <div style={styles.layout}>
      <Sidebar />

      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>Officer queue</h1>

          <input
            aria-label="Search requests"
            placeholder="Search requests..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={styles.searchBox}
          />
        </div>

        <div style={styles.filterRow}>
          <input
            aria-label="Search by citizen, service or reference"
            placeholder="Citizen ID, service or reference"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={styles.citizenSearch}
          />

          <button
            type="button"
            onClick={loadQueue}
            disabled={loading}
            style={{
              ...styles.refreshBtn,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Loading...' : 'Refresh queue'}
          </button>
        </div>

        {error && (
          <div role="alert" style={styles.error}>
            {error}
          </div>
        )}

        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <span style={styles.cell}>Citizen</span>
            <span style={styles.cell}>Service</span>
            <span style={styles.cell}>Reference</span>
            <span style={styles.cell}>Status</span>
            <span style={styles.cell}>Action</span>
          </div>

          {loading && rows.length === 0 && (
            <p style={styles.empty}>Loading requests...</p>
          )}

          {!loading && filtered.length === 0 && (
            <p style={styles.empty}>
              No requests match your search.
            </p>
          )}

          {filtered.map((row, index) => {
            const isSelected =
              selected &&
              String(selected.id) === String(row.id);

            return (
              <div
                key={row.id ?? row.reference_number ?? index}
                style={{
                  ...styles.tableRow,
                  ...(isSelected ? styles.selectedRow : {}),
                }}
              >
                <span style={styles.cell}>
                  {row.national_id || row.user_id || 'Unknown'}
                </span>

                <span style={styles.cell}>
                  {row.service_type || 'Service not specified'}
                </span>

                <span style={styles.cell}>
                  {row.reference_number || 'No reference'}
                </span>

                <span style={styles.cell}>
                  <StatusBadge status={row.status} />
                </span>

                <span style={styles.cell}>
                  <button
                    type="button"
                    style={styles.reviewBtn}
                    onClick={() => openReview(row)}
                  >
                    Review
                  </button>
                </span>
              </div>
            );
          })}
        </div>

        {selected && (
          <section style={styles.reviewCard}>
            <h2 style={styles.reviewTitle}>
              Application review
            </h2>

            <p style={{ color: '#64748b', fontSize: 13 }}>
              Reference:{' '}
              <strong>
                {selected.reference_number || 'Not available'}
              </strong>
              {' · '}
              Service:{' '}
              <strong>
                {selected.service_type || 'Not specified'}
              </strong>
            </p>

            {serviceRequestId ? (
              <AISummaryPanel
                applicationId={serviceRequestId}
              />
            ) : (
              <div style={styles.notice}>
                AI review is not available for this record because
                the queue did not provide its underlying service
                request ID. The application ID from another table
                must not be sent to the AI endpoints as if it were
                a service request ID.
                <br />
                <br />
                The backend queue must return the actual
                <code> service_request_id </code>
                for this record.
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                marginTop: 16,
              }}
            >
              <button
                type="button"
                style={styles.reviewBtn}
                disabled={updatingId === selected.id}
                onClick={() => handleStatusChange(selected, 'review')}
              >
                {updatingId === selected.id
                  ? 'Updating...'
                  : 'Mark for review'}
              </button>

              <button
                type="button"
                style={styles.reviewBtn}
                disabled={updatingId === selected.id}
                onClick={() => handleStatusChange(selected, 'ready')}
              >
                Mark ready
              </button>

              <button
                type="button"
                style={styles.reviewBtn}
                onClick={() => setSelected(null)}
              >
                Close review
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default OfficerQueue;
