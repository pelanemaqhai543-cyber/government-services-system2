import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import API from '../utils/api';

const STATUS_LABELS = { submitted: 'Submitted', pending: 'Pending', review: 'Under review', in_review: 'Under review', ready: 'Ready for pickup', rejected: 'Rejected', completed: 'Completed', approved: 'Approved' };

const Icon = ({ name, size = 18 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    search: <><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    document: <><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4M9 12h6M9 16h6" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 20h14" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

const styles = `
  .track-page { --blue:#00209F; --blue-dark:#00166f; --blue-soft:#edf2ff; --green:#009543; --green-dark:#007936; --green-soft:#eaf8f0; --black:#000; --ink:#172235; --muted:#718096; --border:#e5e9f0; --white:#fff; width:min(100%,1440px); margin:0 auto; padding:0 2px; color:var(--ink); padding-bottom:35px; }
  .track-page * { box-sizing:border-box; }.track-page button,.track-page input { font:inherit; }.track-page button { cursor:pointer; }.track-page h1,.track-page h2,.track-page p { margin:0; }
  .track-page .hero { position:relative; overflow:hidden; display:flex; align-items:center; justify-content:space-between; gap:22px; min-height:188px; padding:30px 32px; margin-bottom:24px; border:1px solid #00166f; border-radius:22px; background:linear-gradient(118deg,#00145f 0%,#00209f 58%,#003dbb 100%); box-shadow:0 18px 40px rgba(0,32,159,.18); }
  .track-page .hero:after { position:absolute; right:-88px; bottom:-132px; width:320px; height:320px; content:''; border:45px solid rgba(0,149,67,.34); border-radius:50%; }
  .track-page .hero>div { position:relative; z-index:1; }
  .track-page .eyebrow { display:flex; align-items:center; gap:9px; margin-bottom:9px; color:#baf2cf; font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }
  .track-page .eyebrow span { width:8px; height:8px; border-radius:50%; background:#20c778; box-shadow:0 0 0 5px rgba(32,199,120,.2); }
  .track-page h1 { color:#fff; font-size:clamp(28px,3.2vw,42px); letter-spacing:-.055em; }
  .track-page .hero p { color:rgba(255,255,255,.78); margin-top:9px; font-size:14px; }
  .track-page .search-wrap { position:relative; width:270px; z-index:1; }
  .track-page .search-wrap svg { position:absolute; top:50%; left:14px; color:var(--blue); transform:translateY(-50%); }
  .track-page .search { width:100%; min-height:42px; padding:0 14px 0 41px; color:var(--ink); border:1px solid #7f9be0; border-radius:10px; outline:none; background:rgba(255,255,255,.96); font-size:12px; box-shadow:0 8px 18px rgba(0,0,0,.14); }
  .track-page .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:13px; margin-bottom:20px; }
  .track-page .summary-card { position:relative; overflow:hidden; display:flex; align-items:center; gap:11px; min-height:83px; padding:15px; border:1px solid var(--border); border-radius:14px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.04); transition:transform .2s ease,box-shadow .2s ease; }
  .track-page .summary-card:before { position:absolute; top:0; left:0; right:0; height:4px; content:''; background:#00209f; }
  .track-page .summary-card:nth-child(2):before { background:#000; }
  .track-page .summary-card:nth-child(3):before { background:#009543; }
  .track-page .summary-card:nth-child(4):before { background:#000; }
  .track-page .summary-card:hover { transform:translateY(-4px); box-shadow:0 14px 27px rgba(20,35,60,.1); }
  .track-page .summary-icon { display:grid; place-items:center; width:36px; height:36px; color:var(--blue); border-radius:10px; background:var(--blue-soft); }
  .track-page .summary-card:nth-child(3) .summary-icon,.track-page .summary-card:nth-child(4) .summary-icon { color:var(--green); background:var(--green-soft); }
  .track-page .summary-card span { display:block; color:var(--muted); font-size:10px; font-weight:700; }
  .track-page .summary-card strong { display:block; margin-top:3px; color:var(--black); font-size:22px; }
  .track-page .timeline-panel { padding:21px; border:1px solid var(--border); border-radius:16px; background:var(--white); box-shadow:0 10px 26px rgba(20,35,60,.06); }
  .track-page .panel-header { display:flex; align-items:flex-end; justify-content:space-between; gap:15px; padding-bottom:14px; border-bottom:1px solid #f0f2f5; }
  .track-page .panel-header h2 { color:var(--black); font-size:17px; letter-spacing:-.035em; }
  .track-page .panel-header p { margin-top:5px; color:var(--muted); font-size:11px; }
  .track-page .result-count { color:var(--blue); font-size:11px; font-weight:800; }
  .track-page .timeline { position:relative; display:grid; gap:14px; padding:24px 0 4px; }
  .track-page .timeline::before { position:absolute; top:28px; bottom:28px; left:15px; width:1px; content:''; background:linear-gradient(#b5c8f2,#8ed6ae); }
  .track-page .timeline-item { position:relative; display:flex; align-items:flex-start; gap:14px; }
  .track-page .dot { z-index:1; flex:0 0 auto; width:31px; height:31px; display:grid; place-items:center; color:var(--blue); border:1px solid #cbd6f2; border-radius:50%; background:var(--white); box-shadow:0 0 0 4px #edf2ff; }
  .track-page .timeline-item.completed .dot { color:var(--white); border-color:var(--green); background:var(--green); box-shadow:0 0 0 4px #e4f7ec; }
  .track-page .timeline-card { flex:1; min-width:0; padding:15px 17px; border:1px solid var(--border); border-radius:13px; background:#fbfcff; transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease; }
  .track-page .timeline-card:hover { transform:translateX(3px); border-color:#9bb3ee; box-shadow:0 8px 18px rgba(0,32,159,.08); }
  .track-page .timeline-item.completed .timeline-card { border-color:#bce4cf; background:#fbfffc; }
  .track-page .timeline-header { display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .track-page .timeline-title { color:var(--black); font-size:13px; font-weight:800; }
  .track-page .timeline-sub { margin-top:6px; color:var(--muted); font-size:11px; }
  .track-page .ref-line { display:flex; align-items:center; gap:8px; margin-top:8px; padding:6px 10px; background:#edf2ff; border-radius:6px; width:fit-content; }
  .track-page .ref-line code { font-family:monospace; font-size:12px; font-weight:700; color:var(--blue); }
  .track-page .ref-line button { border:0; background:#00209F; color:#fff; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:700; cursor:pointer; }
  .track-page .empty { padding:48px 15px; color:var(--muted); text-align:center; font-size:12px; min-height:220px; }
  .track-page .empty-icon { display:grid; place-items:center; width:42px; height:42px; margin:0 auto 10px; color:var(--blue); border-radius:12px; background:var(--blue-soft); }
  .track-main { min-width:0; width:calc(100% - 240px); min-height:100vh; margin-left:240px; padding:32px 40px; }
  .track-page .update-action { margin-top:10px; padding:12px 14px; background:#fef3c7; border-left:4px solid #b45309; border-radius:8px; }
  .track-page .update-action p { font-size:12px; color:#92400e; margin-bottom:8px; }
  .track-page .update-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; background:#00209F; color:#fff; border:none; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; }
  .track-page .update-btn:hover { background:#00166f; }
  @media (max-width:900px) { .track-page .summary-grid { grid-template-columns:repeat(2,1fr); } .track-main { width:100%; } }
  @media (max-width:600px) { .track-main { width:100%; margin-left:0; padding:22px 16px 32px; } .track-page { padding:0; } .track-page .hero { flex-direction:column; padding:24px 20px; } .track-page .search-wrap { width:100%; } .track-page .summary-grid { gap:9px; } .track-page .summary-card { align-items:flex-start; flex-direction:column; gap:7px; min-height:105px; padding:12px; } .track-page .panel-header { align-items:flex-start; flex-direction:column; } .track-page .timeline-header { align-items:flex-start; flex-direction:column; gap:7px; } }
`;

const TrackRequest = () => {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState('');
  const [uploading, setUploading] = useState(null);

  const loadRequests = () => {
    API.get('/applications/my')
      .then((response) => setRequests(Array.isArray(response.data) ? response.data : []))
      .catch((err) => {
        console.error('Failed to load applications:', err);
        setRequests([]);
      });
  };

  useEffect(() => { loadRequests(); }, []);

  const handleFileUpdate = async (appId, event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(appId);

    // Convert files to base64
    const docs = await Promise.all(files.map((file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_data: reader.result,
      });
      reader.readAsDataURL(file);
    })));

    try {
      await API.put(`/applications/${appId}/update-documents`, { documents: docs });
      alert('Documents uploaded successfully. Your application is now being processed.');
      loadRequests(); // Refresh the timeline
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update application.');
    } finally {
      setUploading(null);
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((request) => !query || String(request.service_type || '').toLowerCase().includes(query) || String(request.reference_number || '').toLowerCase().includes(query));
  }, [requests, search]);

  const completed = requests.filter((request) => ['completed', 'approved'].includes(request.status)).length;
  const active = requests.filter((request) => ['submitted', 'pending', 'review', 'in_review', 'ready'].includes(request.status)).length;
  const rejected = requests.filter((request) => request.status === 'rejected').length;
  const summary = [{ label: 'Total requests', value: requests.length, icon: 'document' }, { label: 'In progress', value: active, icon: 'clock' }, { label: 'Completed', value: completed, icon: 'check' }, { label: 'Rejected', value: rejected, icon: 'document' }];

  const handleCopy = (ref) => {
    navigator.clipboard.writeText(ref).then(() => {
      setCopied(ref);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  return <div style={layoutStyles.layout}><Sidebar /><main className="track-main"><style>{styles}</style><div className="track-page">
    <header className="hero"><div><div className="eyebrow"><span /> Application tracking</div><h1>Track your requests</h1><p>Follow the progress of your government applications and see the latest status updates.</p></div><div className="search-wrap"><Icon name="search" size={17} /><input className="search" placeholder="Search by service or reference" value={search} onChange={(event) => setSearch(event.target.value)} /></div></header>
    <section className="summary-grid" aria-label="Request summary">{summary.map((card) => <article className="summary-card" key={card.label}><span className="summary-icon"><Icon name={card.icon} size={17} /></span><span><span>{card.label}</span><strong>{card.value}</strong></span></article>)}</section>
    <section className="timeline-panel">
      <div className="panel-header"><div><h2>Request timeline</h2><p>Latest applications appear at the top.</p></div><span className="result-count">{filtered.length} result{filtered.length === 1 ? '' : 's'}</span></div>
      {filtered.length === 0 ? <div className="empty"><div className="empty-icon"><Icon name="document" size={19} /></div><p>{requests.length ? 'No requests match your search.' : 'No requests yet.'}</p></div> : (
        <div className="timeline">
          {filtered.map((request) => {
            const status = request.status || 'submitted';
            const date = request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Date unavailable';
            // SHOW UPDATE BUTTON FOR ANY ACTIVE STATUS
            const needsUpdate = ['submitted', 'review', 'pending'].includes(status);
            
            return (
              <div className={`timeline-item${['completed', 'approved'].includes(status) ? ' completed' : ''}`} key={request.id}>
                <div className="dot"><Icon name={['completed', 'approved'].includes(status) ? 'check' : 'clock'} size={15} /></div>
                <div className="timeline-card">
                  <div className="timeline-header">
                    <span className="timeline-title">{STATUS_LABELS[status] || status}</span>
                    <StatusBadge status={status} />
                  </div>
                  <p className="timeline-sub">{request.service_type || 'Government service'} · Submitted {date}</p>
                  <div className="ref-line">
                    <code>{request.reference_number || 'Not assigned'}</code>
                    {request.reference_number && (
                      <button onClick={() => handleCopy(request.reference_number)}>
                        {copied === request.reference_number ? '✓ Copied' : 'Copy'}
                      </button>
                    )}
                  </div>

                  {/* UPLOAD MISSING DOCUMENTS SECTION */}
                  {needsUpdate && (
                    <div className="update-action">
                      <p>⚠️ Need to add or fix documents? Upload them here. The AI will re-review your application.</p>
                      <label className="update-btn">
                        <Icon name="upload" size={12} />
                        {uploading === request.id ? 'Uploading...' : 'Upload Documents'}
                        <input type="file" multiple hidden onChange={(e) => handleFileUpdate(request.id, e)} disabled={uploading === request.id} />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  </div></main></div>;
};

const layoutStyles = { layout: { display: 'flex', minHeight: '100vh', background: '#f7f9fc' } };

export default TrackRequest;