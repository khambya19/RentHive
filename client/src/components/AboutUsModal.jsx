import React from 'react';
import { X, Home, Car, Shield, MapPin, Users, Star, CheckCircle } from 'lucide-react';

const AboutUsModal = ({ isOpen, onClose }) => {
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
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6 text-white rounded-t-xl sm:rounded-t-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1">About RentHive</h2>
                <p className="text-white/80 text-xs sm:text-sm">Your Trusted Rental Platform</p>
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
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Intro */}
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              <strong className="text-gray-800">RentHive</strong> is a modern rental marketplace designed to connect property owners and renters in Nepal. Whether you're looking for a cozy room, a spacious flat, or a reliable vehicle – we've got you covered.
            </p>
            
            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <Home size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 text-xs sm:text-sm">Property Rentals</h4>
                  <p className="text-gray-500 text-[10px] sm:text-xs">Rooms, Flats & Houses</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg">
                <Car size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 text-xs sm:text-sm">Vehicle Rentals</h4>
                  <p className="text-gray-500 text-[10px] sm:text-xs">Bikes & Scooters</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                <Shield size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 text-xs sm:text-sm">Secure Payments</h4>
                  <p className="text-gray-500 text-[10px] sm:text-xs">Safe Transactions</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                <MapPin size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 text-xs sm:text-sm">Nepal Wide</h4>
                  <p className="text-gray-500 text-[10px] sm:text-xs">Nationwide Coverage</p>
                </div>
              </div>
            </div>
            
            {/* Why Choose Us */}
            <div>
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-3 flex items-center gap-2">
                <Star size={16} className="text-yellow-500" /> Why Choose RentHive?
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-600 text-xs sm:text-sm">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  <span>Verified listings with KYC authentication</span>
                </li>
                <li className="flex items-center gap-2 text-gray-600 text-xs sm:text-sm">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  <span>Direct communication with property owners</span>
                </li>
                <li className="flex items-center gap-2 text-gray-600 text-xs sm:text-sm">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  <span>Easy booking and payment management</span>
                </li>
                <li className="flex items-center gap-2 text-gray-600 text-xs sm:text-sm">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  <span>24/7 customer support</span>
                </li>
              </ul>
            </div>
            
            {/* Stats */}
            <div className="flex justify-around py-4 bg-gray-50 rounded-xl">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">500+</p>
                <p className="text-gray-500 text-[10px] sm:text-xs">Properties</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-purple-600">1000+</p>
                <p className="text-gray-500 text-[10px] sm:text-xs">Happy Users</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-600">4.8</p>
                <p className="text-gray-500 text-[10px] sm:text-xs">Rating</p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="text-center pt-2 border-t border-gray-100">
              <p className="text-gray-500 text-xs">
                <Users size={14} className="inline mr-1" />
                Made with ❤️ in Nepal
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutUsModal;
