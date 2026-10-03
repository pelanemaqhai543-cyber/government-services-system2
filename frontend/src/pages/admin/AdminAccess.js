import React, { useMemo, useState } from 'react';
import OfficerLayout from '../../components/OfficerLayout';

const departments = [
  { role: 'traffic', name: 'Traffic', icon: 'TR', access: ['Driver licence services', 'Vehicle services', 'Authorized citizen information'] },
  { role: 'finance', name: 'Finance', icon: 'FN', access: ['Tax services', 'Revenue information', 'Authorized financial records'] },
  { role: 'pension', name: 'Pension', icon: 'PN', access: ['Pension applications', 'Eligibility information', 'Authorized pension records'] },
  { role: 'police', name: 'Police', icon: 'PL', access: ['Police clearance', 'Background checks', 'Authorized police records'] },
  { role: 'passport', name: 'Passport', icon: 'PP', access: ['Passport applications', 'Passport renewals', 'Required identity documents'] },
];

const Icon = ({ name, size = 19 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    check: <path d="m5 12 4 4L19 6" />,
    shield: <><path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 10v6M12 7h.01" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

const styles = `
  .access-page { --blue:#00209F; --blue-dark:#00166f; --blue-soft:#edf2ff; --green:#009543; --green-dark:#007936; --green-soft:#eaf8f0; --black:#000; --ink:#172235; --muted:#718096; --border:#e5e9f0; --white:#fff; width:min(100%,1440px); margin:0 auto; padding:0 2px; color:var(--ink); }
  .access-page * { box-sizing:border-box; }.access-page button { font:inherit; cursor:pointer; }.access-page h1,.access-page h2,.access-page h3,.access-page p { margin:0; }
  .access-page .hero { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; margin-bottom:28px; }.access-page .eyebrow { display:flex; align-items:center; gap:9px; margin-bottom:10px; color:var(--blue); font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }.access-page .eyebrow span { width:8px; height:8px; border-radius:50%; background:var(--green); box-shadow:0 0 0 5px var(--green-soft); }.access-page h1 { color:var(--black); font-size:clamp(25px,3vw,34px); line-height:1.1; letter-spacing:-.04em; }.access-page .hero p { max-width:680px; margin-top:10px; color:var(--muted); font-size:14px; line-height:1.6; }
  .access-page .overview-strip { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:22px; }.access-page .overview-card { display:flex; align-items:center; gap:13px; min-height:92px; padding:17px 18px; border:1px solid var(--border); border-radius:15px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.05); }.access-page .overview-icon { display:grid; place-items:center; width:40px; height:40px; color:var(--blue); border-radius:11px; background:var(--blue-soft); }.access-page .overview-card:nth-child(2) .overview-icon { color:var(--green); background:var(--green-soft); }.access-page .overview-card:nth-child(3) .overview-icon { color:var(--black); background:#f2f2f2; }.access-page .overview-card span { display:block; color:var(--muted); font-size:11px; font-weight:700; }.access-page .overview-card strong { display:block; margin-top:3px; color:var(--black); font-size:23px; letter-spacing:-.04em; }
  .access-page .access-layout { display:grid; grid-template-columns:260px minmax(0,1fr); align-items:stretch; gap:18px; }.access-page .panel { min-width:0; border:1px solid var(--border); border-radius:16px; background:var(--white); box-shadow:0 7px 20px rgba(20,35,60,.045); }.access-page .department-panel { padding:18px; }.access-page .department-panel h2 { margin:2px 0 4px; font-size:17px; letter-spacing:-.02em; }.access-page .department-panel > p { margin-bottom:16px; color:var(--muted); font-size:12px; line-height:1.45; }.access-page .department-list { display:grid; gap:8px; }.access-page .department-button { display:flex; align-items:center; gap:10px; width:100%; min-height:48px; padding:0 11px; color:var(--ink); text-align:left; border:1px solid transparent; border-radius:10px; background:transparent; font-size:13px; font-weight:800; transition:.2s ease; }.access-page .department-button:hover { border-color:#cfd9ef; background:var(--blue-soft); }.access-page .department-button.active { color:var(--blue); border-color:#bccdf4; background:var(--blue-soft); }.access-page .department-mark { display:grid; place-items:center; width:28px; height:28px; color:var(--blue); border-radius:8px; background:var(--white); font-size:9px; font-weight:900; }.access-page .department-button.active .department-mark { color:var(--white); background:var(--blue); }
  .access-page .details-panel { overflow:hidden; }.access-page .details-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:22px 24px 19px; border-bottom:1px solid var(--border); }.access-page .details-heading { display:flex; align-items:center; gap:13px; min-width:0; }.access-page .details-badge { display:grid; flex:0 0 auto; place-items:center; width:44px; height:44px; color:var(--white); border-radius:12px; background:var(--blue); font-size:12px; font-weight:900; }.access-page .details-heading h2 { color:var(--black); font-size:20px; letter-spacing:-.03em; }.access-page .details-heading p { margin-top:5px; color:var(--muted); font-size:12px; }.access-page .status-pill { display:inline-flex; align-items:center; gap:6px; min-height:28px; padding:0 9px; color:var(--green-dark); border:1px solid #bfe4cf; border-radius:99px; background:var(--green-soft); font-size:10px; font-weight:800; white-space:nowrap; }.access-page .status-pill i { width:6px; height:6px; border-radius:50%; background:var(--green); }.access-page .permission-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; padding:21px 24px; }.access-page .permission-card { display:flex; align-items:flex-start; gap:11px; min-height:92px; padding:15px; border:1px solid var(--border); border-radius:12px; background:#fcfdff; }.access-page .permission-icon { display:grid; flex:0 0 auto; place-items:center; width:30px; height:30px; color:var(--green); border-radius:8px; background:var(--green-soft); }.access-page .permission-card strong { display:block; color:var(--ink); font-size:12px; line-height:1.35; }.access-page .permission-card p { margin-top:5px; color:var(--muted); font-size:10px; line-height:1.4; }.access-page .security-note { display:flex; align-items:flex-start; gap:10px; margin:0 24px 23px; padding:13px 14px; color:var(--ink); border-left:3px solid var(--black); background:#f5f5f5; font-size:11px; line-height:1.5; }.access-page .security-note svg { flex:0 0 auto; color:var(--black); margin-top:1px; }
  @media (max-width:850px) { .access-page .access-layout { grid-template-columns:1fr; }.access-page .department-panel { padding:16px; }.access-page .department-list { grid-template-columns:repeat(3,1fr); }.access-page .department-button { justify-content:center; flex-direction:column; gap:5px; min-height:72px; padding:8px; text-align:center; font-size:11px; } }
  @media (max-width:600px) { .access-page { padding:0; }.access-page .hero { align-items:stretch; flex-direction:column; }.access-page .overview-strip { gap:9px; }.access-page .overview-card { align-items:flex-start; flex-direction:column; gap:8px; min-height:112px; padding:13px; }.access-page .overview-card strong { font-size:20px; }.access-page .department-list { grid-template-columns:repeat(2,1fr); }.access-page .details-header { align-items:flex-start; flex-direction:column; padding:18px 16px; }.access-page .permission-grid { grid-template-columns:1fr; padding:16px; }.access-page .security-note { margin:0 16px 17px; } }
`;

const AdminAccess = () => {
  const [selected, setSelected] = useState('traffic');
  const department = useMemo(() => departments.find((item) => item.role === selected), [selected]);
  const totalPermissions = departments.reduce((sum, item) => sum + item.access.length, 0);

  return (
    <OfficerLayout title="Access Control">
      <style>{styles}</style>
      <div className="access-page">
        <header className="hero"><div><div className="eyebrow"><span /> Security administration</div><h1>Department Access Control</h1><p>Manage the information and government services that each department is authorized to access.</p></div></header>

        <section className="overview-strip" aria-label="Access control overview">
          <article className="overview-card"><span className="overview-icon"><Icon name="shield" size={19} /></span><span><span>Departments managed</span><strong>{departments.length}</strong></span></article>
          <article className="overview-card"><span className="overview-icon"><Icon name="check" size={19} /></span><span><span>Authorized permissions</span><strong>{totalPermissions}</strong></span></article>
          <article className="overview-card"><span className="overview-icon"><Icon name="lock" size={19} /></span><span><span>Policy status</span><strong>Protected</strong></span></article>
        </section>

        <section className="access-layout">
          <aside className="panel department-panel"><h2>Departments</h2><p>Select a department to review its authorized access scope.</p><div className="department-list">{departments.map((item) => <button key={item.role} type="button" className={`department-button${selected === item.role ? ' active' : ''}`} onClick={() => setSelected(item.role)}><span className="department-mark">{item.icon}</span>{item.name}</button>)}</div></aside>

          <article className="panel details-panel">
            {department && <>
              <div className="details-header"><div className="details-heading"><span className="details-badge">{department.icon}</span><div><h2>{department.name} Department</h2><p>Authorized information and services</p></div></div><span className="status-pill"><i /> Access active</span></div>
              <div className="permission-grid">{department.access.map((permission) => <div className="permission-card" key={permission}><span className="permission-icon"><Icon name="check" size={16} /></span><div><strong>{permission}</strong><p>Access is controlled by the department role.</p></div></div>)}</div>
              <div className="security-note"><Icon name="info" size={16} /><span>Department employees must only access information required for their authorized government services. All access is subject to security and privacy policies.</span></div>
            </>}
          </article>
        </section>
      </div>
    </OfficerLayout>
  );
};

export default AdminAccess;
