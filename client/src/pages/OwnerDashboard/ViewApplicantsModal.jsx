import React from 'react';
import ReactDOM from 'react-dom';
import { X, User, Phone, Mail, Calendar, Wallet, Check, XIcon, Clock, MapPin, Home, Bike } from 'lucide-react';
import { SERVER_BASE_URL } from '../../config/api';

const ViewApplicantsModal = ({ listing, applicants, onClose, onApprove, onReject }) => {
  if (!listing) return null;

  const isProperty = listing.listingType === 'property';
  const itemImage = listing.images?.[0] 
    ? `${SERVER_BASE_URL}/uploads/${isProperty ? 'properties' : 'bikes'}/${listing.images[0]}`
    : "https://via.placeholder.com/300?text=No+Image";

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString();
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'pending' || s === 'available') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (['confirmed', 'active', 'approved'].includes(s)) return 'bg-green-100 text-green-800 border-green-200';
    if (['cancelled', 'rejected'].includes(s)) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 border-white shadow-lg">
              <img 
                src={itemImage}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/300?text=No+Image"; }}
                alt={listing.title}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {isProperty ? <Home size={20} className="text-indigo-600" /> : <Bike size={20} className="text-blue-600" />}
                    <h3 className="text-2xl font-black text-slate-800">{listing.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 flex items-center gap-1 font-medium">
                    <MapPin size={14} className="text-slate-400" />
                    {listing.location}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm">
                    <Clock size={14} className="text-indigo-500" />
                    <span className="text-sm font-bold text-slate-700">{applicants.length} Application{applicants.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="p-2 hover:bg-white/50 rounded-full transition-colors text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Applicants List */}
        <div className="flex-1 overflow-y-auto p-6">
          {applicants.length === 0 ? (
            <div className="text-center py-20">
              <User size={64} className="mx-auto mb-4 text-slate-300" />
              <h4 className="text-xl font-bold text-slate-600 mb-2">No Applications Yet</h4>
              <p className="text-slate-400">This listing hasn't received any applications.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applicants.map((applicant, index) => {
                const isPending = (applicant.status || '').toLowerCase() === 'pending';
                
                return (
                  <div 
                    key={`${applicant.id}-${index}`} 
                    className="bg-white border-2 border-slate-100 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left: Applicant Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {applicant.renterName?.[0] || applicant.lessorName?.[0] || 'U'}
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-slate-800">
                                {applicant.renterName || applicant.lessorName || 'Unknown User'}
                              </h4>
                              <p className="text-xs text-slate-500 font-medium">
                                Applied {formatDate(applicant.createdAt)}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(applicant.status)}`}>
                            {applicant.status || 'Pending'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <Mail size={18} className="text-slate-400" />
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</p>
                              <p className="text-sm font-semibold text-slate-700 truncate">
                                {applicant.renterEmail || applicant.lessorEmail || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <Phone size={18} className="text-slate-400" />
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phone</p>
                              <a 
                                href={`tel:${applicant.renterPhone || applicant.lessorPhone}`}
                                className="text-sm font-semibold text-indigo-600 hover:underline"
                              >
                                {applicant.renterPhone || applicant.lessorPhone || 'N/A'}
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Booking Details & Actions */}
                      <div className="lg:w-80 space-y-4">
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Duration</span>
                              <span className="text-sm font-black text-slate-800">
                                {applicant.duration || '0'} days
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Start Date</p>
                                <p className="text-sm font-semibold text-slate-700">{formatDate(applicant.startDate || applicant.moveInDate)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">End Date</p>
                                <p className="text-sm font-semibold text-slate-700">{formatDate(applicant.endDate || applicant.moveOutDate)}</p>
                              </div>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                <Wallet size={14} />
                                Total Amount
                              </span>
                              <span className="text-xl font-black text-indigo-600">
                                NPR {formatCurrency(applicant.totalAmount || applicant.monthlyRent)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {isPending && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => onReject(applicant.id, isProperty ? 'property' : 'bike')}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 border-2 border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-100 hover:scale-105 transition-all shadow-sm"
                            >
                              <XIcon size={18} />
                              Reject
                            </button>
                            <button
                              onClick={() => onApprove(applicant.id, isProperty ? 'property' : 'bike')}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-50 border-2 border-green-200 text-green-600 rounded-xl font-bold hover:bg-green-100 hover:scale-105 transition-all shadow-sm"
                            >
                              <Check size={18} />
                              Approve
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ViewApplicantsModal;
