import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import './OwnerBookings.css';
import API_BASE_URL, { SERVER_BASE_URL } from '../../config/api';

const OwnerBookings = ({ showSuccess, showError }) => {
  const socket = useSocket();
  const [bookings, setBookings] = useState({
    propertyBookings: [],
    bikeBookings: []
  });
  const [loading, setLoading] = useState(true);
  const [activeBookingType, setActiveBookingType] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  // Listen for real-time booking updates
  useEffect(() => {
    if (socket && socket.connected) {
      const handleBookingUpdate = (notification) => {
        if (notification.type === 'booking') {
          // Refresh bookings when there's a booking-related notification
          fetchBookings();
          
          // Show notification for booking status updates
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
  }, [socket, showSuccess, showError]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        showError('Authentication Error', 'Please login again');
        return;
      }

      console.log('Fetching bookings from /api/owners/all-bookings');
      const response = await fetch(`${API_BASE_URL}/owners/all-bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Bookings data received:', data);
        setBookings(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch bookings:', response.status, errorData);
        showError('Failed to fetch bookings', errorData.details || errorData.error || 'Please try refreshing the page');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showError('Error loading bookings', error.message || 'Please check your connection and try again');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId, action, bookingType) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = bookingType === 'property' 
        ? `http://localhost:3001/api/properties/bookings/${bookingId}/status`
        : `http://localhost:3001/api/bikes/bookings/${bookingId}/status`;

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
        fetchBookings(); // Refresh the bookings list
      } else {
        const errorData = await response.json();
        showError('Failed to update booking', errorData.error || 'Please try again');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
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

  const handleApproveBooking = async (bookingId, type) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'property' 
        ? `${API_BASE_URL}/owners/bookings/${bookingId}/approve`
        : `${API_BASE_URL}/bikes/bookings/${bookingId}/approve`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showSuccess('Booking Approved', 'Payment reminders will be sent automatically');
        fetchBookings();
      } else {
        const error = await response.json();
        showError('Failed to approve', error.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error approving booking:', error);
      showError('Error', 'Failed to approve booking');
    }
  };

  const handleRejectBooking = async (bookingId, type) => {
    if (!confirm('Are you sure you want to reject this booking?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'property'
        ? `${API_BASE_URL}/owners/bookings/${bookingId}/reject`
        : `${API_BASE_URL}/bikes/bookings/${bookingId}/reject`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showSuccess('Booking Rejected', 'The booking has been rejected');
        fetchBookings();
      } else {
        const error = await response.json();
        showError('Failed to reject', error.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error rejecting booking:', error);
      showError('Error', 'Failed to reject booking');
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'confirmed':
      case 'active':
        return 'status-confirmed';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  const renderPropertyBookings = () => {
    if (bookings.propertyBookings.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">🏠</div>
          <h3>No Property Bookings</h3>
          <p>You haven't received any property rental requests yet.</p>
        </div>
      );
    }

    return bookings.propertyBookings.map((booking) => (
      <div key={`property-${booking.id}`} className="booking-card">
        <div className="booking-header">
          <div className="booking-type-badge property">PROPERTY RENTAL</div>
          <div className={`booking-status ${getStatusClass(booking.status)}`}>
            {booking.status?.toUpperCase() || 'PENDING'}
          </div>
        </div>
        <div className="booking-content">
          <div className="booking-image">
            {booking.property?.images?.[0] ? (
              <img 
                src={`${SERVER_BASE_URL}/uploads/properties/${booking.property.images[0]}`} 
                alt={booking.property.title}
              />
            ) : (
              <div className="placeholder-image">🏠</div>
            )}
          </div>
          <div className="booking-details">
            <h3>{booking.property?.title || 'Property'}</h3>
            <p className="booking-location">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', marginRight: '4px' }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {booking.property?.address}, {booking.property?.city}
            </p>
            <p className="booking-type">Type: {booking.property?.propertyType || 'House'}</p>
            <p className="booking-renter">Renter: <strong>{booking.tenant?.fullName || booking.renter?.fullName}</strong></p>
            <p className="booking-contact">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', marginRight: '4px' }}>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              {booking.tenant?.phone || booking.renter?.phone || '9811387634'}
            </p>
            <div className="booking-dates">
              <span>From: <strong>{formatDate(booking.moveInDate || booking.startDate)}</strong></span>
              <span>To: <strong>{formatDate(booking.moveOutDate || booking.endDate)}</strong></span>
            </div>
            <p className="booking-amount">Amount: <strong>NPR {(booking.monthlyRent || booking.totalAmount || 0).toLocaleString()}</strong></p>
          </div>
        </div>
        
        {/* Accept/Decline buttons for pending bookings */}
        {booking.status?.toLowerCase() === 'pending' && (
          <div className="booking-actions">
            <button 
              className="btn-accept"
              onClick={() => handleBookingAction(booking.id, 'accept', 'property')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Accept
            </button>
            <button 
              className="btn-decline"
              onClick={() => handleBookingAction(booking.id, 'decline', 'property')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Decline
            </button>
          </div>
        )}

        <div className="booking-footer">
          <small>Booked on {formatDate(booking.createdAt)}</small>
          {booking.status?.toLowerCase() === 'pending' && (
            <div className="booking-actions">
              <button 
                className="btn-approve"
                onClick={() => handleApproveBooking(booking.id, 'property')}
              >
                ✓ Accept
              </button>
              <button 
                className="btn-reject"
                onClick={() => handleRejectBooking(booking.id, 'property')}
              >
                ✗ Reject
              </button>
            </div>
          )}
        </div>
      </div>
    ));
  };

  const renderBikeBookings = () => {
    if (bookings.bikeBookings.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">🚴</div>
          <h3>No Bike Rentals</h3>
          <p>You haven't rented any bikes yet.</p>
        </div>
      );
    }

    return bookings.bikeBookings.map((booking) => (
      <div key={`bike-${booking.id}`} className="booking-card">
        <div className="booking-header">
          <div className="booking-type-badge bike">Bike Rental</div>
          <div className={`booking-status ${getStatusClass(booking.status)}`}>
            {booking.status || 'Pending'}
          </div>
        </div>
        <div className="booking-content">
          <div className="booking-image">
            {booking.bike?.images?.[0] ? (
              <img 
                src={`${SERVER_BASE_URL}/uploads/bikes/${booking.bike.images[0]}`} 
                alt={`${booking.bike.brand} ${booking.bike.model}`}
              />
            ) : (
              <div className="placeholder-image">🚴</div>
            )}
          </div>
          <div className="booking-details">
            <h3>{booking.bike?.brand} {booking.bike?.model}</h3>
            <p className="booking-location">📍 {booking.bike?.location}</p>
            <p className="booking-type">Type: {booking.bike?.type}</p>
            <p className="booking-vendor">Vendor: {booking.vendor?.businessName || booking.vendor?.fullName}</p>
            <p className="booking-contact">📞 {booking.vendor?.phone}</p>
            <div className="booking-dates">
              <span>From: {formatDate(booking.startDate)}</span>
              <span>To: {formatDate(booking.endDate)}</span>
            </div>
            {booking.totalAmount && (
              <p className="booking-amount">Amount: NPR {booking.totalAmount.toLocaleString()}</p>
            )}
          </div>
        </div>
        <div className="booking-footer">
          <small>Booked on {formatDate(booking.createdAt)}</small>
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
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Bookings</h3>
          <p>You don't have any bookings yet. Start by listing properties or renting bikes!</p>
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
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="lessor-bookings">
      <div className="bookings-header">
        <div className="booking-tabs">
          <button 
            className={`tab ${activeBookingType === 'all' ? 'active' : ''}`}
            onClick={() => setActiveBookingType('all')}
          >
            All Bookings ({getAllBookings().length})
          </button>
          <button 
            className={`tab ${activeBookingType === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveBookingType('properties')}
          >
            Property Rentals ({bookings.propertyBookings.length})
          </button>
          <button 
            className={`tab ${activeBookingType === 'bikes' ? 'active' : ''}`}
            onClick={() => setActiveBookingType('bikes')}
          >
            Bike Rentals ({bookings.bikeBookings.length})
          </button>
        </div>
        <button className="refresh-btn" onClick={fetchBookings}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
          Refresh
        </button>
      </div>

      <div className="bookings-content">
        {activeBookingType === 'all' && renderAllBookings()}
        {activeBookingType === 'properties' && renderPropertyBookings()}
        {activeBookingType === 'bikes' && renderBikeBookings()}
      </div>
    </div>
  );
};

export default OwnerBookings;