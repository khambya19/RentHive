import React from 'react';
import { X, AlertTriangle, Clock, CheckCircle, XCircle, RefreshCw, CreditCard } from 'lucide-react';

const CancellationModal = ({ isOpen, onClose }) => {
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
          <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 p-4 sm:p-6 text-white rounded-t-xl sm:rounded-t-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1">Cancellation Policy</h2>
                <p className="text-white/80 text-xs sm:text-sm">Booking Cancellation Terms</p>
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
            
            {/* Free Cancellation */}
            <div className="p-3 sm:p-4 bg-green-50 border border-green-100 rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-1">Free Cancellation</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Cancel within <strong>24 hours</strong> of booking for a full refund (if check-in is more than 48 hours away).
                  </p>
                </div>
              </div>
            </div>

            {/* Partial Refund */}
            <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
              <div className="flex items-start gap-3">
                <RefreshCw size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-1">Partial Refund</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Cancel <strong>24-48 hours</strong> before check-in and receive a <strong>50% refund</strong> of the booking amount.
                  </p>
                </div>
              </div>
            </div>

            {/* No Refund */}
            <div className="p-3 sm:p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="flex items-start gap-3">
                <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-1">No Refund</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Cancellations made <strong>less than 24 hours</strong> before check-in are <strong>non-refundable</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* How to Cancel */}
            <div>
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-3 flex items-center gap-2">
                <Clock size={16} className="text-blue-600" /> How to Cancel
              </h3>
              <ol className="space-y-2 text-gray-600 text-xs sm:text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>Go to your <strong>Dashboard → My Bookings</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Select the booking you want to cancel</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>Click <strong>"Cancel Booking"</strong> and confirm</span>
                </li>
              </ol>
            </div>

            {/* Refund Processing */}
            <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start gap-3">
                <CreditCard size={18} className="text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-800 text-sm mb-1">Refund Processing</h4>
                  <p className="text-gray-500 text-xs">
                    Refunds are processed within <strong>5-7 business days</strong> to your original payment method.
                  </p>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
              <AlertTriangle size={16} className="text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-orange-700 text-xs">
                <strong>Note:</strong> Special promotions or discounted bookings may have different cancellation terms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CancellationModal;
