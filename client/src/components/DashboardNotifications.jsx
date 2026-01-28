import React, { useState } from 'react';
import './DashboardNotifications.css';

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
      console.error('Error handling booking response:', error);
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
          console.error('Error parsing notification metadata:', e);
        }

        const isBookingRequest = notification.type === 'booking' && metadata?.requiresAction;

        return (
          <div
            key={notification.id}
            className={`notification-toast ${notification.type} ${isBookingRequest ? 'booking-request' : ''}`}
          >
            <div className="notification-icon">
              {notification.type === 'success' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              {notification.type === 'error' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              )}
              {notification.type === 'booking' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              )}
              {notification.type === 'info' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {processingBooking === metadata.bookingId ? 'Processing...' : 'Accept'}
                  </button>
                  <button
                    className="btn-decline"
                    onClick={() => handleBookingResponse(notification.id, metadata.bookingId, 'decline')}
                    disabled={processingBooking === metadata.bookingId}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    {processingBooking === metadata.bookingId ? 'Processing...' : 'Decline'}
                  </button>
                </div>
              )}
            </div>
            <button
              className="notification-close"
              onClick={() => onRemove(notification.id)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardNotifications;