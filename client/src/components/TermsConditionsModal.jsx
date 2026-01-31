import React from 'react';
import { X, FileText, AlertCircle, CheckCircle, Users, Home, CreditCard, Scale, MessageCircle } from 'lucide-react';

const TermsConditionsModal = ({ isOpen, onClose }) => {
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
          <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6 text-white rounded-t-xl sm:rounded-t-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1">Terms & Conditions</h2>
                <p className="text-white/80 text-xs sm:text-sm">User Agreement</p>
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
              By using <strong className="text-gray-800">RentHive</strong>, you agree to the following terms and conditions. Please read them carefully before using our services.
            </p>

            {/* User Eligibility */}
            <div className="p-3 sm:p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
              <div className="flex items-start gap-3">
                <Users size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">User Eligibility</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    You must be at least <strong>18 years old</strong> and provide accurate personal information to use RentHive.
                  </p>
                </div>
              </div>
            </div>

            {/* For Renters */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                <Home size={16} className="text-blue-600" /> For Renters (Users)
              </h3>
              <ul className="space-y-1.5 text-gray-600 text-xs sm:text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Respect property and follow owner's rules</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Complete payment before check-in</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Report any damages immediately</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Vacate property at agreed time</span>
                </li>
              </ul>
            </div>

            {/* For Owners */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                <FileText size={16} className="text-purple-600" /> For Property Owners
              </h3>
              <ul className="space-y-1.5 text-gray-600 text-xs sm:text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Provide accurate listing information</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Maintain property safety standards</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Honor confirmed bookings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Complete KYC verification</span>
                </li>
              </ul>
            </div>

            {/* Payments */}
            <div className="p-3 sm:p-4 bg-green-50 border border-green-100 rounded-xl">
              <div className="flex items-start gap-3">
                <CreditCard size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">Payments</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    RentHive charges a <strong>5% service fee</strong> on each booking. Payments are held securely until check-in is confirmed.
                  </p>
                </div>
              </div>
            </div>

            {/* Disputes */}
            <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
              <div className="flex items-start gap-3">
                <Scale size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">Dispute Resolution</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Disputes should be reported within <strong>48 hours</strong>. RentHive will mediate but is not liable for direct user disputes.
                  </p>
                </div>
              </div>
            </div>

            {/* Prohibited */}
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 text-xs font-medium mb-1">Prohibited Activities:</p>
                <p className="text-red-600 text-xs">
                  Fraud, illegal activities, harassment, false listings, and misrepresentation will result in immediate account termination.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
              <MessageCircle size={14} className="text-gray-500" />
              <p className="text-gray-500 text-xs">
                Questions? Contact <strong>support@renthive.com</strong>
              </p>
            </div>

            {/* Last Updated */}
            <p className="text-center text-gray-400 text-xs pt-2 border-t border-gray-100">
              Effective: January 2025
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsConditionsModal;
