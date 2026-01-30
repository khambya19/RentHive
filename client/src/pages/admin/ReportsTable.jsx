import React, { useState, useEffect, useCallback } from 'react';
import API_BASE_URL from '../../config/api';
import axios from 'axios';
import { Search, Flag, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const ReportsTable = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setReports(response.data.reports);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/admin/reports/${id}/status`, 
        { status: newStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchReports();
    } catch (err) {
      alert('Failed to update report status');
    }
  };

  const filteredReports = reports.filter(r => 
    filter === 'all' ? true : r.status === filter
  );

  if (loading) return <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Loading reports...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
         <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Flag className="text-red-500" size={20} /> Reported Issues
         </h3>
         <div className="flex gap-2">
            {['all', 'pending', 'resolved', 'dismissed'].map(s => (
                <button 
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                    filter === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                    {s}
                </button>
            ))}
         </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Report Details</th>
              <th className="px-6 py-4">Target</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReports.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">No reports found.</td></tr>
            ) : (
              filteredReports.map(report => (
                <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                     {report.status === 'pending' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100"><AlertTriangle size={12} className="mr-1"/> Pending</span>}
                     {report.status === 'resolved' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-100"><CheckCircle size={12} className="mr-1"/> Resolved</span>}
                     {report.status === 'dismissed' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200"><XCircle size={12} className="mr-1"/> Dismissed</span>}
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                     <p className="font-bold text-slate-900">{report.reason}</p>
                     <p className="text-xs text-slate-500 mt-1 line-clamp-2">{report.description}</p>
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-xs font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {report.reportedType}
                     </span>
                     <p className="text-xs text-slate-500 mt-1">ID: {report.reportedId}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                     {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                     {report.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                            <button 
                                className="px-3 py-1.5 bg-green-50 text-green-700 font-bold rounded hover:bg-green-100 text-xs transition-colors"
                                onClick={() => handleUpdateStatus(report.id, 'resolved')}
                            >
                                Resolve
                            </button>
                            <button 
                                className="px-3 py-1.5 bg-slate-100 text-slate-600 font-bold rounded hover:bg-slate-200 text-xs transition-colors"
                                onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                            >
                                Dismiss
                            </button>
                        </div>
                     )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsTable;
