import React from 'react';
import StatusBadge from './StatusBadge';

const tableStyles = `
  .request-table-wrap{overflow:hidden;border:1px solid #e5e9f0;border-radius:16px;background:#fff;box-shadow:0 10px 26px rgba(20,35,60,.06)}
  .request-table-head,.request-table-row{display:flex;align-items:center;gap:14px;padding:0 22px}
  .request-table-head{min-height:48px;color:#fff;background:#00209F;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
  .request-table-row{min-height:68px;border-bottom:1px solid #eef1f5;font-size:13px;transition:background .16s ease,box-shadow .16s ease}
  .request-table-row:last-child{border-bottom:0}
  .request-table-row:hover{background:#f6f9ff;box-shadow:inset 4px 0 0 #009543}
  .request-table-cell{min-width:0;overflow:hidden;color:#172235;text-overflow:ellipsis;white-space:nowrap}
  .request-table-reference{color:#00209F;font-weight:800}
  .request-table-service{font-weight:700;text-transform:capitalize}
  .request-table-date{color:#718096}
  .request-table-status{display:flex;flex:1.8;align-items:center;justify-content:flex-end;gap:9px;min-width:0}
  .request-table-select{max-width:124px;padding:7px 9px;color:#172235;border:1px solid #cbd6f2;border-radius:8px;outline:none;background:#fff;font-size:11px;cursor:pointer}
  .request-table-select:focus{border-color:#009543;box-shadow:0 0 0 3px rgba(0,149,67,.1)}
  .request-table-empty{display:grid;place-items:center;min-height:180px;padding:35px;color:#718096;text-align:center;background:#fff;border:1px solid #e5e9f0;border-radius:16px;font-size:13px}
  .request-table-empty-mark{display:grid;place-items:center;width:42px;height:42px;margin:0 auto 10px;color:#00209F;border-radius:12px;background:#edf2ff;font-size:21px;font-weight:800}
  .request-table-loading{display:flex;align-items:center;justify-content:center;gap:10px;min-height:180px;color:#00209F;border:1px solid #e5e9f0;border-radius:16px;background:#fff;font-size:13px;font-weight:700}
  .request-table-loading i{width:9px;height:9px;border-radius:50%;background:#009543;box-shadow:0 0 0 5px #eaf8f0}
  @media(max-width:760px){.request-table-wrap{overflow-x:auto}.request-table-head,.request-table-row{min-width:760px}.request-table-head,.request-table-row{padding-left:16px;padding-right:16px}}
`;

const RequestTable = ({ rows, requests, loading = false, onStatusChange, showDepartment = false }) => {
  const data = Array.isArray(rows) ? rows : Array.isArray(requests) ? requests : [];

  if (loading) return <><style>{tableStyles}</style><div className="request-table-loading"><i /> Loading applications...</div></>;

  if (data.length === 0) {
    return <><style>{tableStyles}</style><div className="request-table-empty"><div><div className="request-table-empty-mark">—</div><p>No applications to display</p></div></div></>;
  }

  return (
    <>
      <style>{tableStyles}</style>
      <div className="request-table-wrap" role="table" aria-label="Government applications">
        <div className="request-table-head" role="row">
          <span style={{ flex: 1.2 }}>Reference</span>
          <span style={{ flex: 1.4 }}>Citizen ID</span>
          <span style={{ flex: 1.4 }}>Service</span>
          {showDepartment && <span style={{ flex: 1 }}>Department</span>}
          <span style={{ flex: 1 }}>Date</span>
          <span style={{ flex: 1.8, textAlign: 'right' }}>Status</span>
        </div>
        {data.map((request) => {
          const createdDate = request.created_at ? new Date(request.created_at).toLocaleDateString() : '—';
          const status = request.status || 'submitted';
          return (
            <div className="request-table-row" key={request.id} role="row">
              <span className="request-table-cell request-table-reference" style={{ flex: 1.2 }}>{request.reference_number || '—'}</span>
              <span className="request-table-cell" style={{ flex: 1.4 }}>{request.national_id || '—'}</span>
              <span className="request-table-cell request-table-service" style={{ flex: 1.4 }}>{request.service_type || 'General service'}</span>
              {showDepartment && <span className="request-table-cell" style={{ flex: 1, textTransform: 'capitalize' }}>{request.department || '—'}</span>}
              <span className="request-table-cell request-table-date" style={{ flex: 1 }}>{createdDate}</span>
              <div className="request-table-status">
                <StatusBadge status={status} />
                {onStatusChange && <select className="request-table-select" value={status} onChange={(event) => onStatusChange(request.id, event.target.value)} aria-label={`Update status for ${request.reference_number || 'request'}`}>
                  <option value="submitted">Submitted</option><option value="pending">Pending</option><option value="review">In Review</option><option value="in_review">In Review</option><option value="ready">Ready</option><option value="completed">Completed</option><option value="rejected">Rejected</option>
                </select>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default RequestTable;
