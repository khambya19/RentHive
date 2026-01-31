import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../../config/api';
import { AlertTriangle, CheckCircle, Clock, XCircle, Eye, MessageSquare, Flag, Home, Bike, Shield } from 'lucide-react';

const Report = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'reviewed', 'resolved'

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reports/vendor`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(Array.isArray(data) ? data : []);
        setError(null);
      } else {
        setReports([]);
        setError('Failed to fetch reports');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to fetch reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);



  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, label: 'Pending' },
      reviewed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Eye, label: 'Reviewed' },
      resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, label: 'Resolved' },
      dismissed: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: XCircle, label: 'Dismissed' }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${badge.bg} ${badge.text} ${badge.border}`}>
        <Icon size={12} />
        {badge.label}
      </span>
    );
  };

  const getReasonBadge = (reason) => {
    const colors = {
      'Spam': 'bg-red-100 text-red-700',
      'Fraud': 'bg-rose-100 text-rose-700',
      'Inappropriate': 'bg-orange-100 text-orange-700',
      'Misleading': 'bg-yellow-100 text-yellow-700',
      'Other': 'bg-gray-100 text-gray-700'
    };
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${colors[reason] || colors.Other}`}>
        {reason}
      </span>
    );
  };

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.status === filter);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-0 mb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <Flag size={28} />
            </div>
            User Reports
          </h2>
          <p className="text-slate-500 mt-1">Reports submitted by users about your listings</p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setFilter('all')}
          >
            All ({reports.length})
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'pending' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({reports.filter(r => r.status === 'pending').length})
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'resolved' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setFilter('resolved')}
          >
            Resolved ({reports.filter(r => r.status === 'resolved').length})
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 text-center bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
            <Flag size={48} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Reports Found</h3>
          <p className="text-gray-500 max-w-md mx-auto text-lg">
            {filter === 'all' 
              ? "You don't have any reports yet. This is where user-submitted reports about your listings will appear."
              : `No ${filter} reports at the moment.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-xl ${report.listingType === 'property' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                      {report.listingType === 'property' ? <Home size={24} /> : <Bike size={24} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-slate-800">{report.entityName || 'Unknown Listing'}</h3>
                        {getReasonBadge(report.reason)}
                      </div>
                      <p className="text-sm text-slate-500 mb-1">
                        Reported by: <span className="font-medium capitalize">{report.reporterType}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(report.createdAt).toLocaleString('en-US', { 
                          dateStyle: 'medium', 
                          timeStyle: 'short' 
                        })}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(report.status)}
                </div>

                {report.description && (
                  <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                    <div className="flex items-start gap-2 text-slate-700">
                      <MessageSquare size={16} className="mt-1 text-slate-400 flex-shrink-0" />
                      <p className="text-sm leading-relaxed">{report.description}</p>
                    </div>
                  </div>
                )}

                {report.adminNotes && (
                  <div className="bg-indigo-50/50 rounded-xl p-4 mb-4 border border-indigo-100">
                    <div className="flex items-start gap-2 text-indigo-700">
                      <Shield size={16} className="mt-1 text-indigo-400 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Admin Response</p>
                        <p className="text-sm leading-relaxed font-medium">{report.adminNotes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {report.status === 'pending' && (
                  <div className="pt-4 border-t border-slate-100">
                     <p className="text-xs text-slate-400 italic font-medium text-center">
                        This report is under review by RentHive Admins.
                     </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Report;
