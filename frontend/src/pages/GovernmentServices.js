import React from 'react';
import Sidebar from '../components/Sidebar';

const services = [
  { dept: 'Home Affairs', name: 'Identity Registration', desc: 'Register and verify national ID' },
  { dept: 'Home Affairs', name: 'Passport Application', desc: 'Apply for or renew a passport' },
  { dept: 'Traffic', name: "Driver's Licence", desc: 'Apply or renew a driver\'s licence' },
  { dept: 'Traffic', name: 'Vehicle Registration', desc: 'Register a new vehicle' },
  { dept: 'Finance', name: 'Tax Services', desc: 'File and manage tax records' },
  { dept: 'Pensions', name: 'Pension Application', desc: 'Apply for retirement or old-age pension' },
  { dept: 'Police', name: 'Police Clearance', desc: 'Request a police clearance certificate' }
];

const GovernmentServices = () => (
  <div style={styles.layout}>
    <Sidebar />
    <main style={styles.main}>
      <h1 style={styles.pageTitle}>Government services</h1>
      <p style={styles.subtitle}>Browse all services offered across government departments.</p>

      <div style={styles.grid}>
        {services.map((s, i) => (
          <div key={i} style={styles.card}>
            <span style={styles.deptTag}>{s.dept}</span>
            <h3 style={styles.cardTitle}>{s.name}</h3>
            <p style={styles.cardDesc}>{s.desc}</p>
          </div>
        ))}
      </div>
    </main>
  </div>
);

const styles = {
  layout: { display: 'flex', minHeight: '100vh', background: '#f4f6fa' },
  main: { flex: 1, marginLeft: '240px', padding: '32px 40px' },
  pageTitle: { fontSize: '28px', fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' },
  subtitle: { fontSize: '14px', color: '#8a93a6', marginBottom: '28px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '18px'
  },
  card: {
    background: '#fff', border: '1.5px solid #1a1a2e',
    borderRadius: '16px', padding: '22px 24px'
  },
  deptTag: {
    display: 'inline-block', fontSize: '11px',
    background: '#eef2ff', color: '#4338ca',
    padding: '4px 10px', borderRadius: '999px',
    marginBottom: '10px', fontWeight: 500
  },
  cardTitle: { fontSize: '16px', fontWeight: 600, marginBottom: '6px' },
  cardDesc: { fontSize: '13px', color: '#6b7280' }
};

export default GovernmentServices;