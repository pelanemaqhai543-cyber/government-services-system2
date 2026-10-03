import React, { useEffect, useMemo, useState } from 'react';
import OfficerLayout from '../../components/OfficerLayout';
import RequestTable from '../../components/RequestTable';
import API from '../../utils/api';

const STATUSES = ['all', 'submitted', 'review', 'ready', 'completed', 'rejected'];

const Icon = ({ name, size = 18 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    search: <><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.8-3L3 11" /><path d="M3 5v6h6" /><path d="M4 13a8 8 0 0 0 14.8 3L21 13" /><path d="M21 19v-6h-6" /></>,
    document: <><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4M9 12h6M9 16h6" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

const styles = `
  .requests-page { --blue:#00209F; --blue-dark:#00166f; --blue-soft:#edf2ff; --green:#009543; --green-soft:#eaf8f0; --black:#000; --ink:#172235; --muted:#718096; --border:#e5e9f0; --white:#fff; width:min(100%,1440px); margin:0 auto; padding:0 2px; color:var(--ink); }
  .requests-page * { box-sizing:border-box; }.requests-page button,.requests-page input { font:inherit; }.requests-page button { cursor:pointer; }.requests-page h1,.requests-page h2,.requests-page p { margin:0; }
  .requests-page .hero { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:26px; }.requests-page .eyebrow { display:flex; align-items:center; gap:9px; margin-bottom:10px; color:var(--blue); font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }.requests-page .eyebrow span { width:8px; height:8px; border-radius:50%; background:var(--green); box-shadow:0 0 0 5px var(--green-soft); }.requests-page h1 { color:var(--black); font-size:clamp(25px,3vw,34px); line-height:1.1; letter-spacing:-.04em; }.requests-page .hero p { margin-top:9px; color:var(--muted); font-size:14px; line-height:1.55; }
  .requests-page .refresh-button { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:40px; padding:0 14px; color:var(--blue); border:1px solid #cbd6f2; border-radius:10px; background:var(--white); font-size:12px; font-weight:800; }.requests-page .refresh-button:hover { background:var(--blue-soft); }
  .requests-page .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:13px; margin-bottom:20px; }.requests-page .summary-card { display:flex; align-items:center; gap:12px; min-height:88px; padding:16px; border:1px solid var(--border); border-radius:14px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.045); }.requests-page .summary-icon { display:grid; place-items:center; width:38px; height:38px; color:var(--blue); border-radius:10px; background:var(--blue-soft); }.requests-page .summary-card:nth-child(3) .summary-icon,.requests-page .summary-card:nth-child(4) .summary-icon { color:var(--green); background:var(--green-soft); }.requests-page .summary-card span { display:block; color:var(--muted); font-size:11px; font-weight:700; }.requests-page .summary-card strong { display:block; margin-top:3px; color:var(--black); font-size:23px; line-height:1; }
  .requests-page .filter-panel { padding:18px; border:1px solid var(--border); border-radius:15px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.04); }.requests-page .filter-heading { display:flex; align-items:center; justify-content:space-between; gap:15px; margin-bottom:13px; }.requests-page .filter-heading h2 { color:var(--black); font-size:15px; }.requests-page .filter-heading span { color:var(--muted); font-size:11px; }.requests-page .search-wrap { position:relative; }.requests-page .search-wrap svg { position:absolute; top:50%; left:14px; color:var(--blue); transform:translateY(-50%); }.requests-page .search { width:100%; min-height:44px; padding:0 16px 0 42px; color:var(--ink); outline:none; border:1px solid var(--border); border-radius:10px; background:#fbfcff; font-size:13px; }.requests-page .search:focus { border-color:#a9bde9; box-shadow:0 0 0 3px var(--blue-soft); }.requests-page .search::placeholder { color:#9aa6b8; }.requests-page .chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:13px; }.requests-page .chip { min-height:32px; padding:0 13px; color:var(--muted); border:1px solid var(--border); border-radius:99px; background:var(--white); font-size:11px; font-weight:800; text-transform:capitalize; transition:.18s ease; }.requests-page .chip:hover { color:var(--blue); border-color:#b9c9ee; background:var(--blue-soft); }.requests-page .chip.active { color:var(--white); border-color:var(--blue); background:var(--blue); box-shadow:0 5px 12px rgba(0,32,159,.16); }
  .requests-page .table-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:15px; margin:24px 0 12px; }.requests-page .table-heading h2 { color:var(--black); font-size:18px; letter-spacing:-.03em; }.requests-page .table-heading p { margin-top:5px; color:var(--muted); font-size:12px; }.requests-page .table-panel { overflow:auto; padding:4px; border:1px solid var(--border); border-radius:15px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.04); }.requests-page .table-panel > * { min-width:680px; }.requests-page .empty-state { padding:44px 20px; color:var(--muted); text-align:center; font-size:13px; }
  @media (max-width:900px) { .requests-page .summary-grid { grid-template-columns:repeat(2,1fr); } }
  @media (max-width:600px) { .requests-page { padding:0; }.requests-page .hero { align-items:stretch; flex-direction:column; }.requests-page .refresh-button { width:100%; }.requests-page .summary-grid { gap:9px; }.requests-page .summary-card { align-items:flex-start; flex-direction:column; gap:8px; min-height:112px; padding:13px; }.requests-page .summary-card strong { font-size:21px; }.requests-page .filter-panel { padding:14px; }.requests-page .filter-heading { align-items:flex-start; flex-direction:column; gap:4px; }.requests-page .table-heading { align-items:flex-start; flex-direction:column; } }
`;

const OfficerRequests = () => {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await API.get('/requests/queue');
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to load request queue:', error);
      setError('Unable to load the request queue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((row) => {
    const matchesStatus = status === 'all' || row.status === status;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || String(row.national_id || '').toLowerCase().includes(query) || String(row.reference_number || '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const summary = {
    total: rows.length,
    pending: rows.filter((row) => ['submitted', 'pending'].includes(row.status)).length,
    review: rows.filter((row) => ['review', 'in_review'].includes(row.status)).length,
    completed: rows.filter((row) => row.status === 'completed').length,
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await API.put(`/requests/${id}/status`, { status: newStatus });
      setRows((current) => current.map((row) => row.id === id ? { ...row, status: newStatus } : row));
    } catch (error) {
      console.error('Unable to update request status:', error);
    }
  };

  const summaryCards = [
    { label: 'Total requests', value: summary.total, icon: 'document' },
    { label: 'Pending', value: summary.pending, icon: 'clock' },
    { label: 'In review', value: summary.review, icon: 'search' },
    { label: 'Completed', value: summary.completed, icon: 'check' },
  ];

  return (
    <OfficerLayout title="Request Queue" subtitle="Filter, review and update applications assigned to your department.">
      <style>{styles}</style>
      <div className="requests-page">
        <header className="hero"><div><div className="eyebrow"><span /> Application operations</div><h1>Request Queue</h1><p>Filter, review, and update applications assigned to your department from one aligned workspace.</p></div><button className="refresh-button" type="button" onClick={load}><Icon name="refresh" size={16} /> Refresh queue</button></header>

        <section className="summary-grid" aria-label="Request summary">{summaryCards.map((card) => <article className="summary-card" key={card.label}><span className="summary-icon"><Icon name={card.icon} size={18} /></span><span><span>{card.label}</span><strong>{loading ? '—' : card.value}</strong></span></article>)}</section>

        <section className="filter-panel" aria-label="Request filters"><div className="filter-heading"><h2>Find an application</h2><span>{filtered.length} result{filtered.length === 1 ? '' : 's'} shown</span></div><div className="search-wrap"><Icon name="search" size={17} /><input className="search" placeholder="Search by national ID or reference number" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="chips" role="group" aria-label="Filter by status">{STATUSES.map((value) => <button key={value} type="button" className={`chip${status === value ? ' active' : ''}`} onClick={() => setStatus(value)}>{value === 'all' ? 'All requests' : value.replace('_', ' ')}</button>)}</div></section>

        <div className="table-heading"><div><h2>Applications</h2><p>Review the latest requests and update their processing status.</p></div></div><section className="table-panel">{error ? <div className="empty-state"><p>{error}</p><button className="refresh-button" type="button" onClick={load}>Try again</button></div> : <RequestTable requests={filtered} rows={filtered} loading={loading} onStatusChange={handleStatusChange} />}</section>
      </div>
    </OfficerLayout>
  );
};

export default OfficerRequests;
