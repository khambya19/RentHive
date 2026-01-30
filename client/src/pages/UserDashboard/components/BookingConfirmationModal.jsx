import React from 'react';
import { X, Calendar, MapPin, DollarSign, Home, Bike, AlertCircle } from 'lucide-react';

const BookingConfirmationModal = ({ listing, bookingDetails, onConfirm, onCancel }) => {
  if (!listing || !bookingDetails) return null;

  const isProperty = listing.title !== undefined;
  const title = isProperty ? listing.title : `${listing.brand} ${listing.model}`;
  const location = isProperty ? `${listing.address}, ${listing.city}` : listing.location;
  const { startDate, endDate, duration, totalCost, grandTotal } = bookingDetails;

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-linear-to-r from-orange-500 to-orange-600 p-6 text-white">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              {isProperty ? (
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Home size={24} />
                </div>
              ) : (
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Bike size={24} />
                </div>
              )}
              <div>
                <h2 className="text-xl font-black">Confirm Booking</h2>
                <p className="text-sm text-orange-100">Review your booking details</p>
              </div>
            </div>
            <button 
              onClick={onCancel}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Property/Bike Details */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              {isProperty ? <Home size={16} className="text-green-500" /> : <Bike size={16} className="text-orange-500" />}
              <h3 className="font-bold text-gray-900">{title}</h3>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <MapPin size={12} />
              <span>{location}</span>
            </div>
          </div>

          {/* Date Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                <span className="text-sm font-bold text-gray-700">Start Date</span>
              </div>
              <span className="font-bold text-gray-900">{new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                <span className="text-sm font-bold text-gray-700">End Date</span>
              </div>
              <span className="font-bold text-gray-900">{new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <span className="text-sm font-bold text-gray-700">Duration</span>
              <span className="font-bold text-green-600">{duration} days</span>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-linear-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200">
            <h4 className="font-black text-gray-900 mb-3 text-sm uppercase tracking-wide">Price Breakdown</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Rate × {duration} days</span>
                <span className="font-bold text-gray-900">Rs {Number(totalCost - (listing.securityDeposit || 0)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Security Deposit</span>
                <span className="font-bold text-gray-900">Rs {Number(listing.securityDeposit || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Service Fee (5%)</span>
                <span className="font-bold text-gray-900">Rs {Math.round(totalCost * 0.05).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT (13%)</span>
                <span className="font-bold text-gray-900">Rs {Math.round((totalCost + totalCost * 0.05) * 0.13).toLocaleString()}</span>
              </div>
              <div className="h-px bg-indigo-300 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="font-black text-gray-900">Total Amount</span>
                <div className="flex items-center gap-2">
                  <DollarSign size={18} className="text-indigo-600" />
                  <span className="text-xl font-black text-indigo-600">Rs {Number(grandTotal).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Note */}
          <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <p className="font-bold mb-1">Important:</p>
              <p>By confirming, you're submitting a booking request. The owner will review and approve it. You'll be able to make payment once approved.</p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-200"
          >
            Confirm Booking
          </button>
        </div>

      </div>
    </div>
  );
};

export default BookingConfirmationModal;
