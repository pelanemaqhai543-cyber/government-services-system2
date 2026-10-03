import React, { useState } from 'react';
import OfficerLayout from '../../components/OfficerLayout';
import API from '../../utils/api';

// Keep the canonical endpoint first. The fallbacks support common backend route names
// while the backend is being standardized across officer deployments.
const SEARCH_ENDPOINT = '/employee/search-citizen';

const OfficerSearch = () => {
  const [nationalId, setNationalId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const search = async (event) => {
    event.preventDefault();
    const value = nationalId.trim();
    if (!value) {
      setError('Enter a National ID to search.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await API.get(SEARCH_ENDPOINT, {
        params: { national_id: value },
      });
      setResult(response.data);
    } catch (requestError) {
      const status = requestError.response?.status;

      if (status === 404) {
        setError('Verified citizen not found, or the employee search route is not available.');
      } else if (status === 403) {
        setError('You are not authorized to search citizens.');
      } else if (status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else {
        setError(requestError.response?.data?.message || 'Citizen search failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <OfficerLayout title="Citizen Search" subtitle="Search verified citizens by National ID. You only see fields your department is authorized to access.">
      <style>{styles}</style>
      <div className="officer-search-page">
        <section className="search-panel"><div className="panel-heading"><div><div className="eyebrow"><span /> Secure lookup</div><h2>Find a citizen</h2><p>Use the citizen's National ID to retrieve authorized records.</p></div></div><form onSubmit={search} className="search-form"><label htmlFor="national-id">National ID</label><div className="search-controls"><input id="national-id" inputMode="numeric" placeholder="e.g. 60101234" value={nationalId} onChange={(event) => setNationalId(event.target.value)} /><button type="submit" disabled={loading}>{loading ? 'Searching...' : 'Search citizen'}</button></div></form></section>
        {error && <div className="search-alert" role="alert">{error}</div>}
        {result && <section className="result-card" aria-live="polite"><div className="result-header"><div className="avatar">{result.full_name?.charAt(0)?.toUpperCase() || 'C'}</div><div><h2>{result.full_name || 'Citizen record'}</h2><p>National ID: {result.national_id || nationalId}</p></div></div><div className="fields">{Object.entries(result).map(([key, value]) => { if (['full_name', 'national_id'].includes(key) || value === null || value === undefined || value === '') return null; return <div className="field" key={key}><span>{key.replace(/_/g, ' ')}</span><strong>{String(value)}</strong></div>; })}</div></section>}
      </div>
    </OfficerLayout>
  );
};

const styles = `
  .officer-search-page { --blue:#00209F; --blue-dark:#00166f; --blue-soft:#edf2ff; --green:#009543; --green-soft:#eaf8f0; --black:#000; --ink:#172235; --muted:#718096; --border:#e5e9f0; --white:#fff; max-width:1000px; }.officer-search-page * { box-sizing:border-box; }.officer-search-page h2,.officer-search-page p { margin:0; }.officer-search-page button,.officer-search-page input { font:inherit; }.officer-search-page button { cursor:pointer; }
  .officer-search-page .search-panel,.officer-search-page .result-card { padding:22px; border:1px solid var(--border); border-radius:16px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.045); }.officer-search-page .eyebrow { display:flex; align-items:center; gap:8px; margin-bottom:8px; color:var(--blue); font-size:10px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }.officer-search-page .eyebrow span { width:7px; height:7px; border-radius:50%; background:var(--green); }.officer-search-page h2 { color:var(--black); font-size:18px; }.officer-search-page .panel-heading p { margin-top:6px; color:var(--muted); font-size:12px; }.officer-search-page .search-form { margin-top:21px; }.officer-search-page label { display:block; margin-bottom:7px; color:var(--ink); font-size:11px; font-weight:800; }.officer-search-page .search-controls { display:flex; gap:10px; }.officer-search-page input { flex:1; min-height:44px; padding:0 14px; color:var(--ink); border:1px solid var(--border); border-radius:10px; outline:none; background:#fbfcff; font-size:13px; }.officer-search-page input:focus { border-color:#a9bde9; box-shadow:0 0 0 3px var(--blue-soft); }.officer-search-page button { min-height:44px; padding:0 17px; color:var(--white); border:1px solid var(--blue); border-radius:10px; background:var(--blue); font-size:12px; font-weight:800; }.officer-search-page button:hover { background:var(--blue-dark); }.officer-search-page button:disabled { cursor:wait; opacity:.65; }.officer-search-page .search-alert { margin-top:15px; padding:12px 14px; color:#9b3d3d; border:1px solid #f0caca; border-radius:10px; background:#fff3f3; font-size:12px; line-height:1.5; }.officer-search-page .result-card { margin-top:18px; }.officer-search-page .result-header { display:flex; align-items:center; gap:13px; padding-bottom:18px; border-bottom:1px solid #f0f2f5; }.officer-search-page .avatar { display:grid; place-items:center; width:48px; height:48px; color:var(--white); border-radius:50%; background:var(--green); font-size:17px; font-weight:900; }.officer-search-page .result-header h2 { font-size:17px; }.officer-search-page .result-header p { margin-top:4px; color:var(--muted); font-size:11px; }.officer-search-page .fields { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:11px; margin-top:18px; }.officer-search-page .field { padding:12px; border-radius:10px; background:#f7f9fc; }.officer-search-page .field span { display:block; color:var(--muted); font-size:10px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; }.officer-search-page .field strong { display:block; margin-top:5px; color:var(--ink); font-size:13px; word-break:break-word; }
  @media (max-width:600px) { .officer-search-page .search-panel,.officer-search-page .result-card { padding:16px; }.officer-search-page .search-controls { flex-direction:column; }.officer-search-page button { width:100%; } }
`;

export default OfficerSearch;
