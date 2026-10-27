import React, { useEffect, useState } from 'react';
import API from '../utils/api';

const REC_STYLES = {
  approve: { background: '#e8f7ef', color: '#007936', label: 'AI suggests approval' },
  request_info: { background: '#fff7df', color: '#9a6500', label: 'Additional information required' },
  escalate: { background: '#fff0f0', color: '#a32632', label: 'Officer review required' },
  reject: { background: '#fff0f0', color: '#a32632', label: 'AI suggests rejection' },
};

const Icon = ({ name, size = 18 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    brain: <><path d="M9 4a3 3 0 0 0-3 3v.5A3.5 3.5 0 0 0 4 11a3.5 3.5 0 0 0 2 3.2V16a3 3 0 0 0 3 3" /><path d="M15 4a3 3 0 0 1 3 3v.5a3.5 3.5 0 0 1 2 3.5 3.5 3.5 0 0 1-2 3.2V16a3 3 0 0 1-3 3" /><path d="M9 4v16M15 4v16M9 8h2M13 12h2M9 15h2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    alert: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

const styles = `
.ai-summary-panel{--blue:#00209F;--green:#009543;--ink:#172235;--muted:#718096;--line:#e5e9f0;overflow:hidden;margin-bottom:20px;border:1px solid var(--line);border-radius:17px;background:#fff;box-shadow:0 10px 26px rgba(20,35,60,.07);color:var(--ink)}
.ai-summary-panel *{box-sizing:border-box}.ai-summary-panel h3,.ai-summary-panel h4,.ai-summary-panel p{margin:0}
.ai-summary-head{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:19px 22px;border-bottom:1px solid var(--line);background:linear-gradient(135deg,#fbfdff,#f3f6ff)}
.ai-summary-title{display:flex;align-items:center;gap:10px;color:#000;font-size:16px;font-weight:800}.ai-summary-title svg{color:var(--blue)}
.ai-summary-badge{padding:5px 10px;color:var(--blue);border:1px solid #cbd8fa;border-radius:99px;background:#edf2ff;font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}
.ai-summary-body{padding:21px 22px}.ai-recommendation{display:flex;align-items:center;gap:9px;padding:12px 14px;margin-bottom:19px;border-radius:10px;font-size:13px;font-weight:800}.ai-recommendation svg{flex:0 0 auto}
.ai-summary-section{margin-bottom:18px}.ai-summary-section:last-child{margin-bottom:0}.ai-summary-section h4{margin-bottom:8px;color:var(--blue);font-size:10px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.ai-summary-section p{color:#35445a;font-size:13px;line-height:1.65}
.ai-findings{display:grid;gap:8px;margin:0;padding:0;list-style:none}.ai-finding{padding:10px 12px;color:#526071;border:1px solid var(--line);border-radius:9px;background:#fbfcff;font-size:12px;line-height:1.5}
.ai-rule-box{display:flex;align-items:flex-start;gap:11px;padding:14px 16px;border:1px solid #dbe4f5;border-left:4px solid var(--green);border-radius:0 11px 11px 0;background:#f8fbff}.ai-rule-box svg{flex:0 0 auto;margin-top:2px}.ai-rule-box strong{display:block;margin-bottom:4px;color:#172235;font-size:13px}.ai-rule-box span{display:block;color:#526071;font-size:12px;line-height:1.55}
.ai-summary-loading{display:flex;align-items:center;gap:10px;padding:24px 22px;color:var(--blue);font-size:13px;font-weight:700}.ai-summary-loading i{width:9px;height:9px;border-radius:50%;background:var(--green);box-shadow:0 0 0 5px #eaf8f0}
.ai-summary-error{display:flex;align-items:flex-start;gap:10px;padding:17px 22px;color:#a32632;background:#fff2f3;border-top:3px solid #bd4545;font-size:13px;line-height:1.5}.ai-summary-error svg{flex:0 0 auto}
@media(max-width:560px){.ai-summary-head{align-items:flex-start;flex-direction:column;padding:17px}.ai-summary-body{padding:18px 17px}.ai-summary-badge{align-self:flex-start}}
`;

export default function AISummaryPanel({ applicationId }) {
  const [summary, setSummary] = useState(null);
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!applicationId) { setLoading(false); return undefined; }
    let cancelled = false;
    setLoading(true); setError('');
    Promise.allSettled([API.get(`/ai/summary/${applicationId}`), API.post('/rules/evaluate', { applicationId })]).then(([sumRes, ruleRes]) => {
      if (cancelled) return;
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
      if (ruleRes.status === 'fulfilled') { const payload = ruleRes.value.data || {}; setRules(payload.rule_result || payload); }
      if (sumRes.status === 'rejected' && ruleRes.status === 'rejected') setError('AI review is currently unavailable. Please review the application manually.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [applicationId]);

  if (loading) return <><style>{styles}</style><div className="ai-summary-panel"><div className="ai-summary-loading"><i /><span>AI is analyzing documents and checking eligibility rules…</span></div></div></>;
  if (error) return <><style>{styles}</style><div className="ai-summary-panel"><div className="ai-summary-head"><div className="ai-summary-title"><Icon name="brain" /> AI review summary</div><span className="ai-summary-badge">Advisory only</span></div><div className="ai-summary-error"><Icon name="alert" /><span>{error}</span></div></div></>;

  const recommendation = summary?.recommendation || 'escalate';
  const rec = REC_STYLES[recommendation] || REC_STYLES.escalate;
  const eligible = rules?.eligible;
  const ruleTitle = eligible ? 'Automated requirements passed' : 'Action required before processing';
  const ruleReason = rules?.reason || 'All automated checks passed.';

  return <><style>{styles}</style><section className="ai-summary-panel" aria-label="AI review summary">
    <div className="ai-summary-head"><div className="ai-summary-title"><Icon name="brain" /> AI review summary</div><span className="ai-summary-badge">Advisory only</span></div>
    <div className="ai-summary-body">
      <div className="ai-recommendation" style={{ background: rec.background, color: rec.color }}><Icon name={recommendation === 'approve' ? 'check' : 'alert'} />{rec.label}{summary?.risk_score != null && ` · risk ${summary.risk_score}/100`}</div>
      <div className="ai-summary-section"><h4>Summary</h4><p>{summary?.summary || 'No summary is available. Review the application details and supporting documents manually.'}</p></div>
      {summary?.findings?.length > 0 && <div className="ai-summary-section"><h4>Key findings</h4><ul className="ai-findings">{summary.findings.map((finding, index) => <li className="ai-finding" key={index}>{finding}</li>)}</ul></div>}
      {rules && <div className="ai-summary-section"><h4>Automated eligibility check</h4><div className="ai-rule-box" style={{ borderLeftColor: eligible ? '#009543' : '#c07a00' }}><Icon name={eligible ? 'check' : 'alert'} size={17} /><div><strong>{ruleTitle}</strong><span>{ruleReason}{rules.rule_id ? ` (${rules.rule_id})` : ''}</span></div></div></div>}
    </div>
  </section></>;
}
