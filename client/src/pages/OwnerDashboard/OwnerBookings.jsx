import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import './OwnerBookings.css';

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
      const response = await fetch('http://localhost:3001/api/owners/all-bookings', {
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <div className="booking-type-badge property">Property Rental</div>
          <div className={`booking-status ${getStatusClass(booking.status)}`}>
            {booking.status || 'Pending'}
          </div>
        </div>
        <div className="booking-content">
          <div className="booking-image">
            {booking.property?.images?.[0] ? (
              <img 
                src={`http://localhost:3001/uploads/properties/${booking.property.images[0]}`} 
                alt={booking.property.title}
              />
            ) : (
              <div className="placeholder-image">🏠</div>
            )}
          </div>
          <div className="booking-details">
            <h3>{booking.property?.title || 'Property'}</h3>
            <p className="booking-location">📍 {booking.property?.location}</p>
            <p className="booking-type">Type: {booking.property?.propertyType}</p>
            <p className="booking-renter">Renter: {booking.renter?.fullName}</p>
            <p className="booking-contact">📞 {booking.renter?.phone}</p>
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
                src={`http://localhost:3001/uploads/bikes/${booking.bike.images[0]}`} 
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