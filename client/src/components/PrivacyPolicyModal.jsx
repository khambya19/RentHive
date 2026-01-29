import React from 'react';
import { X, Shield, Eye, Lock, Database, UserCheck, Bell, Trash2 } from 'lucide-react';

const PrivacyPolicyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <div 
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-green-600 to-teal-600 p-4 sm:p-6 text-white rounded-t-xl sm:rounded-t-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1">Privacy & Policy</h2>
                <p className="text-white/80 text-xs sm:text-sm">How We Protect Your Data</p>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              At <strong className="text-gray-800">RentHive</strong>, we are committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.
            </p>

            {/* Data Collection */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                <Database size={16} className="text-blue-600" /> Information We Collect
              </h3>
              <ul className="space-y-2 text-gray-600 text-xs sm:text-sm pl-6">
                <li className="list-disc">Name, email, and phone number</li>
                <li className="list-disc">Profile photo and KYC documents</li>
                <li className="list-disc">Payment information (securely processed)</li>
                <li className="list-disc">Booking history and preferences</li>
                <li className="list-disc">Device information and location data</li>
              </ul>
            </div>

            {/* How We Use */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                <Eye size={16} className="text-purple-600" /> How We Use Your Data
              </h3>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-start gap-2 p-2 bg-purple-50 rounded-lg">
                  <UserCheck size={14} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-600">Verify your identity and process bookings</span>
                </div>
                <div className="flex items-start gap-2 p-2 bg-purple-50 rounded-lg">
                  <Bell size={14} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-600">Send booking confirmations and updates</span>
                </div>
                <div className="flex items-start gap-2 p-2 bg-purple-50 rounded-lg">
                  <Shield size={14} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-600">Protect against fraud and maintain security</span>
                </div>
              </div>
            </div>

            {/* Data Protection */}
            <div className="p-3 sm:p-4 bg-green-50 border border-green-100 rounded-xl">
              <div className="flex items-start gap-3">
                <Lock size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-1">Data Protection</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    We use industry-standard encryption and security measures to protect your data. Your information is never sold to third parties.
                  </p>
                </div>
              </div>
            </div>

            {/* Your Rights */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                <UserCheck size={16} className="text-teal-600" /> Your Rights
              </h3>
              <ul className="space-y-1.5 text-gray-600 text-xs sm:text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                  Access and download your personal data
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                  Request correction of inaccurate information
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                  Opt-out of marketing communications
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                  Request deletion of your account
                </li>
              </ul>
            </div>

            {/* Delete Account */}
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
              <Trash2 size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-xs">
                To delete your account and all associated data, contact us at <strong>support@renthive.com</strong>
              </p>
            </div>

            {/* Last Updated */}
            <p className="text-center text-gray-400 text-xs pt-2 border-t border-gray-100">
              Last updated: January 2025
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicyModal;
