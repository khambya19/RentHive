import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, DollarSign, Calendar, MapPin, Home, Bike, Trash2, RefreshCw, Eye } from 'lucide-react';
import API_BASE_URL, { SERVER_BASE_URL } from '../../../config/api';
import noImage from '../../../assets/no-image.png';

const Applications = ({ onPaymentInitiate, onViewDetails, applications, loading, onRefresh, onCancelApplication }) => {
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  const handleCancelApplication = async (id) => {
    if (!confirm('Cancel this application?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/bookings/applications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        onRefresh && onRefresh(true);
      }
    } catch (error) {
      console.error('Failed to cancel application:', error);
      alert('Failed to cancel application');
    }
  };

  const getStatusBadge = (statusStr) => {
    // Treat 'available' as 'pending' for applications
    let status = (statusStr || '').toLowerCase();
    if (status === 'available') status = 'pending';

    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      approved: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      cancelled: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    
    const icons = {
      pending: <Clock size={16} />,
      approved: <CheckCircle size={16} />,
      rejected: <XCircle size={16} />,
      cancelled: <Trash2 size={16} />
    };
    
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border ${styles[status] || styles.pending}`}>
        {icons[status] || <Clock size={16} />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredApplications = filter === 'all' 
    ? applications.filter(app => (app.status || '').toLowerCase() !== 'cancelled') // Hide cancelled from 'all'
    : applications.filter(app => {
        let s = (app.status || '').toLowerCase();
        if (s === 'available') s = 'pending'; // Filter 'available' under 'pending'
        return s === filter;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="applications-container w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">My Applications</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Track your booking requests</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-bold text-sm flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-1 scrollbar-hide">
        {['all', 'pending', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-bold text-sm whitespace-nowrap transition-all ${
              filter === status
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
              {status === 'all' 
                 ? applications.filter(a => (a.status || '').toLowerCase() !== 'cancelled').length 
                 : applications.filter(a => {
                     let s = (a.status || '').toLowerCase();
                     if (s === 'available') s = 'pending';
                     return s === status;
                   }).length}
            </span>
          </button>
        ))}
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No Applications Found</h3>
          <p className="text-sm text-slate-500">
            {filter === 'all' 
              ? 'Browse listings and submit booking requests to get started'
              : `You have no ${filter} applications`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications
            // Filter out applications where the listing is deleted (no brand/model/title)
            .filter(app => {
              if (app.type === 'bike') return app.brand || app.model || app.name;
              return app.title;
            })
            .map(app => {
            const isBike = app.type === 'bike';
            const image = app.images?.[0] 
              ? `${SERVER_BASE_URL}/uploads/${isBike ? 'bikes' : 'properties'}/${app.images[0]}`
              : noImage;

            // Robust title fallback
            const displayTitle = isBike 
              ? (app.brand && app.model ? `${app.brand} ${app.model}` : (app.name || app.title || 'Vehicle Listing'))
              : (app.title || 'Property Listing');
              
            let appStatus = (app.status || '').toLowerCase();
            if (appStatus === 'available') appStatus = 'pending'; // Normalize available to pending

            return (
              <div key={app.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  <div className="w-full md:w-48 h-32 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    <img 
                      src={image} 
                      alt={displayTitle} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = noImage; }} 
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row items-start justify-between mb-3 gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {isBike ? <Bike size={18} className="text-orange-500 shrink-0" /> : <Home size={18} className="text-green-500 shrink-0" />}
                          <h3 className="font-bold text-lg text-slate-900 truncate">
                            {displayTitle}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-500 truncate">
                          <MapPin size={14} className="shrink-0" />
                          <span className="truncate">{isBike ? (app.location || 'Location N/A') : `${app.city || ''}, ${app.address || ''}`}</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(app.status)}
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Duration</p>
                        <p className="text-sm font-bold text-slate-700 flex items-center gap-1">
                          <Calendar size={14} />
                          {app.duration} days
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Start Date</p>
                        <p className="text-sm font-bold text-slate-700">
                          {new Date(app.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Total Cost</p>
                        <p className="text-sm font-bold text-indigo-600 flex items-center gap-1">
                          <DollarSign size={14} />
                          Rs {Number(app.grandTotal || app.totalAmount).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={() => onViewDetails?.(app)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-sm transition-all flex items-center gap-2"
                      >
                        <Eye size={14} />
                        View Details
                      </button>

                      {appStatus === 'approved' && (
                        <button 
                          onClick={() => onPaymentInitiate?.(app)}
                          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                        >
                          <DollarSign size={16} />
                          Pay Now
                        </button>
                      )}
                      
                      {appStatus === 'pending' && (
                        <>
                          <button
                             onClick={() => onViewDetails?.(app)}
                             className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 font-bold rounded-lg text-sm transition-all flex items-center gap-2"
                          >
                             <RefreshCw size={14} />
                             Edit
                          </button>
                          
                          <button
                            onClick={() => onCancelApplication?.(app.id)}
                            className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-lg text-sm transition-all flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            Cancel
                          </button>
                        </>
                      )}
                      
                      {appStatus === 'rejected' && app.rejectionReason && (
                        <p className="text-sm text-red-600 italic bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                          <span className="font-bold">Reason:</span> {app.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Applications;
