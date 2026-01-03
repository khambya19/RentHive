import React, { useState } from 'react';

const RentalBookings = ({ bookings, setBookings, fetchData, showSuccess, showError }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'approved', 'active', 'completed', 'cancelled'
  const [sortBy, setSortBy] = useState('newest');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const handleBookingAction = async (bookingId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/bikes/vendor/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update booking');
      }

      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status } : booking
      ));
      
      fetchData(); // Refresh stats
      showSuccess(`Booking ${status.toLowerCase()} successfully!`);
    } catch (error) {
      console.error('Error updating booking:', error);
      showError(error.message || 'Failed to update booking status');
    }
  };

  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const getFilteredAndSortedBookings = () => {
    let filtered = [...bookings];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(booking => 
        booking.customer?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.bike?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.bike?.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(booking => booking.status?.toLowerCase() === filterStatus);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'amount-high') return parseInt(b.totalAmount || 0) - parseInt(a.totalAmount || 0);
      if (sortBy === 'amount-low') return parseInt(a.totalAmount || 0) - parseInt(b.totalAmount || 0);
      return 0;
    });
    
    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredBookings = getFilteredAndSortedBookings();

  return (
    <div className="rental-bookings">
      {/* Toolbar */}
      <div className="bookings-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by customer name, email, or bike..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <select 
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select 
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount-high">Amount: High to Low</option>
              <option value="amount-low">Amount: Low to High</option>
            </select>
          </div>
        </div>
        
        <div className="toolbar-right">
          <div className="bookings-summary">
            <span className="summary-item">
              <span className="summary-count">{bookings.filter(b => b.status === 'Pending').length}</span>
              <span className="summary-label">Pending</span>
            </span>
            <span className="summary-item">
              <span className="summary-count">{bookings.filter(b => b.status === 'Active').length}</span>
              <span className="summary-label">Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {filteredBookings.length > 0 && (
        <div className="bookings-stats-bar">
          <span className="stats-text">
            Showing <strong>{filteredBookings.length}</strong> of <strong>{bookings.length}</strong> bookings
          </span>
          <div className="stats-chips">
            <span className="chip chip-warning">{bookings.filter(b => b.status === 'Pending').length} Pending</span>
            <span className="chip chip-success">{bookings.filter(b => b.status === 'Active').length} Active</span>
            <span className="chip chip-primary">{bookings.filter(b => b.status === 'Completed').length} Completed</span>
          </div>
        </div>
      )}

      {/* Bookings Table */}
      <div className="table-container">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Bike Details</th>
              <th>Rental Period</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Booked On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? filteredBookings.map(booking => (
              <tr key={booking.id} className={`booking-row status-${booking.status?.toLowerCase()}`}>
                <td>
                  <div className="customer-info">
                    <div className="customer-avatar">
                      {booking.customer?.profileImage ? (
                        <img 
                          src={`http://localhost:3001/uploads/profiles/${booking.customer.profileImage}`} 
                          alt={booking.customer.fullName}
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {booking.customer?.fullName?.[0] || 'C'}
                        </div>
                      )}
                    </div>
                    <div className="customer-details">
                      <div className="customer-name">{booking.customer?.fullName || 'N/A'}</div>
                      <div className="customer-email">{booking.customer?.email || ''}</div>
                      <div className="customer-phone">{booking.customer?.phone || ''}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="bike-info">
                    <div className="bike-image">
                      {booking.bike?.images?.[0] ? (
                        <img 
                          src={`http://localhost:3001/uploads/bikes/${booking.bike.images[0]}`} 
                          alt={booking.bike.name}
                        />
                      ) : (
                        <div className="bike-placeholder">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12V7a1 1 0 0 1 1-1h4l2-3h4a1 1 0 0 1 1 1v7.5"/>
                            <circle cx="8" cy="16" r="3"/>
                            <circle cx="16" cy="16" r="3"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="bike-details">
                      <div className="bike-name">{booking.bike?.name || 'N/A'}</div>
                      <div className="bike-brand-model">{booking.bike?.brand} {booking.bike?.model}</div>
                      <div className="bike-type">{booking.bike?.type}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="rental-period">
                    <div className="date-range">
                      <div className="start-date">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {new Date(booking.startDate).toLocaleDateString('en-US', { 
                          month: 'short', day: 'numeric', year: 'numeric' 
                        })}
                      </div>
                      <div className="end-date">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {new Date(booking.endDate).toLocaleDateString('en-US', { 
                          month: 'short', day: 'numeric', year: 'numeric' 
                        })}
                      </div>
                    </div>
                    <div className="duration">
                      {calculateDuration(booking.startDate, booking.endDate)} day(s)
                    </div>
                  </div>
                </td>
                <td>
                  <div className="amount-info">
                    <div className="total-amount">NPR {parseInt(booking.totalAmount || 0).toLocaleString()}</div>
                    <div className="daily-rate">NPR {parseInt(booking.bike?.dailyRate || 0).toLocaleString()}/day</div>
                  </div>
                </td>
                <td>
                  <span className={`status-badge status-${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
                <td>
                  <div className="booking-date">
                    {new Date(booking.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric' 
                    })}
                    <div className="booking-time">
                      {new Date(booking.createdAt).toLocaleTimeString('en-US', { 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="booking-actions">
                    {booking.status === 'Pending' && (
                      <>
                        <button 
                          className="btn-sm btn-success" 
                          onClick={() => handleBookingAction(booking.id, 'Approved')}
                          title="Approve Booking"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Approve
                        </button>
                        <button 
                          className="btn-sm btn-danger" 
                          onClick={() => handleBookingAction(booking.id, 'Cancelled')}
                          title="Cancel Booking"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                          Cancel
                        </button>
                      </>
                    )}
                    {booking.status === 'Approved' && (
                      <button 
                        className="btn-sm btn-primary" 
                        onClick={() => handleBookingAction(booking.id, 'Active')}
                        title="Mark as Active"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="10 8 16 12 10 16"/>
                        </svg>
                        Start Rental
                      </button>
                    )}
                    {booking.status === 'Active' && (
                      <button 
                        className="btn-sm btn-success" 
                        onClick={() => handleBookingAction(booking.id, 'Completed')}
                        title="Complete Rental"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Complete
                      </button>
                    )}
                    <button 
                      className="btn-sm btn-outline" 
                      onClick={() => viewBookingDetails(booking)}
                      title="View Details"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      View
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <h3>{searchQuery || filterStatus !== 'all' ? 'No bookings found' : 'No rental bookings yet'}</h3>
                    <p>
                      {searchQuery || filterStatus !== 'all' 
                        ? 'Try adjusting your search or filters' 
                        : 'Rental bookings will appear here when customers book your bikes'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Booking Details Modal */}
      {showBookingModal && selectedBooking && (
        <div className="modal-backdrop" onClick={() => setShowBookingModal(false)}>
          <div className="modal-dialog booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button className="modal-close" onClick={() => setShowBookingModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="booking-details-grid">
                <div className="detail-section">
                  <h3>Customer Information</h3>
                  <div className="detail-item">
                    <span className="label">Name:</span>
                    <span className="value">{selectedBooking.customer?.fullName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{selectedBooking.customer?.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Phone:</span>
                    <span className="value">{selectedBooking.customer?.phone}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Bike Information</h3>
                  <div className="detail-item">
                    <span className="label">Name:</span>
                    <span className="value">{selectedBooking.bike?.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Brand & Model:</span>
                    <span className="value">{selectedBooking.bike?.brand} {selectedBooking.bike?.model}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Type:</span>
                    <span className="value">{selectedBooking.bike?.type}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Daily Rate:</span>
                    <span className="value">NPR {parseInt(selectedBooking.bike?.dailyRate || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Rental Details</h3>
                  <div className="detail-item">
                    <span className="label">Start Date:</span>
                    <span className="value">{new Date(selectedBooking.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">End Date:</span>
                    <span className="value">{new Date(selectedBooking.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Duration:</span>
                    <span className="value">{calculateDuration(selectedBooking.startDate, selectedBooking.endDate)} day(s)</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Total Amount:</span>
                    <span className="value total-amount">NPR {parseInt(selectedBooking.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Booking Status</h3>
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span className={`status-badge status-${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Booked On:</span>
                    <span className="value">{new Date(selectedBooking.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="detail-section">
                  <h3>Customer Notes</h3>
                  <p className="notes">{selectedBooking.notes}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedBooking.status === 'Pending' && (
                <>
                  <button 
                    className="btn-success" 
                    onClick={() => {
                      handleBookingAction(selectedBooking.id, 'Approved');
                      setShowBookingModal(false);
                    }}
                  >
                    Approve Booking
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={() => {
                      handleBookingAction(selectedBooking.id, 'Cancelled');
                      setShowBookingModal(false);
                    }}
                  >
                    Cancel Booking
                  </button>
                </>
              )}
              <button className="btn-secondary" onClick={() => setShowBookingModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalBookings;