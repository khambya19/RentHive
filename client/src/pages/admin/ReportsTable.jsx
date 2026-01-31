import React, { useState, useEffect, useCallback } from 'react';
import API_BASE_URL from '../../config/api';
import axios from 'axios';
import { Search, Flag, CheckCircle, XCircle, AlertTriangle, User, ExternalLink, MessageSquare, ShieldAlert } from 'lucide-react';

const ReportsTable = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Status Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Using the universal reports endpoint for consistency
      const response = await axios.get(`${API_BASE_URL}/reports/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // The endpoint returns the array directly
      if (Array.isArray(response.data)) {
        setReports(response.data);
      } else if (response.data.success && Array.isArray(response.data.reports)) {
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

  const openStatusModal = (report, status) => {
    setSelectedReport(report);
    setNewStatus(status);
    setAdminNotes(report.adminNotes || '');
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedReport) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/reports/${selectedReport.id}/status`, 
        { 
          status: newStatus,
          adminNotes: adminNotes
        }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatusModalOpen(false);
      fetchReports();
    } catch (err) {
      console.error(err);
      setUpdateError(err.response?.data?.error || 'Failed to update report status');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesFilter = filter === 'all' ? true : r.status === filter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
        r.reason?.toLowerCase().includes(searchLower) || 
        r.description?.toLowerCase().includes(searchLower) ||
        r.entityName?.toLowerCase().includes(searchLower) ||
        r.owner?.fullName?.toLowerCase().includes(searchLower) ||
        r.reporter?.fullName?.toLowerCase().includes(searchLower);
    
    return matchesFilter && matchesSearch;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold">Synchronizing reported issues...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
            icon={<ShieldAlert className="text-rose-500" />} 
            label="Pending" 
            value={reports.filter(r => r.status === 'pending').length} 
            color="rose"
        />
        <StatCard 
            icon={<CheckCircle className="text-emerald-500" />} 
            label="Resolved" 
            value={reports.filter(r => r.status === 'resolved').length} 
            color="emerald"
        />
        <StatCard 
            icon={<XCircle className="text-slate-500" />} 
            label="Dismissed" 
            value={reports.filter(r => r.status === 'dismissed').length} 
            color="slate"
        />
        <StatCard 
            icon={<Flag className="text-amber-500" />} 
            label="Total Reports" 
            value={reports.length} 
            color="amber"
        />
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="Search reason, listing, owner, or reporter..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           
           <div className="flex bg-slate-100 p-1 rounded-2xl self-end md:self-auto">
              {['all', 'pending', 'resloved', 'resolved', 'dismissed'].map(s => (
                  <button 
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-black capitalize transition-all ${
                      filter === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                      {s}
                  </button>
              ))}
           </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Listing / Asset</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reported By</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredReports.length === 0 ? (
                <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center space-y-2">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <Search className="text-slate-200" size={32} />
                            </div>
                            <p className="text-slate-400 font-bold">No matching reports found</p>
                        </div>
                    </td>
                </tr>
              ) : (
                filteredReports.map(report => (
                  <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                       <div className="space-y-1">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{report.entityName}</p>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md uppercase tracking-tighter">
                                {report.listingType}
                             </span>
                             <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <User size={10} /> {report.owner?.fullName || 'N/A'}
                             </span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="space-y-1 max-w-xs">
                          <p className="font-bold text-sm text-slate-800">{report.reason}</p>
                          <p className="text-xs text-slate-500 line-clamp-2 italic">"{report.description}"</p>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="text-xs">
                          <p className="font-bold text-slate-700">{report.reporter?.fullName}</p>
                          <p className="text-slate-400 text-[10px] font-medium">{report.reporter?.email}</p>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <StatusBadge status={report.status} />
                       {report.adminNotes && (
                          <p className="text-[10px] text-indigo-400 font-bold mt-1 flex items-center gap-1">
                             <MessageSquare size={10} /> Note Added
                          </p>
                       )}
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex justify-end gap-2">
                          {report.status === 'pending' ? (
                             <>
                                <button 
                                  className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                  onClick={() => openStatusModal(report, 'resolved')}
                                  title="Mark as Resolved"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button 
                                  className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-600 hover:text-white transition-all shadow-sm"
                                  onClick={() => openStatusModal(report, 'dismissed')}
                                  title="Dismiss Report"
                                >
                                  <XCircle size={18} />
                                </button>
                             </>
                          ) : (
                             <button 
                               className="px-3 py-1.5 bg-slate-50 text-slate-400 font-black text-[10px] rounded-lg hover:bg-slate-100 transition-all uppercase tracking-widest"
                               onClick={() => openStatusModal(report, report.status)}
                             >
                               Edit Note
                             </button>
                          )}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status & Feedback Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setStatusModalOpen(false)}></div>
           <div className="relative bg-white w-full max-w-md mx-4 rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="p-8 space-y-6">
                 <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900">Admin Response</h3>
                    <p className="text-slate-500 text-sm font-medium">Update the status and provide feedback for this report.</p>
                 </div>

                 <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reporting Issue</p>
                    <p className="text-sm font-bold text-indigo-600">{selectedReport?.entityName}</p>
                     <p className="text-xs text-slate-600 italic">" {selectedReport?.reason} "</p>
                 </div>

                 {updateError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                       <AlertTriangle size={16} />
                       {updateError}
                    </div>
                 )}

                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Action / Status</label>
                       <div className="grid grid-cols-2 gap-3">
                          <button 
                             onClick={() => setNewStatus('resolved')}
                             className={`px-4 py-3 rounded-xl text-xs font-black transition-all border-2 ${newStatus === 'resolved' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border-slate-100 text-slate-500 hover:border-emerald-200'}`}
                          >
                             RESOLVE
                          </button>
                          <button 
                             onClick={() => setNewStatus('dismissed')}
                             className={`px-4 py-3 rounded-xl text-xs font-black transition-all border-2 ${newStatus === 'dismissed' ? 'bg-slate-800 border-slate-800 text-white shadow-lg shadow-slate-200' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
                          >
                             DISMISS
                          </button>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Response Message</label>
                       <textarea 
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                          placeholder="Explain the action taken or reason for dismissal..."
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                       />
                       <p className="text-[10px] text-slate-400 font-medium">This message will be visible to the reporter in their dashboard.</p>
                    </div>
                 </div>

                 <div className="flex gap-3">
                    <button 
                       onClick={() => setStatusModalOpen(false)}
                       className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                    >
                       Cancel
                    </button>
                    <button 
                       onClick={handleUpdateStatus}
                       disabled={isUpdating}
                       className="flex-[2] py-4 bg-indigo-600 text-white font-black text-xs rounded-2xl uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                       {isUpdating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Update Status'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl bg-${color}-50 flex items-center justify-center`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <h4 className="text-xl font-black text-slate-900">{value}</h4>
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    switch (status) {
        case 'pending': 
            return <span className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-100">Pending</span>;
        case 'resolved':
            return <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-emerald-100">Resolved</span>;
        case 'dismissed':
            return <span className="inline-flex items-center px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider rounded-lg border border-slate-200">Dismissed</span>;
        default:
            return <span className="inline-flex items-center px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider rounded-lg">{status}</span>;
    }
};

export default ReportsTable;
