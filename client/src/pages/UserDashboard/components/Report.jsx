import React, { useEffect, useState } from 'react';
import { fetchJobReports } from './api';
import { Flag, AlertCircle, RefreshCw } from 'lucide-react';

const Report = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect(() => {
  //   setLoading(true);
  //   fetchJobReports()
  //     .then((data) => {
  //       setReports(data.reports || []);
  //       setError(null);
  //     })
  //     .catch((err) => {
  //       setError(err.message || 'Failed to fetch reports');
  //       setReports([]);
  //     })
  //     .finally(() => setLoading(false));
  // }, []);

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Job Reports</h2>
        <p className="text-sm text-slate-500">View and track your submitted reports.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <RefreshCw size={32} className="animate-spin text-blue-600" />
             <p className="text-sm text-slate-400">Loading reports...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-red-500">
             <AlertCircle size={32} />
             <p className="text-sm font-medium">{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-slate-50 border-2 border-dashed border-slate-200 mx-4 my-4 rounded-xl">
             <Flag size={32} className="text-slate-300 mb-4" />
             <h3 className="font-bold text-slate-800">No reports found</h3>
             <p className="text-xs text-slate-500 mt-1">Your submitted reports will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((report) => (
              <div key={report.id} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-slate-900">{report.title || 'Untitled Report'}</h4>
                  <span className="text-[10px] font-bold uppercase text-slate-400 px-2 py-0.5 bg-slate-100 rounded">
                    {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{report.description || report.details || 'No details provided.'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;
