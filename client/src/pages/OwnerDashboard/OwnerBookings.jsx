import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
// import './OwnerBookings.css'; // Deprecated
import API_BASE_URL, { SERVER_BASE_URL } from '../../config/api';
import { RefreshCw, MapPin, Phone, Check, X, ClipboardList, Home, Bike, Calendar, Wallet } from 'lucide-react';

const OwnerBookings = ({ showSuccess, showError }) => {
  const socket = useSocket();
  const [bookings, setBookings] = useState({
    propertyBookings: [],
    bikeBookings: []
  });
  const [loading, setLoading] = useState(true);
  const [activeBookingType, setActiveBookingType] = useState('all');

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Error', 'No authentication token found');
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [ownersRes, bikeRes] = await Promise.all([
        fetch(`${API_BASE_URL}/owners/bookings`, { headers }),
        fetch(`${API_BASE_URL}/bikes/vendor/bookings`, { headers })
      ]);

      let propertyBookings = [];
      let bikeBookings = [];

      if (ownersRes.ok) {
        const data = await ownersRes.json();
        propertyBookings = data.propertyBookings || [];
        // Use bike bookings from /owners/bookings if available, otherwise fetch separately
        if (data.bikeBookings && data.bikeBookings.length > 0) {
          bikeBookings = data.bikeBookings;
        }
      } else {
        console.error('Failed to fetch owner bookings:', await ownersRes.text());
      }

      // Only fetch bike bookings separately if not already included
      if (bikeRes.ok && bikeBookings.length === 0) {
        const data = await bikeRes.json();
        bikeBookings = data || [];
      } else if (!bikeRes.ok) {
        console.error('Failed to fetch bike bookings:', await bikeRes.text());
      }

      setBookings({ propertyBookings, bikeBookings });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showError('Error', 'Failed to load bookings');
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

          
          if (notification.title.includes('Approved') || 
              notification.title.includes('Confirmed') ||
              notification.title.includes('Active') ||
              notification.title.includes('Completed')) {
            showSuccess(notification.title, notification.message);
          } else if (notification.title.includes('Rejected') || 
                     notification.title.includes('Cancelled')) {
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
        : `${API_BASE_URL}/bikes/vendor/bookings/${bookingId}/status`;

      const status = action === 'accept' ? 'Approved' : 'Rejected';

      const response = await fetch(endpoint, {
        method: 'PUT',
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
        fetchBookings(); // Refresh the bookings list
      } else {
        const errorData = await response.json();
        showError('Failed to update booking', errorData.error || 'Please try again');
      }
    } catch (error) {
      // console.error('Error updating booking:', error);
      showError('Error', 'Failed to update booking status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };





  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
      case 'active':
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'cancelled':
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderPropertyBookings = () => {
    if (bookings.propertyBookings.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200 text-gray-500">
          <Home size={48} className="mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Property Bookings</h3>
          <p className="max-w-md mx-auto">You haven't received any property rental requests yet.</p>
        </div>
      );
    }

    return bookings.propertyBookings.map((booking) => (
      <div key={`property-${booking.id}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-gray-50/50 border-b border-gray-100 gap-4">
          <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Home size={12} /> Property Rental
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(booking.status)}`}>
            {booking.status?.toUpperCase() || 'PENDING'}
          </div>
        </div>
        
        <div className="p-5 flex flex-col md:flex-row gap-6">
          <div className="md:w-48 h-48 md:h-auto flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 relative group-hover:scale-[1.02] transition-transform duration-300">
            {booking.property?.images?.[0] ? (
              <img 
                src={`${SERVER_BASE_URL}/uploads/properties/${booking.property.images[0]}`} 
                alt={booking.property.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = "https://via.placeholder.com/300?text=No+Image"; }}
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full text-gray-300">
                <Home size={40} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
          </div>
          
          <div className="flex-1 space-y-3">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{booking.property?.title || 'Property'}</h3>
            <p className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} className="text-indigo-500" />
              {booking.property?.address}, {booking.property?.city}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <p className="text-sm"><span className="font-semibold text-gray-500">Type:</span> {booking.property?.propertyType || 'House'}</p>
                <p className="text-sm"><span className="font-semibold text-gray-500">Renter:</span> {booking.tenant?.fullName || booking.renter?.fullName}</p>
                <p className="text-sm flex items-center gap-2">
                  <span className="font-semibold text-gray-500">Contact:</span> 
                  <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs font-medium">
                    <Phone size={12} /> {booking.tenant?.phone || booking.renter?.phone || 'N/A'}
                  </span>
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex flex-col gap-1 text-sm bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1"><Calendar size={14} /> From:</span>
                    <span className="font-medium">{formatDate(booking.moveInDate || booking.startDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1"><Calendar size={14} /> To:</span>
                    <span className="font-medium">{formatDate(booking.moveOutDate || booking.endDate)}</span>
                  </div>
                </div>
                <p className="text-sm flex items-center gap-1 font-bold text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">
                  <Wallet size={16} /> NPR {(booking.monthlyRent || booking.totalAmount || 0).toLocaleString()} <span className="text-xs font-normal text-green-700">/month</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Accept/Decline buttons for pending bookings */}
        {booking.status?.toLowerCase() === 'pending' && (
          <div className="flex flex-col sm:flex-row gap-3 p-5 bg-gray-50 border-t border-gray-100">
            <button 
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
              onClick={() => handleBookingAction(booking.id, 'accept', 'property')}
            >
              <Check size={18} /> Accept Request
            </button>
            <button 
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-red-600 border border-red-100 rounded-xl font-semibold shadow-sm hover:bg-red-50 hover:border-red-200 hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
              onClick={() => handleBookingAction(booking.id, 'decline', 'property')}
            >
              <X size={18} /> Decline
            </button>
          </div>
        )}

        <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100 text-xs text-gray-500 text-right">
          Booked on {formatDate(booking.createdAt)}
        </div>
      </div>
    ));
  };

  const renderBikeBookings = () => {
    if (bookings.bikeBookings.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200 text-gray-500">
          <Bike size={48} className="mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Bike Rentals</h3>
          <p className="max-w-md mx-auto">You haven't rented any bikes yet.</p>
        </div>
      );
    }

    return bookings.bikeBookings.map((booking) => (
      <div key={`bike-${booking.id}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-gray-50/50 border-b border-gray-100 gap-4">
          <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Bike size={12} /> Bike Rental
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(booking.status)}`}>
            {booking.status || 'PENDING'}
          </div>
        </div>
        
        <div className="p-5 flex flex-col md:flex-row gap-6">
          <div className="md:w-48 h-48 md:h-auto flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 relative group-hover:scale-[1.02] transition-transform duration-300">
            {booking.bike?.images?.[0] ? (
              <img 
                src={booking.bike.images[0].startsWith('/uploads') 
                  ? `${SERVER_BASE_URL}${booking.bike.images[0]}` 
                  : `${SERVER_BASE_URL}/uploads/bikes/${booking.bike.images[0]}`
                }
                alt={`${booking.bike.brand} ${booking.bike.model}`}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = "https://via.placeholder.com/300?text=No+Image"; }}
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full text-gray-300">
                <Bike size={40} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
          </div>
          
          <div className="flex-1 space-y-3">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{booking.bike?.brand} {booking.bike?.model}</h3>
            <p className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} className="text-indigo-500" />
              {booking.bike?.location}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <p className="text-sm"><span className="font-semibold text-gray-500">Type:</span> {booking.bike?.type}</p>
                <p className="text-sm"><span className="font-semibold text-gray-500">Vendor:</span> {booking.vendor?.businessName || booking.vendor?.fullName}</p>
                <p className="text-sm flex items-center gap-2">
                  <span className="font-semibold text-gray-500">Contact:</span> 
                  <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs font-medium">
                    <Phone size={12} /> {booking.vendor?.phone || 'N/A'}
                  </span>
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex flex-col gap-1 text-sm bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1"><Calendar size={14} /> From:</span>
                    <span className="font-medium">{formatDate(booking.startDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1"><Calendar size={14} /> To:</span>
                    <span className="font-medium">{formatDate(booking.endDate)}</span>
                  </div>
                </div>
                {booking.totalAmount && (
                  <p className="text-sm flex items-center gap-1 font-bold text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">
                    <Wallet size={16} /> NPR {booking.totalAmount.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Accept/Decline buttons for pending bike bookings */}
        {booking.status?.toLowerCase() === 'pending' && (
          <div className="flex flex-col sm:flex-row gap-3 p-5 bg-gray-50 border-t border-gray-100">
            <button 
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
              onClick={() => handleBookingAction(booking.id, 'accept', 'bike')}
            >
              <Check size={18} /> Accept Request
            </button>
            <button 
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-red-600 border border-red-100 rounded-xl font-semibold shadow-sm hover:bg-red-50 hover:border-red-200 hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
              onClick={() => handleBookingAction(booking.id, 'decline', 'bike')}
            >
              <X size={18} /> Decline
            </button>
          </div>
        )}

        <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100 text-xs text-gray-500 text-right">
          Booked on {formatDate(booking.createdAt)}
        </div>
      </div>
    ));
  };

  const getAllBookings = () => {
    const allBookings = [
      ...bookings.propertyBookings.map(booking => ({ ...booking, type: 'property' })),
      ...bookings.bikeBookings.map(booking => ({ ...booking, type: 'bike' }))
    ];
    
    return allBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const renderAllBookings = () => {
    const allBookings = getAllBookings();
    
    if (allBookings.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200 text-gray-500">
          <ClipboardList size={64} className="mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Bookings</h3>
          <p className="max-w-md mx-auto">You don't have any bookings yet. Start by listing properties or renting bikes!</p>
        </div>
      );
    }

    return allBookings.map((booking) => {
      if (booking.type === 'property') {
        return renderPropertyBookings().find(card => 
          card.key === `property-${booking.id}`
        );
      } else {
        return renderBikeBookings().find(card => 
          card.key === `bike-${booking.id}`
        );
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeBookingType === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setActiveBookingType('all')}
          >
            All Bookings ({getAllBookings().length})
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeBookingType === 'properties' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setActiveBookingType('properties')}
          >
            <Home size={16} /> Property Rentals ({bookings.propertyBookings.length})
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeBookingType === 'bikes' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setActiveBookingType('bikes')}
          >
            <Bike size={16} /> Bike Rentals ({bookings.bikeBookings.length})
          </button>
        </div>
        
        <button 
          className="w-full md:w-auto px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
          onClick={fetchBookings}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="space-y-6">
        {activeBookingType === 'all' && renderAllBookings()}
        {activeBookingType === 'properties' && renderPropertyBookings()}
        {activeBookingType === 'bikes' && renderBikeBookings()}
      </div>
    </div>
  );
};

export default OwnerBookings;