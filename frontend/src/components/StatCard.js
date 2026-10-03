import React from 'react';

const StatCard = ({ label, value, icon, accent = '#0057b7', trend }) => (
  <div style={styles.card}>
    <div style={{ ...styles.iconWrap, background: `${accent}14`, color: accent }}>
      {icon}
    </div>
    <div style={styles.body}>
      <div style={styles.label}>{label}</div>
      <div style={styles.value}>{value}</div>
      {trend && <div style={{ ...styles.trend, color: accent }}>{trend}</div>}
    </div>
  </div>
);

const styles = {
  card: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 16
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  body: { flex: 1, minWidth: 0 },
  label: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  value: {
    fontSize: 26,
    fontWeight: 800,
    color: '#0f172a',
    marginTop: 4,
    letterSpacing: '-0.02em'
  },
  trend: { fontSize: 12, fontWeight: 600, marginTop: 2 }
};

export default StatCard;