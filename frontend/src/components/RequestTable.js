import React from 'react';
import StatusBadge from './StatusBadge';

const RequestTable = ({
  rows,
  requests,
  loading = false,
  onStatusChange,
  showDepartment = false,
}) => {
  // Support both existing dashboard conventions: rows and requests.
  const data = Array.isArray(rows) ? rows : Array.isArray(requests) ? requests : [];

  if (loading) return <div style={styles.empty}>Loading applications...</div>;

  if (data.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>—</div>
        <p>No requests to display</p>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.head}>
        <span style={{ flex: 1.2 }}>Reference</span>
        <span style={{ flex: 1.4 }}>Citizen ID</span>
        <span style={{ flex: 1.4 }}>Service</span>
        {showDepartment && <span style={{ flex: 1 }}>Department</span>}
        <span style={{ flex: 1 }}>Date</span>
        <span style={{ flex: 1.8, textAlign: 'right' }}>Status</span>
      </div>

      {data.map((request) => {
        const createdDate = request.created_at
          ? new Date(request.created_at).toLocaleDateString()
          : '—';

        return (
          <div key={request.id} style={styles.row}>
            <span style={{ ...styles.cell, flex: 1.2, fontWeight: 800, color: '#00209F' }}>
              {request.reference_number || '—'}
            </span>
            <span style={{ ...styles.cell, flex: 1.4 }}>
              {request.national_id || '—'}
            </span>
            <span style={{ ...styles.cell, flex: 1.4 }}>
              {request.service_type || 'General service'}
            </span>
            {showDepartment && (
              <span style={{ ...styles.cell, flex: 1, textTransform: 'capitalize' }}>
                {request.department || '—'}
              </span>
            )}
            <span style={{ ...styles.cell, flex: 1, color: '#718096' }}>
              {createdDate}
            </span>
            <div style={styles.statusCell}>
              <StatusBadge status={request.status || 'submitted'} />
              {onStatusChange && (
                <select
                  value={request.status || 'submitted'}
                  onChange={(event) => onStatusChange(request.id, event.target.value)}
                  style={styles.select}
                  aria-label={`Update status for ${request.reference_number || 'request'}`}
                >
                  <option value="submitted">Submitted</option>
                  <option value="pending">Pending</option>
                  <option value="review">In Review</option>
                  <option value="in_review">In Review</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const styles = {
  wrap: {
    overflow: 'hidden',
    background: '#ffffff',
    border: '1px solid #e5e9f0',
    borderRadius: 16,
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 22px',
    color: '#00209F',
    background: '#edf2ff',
    borderBottom: '1px solid #d8e1f7',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minHeight: 66,
    padding: '14px 22px',
    borderBottom: '1px solid #f0f2f5',
    fontSize: 13,
  },
  cell: {
    minWidth: 0,
    overflow: 'hidden',
    color: '#172235',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statusCell: {
    display: 'flex',
    flex: 1.8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    minWidth: 0,
  },
  select: {
    maxWidth: 122,
    padding: '6px 9px',
    color: '#172235',
    border: '1px solid #cbd6f2',
    borderRadius: 8,
    outline: 'none',
    background: '#ffffff',
    fontSize: 11,
    cursor: 'pointer',
  },
  empty: {
    padding: 52,
    color: '#718096',
    textAlign: 'center',
    background: '#ffffff',
    border: '1px solid #e5e9f0',
    borderRadius: 16,
    fontSize: 13,
  },
  emptyIcon: {
    marginBottom: 8,
    color: '#009543',
    fontSize: 28,
    fontWeight: 800,
  },
};

export default RequestTable;
