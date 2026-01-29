import React, { useState } from 'react';
import { Check, AlertCircle, Info, Home, X } from 'lucide-react';
import './DashboardNotifications.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

const DashboardNotifications = ({ notifications, onRemove }) => {
  const [processingBooking, setProcessingBooking] = useState(null);

  const handleBookingResponse = async (notificationId, bookingId, action) => {
    setProcessingBooking(bookingId);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/notifications/booking-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId,
          action,
          notificationId
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Remove the notification after successful response
        onRemove(notificationId);
        
        // Show success message
        const successMessage = action === 'accept' 
          ? 'Booking request accepted successfully!' 
          : 'Booking request declined.';
        alert(successMessage);
      } else {
        alert(data.message || 'Failed to process booking response');
      }
    } catch (error) {
      // console.error('Error handling booking response:', error);
      alert('Failed to process booking response');
    } finally {
      setProcessingBooking(null);
    }
  };

  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="dashboard-notifications">
      {notifications.map((notification) => {
        // Parse metadata if it exists
        let metadata = null;
        try {
          metadata = notification.metadata ? JSON.parse(notification.metadata) : null;
        } catch (e) {
          // console.error('Error parsing notification metadata:', e);
        }

        const isBookingRequest = notification.type === 'booking' && metadata?.requiresAction;

        return (
          <div
            key={notification.id}
            className={`notification-toast ${notification.type} ${isBookingRequest ? 'booking-request' : ''}`}
          >
            <div className="notification-icon">
              {notification.type === 'success' && (
                <Check size={24} />
              )}
              {notification.type === 'error' && (
                <AlertCircle size={24} />
              )}
              {notification.type === 'booking' && (
                <Home size={24} />
              )}
              {notification.type === 'info' && (
                <Info size={24} />
              )}
            </div>
            <div className="notification-content">
              <h4>{notification.title}</h4>
              {notification.message && <p>{notification.message}</p>}
              
              {/* Display booking details if available */}
              {metadata && isBookingRequest && (
                <div className="booking-details">
                  <div className="detail-row">
                    <span className="label">Tenant:</span>
                    <span className="value">{metadata.tenantName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Property:</span>
                    <span className="value">{metadata.propertyTitle}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Move-in Date:</span>
                    <span className="value">{new Date(metadata.moveInDate).toLocaleDateString()}</span>
                  </div>
                  {metadata.message && (
                    <div className="detail-row">
                      <span className="label">Message:</span>
                      <span className="value">"{metadata.message}"</span>
                    </div>
                  )}
                </div>
              )}

              {/* Accept/Decline buttons for booking requests */}
              {isBookingRequest && (
                <div className="booking-actions">
                  <button
                    className="btn-accept"
                    onClick={() => handleBookingResponse(notification.id, metadata.bookingId, 'accept')}
                    disabled={processingBooking === metadata.bookingId}
                  >
                    <Check size={18} />
                    {processingBooking === metadata.bookingId ? 'Processing...' : 'Accept'}
                  </button>
                  <button
                    className="btn-decline"
                    onClick={() => handleBookingResponse(notification.id, metadata.bookingId, 'decline')}
                    disabled={processingBooking === metadata.bookingId}
                  >
                    <X size={18} />
                    {processingBooking === metadata.bookingId ? 'Processing...' : 'Decline'}
                  </button>
                </div>
              )}
            </div>
            <button
              className="notification-close"
              onClick={() => onRemove(notification.id)}
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardNotifications;