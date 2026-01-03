import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import './BikeRental.css';
import bikeFallback from '../../assets/bike3.jpg';

const BikeRental = ({ showSuccess, showError }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBike, setSelectedBike] = useState(null);
  const [newBikeNotifications, setNewBikeNotifications] = useState([]);
  const [bookingForm, setBookingForm] = useState({
    startDate: '',
    endDate: '',
    message: '',
  });

  useEffect(() => {
    fetchAvailableBikes();
  }, []);

  // Listen for real-time notifications about new bikes
  useEffect(() => {
    if (socket && socket.connected) {
      const handleNewNotification = (notification) => {
        if (notification.type === 'bike_available') {
          // Show notification for new bike availability
          showSuccess(
            notification.title,
            notification.message
          );
          
          // Add to new bike notifications list (show as badge)
          setNewBikeNotifications(prev => [
            ...prev,
            {
              id: notification.id || Date.now(),
              title: notification.title,
              message: notification.message,
              timestamp: new Date()
            }
          ]);
          
          // Refresh bikes list to show the new bike
          fetchAvailableBikes();
        }
      };

      socket.on('new-notification', handleNewNotification);

      return () => {
        socket.off('new-notification', handleNewNotification);
      };
    }
  }, [socket, showSuccess]);

  const fetchAvailableBikes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/bikes/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBikes(data);
      } else {
        console.error('Failed to fetch bikes');
      }
    } catch (error) {
      console.error('Error fetching bikes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookBike = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Calculate total days and amount
      const start = new Date(bookingForm.startDate);
      const end = new Date(bookingForm.endDate);
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      const response = await fetch('http://localhost:3001/api/bikes/book-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bikeId: selectedBike.id,
          vendorId: selectedBike.vendorId,
          startDate: bookingForm.startDate,
          endDate: bookingForm.endDate,
          message: bookingForm.message,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Show success notification for confirmed booking
        showSuccess(
          'Bike Booked Successfully!',
          `${selectedBike.brand} ${selectedBike.model} has been booked from ${new Date(bookingForm.startDate).toLocaleDateString()} to ${new Date(bookingForm.endDate).toLocaleDateString()}. Total: NPR ${result.totalAmount?.toLocaleString()}`
        );
        
        setShowBookingModal(false);
        setSelectedBike(null);
        resetBookingForm();
        fetchAvailableBikes(); // Refresh list to show updated availability
      } else {
        const error = await response.json();
        
        showError(
          'Booking Failed',
          error.error || 'Failed to book the bike. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error booking bike:', error);
      
      showError(
        'Booking Failed',
        'An unexpected error occurred while booking the bike. Please try again.'
      );
    }
  };

  const resetBookingForm = () => {
    setBookingForm({ startDate: '', endDate: '', message: '' });
  };

  const filteredBikes = bikes.filter(bike => {
    const matchesSearch = bike.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bike.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || bike.type === filterType;
    return matchesSearch && matchesType;
  });

  // Calculate total cost for booking modal
  const calculateTotalCost = () => {
    if (!bookingForm.startDate || !bookingForm.endDate || !selectedBike) return 0;
    
    const start = new Date(bookingForm.startDate);
    const end = new Date(bookingForm.endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (totalDays <= 0) return 0;
    
    if (totalDays >= 30 && selectedBike.monthlyRate) {
      return selectedBike.monthlyRate * Math.ceil(totalDays / 30);
    } else if (totalDays >= 7) {
      return selectedBike.weeklyRate * Math.ceil(totalDays / 7);
    } else {
      return selectedBike.dailyRate * totalDays;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading available bikes...</p>
      </div>
    );
  }

  return (
    <div className="bike-rental">
      <div className="section-header">
        <div>
          <h2>🏍️ Rent Bikes</h2>
          <p>Find and rent bikes from local vendors in your area</p>
        </div>
      </div>

      <div className="search-filters">
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search bikes by brand, model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select 
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="Mountain">Mountain</option>
          <option value="Road">Road</option>
          <option value="Electric">Electric</option>
          <option value="Hybrid">Hybrid</option>
          <option value="BMX">BMX</option>
          <option value="Cruiser">Cruiser</option>
        </select>
      </div>

      {filteredBikes.length > 0 && (
        <div className="bikes-stats-bar">
          <span className="stats-text">
            Showing <strong>{filteredBikes.length}</strong> of <strong>{bikes.length}</strong> available bikes
          </span>
        </div>
      )}

      <div className="bikes-grid">
        {filteredBikes.length > 0 ? filteredBikes.map(bike => (
          <div key={bike.id} className="bike-card">
            <div className="bike-image">
              <img 
                src={bike.images && bike.images.length > 0 
                  ? `http://localhost:3001/uploads/bikes/${bike.images[0]}` 
                  : bikeFallback}
                alt={`${bike.brand} ${bike.model}`}
                onError={(e) => {
                  e.currentTarget.src = bikeFallback;
                }}
              />
              <span className="bike-type-badge">{bike.type}</span>
              {bike.rating > 0 && (
                <div className="rating-badge">
                  ⭐ {bike.rating.toFixed(1)} ({bike.ratingCount})
                </div>
              )}
            </div>
            
            <div className="bike-content">
              <h3>{bike.brand} {bike.model}</h3>
              <p className="bike-vendor">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                By: {bike.vendorName || 'Vendor'}
              </p>
              
              <div className="bike-specs">
                <div className="spec-item">
                  <span className="spec-label">Year:</span>
                  <span>{bike.year}</span>
                </div>
                {bike.engineCapacity && (
                  <div className="spec-item">
                    <span className="spec-label">Engine:</span>
                    <span>{bike.engineCapacity}cc</span>
                  </div>
                )}
                <div className="spec-item">
                  <span className="spec-label">Fuel:</span>
                  <span>{bike.fuelType}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Location:</span>
                  <span>{bike.location}</span>
                </div>
              </div>

              <div className="bike-pricing">
                <div className="price-item">
                  <span className="price-label">Daily Rate</span>
                  <span className="price-value">NPR {parseInt(bike.dailyRate).toLocaleString()}</span>
                </div>
                <div className="price-item">
                  <span className="price-label">Weekly Rate</span>
                  <span className="price-value">NPR {parseInt(bike.weeklyRate).toLocaleString()}</span>
                </div>
                {bike.monthlyRate && (
                  <div className="price-item">
                    <span className="price-label">Monthly Rate</span>
                    <span className="price-value">NPR {parseInt(bike.monthlyRate).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="bike-features">
                {bike.features && bike.features.slice(0, 3).map((feature, index) => (
                  <span key={index} className="feature-tag">{feature}</span>
                ))}
                {(!bike.features || bike.features.length === 0) && (
                  <span className="feature-tag">Standard Features</span>
                )}
              </div>

              <div className="bike-requirements">
                {bike.licenseRequired && (
                  <div className="requirement-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    License Required
                  </div>
                )}
                <div className="requirement-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Min Age: {bike.minimumAge}
                </div>
              </div>

              <button 
                className="btn-rent"
                onClick={() => {
                  setSelectedBike(bike);
                  setShowBookingModal(true);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Rent Now
              </button>
            </div>
          </div>
        )) : (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '64px', height: '64px'}}>
              <circle cx="12" cy="12" r="10"/>
              <path d="m4.93 4.93 4.24 4.24"/>
              <path d="m14.83 9.17 4.24-4.24"/>
              <path d="m14.83 14.83 4.24 4.24"/>
              <path d="m9.17 14.83-4.24 4.24"/>
            </svg>
            <h3>No bikes available</h3>
            <p>
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'No bikes are currently available for rent. Check back later!'}
            </p>
          </div>
        )}
      </div>

      {/* Bike Booking Modal */}
      {showBookingModal && selectedBike && (
        <div className="modal-backdrop" onClick={() => { setShowBookingModal(false); setSelectedBike(null); resetBookingForm(); }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏍️ Rent {selectedBike.brand} {selectedBike.model}</h2>
              <button className="modal-close" onClick={() => { setShowBookingModal(false); setSelectedBike(null); resetBookingForm(); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleBookBike} className="modal-body">
              <div className="selected-bike-info">
                <img 
                  src={selectedBike.images && selectedBike.images.length > 0 
                    ? `http://localhost:3001/uploads/bikes/${selectedBike.images[0]}` 
                    : bikeFallback}
                  alt={`${selectedBike.brand} ${selectedBike.model}`}
                  onError={(e) => {
                    e.currentTarget.src = bikeFallback;
                  }}
                />
                <div>
                  <h3>{selectedBike.brand} {selectedBike.model}</h3>
                  <p>{selectedBike.type} • {selectedBike.year} • {selectedBike.fuelType}</p>
                  <p className="vendor-info">📍 {selectedBike.location} | 🏪 {selectedBike.vendorName}</p>
                  <div className="pricing-summary">
                    <span>NPR {parseInt(selectedBike.dailyRate).toLocaleString()}/day • NPR {parseInt(selectedBike.weeklyRate).toLocaleString()}/week</span>
                    {selectedBike.monthlyRate && <span> • NPR {parseInt(selectedBike.monthlyRate).toLocaleString()}/month</span>}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={bookingForm.startDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={bookingForm.endDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, endDate: e.target.value })}
                    min={bookingForm.startDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              {bookingForm.startDate && bookingForm.endDate && (
                <div className="cost-breakdown">
                  <h4>Cost Breakdown</h4>
                  <div className="cost-item">
                    <span>Duration:</span>
                    <span>{Math.ceil((new Date(bookingForm.endDate) - new Date(bookingForm.startDate)) / (1000 * 60 * 60 * 24))} days</span>
                  </div>
                  <div className="cost-item">
                    <span>Total Amount:</span>
                    <span className="cost-total">NPR {calculateTotalCost().toLocaleString()}</span>
                  </div>
                  <div className="cost-item">
                    <span>Security Deposit:</span>
                    <span>NPR {parseInt(selectedBike.securityDeposit).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-field full-width">
                  <label>Message to Vendor</label>
                  <textarea
                    rows="3"
                    value={bookingForm.message}
                    onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                    placeholder="Any special requests, pickup preferences, or questions for the vendor..."
                  />
                </div>
              </div>

              <div className="booking-terms">
                <h4>📋 Important Terms:</h4>
                <ul>
                  <li>Valid driving license required (minimum age: {selectedBike.minimumAge})</li>
                  <li>Security deposit of NPR {parseInt(selectedBike.securityDeposit).toLocaleString()} required</li>
                  <li>Fuel costs are separate and borne by the renter</li>
                  <li>Follow all traffic rules and return vehicle on time</li>
                  <li>Any damages will be deducted from security deposit</li>
                </ul>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => { setShowBookingModal(false); setSelectedBike(null); resetBookingForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Book Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BikeRental;