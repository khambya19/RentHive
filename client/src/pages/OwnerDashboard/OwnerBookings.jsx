import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import API_BASE_URL, { SERVER_BASE_URL } from '../../config/api';
import { RefreshCw, MapPin, Phone, Check, X, ClipboardList, Home, Bike, Calendar, Wallet, Eye, User, Clock, AlertTriangle } from 'lucide-react';
import ViewApplicantsModal from './ViewApplicantsModal';

const OwnerBookings = ({ showSuccess, showError }) => {
  const socket = useSocket();
  const [bookings, setBookings] = useState({
    propertyBookings: [],
    bikeBookings: []
  });
  const [loading, setLoading] = useState(true);
  const [activeBookingType, setActiveBookingType] = useState('all');
  const [selectedListing, setSelectedListing] = useState(null); // For grouped applicants view
  const [listingApplicants, setListingApplicants] = useState([]); // Applicants for selected listing

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
      const method = action === 'accept' ? 'approve' : 'reject';
      const endpoint = `${API_BASE_URL}/owners/bookings/${bookingId}/${method}`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showSuccess(
          action === 'accept' ? 'Booking Accepted!' : 'Booking Declined',
          `The booking has been ${action === 'accept' ? 'accepted' : 'declined'} successfully.`
        );
        fetchBookings();
        setSelectedListing(null); // Close modal
      } else {
        const errorData = await response.json().catch(() => ({}));
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

  const getFilteredBookings = () => {
    const props = (bookings?.propertyBookings || []).map(b => ({ ...b, type: 'property' }));
    const bikes = (bookings?.bikeBookings || []).map(b => ({ ...b, type: 'bike' }));
    
    let all = [];
    if (activeBookingType === 'all') all = [...props, ...bikes];
    else if (activeBookingType === 'properties') all = props;
    else if (activeBookingType === 'bikes') all = bikes;
    
    return all.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  };

  // Group bookings by listing ID to show all applicants for the same property/bike
  const getGroupedListings = () => {
    const filtered = getFilteredBookings();
    const grouped = {};

    filtered.forEach(booking => {
      const listingId = booking.type === 'property' ? booking.property?.id : booking.bike?.id;
      const listingType = booking.type;
      
      if (!listingId) return;

      const key = `${listingType}-${listingId}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          listingId,
          listingType,
          title: booking.type === 'property' ? booking.property?.title : `${booking.bike?.brand} ${booking.bike?.model}`,
          location: booking.type === 'property' ? booking.property?.location : booking.bike?.location,
          images: booking.type === 'property' ? booking.property?.images : booking.bike?.images,
          applicants: []
        };
      }

      grouped[key].applicants.push({
        ...booking,
        renterName: booking.renter?.fullName || booking.lessor?.fullName,
        renterEmail: booking.renter?.email || booking.lessor?.email,
        renterPhone: booking.renter?.phone || booking.lessor?.phone,
        lessorName: booking.lessor?.fullName,
        lessorEmail: booking.lessor?.email,
        lessorPhone: booking.lessor?.phone,
      });
    });

    return Object.values(grouped).sort((a, b) => b.applicants.length - a.applicants.length);
  };

  const handleViewApplicants = (listing) => {
    setSelectedListing(listing);
    setListingApplicants(listing.applicants);
  };

  const groupedListings = getGroupedListings();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-center">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading bookings...</p>
      </div>
    );
  }

  // Render a listing card with applicant count
  const renderListingCard = (listing) => {
    const isProperty = listing.listingType === 'property';
    const itemImage = listing.images?.[0] 
      ? `${SERVER_BASE_URL}/uploads/${isProperty ? 'properties' : 'bikes'}/${listing.images[0]}`
      : "https://via.placeholder.com/300?text=No+Image";

    const pendingCount = listing.applicants.filter(a => (a.status || '').toLowerCase() === 'pending').length;
    const approvedCount = listing.applicants.filter(a => ['approved', 'confirmed', 'active'].includes((a.status || '').toLowerCase())).length;

    return (
      <div key={`${listing.listingType}-${listing.listingId}`} className="bg-white rounded-2xl overflow-hidden shadow border border-gray-100/50 hover:shadow-2xl hover:border-indigo-100 transition-all duration-300 relative group flex flex-col h-full">
        {/* Type Badge */}
        <div className={`absolute top-4 left-4 z-10 px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1 ${isProperty ? 'text-indigo-600' : 'text-blue-600'}`}>
          {isProperty ? <Home size={12} /> : <Bike size={12} />}
          {isProperty ? 'Property' : 'Vehicle'}
        </div>

        {/* Applicant Count Badge */}
        <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
          <User size={12} />
          {listing.applicants.length} Applicant{listing.applicants.length !== 1 ? 's' : ''}
        </div>

        {/* Image Section */}
        <div className="h-48 overflow-hidden bg-gray-100 relative">
          <img 
            src={itemImage} 
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/300?text=No+Image"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="text-lg font-bold leading-tight truncate drop-shadow-md">
              {listing.title}
            </h3>
            <p className="text-xs font-medium text-white/90 drop-shadow-md truncate flex items-center gap-1">
              <MapPin size={10} className={isProperty ? "text-indigo-300" : "text-blue-300"} />
              {listing.location}
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200 text-center">
                <p className="text-2xl font-black text-yellow-600">{pendingCount}</p>
                <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide">Pending</p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl border border-green-200 text-center">
                <p className="text-2xl font-black text-green-600">{approvedCount}</p>
                <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Approved</p>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100">
            <button 
              onClick={() => handleViewApplicants(listing)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95"
            >
              <Eye size={18} /> View All Applicants
            </button>
          </div>
        </div>
      </div>
    );
  };

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
        {groupedListings.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
            <ClipboardList size={64} className="mb-6 opacity-50" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Applications Found</h3>
            <p className="max-w-md mx-auto">You don't have any applications in this category yet.</p>
          </div>
        ) : (
          groupedListings.map(listing => renderListingCard(listing))
        )}
      </div>

      {/* View Applicants Modal */}
      {selectedListing && (
        <ViewApplicantsModal
          listing={selectedListing}
          applicants={listingApplicants}
          onClose={() => {
            setSelectedListing(null);
            setListingApplicants([]);
          }}
          onApprove={(applicantId, type) => {
            handleBookingAction(applicantId, 'accept', type);
          }}
          onReject={(applicantId, type) => {
            handleBookingAction(applicantId, 'decline', type);
          }}
        />
      )}
    </div>
  );
};

export default OwnerBookings;