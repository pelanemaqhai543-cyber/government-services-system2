import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import API from '../utils/api';

const OfficerQueue = () => {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const loadQueue = () => {
    setLoading(true);
    API.get('/requests/queue')
      .then(r => setRows(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadQueue(); }, []);

  const filtered = rows.filter(r =>
    !search ||
    r.national_id?.includes(search) ||
    r.service_type?.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = async (id, status) => {
    await API.put(`/requests/${id}/status`, { status });
    loadQueue();
  };

  return (
    <div style={styles.layout}>
      <Sidebar />
      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>Officer queue</h1>
          <input
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchBox}
          />
        </div>

        <div style={styles.filterRow}>
          <input
            placeholder="Search citizen ID"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.citizenSearch}
          />
          <button style={styles.newBtn}>+ New entry</button>
        </div>

        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <span style={{ flex: 1 }}>Citizen</span>
            <span style={{ flex: 1 }}>Service</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Status</span>
          </div>

          {loading && <p style={styles.empty}>Loading...</p>}

          {!loading && filtered.length === 0 && (
            <p style={styles.empty}>No requests in queue.</p>
          )}

          {filtered.map(r => (
            <div key={r.id} style={styles.tableRow}>
              <span style={{ flex: 1 }}>{r.national_id || r.user_id}</span>
              <span style={{ flex: 1 }}>{r.service_type}</span>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const styles = {
  layout: { display: 'flex', minHeight: '100vh', background: '#f4f6fa' },
  main: { flex: 1, marginLeft: '240px', padding: '32px 40px' },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '20px'
  },
  pageTitle: { fontSize: '28px', fontWeight: 700, color: '#1a1a2e' },
  searchBox: {
    padding: '10px 20px', borderRadius: '999px',
    border: '1px solid #e5e7eb', background: '#fff',
    fontSize: '13px', outline: 'none', width: '200px'
  },
  filterRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '20px', gap: '16px'
  },
  citizenSearch: {
    flex: 1, padding: '12px 18px', borderRadius: '10px',
    border: '1.5px solid #1a1a2e', background: '#fff',
    fontSize: '14px', outline: 'none', maxWidth: '420px'
  },
  newBtn: {
    padding: '12px 22px', borderRadius: '10px',
    border: 'none', background: '#1a1a2e', color: '#fff',
    fontSize: '14px', fontWeight: 600, cursor: 'pointer'
  },
  tableCard: {
    background: '#fff', border: '1.5px solid #1a1a2e',
    borderRadius: '18px', padding: '8px 20px'
  },
  tableHeader: {
    display: 'flex', padding: '14px 0', borderBottom: '1px solid #e5e7eb',
    fontSize: '13px', color: '#8a93a6', fontWeight: 500
  },
  tableRow: {
    display: 'flex', alignItems: 'center',
    padding: '18px 0', borderBottom: '1px solid #f0f2f5',
    fontSize: '14px'
  },
  empty: { padding: '30px', textAlign: 'center', color: '#8a93a6', fontSize: '13px' }
};

export default OfficerQueue;