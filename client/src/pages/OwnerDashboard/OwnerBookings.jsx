import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import API_BASE_URL, { SERVER_BASE_URL } from '../../config/api';
import { RefreshCw, MapPin, Phone, Check, X, ClipboardList, Home, Bike, Calendar, Wallet, Eye, User, Clock, AlertTriangle } from 'lucide-react';

const OwnerBookings = ({ showSuccess, showError }) => {
  const socket = useSocket();
  const [bookings, setBookings] = useState({
    propertyBookings: [],
    bikeBookings: []
  });
  const [loading, setLoading] = useState(true);
  const [activeBookingType, setActiveBookingType] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null); // For View Application modal

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        showError('Authentication Error', 'Please login again');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/owners/all-bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings({
          propertyBookings: Array.isArray(data?.propertyBookings) ? data.propertyBookings : [],
          bikeBookings: Array.isArray(data?.bikeBookings) ? data.bikeBookings : []
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        showError('Failed to fetch bookings', errorData.details || errorData.error || 'Please try refreshing the page');
        setBookings({ propertyBookings: [], bikeBookings: [] });
      }
    } catch (error) {
      showError('Error loading bookings', error.message || 'Please check your connection and try again');
      setBookings({ propertyBookings: [], bikeBookings: [] });
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (socket && socket.connected) {
      const handleBookingUpdate = (notification) => {
        if (notification.type === 'booking') {
          fetchBookings();
          if (notification.title.includes('Approved') || notification.title.includes('Confirmed') || notification.title.includes('Active') || notification.title.includes('Completed')) {
            showSuccess(notification.title, notification.message);
          } else if (notification.title.includes('Rejected') || notification.title.includes('Cancelled')) {
            showError(notification.title, notification.message);
          }
        }
      };
      socket.on('new-notification', handleBookingUpdate);
      return () => {
        socket.off('new-notification', handleBookingUpdate);
      };
    }
  }, [socket, showSuccess, showError, fetchBookings]);

  const handleBookingAction = async (bookingId, action, bookingType) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = bookingType === 'property' 
        ? `${API_BASE_URL}/properties/bookings/${bookingId}/status`
        : `${API_BASE_URL}/bikes/bookings/${bookingId}/status`;

      const status = action === 'accept' ? 'Approved' : 'Rejected';

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        showSuccess(
          action === 'accept' ? 'Booking Accepted!' : 'Booking Declined',
          `The booking has been ${action === 'accept' ? 'accepted' : 'declined'} successfully.`
        );
        fetchBookings();
        setSelectedBooking(null); // Close modal if open
      } else {
        const errorData = await response.json();
        showError('Failed to update booking', errorData.error || 'Please try again');
      }
    } catch (error) {
      showError('Error', 'Failed to update booking status');
    }
  };

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
    if (s === 'completed') return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (['cancelled', 'rejected'].includes(s)) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const renderBookingCard = (booking, type) => {
    const isProperty = type === 'property';
    const item = isProperty ? booking.property : booking.bike;
    const renter = isProperty ? booking.renter : booking.lessor;
    const itemsImage = item?.images?.[0] 
      ? `${SERVER_BASE_URL}/uploads/${isProperty ? 'properties' : 'bikes'}/${item.images[0]}`
      : "https://via.placeholder.com/300?text=No+Image";

    const isPending = (booking.status || '').toLowerCase() === 'pending' || (booking.status || '').toLowerCase() === 'available';

    return (
      <div key={`${type}-${booking.id}`} className="bg-white rounded-2xl overflow-hidden shadow border border-gray-100/50 hover:shadow-2xl hover:border-indigo-100 transition-all duration-300 relative group flex flex-col h-full">
        {/* Type Badge */}
        <div className={`absolute top-4 left-4 z-10 px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1 ${isProperty ? 'text-indigo-600' : 'text-blue-600'}`}>
          {isProperty ? <Home size={12} /> : <Bike size={12} />}
          {isProperty ? 'Property' : 'Vehicle'}
        </div>

        {/* Image Section */}
        <div className="h-48 overflow-hidden bg-gray-100 relative">
          <img 
            src={itemsImage} 
            alt={item?.title || `${item?.brand} ${item?.model}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/300?text=No+Image"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="text-lg font-bold leading-tight truncate drop-shadow-md">
              {isProperty ? item?.title : `${item?.brand} ${item?.model}`}
            </h3>
            <p className="text-xs font-medium text-white/90 drop-shadow-md truncate flex items-center gap-1">
              <MapPin size={10} className={isProperty ? "text-indigo-300" : "text-blue-300"} />
              {isProperty ? item?.location : item?.location}
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(booking.status)}`}>
              {booking.status || 'PENDING'}
            </span>
            <p className="text-xl font-bold text-slate-800">
              <span className="text-sm text-slate-500 font-medium mr-1">NPR</span>
              {formatCurrency(booking.totalAmount || booking.monthlyRent)}
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                {renter?.fullName?.[0] || <User size={14} />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{renter?.fullName || 'Unknown User'}</p>
                <p className="text-[10px] text-slate-500 truncate">{renter?.email}</p>
              </div>
              <a href={`tel:${renter?.phone}`} className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors">
                <Phone size={14} />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Start</span>
                <span className="font-semibold">{formatDate(booking.startDate || booking.moveInDate)}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">End</span>
                <span className="font-semibold">{formatDate(booking.endDate || booking.moveOutDate)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
            <button 
              onClick={() => setSelectedBooking({ ...booking, type })}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all hover:shadow-sm active:scale-95"
            >
              <Eye size={16} /> View
            </button>
            
            {isPending && (
              <>
                <button 
                  onClick={() => handleBookingAction(booking.id, 'accept', type)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 hover:scale-105 transition-all shadow-sm"
                  title="Accept"
                >
                  <Check size={18} />
                </button>
                <button 
                  onClick={() => handleBookingAction(booking.id, 'decline', type)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:scale-105 transition-all shadow-sm"
                  title="Decline"
                >
                  <X size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getFilteredBookings = () => {
    const props = (bookings?.propertyBookings || []).map(b => ({ ...b, type: 'property' }));
    const bikes = (bookings?.bikeBookings || []).map(b => ({ ...b, type: 'bike' }));
    
    let all = [];
    if (activeBookingType === 'all') all = [...props, ...bikes];
    else if (activeBookingType === 'properties') all = props;
    else if (activeBookingType === 'bikes') all = bikes;
    
    return all.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  };

  const filteredBookings = getFilteredBookings();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-center">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-auto">
           {['all', 'properties', 'bikes'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveBookingType(tab)}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  activeBookingType === tab 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
           ))}
        </div>
        <button 
          onClick={fetchBookings}
          className="w-full md:w-auto px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-bold text-sm flex items-center justify-center gap-2 text-gray-600 transition-all"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBookings.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
            <ClipboardList size={64} className="mb-6 opacity-50" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Bookings Found</h3>
            <p className="max-w-md mx-auto">You don't have any bookings in this category yet.</p>
          </div>
        ) : (
          filteredBookings.map(booking => renderBookingCard(booking, booking.type))
        )}
      </div>

      {/* View Application Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-black text-slate-800">Application Details</h3>
              <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
              {/* Header Info */}
              <div className="flex items-start gap-4">
                 <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                    <img 
                       src={selectedBooking.type === 'property' 
                         ? `${SERVER_BASE_URL}/uploads/properties/${selectedBooking.property?.images?.[0]}`
                         : `${SERVER_BASE_URL}/uploads/bikes/${selectedBooking.bike?.images?.[0]}`
                       }
                       className="w-full h-full object-cover"
                       onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/300?text=No+Image"; }}
                    />
                 </div>
                 <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-1">
                      {selectedBooking.type === 'property' ? selectedBooking.property?.title : `${selectedBooking.bike?.brand} ${selectedBooking.bike?.model}`}
                    </h4>
                    <p className="text-sm text-slate-500 font-medium">
                       Application ID: #{selectedBooking.id.slice(0, 8).toUpperCase()}
                    </p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(selectedBooking.status)}`}>
                       {selectedBooking.status}
                    </span>
                 </div>
              </div>

              {/* Applicant Info */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                 <h5 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Applicant Information</h5>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <label className="text-xs font-bold text-slate-500 block mb-1">Full Name</label>
                       <p className="font-bold text-slate-900 text-lg flex items-center gap-2">
                          <User size={18} className="text-indigo-500" />
                          {(selectedBooking.type === 'property' ? selectedBooking.renter : selectedBooking.lessor)?.fullName}
                       </p>
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 block mb-1">Contact Phone</label>
                       <a href={`tel:${(selectedBooking.type === 'property' ? selectedBooking.renter : selectedBooking.lessor)?.phone}`} className="font-bold text-indigo-600 text-lg flex items-center gap-2 hover:underline">
                          <Phone size={18} />
                          {(selectedBooking.type === 'property' ? selectedBooking.renter : selectedBooking.lessor)?.phone || 'N/A'}
                       </a>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Email Address</label>
                        <p className="font-medium text-slate-700">
                           {(selectedBooking.type === 'property' ? selectedBooking.renter : selectedBooking.lessor)?.email || 'N/A'}
                        </p>
                    </div>
                 </div>
              </div>

              {/* Booking Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                    <h5 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Booking Terms</h5>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-500">Start Date</span>
                          <span className="text-sm font-bold text-slate-900">{formatDate(selectedBooking.startDate || selectedBooking.moveInDate)}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-500">End Date</span>
                          <span className="text-sm font-bold text-slate-900">{formatDate(selectedBooking.endDate || selectedBooking.moveOutDate)}</span>
                       </div>
                       <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                          <span className="text-sm font-bold text-slate-500">Total Amount</span>
                          <span className="text-lg font-black text-indigo-600">NPR {formatCurrency(selectedBooking.totalAmount || selectedBooking.monthlyRent)}</span>
                       </div>
                    </div>
                 </div>
                 
                 {/* ID Proof / Documents Area (Placeholder) */}
                 <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col items-center justify-center text-center">
                    <ClipboardList size={32} className="text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-400">Additional Documents</p>
                    <p className="text-xs text-slate-400 mt-1">KYC Verified by Platform</p>
                 </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
               <button 
                 onClick={() => setSelectedBooking(null)}
                 className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-800 transition-all"
               >
                 Close Details
               </button>
               {(selectedBooking.status?.toLowerCase() === 'pending' || selectedBooking.status?.toLowerCase() === 'available') && (
                  <>
                     <button
                        onClick={() => handleBookingAction(selectedBooking.id, 'decline', selectedBooking.type)} 
                        className="px-6 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-100 hover:scale-105 transition-all shadow-sm"
                     >
                        Reject Application
                     </button>
                     <button 
                        onClick={() => handleBookingAction(selectedBooking.id, 'accept', selectedBooking.type)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 hover:scale-105 transition-all shadow-lg shadow-indigo-200"
                     >
                        Accept Application
                     </button>
                  </>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerBookings;