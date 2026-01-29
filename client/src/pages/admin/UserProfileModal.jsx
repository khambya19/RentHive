import React from 'react';
import { X, User, Mail, Phone, Shield, Activity, FileText, Calendar, CreditCard } from 'lucide-react';

// Modal for viewing user profile/details
const UserProfileModal = ({ user, onClose }) => {
  if (!user) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="rounded-lg shadow-lg p-6 w-full max-w-md relative" style={{ background: '#f8fafc' }}>
        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors" onClick={onClose}>
          <X size={24} />
        </button>
        
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
          <User size={24} className="text-purple-600" /> User Profile
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-700">
            <User size={18} className="text-gray-400" />
            <div>
              <span className="font-semibold block text-xs text-gray-500 uppercase">Name</span>
              {user.name}
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-gray-700">
            <Mail size={18} className="text-gray-400" />
            <div>
              <span className="font-semibold block text-xs text-gray-500 uppercase">Email</span>
              {user.email}
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-gray-700">
            <Phone size={18} className="text-gray-400" />
            <div>
              <span className="font-semibold block text-xs text-gray-500 uppercase">Phone</span>
              {user.phone || 'N/A'}
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-gray-700">
            <Shield size={18} className="text-gray-400" />
            <div>
              <span className="font-semibold block text-xs text-gray-500 uppercase">Role</span>
              <span className="capitalize">{user.role}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-gray-700">
            <Activity size={18} className="text-gray-400" />
            <div>
              <span className="font-semibold block text-xs text-gray-500 uppercase">Status</span>
              <span className={`px-2 py-0.5 rounded text-xs ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {user.active ? 'Active' : 'Blocked'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-gray-700">
            <FileText size={18} className="text-gray-400" />
            <div>
              <span className="font-semibold block text-xs text-gray-500 uppercase">KYC Status</span>
              <span className={`capitalize ${
                user.kyc_status === 'approved' ? 'text-green-600' : 
                user.kyc_status === 'pending' ? 'text-orange-600' : 'text-gray-600'
              }`}>
                {user.kyc_status || 'Not Submitted'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-gray-700">
            <CreditCard size={18} className="text-gray-400" />
            <div>
              <span className="font-semibold block text-xs text-gray-500 uppercase">Bookings Count</span>
              {user.bookings_count || 0}
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-gray-700">
            <Calendar size={18} className="text-gray-400" />
            <div>
              <span className="font-semibold block text-xs text-gray-500 uppercase">Joined On</span>
              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
