import React from 'react';

const colors = {
  ready: { bg: '#e0f2fe', color: '#0369a1' },
  review: { bg: '#fef3c7', color: '#b45309' },
  submitted: { bg: '#ede9fe', color: '#6d28d9' },
  rejected: { bg: '#fee2e2', color: '#b91c1c' },
  completed: { bg: '#dcfce7', color: '#15803d' },
  verified: { bg: '#dcfce7', color: '#15803d' },
  pending: { bg: '#fef3c7', color: '#b45309' }
};

const StatusBadge = ({ status }) => {
  const style = colors[status?.toLowerCase()] || { bg: '#e5e7eb', color: '#374151' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '6px 18px',
      borderRadius: '999px',
      background: style.bg,
      color: style.color,
      fontSize: '13px',
      fontWeight: 500,
      textTransform: 'capitalize',
      border: '1px solid rgba(0,0,0,0.05)'
    }}>
      {status}
    </span>
  );
};

export default StatusBadge;