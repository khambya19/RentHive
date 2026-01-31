import React, { useState } from 'react';
import { X, User, Mail, Phone, Shield, Activity, FileText, Calendar, CreditCard, Check, AlertTriangle, ExternalLink, Image } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../../config/api';

// Modal for viewing user profile/details and managing KYC
const UserProfileModal = ({ user, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleKycAction = async (status) => {
    if (!window.confirm(`Are you sure you want to ${status} this user's KYC?`)) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/admin/users/${user.id}/kyc-status`, 
        { status }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`KYC ${status} successfully!`);
      if (onUpdate) onUpdate(); // Refresh parent table
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to update KYC status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
        <button className="absolute top-4 right-4 bg-slate-100 p-2 rounded-full text-slate-500 hover:text-slate-800 transition-colors" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-slate-900 border-b pb-4">
            <User size={28} className="text-indigo-600" /> User Profile
            {user.kyc_status === 'pending' && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full uppercase font-bold tracking-wider">KYC Pending</span>}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Left Column: User Info */}
             <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0"><User size={20}/></div>
                  <div>
                    <span className="font-bold text-xs text-slate-400 uppercase tracking-wider block mb-1">Full Name</span>
                    <p className="font-bold text-slate-900 text-lg">{user.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0"><Mail size={20}/></div>
                  <div>
                    <span className="font-bold text-xs text-slate-400 uppercase tracking-wider block mb-1">Email</span>
                    <p className="font-medium text-slate-800">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0"><Phone size={20}/></div>
                  <div>
                    <span className="font-bold text-xs text-slate-400 uppercase tracking-wider block mb-1">Phone</span>
                    <p className="font-medium text-slate-800">{user.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0"><Shield size={20}/></div>
                  <div>
                    <span className="font-bold text-xs text-slate-400 uppercase tracking-wider block mb-1">Role</span>
                    <p className="font-medium text-slate-800 capitalize badge badge-outline">{user.role}</p>
                  </div>
                </div>
             </div>

             {/* Right Column: KYC & Status */}
             <div className="space-y-6">
               <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><FileText size={18}/> KYC Verification</h3>
                  
                  <div className="mb-4">
                    <span className="text-xs text-slate-500 font-bold uppercase">Current Status:</span>
                    <span className={`ml-2 font-bold uppercase text-sm px-2 py-1 rounded ${
                      user.kyc_status === 'approved' ? 'bg-green-100 text-green-700' :
                      user.kyc_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      user.kyc_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {user.kyc_status || 'Not Submitted'}
                    </span>
                  </div>

                  {/* Document Type */}
                  {user.kyc_document_type && (
                    <div className="mb-4">
                      <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Document Type:</span>
                      <p className="text-sm font-semibold text-slate-800 capitalize">{user.kyc_document_type}</p>
                    </div>
                  )}

                  {/* Submission Date */}
                  {user.created_at && (
                    <div className="mb-4">
                      <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Submitted On:</span>
                      <p className="text-sm font-medium text-slate-700">{new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  )}

                  {user.kyc_doc ? (
                    <div className="mb-4">
                       <p className="text-xs text-slate-500 mb-2 font-bold uppercase">Submitted Document:</p>
                       <a href={user.kyc_doc} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg border border-slate-200">
                          <img src={user.kyc_doc} alt="KYC Doc" className="w-full h-32 object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                             <span className="text-white text-xs font-bold flex items-center gap-1"><ExternalLink size={12}/> View Full</span>
                          </div>
                       </a>
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-sm mb-4">
                       <Image size={24} className="mx-auto mb-2 opacity-50"/>
                       No document uploaded
                    </div>
                  )}

                  {/* KYC Actions */}
                  {user.kyc_status === 'pending' && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                      <button 
                         onClick={() => handleKycAction('approved')} 
                         disabled={loading}
                         className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                      >
                         <Check size={16}/> Approve
                      </button>
                      <button 
                         onClick={() => handleKycAction('rejected')}
                         disabled={loading}
                         className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg font-bold text-sm hover:bg-red-200 transition-colors flex items-center justify-center gap-1"
                      >
                         <X size={16}/> Reject
                      </button>
                    </div>
                  )}
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
