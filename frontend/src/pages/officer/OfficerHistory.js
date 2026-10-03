import React, { useEffect, useState } from 'react';
import OfficerLayout from '../../components/OfficerLayout';
import RequestTable from '../../components/RequestTable';
import API from '../../utils/api';

const OfficerHistory = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/requests/queue');
        setRows(res.data.filter(r => r.status === 'completed' || r.status === 'rejected'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <OfficerLayout
      title="Request History"
      subtitle="Completed and rejected applications handled by your department."
    >
      <RequestTable rows={rows} loading={loading} />
    </OfficerLayout>
  );
};

export default OfficerHistory;