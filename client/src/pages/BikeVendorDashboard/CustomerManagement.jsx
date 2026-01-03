import React, { useState, useEffect } from 'react';

const CustomerManagement = ({ customers, setCustomers }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/bikes/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const viewCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  const getFilteredAndSortedCustomers = () => {
    let filtered = [...customers];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(customer => 
        customer.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'name') return (a.fullName || '').localeCompare(b.fullName || '');
      if (sortBy === 'bookings') return (b.totalBookings || 0) - (a.totalBookings || 0);
      return 0;
    });
    
    return filtered;
  };

  const filteredCustomers = getFilteredAndSortedCustomers();

  return (
    <div className="customer-management">
      {/* Toolbar */}
      <div className="customers-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <select 
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A-Z</option>
              <option value="bookings">Most Bookings</option>
            </select>
          </div>
        </div>
        
        <div className="toolbar-right">
          <div className="customers-summary">
            <span className="summary-item">
              <span className="summary-count">{customers.length}</span>
              <span className="summary-label">Total Customers</span>
            </span>
            <span className="summary-item">
              <span className="summary-count">{customers.filter(c => c.totalBookings > 0).length}</span>
              <span className="summary-label">Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {filteredCustomers.length > 0 && (
        <div className="customers-stats-bar">
          <span className="stats-text">
            Showing <strong>{filteredCustomers.length}</strong> of <strong>{customers.length}</strong> customers
          </span>
        </div>
      )}

      {/* Customers Grid */}
      <div className="customers-grid">
        {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
          <div key={customer.id} className="customer-card">
            <div className="customer-avatar">
              {customer.profileImage ? (
                <img 
                  src={`http://localhost:3001/uploads/profiles/${customer.profileImage}`} 
                  alt={customer.fullName}
                />
              ) : (
                <div className="avatar-placeholder">
                  {customer.fullName?.[0] || 'C'}
                </div>
              )}
            </div>
            
            <div className="customer-info">
              <h3 className="customer-name">{customer.fullName}</h3>
              <p className="customer-email">{customer.email}</p>
              {customer.phone && <p className="customer-phone">{customer.phone}</p>}
            </div>

            <div className="customer-stats">
              <div className="stat-item">
                <span className="stat-number">{customer.totalBookings || 0}</span>
                <span className="stat-label">Bookings</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">NPR {parseInt(customer.totalSpent || 0).toLocaleString()}</span>
                <span className="stat-label">Total Spent</span>
              </div>
            </div>

            <div className="customer-activity">
              <div className="activity-item">
                <span className="activity-label">Last Booking:</span>
                <span className="activity-value">
                  {customer.lastBookingDate 
                    ? new Date(customer.lastBookingDate).toLocaleDateString() 
                    : 'Never'}
                </span>
              </div>
              <div className="activity-item">
                <span className="activity-label">Member Since:</span>
                <span className="activity-value">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="customer-actions">
              <button 
                className="btn-outline"
                onClick={() => viewCustomerDetails(customer)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                View Details
              </button>
              {customer.email && (
                <button 
                  className="btn-primary"
                  onClick={() => window.location.href = `mailto:${customer.email}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Contact
                </button>
              )}
            </div>
          </div>
        )) : (
          <div className="empty-state-large">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <h3>{searchQuery ? 'No customers found' : 'No customers yet'}</h3>
            <p>
              {searchQuery 
                ? 'Try adjusting your search query' 
                : 'Customers will appear here when they start booking your bikes'}
            </p>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {showCustomerModal && selectedCustomer && (
        <div className="modal-backdrop" onClick={() => setShowCustomerModal(false)}>
          <div className="modal-dialog customer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Customer Details</h2>
              <button className="modal-close" onClick={() => setShowCustomerModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="customer-profile">
                <div className="profile-header">
                  <div className="profile-avatar">
                    {selectedCustomer.profileImage ? (
                      <img 
                        src={`http://localhost:3001/uploads/profiles/${selectedCustomer.profileImage}`} 
                        alt={selectedCustomer.fullName}
                      />
                    ) : (
                      <div className="avatar-placeholder large">
                        {selectedCustomer.fullName?.[0] || 'C'}
                      </div>
                    )}
                  </div>
                  <div className="profile-info">
                    <h3>{selectedCustomer.fullName}</h3>
                    <p className="customer-email">{selectedCustomer.email}</p>
                    {selectedCustomer.phone && <p className="customer-phone">{selectedCustomer.phone}</p>}
                    <p className="join-date">Member since: {new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="customer-stats-detailed">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <div className="stat-content">
                      <h4>{selectedCustomer.totalBookings || 0}</h4>
                      <p>Total Bookings</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"/>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                    </div>
                    <div className="stat-content">
                      <h4>NPR {parseInt(selectedCustomer.totalSpent || 0).toLocaleString()}</h4>
                      <p>Total Spent</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    <div className="stat-content">
                      <h4>{selectedCustomer.avgRentalDuration || 0} days</h4>
                      <p>Avg. Rental Duration</p>
                    </div>
                  </div>
                </div>

                {selectedCustomer.recentBookings && selectedCustomer.recentBookings.length > 0 && (
                  <div className="recent-bookings">
                    <h4>Recent Bookings</h4>
                    <div className="bookings-list">
                      {selectedCustomer.recentBookings.slice(0, 5).map(booking => (
                        <div key={booking.id} className="booking-item">
                          <div className="booking-bike">
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
                          <div className="booking-details">
                            <h5>{booking.bike?.name}</h5>
                            <p className="booking-date">
                              {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                            </p>
                            <p className="booking-amount">NPR {parseInt(booking.totalAmount || 0).toLocaleString()}</p>
                          </div>
                          <div className="booking-status">
                            <span className={`status-badge status-${booking.status?.toLowerCase()}`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCustomerModal(false)}>
                Close
              </button>
              {selectedCustomer.email && (
                <button 
                  className="btn-primary"
                  onClick={() => window.location.href = `mailto:${selectedCustomer.email}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Send Email
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;