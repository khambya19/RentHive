import React, { useEffect, useState } from 'react';
import { fetchJobReports } from './api';

const Report = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchJobReports()
      .then((data) => {
        setReports(data.reports || []);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch reports');
        setReports([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full p-0 m-0">
      <h2 className="text-2xl font-bold mb-4 px-4 pt-4">Job Reports</h2>
      <div className="bg-white rounded-3xl shadow-none p-4 text-gray-700 mx-2">
        {loading && <p>Loading job reports...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && reports.length === 0 && (
          <p>No job reports found.</p>
        )}
        {!loading && !error && reports.length > 0 && (
          <ul className="divide-y divide-gray-200">
            {reports.map((report) => (
              <li key={report.id} className="py-4">
                <div className="font-semibold text-gray-900">{report.title || 'Untitled Report'}</div>
                <div className="text-sm text-gray-500 mb-1">{report.created_at ? new Date(report.created_at).toLocaleString() : ''}</div>
                <div className="text-gray-700 whitespace-pre-line">{report.description || report.details || 'No details provided.'}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Report;
