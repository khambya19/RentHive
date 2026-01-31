import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../../config/api';
import { Flag, AlertCircle, RefreshCw, CheckCircle, Clock, MessageSquare, Shield } from 'lucide-react';

const Report = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/reports/my-reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReport = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this report?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchReports(); // Refresh
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel report');
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'resolved':
      case 'resloved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'reviewed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'dismissed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'resolved':
      case 'resloved':
        return <CheckCircle size={14} />;
      case 'reviewed': return <Shield size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="w-full p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Flag className="text-rose-500" size={32} />
            Issue Reports
          </h2>
          <p className="text-slate-500 font-medium">Track the status of listing reports you've submitted.</p>
        </div>
        <button 
          onClick={fetchReports}
          disabled={loading}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
             <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
             <p className="text-slate-400 font-bold tracking-wide uppercase text-xs">Syncing reports...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-rose-500 text-center px-6">
             <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-2">
                <AlertCircle size={32} />
             </div>
             <h3 className="text-lg font-bold">Query Failed</h3>
             <p className="text-sm font-medium opacity-80">{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 px-10 text-center">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300 border-2 border-dashed border-slate-200">
                <Flag size={36} />
             </div>
             <h3 className="text-xl font-bold text-slate-800">No Reports Found</h3>
             <p className="text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                When you report a fraudulent or problematic listing, it will appear here for you to track.
             </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Listing</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Reason</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Submitted</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 line-clamp-1">{report.entityName}</span>
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">ID: #{report.listingId} • {report.listingType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{report.reason}</span>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{report.description || 'No additional details.'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        {(report.status === 'resloved') ? 'resloved' : report.status}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-slate-500">
                        {new Date(report.created_at || report.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex items-center justify-end gap-3">
                          {report.adminNotes ? (
                            <div className="group/note relative">
                              <div className="flex items-center gap-2 text-blue-600 cursor-help">
                                 <span className="text-[10px] font-black uppercase tracking-widest">Notes</span>
                                 <MessageSquare size={16} />
                              </div>
                              {/* Tooltip-style note */}
                              <div className="absolute right-0 bottom-full mb-3 w-64 p-4 bg-slate-900 text-white rounded-2xl text-xs font-medium text-left opacity-0 translate-y-2 pointer-events-none group-hover/note:opacity-100 group-hover/note:translate-y-0 transition-all z-50 shadow-2xl">
                                <div className="font-black uppercase tracking-widest text-[10px] text-blue-400 mb-2 flex items-center gap-2">
                                   <Shield size={10} /> Admin Feedback
                                </div>
                                {report.adminNotes}
                                <div className="absolute top-full right-4 transform-gpu -translate-y-1/2 rotate-45 w-3 h-3 bg-slate-900"></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Pending</span>
                          )}

                          <div className="w-px h-8 bg-slate-100 mx-1"></div>

                          {report.status === 'pending' && (
                            <button 
                              onClick={() => handleCancelReport(report.id)}
                              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Cancel Report"
                            >
                              <AlertCircle size={18} />
                            </button>
                          )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-200">
         <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
               <h3 className="text-2xl font-black tracking-tight">How we handle reports</h3>
               <p className="text-blue-100 font-medium max-w-xl">
                  Every report is manually reviewed by our trust and safety team. We may contact the owner or take down listings that violate our community standards.
               </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
               <Shield size={48} className="text-blue-200" />
            </div>
         </div>
      </div>
    </div>
  );
};

export default Report;
