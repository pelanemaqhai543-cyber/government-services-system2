import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import OfficerLayout from '../../components/OfficerLayout';
import RequestTable from '../../components/RequestTable';
import API from '../../utils/api';

const Icon = ({ name, size = 20 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  const paths = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),

    check: <path d="m5 12 4 4L19 6" />,

    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    document: (
      <>
        <path d="M6 3.5h8l4 4V20.5H6z" />
        <path d="M14 3.5v4h4" />
        <path d="M9 12h6M9 16h6" />
      </>
    ),

    shield: (
      <>
        <path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
        <path d="M15 5.5a3 3 0 0 1 0 5.8M17 14.5a5.5 5.5 0 0 1 3.5 5" />
      </>
    ),

    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),

    refresh: (
      <>
        <path d="M20 11a8 8 0 0 0-14.8-3L3 11" />
        <path d="M3 5v6h6" />
        <path d="M4 13a8 8 0 0 0 14.8 3L21 13" />
        <path d="M21 19v-6h-6" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
};

const styles = `
  /* =========================================================
     LESOTHO FLAG THEME
     Blue  : #00209F
     White : #FFFFFF
     Green : #009543
     Black : #000000
     ========================================================= */

  .ha-dashboard {
    --ha-blue: #00209F;
    --ha-blue-dark: #00166f;
    --ha-blue-soft: #edf2ff;

    --ha-green: #009543;
    --ha-green-dark: #007936;
    --ha-green-soft: #eaf8f0;

    --ha-black: #000000;
    --ha-ink: #172235;

    --ha-muted: #718096;
    --ha-border: #e5e9f0;
    --ha-border-dark: #d6dce6;

    --ha-white: #ffffff;

    --ha-gold: var(--ha-black);
    --ha-gold-soft: #f2f2f2;

    --ha-danger: #bd4545;
    --ha-danger-soft: #fff1f1;

    color: var(--ha-ink);
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    padding: 0;
    align-self: stretch;
  }

  .ha-dashboard *,
  .ha-dashboard *::before,
  .ha-dashboard *::after {
    box-sizing: border-box;
  }

  .ha-dashboard button {
    font: inherit;
    cursor: pointer;
  }

  .ha-dashboard h1,
  .ha-dashboard h2,
  .ha-dashboard h3,
  .ha-dashboard p {
    margin: 0;
  }

  /* =========================================================
     HERO
     ========================================================= */

  .ha-dashboard .hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 28px;
    width: 100%;
    max-width: 100%;
    margin-bottom: 28px;
  }

  .ha-dashboard .hero-copy {
    min-width: 0;
  }

  .ha-dashboard .eyebrow {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 10px;
    color: var(--ha-blue);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .13em;
    text-transform: uppercase;
  }

  .ha-dashboard .eyebrow span {
    width: 8px;
    height: 8px;
    flex: 0 0 8px;
    border-radius: 50%;
    background: var(--ha-green);
    box-shadow: 0 0 0 5px var(--ha-green-soft);
  }

  .ha-dashboard h1 {
    font-size: clamp(25px, 3vw, 34px);
    line-height: 1.1;
    letter-spacing: -.04em;
    color: var(--ha-black);
  }

  .ha-dashboard .hero-copy p {
    max-width: 690px;
    margin-top: 10px;
    color: var(--ha-muted);
    font-size: 14px;
    line-height: 1.6;
  }

  /* =========================================================
     BUTTONS
     ========================================================= */

  .ha-dashboard .primary-button,
  .ha-dashboard .secondary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 800;
    transition:
      transform .2s ease,
      background .2s ease,
      border-color .2s ease,
      box-shadow .2s ease;
    white-space: nowrap;
  }

  .ha-dashboard .primary-button {
    min-height: 44px;
    padding: 0 18px;
    color: var(--ha-white);
    border: 1px solid var(--ha-blue);
    background: var(--ha-blue);
    box-shadow: 0 8px 18px rgba(0, 32, 159, .20);
  }

  .ha-dashboard .primary-button:hover {
    transform: translateY(-2px);
    background: var(--ha-blue-dark);
    border-color: var(--ha-blue-dark);
    box-shadow: 0 11px 22px rgba(0, 32, 159, .25);
  }

  .ha-dashboard .secondary-button {
    min-height: 36px;
    padding: 0 13px;
    color: var(--ha-blue);
    border: 1px solid #cbd6f2;
    background: var(--ha-white);
  }

  .ha-dashboard .secondary-button:hover {
    background: var(--ha-blue-soft);
    border-color: #aebde8;
  }

  /* =========================================================
     STATISTICS
     ========================================================= */

  .ha-dashboard .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: stretch;
    gap: 14px;
    width: 100%;
    margin-bottom: 22px;
  }

  .ha-dashboard .stat-card {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    min-width: 0;
    min-height: 132px;
    padding: 20px;
    border: 1px solid var(--ha-border);
    border-radius: 16px;
    background: var(--ha-white);
    box-shadow: 0 7px 20px rgba(20, 35, 60, .055);
    transition:
      transform .2s ease,
      box-shadow .2s ease,
      border-color .2s ease;
  }

  .ha-dashboard .stat-card:hover {
    transform: translateY(-2px);
    border-color: #cfd7e5;
    box-shadow: 0 11px 26px rgba(20, 35, 60, .08);
  }

  .ha-dashboard .stat-card::after {
    position: absolute;
    right: -32px;
    bottom: -45px;
    width: 115px;
    height: 115px;
    content: '';
    border-radius: 50%;
    background: var(--ha-blue-soft);
    pointer-events: none;
  }

  .ha-dashboard .stat-top {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 38px;
  }

  .ha-dashboard .stat-icon {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    color: var(--ha-blue);
    border-radius: 11px;
    background: var(--ha-blue-soft);
  }

  .ha-dashboard .stat-trend {
    color: var(--ha-green);
    font-size: 11px;
    font-weight: 800;
    text-align: right;
  }

  .ha-dashboard .stat-label {
    position: relative;
    z-index: 1;
    display: block;
    margin-top: 18px;
    color: var(--ha-muted);
    font-size: 12px;
    font-weight: 700;
  }

  .ha-dashboard .stat-value {
    position: relative;
    z-index: 1;
    display: block;
    margin-top: 4px;
    color: var(--ha-black);
    font-size: 30px;
    line-height: 1;
    letter-spacing: -.05em;
  }

  /* =========================================================
     OVERVIEW
     ========================================================= */

  .ha-dashboard .overview-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(280px, .85fr);
    align-items: stretch;
    gap: 18px;
    width: 100%;
    margin-bottom: 26px;
  }

  .ha-dashboard .panel {
    min-width: 0;
    border: 1px solid var(--ha-border);
    border-radius: 16px;
    background: var(--ha-white);
    box-shadow: 0 7px 20px rgba(20, 35, 60, .045);
  }

  .ha-dashboard .panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    min-height: 63px;
    padding: 20px 22px 0;
  }

  .ha-dashboard .panel-header > div {
    min-width: 0;
  }

  .ha-dashboard .panel-header h2 {
    color: var(--ha-black);
    font-size: 17px;
    line-height: 1.2;
    letter-spacing: -.02em;
  }

  .ha-dashboard .panel-header p {
    margin-top: 5px;
    color: var(--ha-muted);
    font-size: 12px;
    line-height: 1.45;
  }

  .ha-dashboard .chart-panel {
    height: 350px;
    min-height: 350px;
    overflow: hidden;
  }

  .ha-dashboard .chart-area {
    height: 287px;
    min-height: 0;
    overflow: hidden;
    padding: 20px 22px 18px;
  }

  .ha-dashboard .chart-legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 18px;
    margin-bottom: 12px;
    color: var(--ha-muted);
    font-size: 11px;
    font-weight: 700;
  }

  .ha-dashboard .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .ha-dashboard .legend-dot {
    width: 8px;
    height: 8px;
    flex: 0 0 8px;
    border-radius: 50%;
  }

  .ha-dashboard .legend-dot.pending {
    background: var(--ha-gold);
  }

  .ha-dashboard .legend-dot.review {
    background: var(--ha-blue);
  }

  .ha-dashboard .legend-dot.completed {
    background: var(--ha-green);
  }

  /* =========================================================
     BAR CHART
     ========================================================= */

  .ha-dashboard .bar-chart {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: end;
    gap: 20px;
    height: 155px;
    max-height: 155px;
    overflow: hidden;
    padding: 8px 10px 0;
    border-bottom: 1px solid var(--ha-border);
    background:
      repeating-linear-gradient(
        to bottom,
        transparent 0,
        transparent 45px,
        #f0f3f7 46px
      );
  }

  .ha-dashboard .bar-group {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 7px;
    height: 100%;
    min-width: 0;
  }

  .ha-dashboard .bar {
    width: 30px;
    height: auto;
    max-height: 147px;
    min-height: 8px;
    border-radius: 7px 7px 0 0;
    transition: height .35s ease;
  }

  .ha-dashboard .bar.pending {
    background: var(--ha-gold);
  }

  .ha-dashboard .bar.review {
    background: var(--ha-blue);
  }

  .ha-dashboard .bar.completed {
    background: var(--ha-green);
  }

  .ha-dashboard .bar-labels {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    padding: 9px 10px 0;
    color: var(--ha-muted);
    font-size: 11px;
    font-weight: 700;
    text-align: center;
  }

  /* =========================================================
     DISTRIBUTION
     ========================================================= */

  .ha-dashboard .distribution {
    display: flex;
    flex-direction: column;
    min-height: 310px;
  }

  .ha-dashboard .distribution-body {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 20px;
  }

  .ha-dashboard .donut {
    position: relative;
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    width: 150px;
    height: 150px;
    border-radius: 50%;

    background:
      conic-gradient(
        var(--ha-gold) 0 34%,
        var(--ha-blue) 34% 62%,
        var(--ha-green) 62% 100%
      );
  }

  .ha-dashboard .donut::after {
    width: 102px;
    height: 102px;
    content: '';
    border-radius: 50%;
    background: var(--ha-white);
  }

  .ha-dashboard .donut-center {
    position: absolute;
    z-index: 1;
    display: grid;
    text-align: center;
  }

  .ha-dashboard .donut-center strong {
    color: var(--ha-black);
    font-size: 27px;
    line-height: 1;
    letter-spacing: -.05em;
  }

  .ha-dashboard .donut-center span {
    margin-top: 4px;
    color: var(--ha-muted);
    font-size: 10px;
    font-weight: 700;
  }

  .ha-dashboard .distribution-list {
    display: grid;
    gap: 14px;
    min-width: 110px;
  }

  .ha-dashboard .distribution-item {
    display: grid;
    grid-template-columns: 9px 1fr auto;
    align-items: center;
    gap: 8px;
    min-width: 0;
    font-size: 12px;
  }

  .ha-dashboard .distribution-item i {
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }

  .ha-dashboard .distribution-item span {
    color: var(--ha-muted);
  }

  .ha-dashboard .distribution-item strong {
    color: var(--ha-black);
    font-size: 13px;
  }

  /* =========================================================
     SECTION HEADINGS
     ========================================================= */

  .ha-dashboard .section-heading {
    width: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    width: 100%;
    margin: 26px 0 13px;
  }

  .ha-dashboard .section-heading > div {
    min-width: 0;
  }

  .ha-dashboard .section-heading h2 {
    color: var(--ha-black);
    font-size: 18px;
    line-height: 1.2;
    letter-spacing: -.03em;
  }

  .ha-dashboard .section-heading p {
    margin-top: 5px;
    color: var(--ha-muted);
    font-size: 12px;
    line-height: 1.45;
  }

  /* =========================================================
     ACTION CARDS
     ========================================================= */

  .ha-dashboard .action-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: stretch;
    gap: 14px;
    width: 100%;
  }

  .ha-dashboard .action-card {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    min-width: 0;
    min-height: 115px;
    padding: 18px;
    color: inherit;
    text-align: left;
    border: 1px solid var(--ha-border);
    border-radius: 14px;
    background: var(--ha-white);
    box-shadow: 0 7px 20px rgba(20, 35, 60, .04);
    transition:
      transform .2s ease,
      border-color .2s ease,
      box-shadow .2s ease;
  }

  .ha-dashboard .action-card:hover {
    transform: translateY(-3px);
    border-color: #b8c7eb;
    box-shadow: 0 12px 25px rgba(20, 35, 60, .09);
  }

  .ha-dashboard .action-icon {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    width: 40px;
    height: 40px;
    color: var(--ha-blue);
    border-radius: 11px;
    background: var(--ha-blue-soft);
  }

  .ha-dashboard .action-card h3 {
    color: var(--ha-black);
    font-size: 14px;
    line-height: 1.25;
  }

  .ha-dashboard .action-card p {
    margin-top: 6px;
    color: var(--ha-muted);
    font-size: 12px;
    line-height: 1.45;
  }

  /* =========================================================
     VERIFICATION QUEUE
     ========================================================= */

  .ha-dashboard .queue-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    min-height: 70px;
    padding: 16px 22px;
    border-top: 1px solid var(--ha-border);
  }

  .ha-dashboard .queue-row:first-child {
    border-top: 0;
  }

  .ha-dashboard .citizen-info {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .ha-dashboard .avatar {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    width: 38px;
    height: 38px;
    color: var(--ha-blue);
    border: 1px solid #d2dcf5;
    border-radius: 50%;
    background: var(--ha-blue-soft);
    font-size: 13px;
    font-weight: 800;
  }

  .ha-dashboard .citizen-copy {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .ha-dashboard .citizen-copy strong {
    overflow: hidden;
    color: var(--ha-black);
    font-size: 13px;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ha-dashboard .citizen-copy span {
    overflow: hidden;
    color: var(--ha-muted);
    font-size: 11px;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ha-dashboard .verification-actions {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 8px;
  }

  .ha-dashboard .approve-button,
  .ha-dashboard .reject-button {
    min-height: 32px;
    padding: 0 11px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 800;
    transition: .2s ease;
  }

  .ha-dashboard .approve-button {
    color: var(--ha-green-dark);
    border: 1px solid #b8dfc8;
    background: var(--ha-green-soft);
  }

  .ha-dashboard .approve-button:hover {
    background: #dff3e8;
    border-color: #98ceb0;
  }

  .ha-dashboard .reject-button {
    color: var(--ha-danger);
    border: 1px solid #eccaca;
    background: var(--ha-danger-soft);
  }

  .ha-dashboard .reject-button:hover {
    background: #ffe7e7;
    border-color: #dfaaaa;
  }

  .ha-dashboard .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 115px;
    padding: 38px 22px;
    color: var(--ha-muted);
    text-align: center;
    font-size: 13px;
  }

  /* =========================================================
     TABLE
     ========================================================= */

  .ha-dashboard .table-panel {
    overflow-x: auto;
    overflow-y: hidden;
    padding: 4px;
  }

  .ha-dashboard .table-panel > * {
    min-width: 650px;
  }

  /* =========================================================
     SMALL LESOTHO FLAG ACCENT
     ========================================================= */

  .ha-dashboard .panel,
  .ha-dashboard .stat-card,
  .ha-dashboard .action-card {
    position: relative;
  }

  .ha-dashboard .action-card::before {
    position: absolute;
    top: 0;
    left: 18px;
    right: 18px;
    height: 3px;
    content: '';
    border-radius: 0 0 4px 4px;
    background: linear-gradient(
      90deg,
      var(--ha-blue) 0 33.33%,
      var(--ha-black) 33.33% 66.66%,
      var(--ha-green) 66.66% 100%
    );
    opacity: .9;
  }

  /* =========================================================
     RESPONSIVE
     ========================================================= */

  @media (max-width: 1100px) {
    .ha-dashboard .overview-grid {
      grid-template-columns: 1fr;
    }

    .ha-dashboard .distribution {
      min-height: 280px;
    }
  }

  @media (max-width: 980px) {
    .ha-dashboard { padding: 0; }
    .ha-dashboard .stat-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .ha-dashboard .action-grid {
      grid-template-columns: 1fr;
    }

    .ha-dashboard .action-card {
      min-height: 100px;
    }
  }

  @media (max-width: 700px) {
    .ha-dashboard .hero {
      align-items: stretch;
      flex-direction: column;
      gap: 18px;
    }

    .ha-dashboard .hero .primary-button {
      width: 100%;
    }

    .ha-dashboard .section-heading {
    width: 100%;
      align-items: flex-start;
      flex-direction: column;
    }

    .ha-dashboard .section-heading .secondary-button {
      width: 100%;
    }

    .ha-dashboard .bar-chart {
      gap: 10px;
      padding-left: 2px;
      padding-right: 2px;
    }

    .ha-dashboard .bar {
      width: 23px;
    }

    .ha-dashboard .bar-group {
      gap: 4px;
    }
  }

  @media (max-width: 640px) {
    .ha-dashboard .stat-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .ha-dashboard .stat-card {
      min-height: 118px;
      padding: 15px;
    }

    .ha-dashboard .stat-value {
      font-size: 25px;
    }

    .ha-dashboard .stat-trend {
      max-width: 80px;
      font-size: 10px;
    }

    .ha-dashboard .panel-header {
      min-height: 58px;
      padding: 17px 16px 0;
    }

    .ha-dashboard .chart-area {
      height: 272px;
      padding: 17px 16px;
    }

    .ha-dashboard .chart-panel {
      height: 335px;
      min-height: 335px;
    }

    .ha-dashboard .distribution-body {
      flex-direction: column;
      padding: 18px;
    }

    .ha-dashboard .distribution-list {
      width: 100%;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    .ha-dashboard .distribution-item {
      grid-template-columns: 8px 1fr;
      gap: 5px;
    }

    .ha-dashboard .distribution-item strong {
      grid-column: 2;
    }

    .ha-dashboard .queue-row {
      align-items: flex-start;
      flex-direction: column;
      padding: 15px 16px;
    }

    .ha-dashboard .verification-actions {
      width: 100%;
    }

    .ha-dashboard .approve-button,
    .ha-dashboard .reject-button {
      flex: 1;
    }

    .ha-dashboard .action-card {
      padding: 17px;
    }
  }

  @media (max-width: 430px) {
    .ha-dashboard .stat-grid {
      grid-template-columns: 1fr;
    }

    .ha-dashboard .distribution-list {
      grid-template-columns: 1fr;
    }

    .ha-dashboard .bar {
      width: 18px;
    }

    .ha-dashboard .chart-legend {
      gap: 10px;
    }
  }
`;

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [pendingCitizens, setPendingCitizens] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [
        requestsResponse,
        verificationResponse,
      ] = await Promise.all([
        API.get('/requests/queue'),
        API.get('/citizen/pending-verifications'),
      ]);

      setRequests(requestsResponse.data || []);
      setPendingCitizens(
        verificationResponse.data || []
      );
    } catch (error) {
      console.error(
        'Failed to load Home Affairs dashboard:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const metrics = useMemo(
    () => ({
      pending: requests.filter((item) =>
        ['submitted', 'pending'].includes(
          item.status
        )
      ).length,

      review: requests.filter((item) =>
        ['review', 'in_review'].includes(
          item.status
        )
      ).length,

      completed: requests.filter(
        (item) => item.status === 'completed'
      ).length,
    }),
    [requests]
  );

  const graphMax = Math.max(
    metrics.pending,
    metrics.review,
    metrics.completed,
    1
  );

  const graphHeight = (value) =>
    `${Math.max(
      10,
      Math.round(
        (value / graphMax) * 155
      )
    )}px`;

  const handleVerify = async (
    userId,
    status
  ) => {
    try {
      await API.post(
        '/citizen/verify',
        {
          userId: userId,
          status,
        }
      );

      setPendingCitizens(
        (current) =>
          current.filter(
            (citizen) =>
              citizen.id !== userId
          )
      );
    } catch (error) {
      console.error(
        'Citizen verification failed:',
        error
      );
    }
  };

  const handleStatusChange = async (
    requestId,
    status
  ) => {
    try {
      await API.put(
        `/requests/${requestId}/status`,
        {
          status,
        }
      );

      setRequests(
        (current) =>
          current.map(
            (request) =>
              request.id === requestId
                ? {
                    ...request,
                    status,
                  }
                : request
          )
      );
    } catch (error) {
      console.error(
        'Unable to update request status:',
        error
      );
    }
  };

  const stats = [
    {
      title: 'Pending verification',
      value: pendingCitizens.length,
      icon: 'users',
      trend: 'Needs attention',
    },

    {
      title: 'Total applications',
      value: requests.length,
      icon: 'document',
      trend: 'All departments',
    },

    {
      title: 'In review',
      value: metrics.review,
      icon: 'clock',
      trend: 'Active queue',
    },

    {
      title: 'Completed',
      value: metrics.completed,
      icon: 'check',
      trend: 'Processed',
    },
  ];

  return (
    <OfficerLayout title="Home Affairs">

      <style>{styles}</style>

      <div className="ha-dashboard">

        {/* =================================================
            HERO
            ================================================= */}

        <header className="hero">

          <div className="hero-copy">

            <div className="eyebrow">
              <span />
              Operations overview
            </div>

            <h1>
              Home Affairs Administration
            </h1>

            <p>
              Monitor citizen verification,
              oversee applications, and keep
              government services moving from
              one central workspace.
            </p>

          </div>

          <button
            className="primary-button"
            type="button"
            onClick={() =>
              navigate(
                '/home-affairs/requests'
              )
            }
          >
            Manage requests
            <Icon
              name="arrow"
              size={17}
            />
          </button>

        </header>

        {/* =================================================
            STATISTICS
            ================================================= */}

        <section
          className="stat-grid"
          aria-label="Key performance indicators"
        >

          {stats.map((stat) => (

            <article
              className="stat-card"
              key={stat.title}
            >

              <div className="stat-top">

                <span className="stat-icon">
                  <Icon
                    name={stat.icon}
                    size={19}
                  />
                </span>

                <span className="stat-trend">
                  {stat.trend}
                </span>

              </div>

              <span className="stat-label">
                {stat.title}
              </span>

              <strong className="stat-value">
                {loading
                  ? '—'
                  : stat.value}
              </strong>

            </article>

          ))}

        </section>

        {/* =================================================
            APPLICATION OVERVIEW
            ================================================= */}

        <section
          className="overview-grid"
          aria-label="Applications overview"
        >

          <article
            className="panel chart-panel"
          >

            <div className="panel-header">

              <div>
                <h2>
                  Application overview
                </h2>

                <p>
                  Current workload by
                  processing stage
                </p>
              </div>

              <span className="secondary-button">
                Live data
              </span>

            </div>

            <div className="chart-area">

              <div className="chart-legend">

                <span className="legend-item">
                  <i className="legend-dot pending" />
                  Pending
                </span>

                <span className="legend-item">
                  <i className="legend-dot review" />
                  In review
                </span>

                <span className="legend-item">
                  <i className="legend-dot completed" />
                  Completed
                </span>

              </div>

              <div
                className="bar-chart"
                aria-label="Bar chart showing pending, in review, and completed applications"
              >

                <div className="bar-group">

                  <div
                    className="bar pending"
                    style={{
                      height:
                        graphHeight(
                          metrics.pending
                        ),
                    }}
                    title={`Pending: ${metrics.pending}`}
                  />

                  <div
                    className="bar review"
                    style={{
                      height:
                        graphHeight(
                          metrics.review
                        ),
                    }}
                    title={`In review: ${metrics.review}`}
                  />

                  <div
                    className="bar completed"
                    style={{
                      height:
                        graphHeight(
                          metrics.completed
                        ),
                    }}
                    title={`Completed: ${metrics.completed}`}
                  />

                </div>

                <div className="bar-group">

                  <div
                    className="bar pending"
                    style={{
                      height:
                        graphHeight(
                          pendingCitizens.length
                        ),
                    }}
                    title={`Verifications: ${pendingCitizens.length}`}
                  />

                  <div
                    className="bar review"
                    style={{
                      height:
                        graphHeight(
                          requests.length
                        ),
                    }}
                    title={`Applications: ${requests.length}`}
                  />

                  <div
                    className="bar completed"
                    style={{
                      height:
                        graphHeight(
                          metrics.completed
                        ),
                    }}
                    title={`Completed: ${metrics.completed}`}
                  />

                </div>

                <div className="bar-group">

                  <div
                    className="bar pending"
                    style={{
                      height:
                        graphHeight(
                          metrics.pending
                        ),
                    }}
                  />

                  <div
                    className="bar review"
                    style={{
                      height:
                        graphHeight(
                          metrics.review
                        ),
                    }}
                  />

                  <div
                    className="bar completed"
                    style={{
                      height:
                        graphHeight(
                          metrics.completed
                        ),
                    }}
                  />

                </div>

              </div>

              <div className="bar-labels">
                <span>Requests</span>
                <span>Department load</span>
                <span>Current total</span>
              </div>

            </div>

          </article>

          {/* =================================================
              STATUS MIX
              ================================================= */}

          <article
            className="panel distribution"
          >

            <div className="panel-header">

              <div>
                <h2>
                  Status mix
                </h2>

                <p>
                  Application distribution
                </p>
              </div>

            </div>

            <div className="distribution-body">

              <div className="donut">

                <div className="donut-center">

                  <strong>
                    {requests.length}
                  </strong>

                  <span>
                    applications
                  </span>

                </div>

              </div>

              <div className="distribution-list">

                <div className="distribution-item">

                  <i
                    style={{
                      background:
                        'var(--ha-gold)',
                    }}
                  />

                  <span>
                    Pending
                  </span>

                  <strong>
                    {metrics.pending}
                  </strong>

                </div>

                <div className="distribution-item">

                  <i
                    style={{
                      background:
                        'var(--ha-blue)',
                    }}
                  />

                  <span>
                    Review
                  </span>

                  <strong>
                    {metrics.review}
                  </strong>

                </div>

                <div className="distribution-item">

                  <i
                    style={{
                      background:
                        'var(--ha-green)',
                    }}
                  />

                  <span>
                    Done
                  </span>

                  <strong>
                    {metrics.completed}
                  </strong>

                </div>

              </div>

            </div>

          </article>

        </section>

        {/* =================================================
            ADMINISTRATION SHORTCUTS
            ================================================= */}

        <div className="section-heading">

          <div>

            <h2>
              Administration shortcuts
            </h2>

            <p>
              Frequently used tools for
              managing the public service
              system.
            </p>

          </div>

        </div>

        <section
          className="action-grid"
          aria-label="Administration shortcuts"
        >

          <button
            className="action-card"
            type="button"
            onClick={() =>
              navigate(
                '/home-affairs/verify'
              )
            }
          >

            <span className="action-icon">
              <Icon name="users" />
            </span>

            <span>
              <h3>
                Verify citizens
              </h3>

              <p>
                Review and approve identity
                verification requests.
              </p>
            </span>

          </button>

          <button
            className="action-card"
            type="button"
            onClick={() =>
              navigate(
                '/home-affairs/requests'
              )
            }
          >

            <span className="action-icon">
              <Icon name="document" />
            </span>

            <span>
              <h3>
                All applications
              </h3>

              <p>
                Monitor applications
                submitted across departments.
              </p>
            </span>

          </button>

          <button
            className="action-card"
            type="button"
            onClick={() =>
              navigate(
                '/home-affairs/access'
              )
            }
          >

            <span className="action-icon">
              <Icon name="lock" />
            </span>

            <span>
              <h3>
                Access control
              </h3>

              <p>
                Manage authorized
                departmental information
                access.
              </p>
            </span>

          </button>

        </section>

        {/* =================================================
            PENDING CITIZEN VERIFICATION
            ================================================= */}

        <div className="section-heading">

          <div>

            <h2>
              Pending citizen verification
            </h2>

            <p>
              Citizens waiting for Home
              Affairs identity approval.
            </p>

          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              navigate(
                '/home-affairs/verify'
              )
            }
          >
            View all
            <Icon
              name="arrow"
              size={14}
            />
          </button>

        </div>

        <section
          className="panel"
          aria-live="polite"
        >

          {loading ? (

            <div className="empty-state">
              Loading verification
              requests...
            </div>

          ) : pendingCitizens.length === 0 ? (

            <div className="empty-state">
              No citizens are currently
              waiting for verification.
            </div>

          ) : (

            pendingCitizens
              .slice(0, 5)
              .map((citizen) => {

                const name =
                  `${citizen.first_name || ''} ${
                    citizen.last_name || ''
                  }`.trim() ||
                  'Unnamed citizen';

                return (

                  <div
                    className="queue-row"
                    key={citizen.id}
                  >

                    <div className="citizen-info">

                      <div className="avatar">
                        {name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="citizen-copy">

                        <strong>
                          {name}
                        </strong>

                        <span>
                          National ID:{' '}
                          {citizen.national_id ||
                            'Not provided'}
                        </span>

                      </div>

                    </div>

                    <div className="verification-actions">

                      <button
                        className="approve-button"
                        type="button"
                        onClick={() =>
                          handleVerify(
                            citizen.id,
                            'verified'
                          )
                        }
                      >
                        Approve
                      </button>

                      <button
                        className="reject-button"
                        type="button"
                        onClick={() =>
                          handleVerify(
                            citizen.id,
                            'rejected'
                          )
                        }
                      >
                        Reject
                      </button>

                    </div>

                  </div>

                );
              })

          )}

        </section>

        {/* =================================================
            RECENT APPLICATIONS
            ================================================= */}

        <div className="section-heading">

          <div>

            <h2>
              Recent applications
            </h2>

            <p>
              Latest submissions across
              government departments.
            </p>

          </div>

        </div>

        <section className="panel table-panel">

          <RequestTable
            requests={requests.slice(0, 6)}
            showDepartment
            onStatusChange={
              handleStatusChange
            }
          />

        </section>

      </div>

    </OfficerLayout>
  );
};

export default AdminDashboard;