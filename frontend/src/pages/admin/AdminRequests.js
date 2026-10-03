import React, { useEffect, useMemo, useState } from 'react';
import OfficerLayout from '../../components/OfficerLayout';
import RequestTable from '../../components/RequestTable';
import API from '../../utils/api';

const FILTERS = [
  { value: 'all', label: 'All applications' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'pending', label: 'Pending' },
  { value: 'review', label: 'In review' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
];

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await API.get('/requests/queue');
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      console.error('Failed to load requests:', requestError);
      setError(requestError.response?.data?.message || 'Unable to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await API.put(`/requests/${id}/status`, { status });
      setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
    } catch (requestError) {
      console.error('Unable to update status:', requestError);
      setError(requestError.response?.data?.message || 'Unable to update application status.');
    }
  };

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus = filter === 'all' || request.status === filter;
      const matchesSearch = !query || String(request.reference_number || '').toLowerCase().includes(query) || String(request.national_id || '').toLowerCase().includes(query) || String(request.service_type || '').toLowerCase().includes(query) || String(request.department || '').toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [requests, filter, search]);

  const metrics = [
    { label: 'Total applications', value: requests.length },
    { label: 'Awaiting action', value: requests.filter((request) => ['submitted', 'pending', 'review'].includes(request.status)).length },
    { label: 'Completed', value: requests.filter((request) => request.status === 'completed').length },
    { label: 'Rejected', value: requests.filter((request) => request.status === 'rejected').length },
  ];

  return (
    <OfficerLayout title="All Applications" subtitle="Home Affairs overview of applications across all government departments.">
      <style>{styles}</style>
      <div className="admin-requests-page">
        <header className="hero"><div><div className="eyebrow"><span /> Application operations</div><h1>Government Applications</h1><p>Review, filter, and update applications submitted across the public service system.</p></div><button className="refresh-button" type="button" onClick={loadRequests}>Refresh applications</button></header>
        <section className="metrics" aria-label="Application metrics">{metrics.map((metric) => <article className="metric" key={metric.label}><span>{metric.label}</span><strong>{loading ? '—' : metric.value}</strong></article>)}</section>
        <section className="filter-panel" aria-label="Application filters"><div className="filter-top"><div><h2>Application queue</h2><p>Search by reference, National ID, service, or department.</p></div><span>{filteredRequests.length} result{filteredRequests.length === 1 ? '' : 's'}</span></div><div className="search-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search applications..." aria-label="Search applications" /></div><div className="filter-bar" role="group" aria-label="Filter by application status">{FILTERS.map((item) => <button type="button" key={item.value} className={filter === item.value ? 'filter-active' : ''} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div></section>
        {error && <div className="error-message" role="alert">{error}<button type="button" onClick={loadRequests}>Try again</button></div>}
        <section className="dashboard-panel">{loading ? <div className="empty-state">Loading applications...</div> : error ? null : filteredRequests.length === 0 ? <div className="empty-state">No applications match the selected filters.</div> : <RequestTable rows={filteredRequests} requests={filteredRequests} showDepartment onStatusChange={handleStatusChange} />}</section>
      </div>
    </OfficerLayout>
  );
};

const styles = `
  .admin-requests-page { --blue:#00209F; --blue-dark:#00166f; --blue-soft:#edf2ff; --green:#009543; --green-soft:#eaf8f0; --black:#000; --ink:#172235; --muted:#718096; --border:#e5e9f0; --white:#fff; width:100%; max-width:1440px; margin:0 auto; color:var(--ink); }.admin-requests-page * { box-sizing:border-box; }.admin-requests-page h1,.admin-requests-page h2,.admin-requests-page p { margin:0; }.admin-requests-page button,.admin-requests-page input { font:inherit; }.admin-requests-page button { cursor:pointer; }
  .admin-requests-page .hero { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:24px; }.admin-requests-page .eyebrow { display:flex; align-items:center; gap:8px; margin-bottom:9px; color:var(--blue); font-size:10px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }.admin-requests-page .eyebrow span { width:8px; height:8px; border-radius:50%; background:var(--green); box-shadow:0 0 0 5px var(--green-soft); }.admin-requests-page h1 { color:var(--black); font-size:clamp(25px,3vw,34px); line-height:1.1; letter-spacing:-.04em; }.admin-requests-page .hero p { margin-top:8px; color:var(--muted); font-size:13px; line-height:1.5; }.admin-requests-page .refresh-button { min-height:40px; padding:0 14px; color:var(--blue); border:1px solid #cbd6f2; border-radius:10px; background:var(--white); font-size:11px; font-weight:800; }.admin-requests-page .refresh-button:hover { background:var(--blue-soft); }
  .admin-requests-page .metrics { display:grid; grid-template-columns:repeat(4,1fr); gap:13px; margin-bottom:19px; }.admin-requests-page .metric { padding:16px; border:1px solid var(--border); border-radius:14px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.04); }.admin-requests-page .metric span { display:block; color:var(--muted); font-size:10px; font-weight:800; }.admin-requests-page .metric strong { display:block; margin-top:5px; color:var(--black); font-size:25px; line-height:1; }
  .admin-requests-page .filter-panel,.admin-requests-page .dashboard-panel { border:1px solid var(--border); border-radius:16px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.045); }.admin-requests-page .filter-panel { padding:19px; }.admin-requests-page .filter-top { display:flex; align-items:flex-end; justify-content:space-between; gap:14px; }.admin-requests-page .filter-top h2 { color:var(--black); font-size:16px; }.admin-requests-page .filter-top p { margin-top:5px; color:var(--muted); font-size:11px; }.admin-requests-page .filter-top > span { color:var(--blue); font-size:11px; font-weight:800; }.admin-requests-page .search-row { margin-top:15px; }.admin-requests-page .search-row input { width:100%; min-height:42px; padding:0 13px; color:var(--ink); border:1px solid var(--border); border-radius:10px; outline:none; background:#fbfcff; font-size:12px; }.admin-requests-page .search-row input:focus { border-color:#a9bde9; box-shadow:0 0 0 3px var(--blue-soft); }.admin-requests-page .filter-bar { display:flex; flex-wrap:wrap; gap:7px; margin-top:13px; }.admin-requests-page .filter-bar button { min-height:32px; padding:0 12px; color:var(--muted); border:1px solid var(--border); border-radius:99px; background:var(--white); font-size:10px; font-weight:800; }.admin-requests-page .filter-bar button:hover,.admin-requests-page .filter-bar .filter-active { color:var(--white); border-color:var(--blue); background:var(--blue); }.admin-requests-page .error-message { display:flex; align-items:center; justify-content:space-between; gap:15px; margin-top:15px; padding:12px 14px; color:#9b3d3d; border:1px solid #f0caca; border-radius:10px; background:#fff3f3; font-size:12px; }.admin-requests-page .error-message button { color:#9b3d3d; border:0; background:transparent; font-size:11px; font-weight:800; text-decoration:underline; }.admin-requests-page .dashboard-panel { overflow:auto; margin-top:19px; padding:4px; }.admin-requests-page .dashboard-panel > * { min-width:680px; }.admin-requests-page .empty-state { min-width:0 !important; padding:54px 20px; color:var(--muted); text-align:center; font-size:12px; }
  @media (max-width:900px) { .admin-requests-page .metrics { grid-template-columns:repeat(2,1fr); } }.admin-requests-page .dashboard-panel { width:100%; }
  @media (max-width:600px) { .admin-requests-page .hero { align-items:stretch; flex-direction:column; }.admin-requests-page .refresh-button { width:100%; }.admin-requests-page .metrics { gap:9px; }.admin-requests-page .metric { padding:13px; }.admin-requests-page .metric strong { font-size:22px; }.admin-requests-page .filter-panel { padding:14px; }.admin-requests-page .filter-top { align-items:flex-start; flex-direction:column; }.admin-requests-page .filter-bar { gap:6px; }.admin-requests-page .filter-bar button { flex:1 1 calc(50% - 6px); }.admin-requests-page .error-message { align-items:flex-start; flex-direction:column; } }
`;

export default AdminRequests;
