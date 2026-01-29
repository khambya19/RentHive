import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './components/Overview';
import Browse from './components/Browse';
import Applications from './components/Applications';
import Rentals from './components/Rentals';
import Payments from './components/Payments';
import Settings from '../Settings/Settings';
import Saved from './components/Saved';
import Report from './components/Report';
import PropertyModal from './components/PropertyModal';
import './UserDashboard.css';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [modalProperty, setModalProperty] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handler for opening property modal from Browse
  const handleViewProperty = (property) => {
    setSelectedProperty(property);
    setShowPropertyModal(true);
    setBookingForm({
      moveInDate: '',
      moveOutDate: '',
      message: ''
    });
  };

  const handleBookProperty = async (e) => {
    e.preventDefault();
    setBookingLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/properties/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          moveInDate: bookingForm.moveInDate,
          moveOutDate: bookingForm.moveOutDate,
          message: bookingForm.message
        })
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess('Booking Submitted!', 'Your booking request has been sent to the property owner. They will review it soon.');
        setShowPropertyModal(false);
        setSelectedProperty(null);
        
        // Refresh applications to show the new pending booking
        await fetchMyApplications();
        
        // Automatically switch to applications tab to show the pending request
        setActiveTab('applications');
      } else {
        showError('Booking Failed', data.error || 'Failed to submit booking request');
      }
    } catch (error) {
      console.error('Error booking property:', error);
      showError('Error', 'Failed to submit booking request');
    } finally {
      setBookingLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="tenant-overview">
      <div className="welcome-section">
        <h1>Welcome back, {user?.fullName || 'Tenant'}!</h1>
        <p>Find your perfect rental property or bike</p>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
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
            <h3>{myRentals.length}</h3>
            <p>Active Rentals</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{savedListings.length}</h3>
            <p>Saved Favorites</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{myApplications.length}</h3>
            <p>Applications</p>
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
            <h3>{upcomingPayments.length}</h3>
            <p>Upcoming Payments</p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <h2>What are you looking for?</h2>
        <div className="search-cards">
          <div className="search-card" onClick={() => setActiveTab('browse')}>
            <div className="search-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h3>Browse Properties</h3>
            <p>{properties.length} available properties</p>
            <button className="btn-primary">Search Properties →</button>
          </div>

          <div className="search-card" onClick={() => setActiveTab('browse')}>
            <div className="search-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
            <h3>Find Bikes & Vehicles</h3>
            <p>{bikes.length} available bikes</p>
            <button className="btn-primary">Find Bikes →</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBrowse = () => (
    <div className="browse-section">
      <div className="browse-header">
        <h2>Browse Available Rentals</h2>
        <div className="browse-controls">
          <input
            type="text"
            className="search-input"
            placeholder="Search by title, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Listings</option>
            <option value="properties">Properties Only</option>
            <option value="bikes">Bikes Only</option>
          </select>
        </div>
      </div>

      {/* Filter Toggle Button */}
      <button 
        className="btn-toggle-filters" 
        onClick={() => setShowFilters(!showFilters)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="6" x2="20" y2="6"/>
          <line x1="4" y1="12" x2="20" y2="12"/>
          <line x1="4" y1="18" x2="20" y2="18"/>
          <circle cx="9" cy="6" r="2" fill="currentColor"/>
          <circle cx="15" cy="12" r="2" fill="currentColor"/>
          <circle cx="12" cy="18" r="2" fill="currentColor"/>
        </svg>
        {showFilters ? 'Hide Filters' : 'Show Filters'}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          style={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Advanced Filters */}
      {showFilters && (
      <div className="advanced-filters">
        <div className="filters-row">
          {/* Price Range */}
          <div className="filter-group">
            <label>Price Range (NPR)</label>
            <div className="price-range">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                className="filter-input small"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                className="filter-input small"
              />
            </div>
          </div>

          {/* Property Type (when showing properties) */}
          {filterType !== 'bikes' && (
            <>
              <div className="filter-group">
                <label>Property Type</label>
                <select
                  value={filters.propertyType}
                  onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
                  className="filter-select"
                >
                  <option value="all">All Types</option>
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Villa">Villa</option>
                  <option value="Studio">Studio</option>
                  <option value="Condo">Condo</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Bedrooms</label>
                <select
                  value={filters.bedrooms}
                  onChange={(e) => setFilters({...filters, bedrooms: e.target.value})}
                  className="filter-select"
                >
                  <option value="">Any</option>
                  <option value="1">1 BR</option>
                  <option value="2">2 BR</option>
                  <option value="3">3 BR</option>
                  <option value="4">4+ BR</option>
                </select>
              </div>

              <div className="filter-group">
                <label>City/Location</label>
                <input
                  type="text"
                  placeholder="e.g., Parbat"
                  value={filters.city}
                  onChange={(e) => setFilters({...filters, city: e.target.value})}
                  className="filter-input"
                />
              </div>
            </>
          )}

          {/* Bike Type (when showing bikes) */}
          {filterType !== 'properties' && (
            <>
              <div className="filter-group">
                <label>Bike Type</label>
                <select
                  value={filters.bikeType}
                  onChange={(e) => setFilters({...filters, bikeType: e.target.value})}
                  className="filter-select"
                >
                  <option value="all">All Types</option>
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="Scooter">Scooter</option>
                  <option value="Sports Bike">Sports Bike</option>
                  <option value="Cruiser">Cruiser</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Fuel Type</label>
                <select
                  value={filters.fuelType}
                  onChange={(e) => setFilters({...filters, fuelType: e.target.value})}
                  className="filter-select"
                >
                  <option value="all">All</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Electric">Electric</option>
                  <option value="Diesel">Diesel</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="e.g., Pokhara"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  className="filter-input"
                />
              </div>
            </>
          )}

          {/* Sort By - Common for both */}
          <div className="filter-group">
            <label>Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              className="filter-select"
            >
              <option value="createdAt">Latest First</option>
              <option value={filterType === 'bikes' ? 'dailyRate' : 'rentPrice'}>Price</option>
              {filterType !== 'bikes' && <option value="area">Area</option>}
              {filterType !== 'bikes' && <option value="bedrooms">Bedrooms</option>}
              {filterType === 'bikes' && <option value="year">Year</option>}
              {filterType === 'bikes' && <option value="rating">Rating</option>}
            </select>
          </div>

          {/* Sort Order */}
          <div className="filter-group">
            <label>Order</label>
            <select
              value={filters.sortOrder}
              onChange={(e) => setFilters({...filters, sortOrder: e.target.value})}
              className="filter-select"
            >
              <option value="DESC">High to Low</option>
              <option value="ASC">Low to High</option>
            </select>
          </div>

          {/* Reset Button */}
          <div className="filter-group">
            <label>&nbsp;</label>
            <button
              onClick={() => {
                setFilters({
                  propertyType: 'all',
                  city: '',
                  minPrice: '',
                  maxPrice: '',
                  bedrooms: '',
                  bathrooms: '',
                  amenities: [],
                  bikeType: 'all',
                  location: '',
                  fuelType: 'all',
                  minEngine: '',
                  maxEngine: '',
                  features: [],
                  sortBy: 'createdAt',
                  sortOrder: 'DESC'
                });
                setSearchQuery('');
              }}
              className="btn-reset"
              style={{
                padding: '8px 16px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              🔄 Reset Filters
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Properties */}
      {(filterType === 'all' || filterType === 'properties') && (
        <div className="listings-section">
          <h3>Available Properties</h3>
          {properties.filter(p => 
            p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.address?.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <h3>No properties found</h3>
              <p>Try adjusting your search or check back later for new listings</p>
            </div>
          ) : (
            <div className="listings-grid">
              {properties
                .filter(p => 
                  p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.address?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(property => (
                  <div key={property.id} className="listing-card">
                    <div className="listing-image">
                      {property.images && property.images.length > 0 ? (
                        <img 
                          src={`${SERVER_BASE_URL}/uploads/properties/${property.images[0]}`} 
                          alt={property.title}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="no-image-placeholder">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                          <span>No Image</span>
                        </div>
                      )}
                      <div className="listing-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        </svg>
                        {property.propertyType}
                      </div>
                    </div>
                    <div className="listing-content">
                      <h4>{property.title}</h4>
                      <p className="listing-location">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {property.address}, {property.city}
                      </p>
                      <div className="listing-details">
                        <div className="detail-item">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                          </svg>
                          <span>{property.bedrooms} Bed{property.bedrooms > 1 ? 's' : ''}</span>
                        </div>
                        <div className="detail-item">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 2v4m6-4v4m-6.75 3h7.5M5 10h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z"/>
                          </svg>
                          <span>{property.bathrooms} Bath{property.bathrooms > 1 ? 's' : ''}</span>
                        </div>
                        <div className="detail-item">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          </svg>
                          <span>{property.area > 0 ? property.area : 'N/A'} sq.ft</span>
                        </div>
                      </div>
                      <div className="listing-footer">
                        <div className="price-section">
                          <span className="price-label">Monthly Rent</span>
                          <p className="listing-price">NPR {property.rentPrice ? Number(property.rentPrice).toLocaleString('en-NP') : 'N/A'}</p>
                        </div>
                        <button className="btn-view-details" onClick={() => handleViewProperty(property)}>
                          View Details
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                            <polyline points="12 5 19 12 12 19"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Bikes */}
      {(filterType === 'all' || filterType === 'bikes') && (
        <div className="listings-section">
          <h3>Available Bikes & Vehicles</h3>
          {bikes.filter(b => 
            b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.brand?.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              <h3>No bikes found</h3>
              <p>Try adjusting your search or check back later for new vehicles</p>
            </div>
          ) : (
            <div className="listings-grid">
              {bikes
                .filter(b => 
                  b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  b.brand?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(bike => (
                  <div key={bike.id} className="listing-card">
                    <div className="listing-image">
                      {bike.images && bike.images.length > 0 ? (
                        <img src={`${SERVER_BASE_URL}${bike.images[0]}`} alt={bike.name} />
                      ) : (
                        <img src={bikeFallback} alt={bike.name} />
                      )}
                    </div>
                    <div className="listing-content">
                      <h4>{bike.name}</h4>
                      <p className="listing-location">{bike.brand} {bike.model} ({bike.year})</p>
                      <div className="listing-details">
                        <span>{bike.type}</span>
                        <span>{bike.engineCapacity || 'N/A'}</span>
                      </div>
                      <div className="listing-footer">
                        <p className="listing-price">NPR {bike.dailyRate?.toLocaleString('en-NP') || 'N/A'}/day</p>
                        <button className="btn-primary">View Details</button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderApplications = () => {
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const getStatusClass = (status) => {
      switch (status?.toLowerCase()) {
        case 'pending':
          return 'status-pending';
        case 'approved':
        case 'active':
          return 'status-approved';
        case 'rejected':
          return 'status-rejected';
        case 'cancelled':
          return 'status-cancelled';
        default:
          return 'status-pending';
      }
    };

    if (myApplications.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <h3>No Applications Yet</h3>
          <p>You haven't submitted any property rental applications. Start browsing properties to find your perfect home!</p>
          <button className="btn-primary" onClick={() => setActiveTab('browse')} style={{ marginTop: '20px' }}>
            Browse Properties
          </button>
        </div>
      );
    }

    return (
      <div className="applications-section">
        <div className="applications-header">
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-number">{myApplications.filter(app => app.status?.toLowerCase() === 'pending').length}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{myApplications.filter(app => app.status?.toLowerCase() === 'approved').length}</span>
              <span className="stat-label">Approved</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{myApplications.filter(app => app.status?.toLowerCase() === 'rejected').length}</span>
              <span className="stat-label">Rejected</span>
            </div>
          </div>
        </div>

        <div className="applications-grid">
          {myApplications.map((application) => (
            <div key={application.id} className="application-card">
              <div className="application-header">
                <div className={`application-status ${getStatusClass(application.status)}`}>
                  {application.status?.toUpperCase() || 'PENDING'}
                </div>
                <span className="application-date">Applied {formatDate(application.createdAt)}</span>
              </div>

              <div className="application-content">
                <div className="application-image">
                  {application.property?.images && application.property.images.length > 0 ? (
                    <img 
                      src={`http://localhost:3001/uploads/properties/${application.property.images[0]}`} 
                      alt={application.property.title}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150x150?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="no-image-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </div>
                  )}
                </div>

                <div className="application-details">
                  <h3>{application.property?.title || 'Property'}</h3>
                  <p className="application-location">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {application.property?.address}, {application.property?.city}
                  </p>

                  <div className="application-info-grid">
                    <div className="info-item">
                      <span className="info-label">Property Type</span>
                      <span className="info-value">{application.property?.propertyType || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Move-In Date</span>
                      <span className="info-value">{formatDate(application.moveInDate)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Monthly Rent</span>
                      <span className="info-value rent-amount">NPR {Number(application.monthlyRent).toLocaleString('en-NP')}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Owner</span>
                      <span className="info-value">{application.vendor?.fullName || 'N/A'}</span>
                    </div>
                  </div>

                  {application.message && (
                    <div className="application-message">
                      <strong>Your Message:</strong>
                      <p>"{application.message}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="application-footer">
                {application.status?.toLowerCase() === 'pending' && (
                  <div className="pending-notice">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>Waiting for owner's response</span>
                  </div>
                )}
                {application.status?.toLowerCase() === 'approved' && (
                  <div className="approved-notice">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Congratulations! Your application has been approved. The owner will contact you soon.</span>
                  </div>
                )}
                {application.status?.toLowerCase() === 'rejected' && (
                  <div className="rejected-notice">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <span>Unfortunately, this application was declined. Keep looking for other properties!</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRentals = () => {
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    if (myRentals.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h3>No Active Rentals</h3>
          <p>You don't have any active rentals at the moment. Browse properties and submit applications to get started!</p>
          <button className="btn-primary" onClick={() => setActiveTab('browse')} style={{ marginTop: '20px' }}>
            Browse Properties
          </button>
        </div>
      );
    }

    return (
      <div className="rentals-section">
        <div className="rentals-header">
          <h2>Your Active Rentals</h2>
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-number">{myRentals.length}</span>
              <span className="stat-label">Active Rental{myRentals.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className="rentals-grid">
          {myRentals.map((rental) => (
            <div key={rental.id} className="rental-card">
              <div className="rental-header">
                <div className="rental-status status-approved">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  ACTIVE RENTAL
                </div>
                <span className="rental-date">Since {formatDate(rental.moveInDate)}</span>
              </div>

              <div className="rental-content">
                <div className="rental-image">
                  {rental.property?.images && rental.property.images.length > 0 ? (
                    <img 
                      src={`http://localhost:3001/uploads/properties/${rental.property.images[0]}`} 
                      alt={rental.property.title}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150x150?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="no-image-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </div>
                  )}
                </div>

                <div className="rental-details">
                  <h3>{rental.property?.title || 'Property'}</h3>
                  <p className="rental-location">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {rental.property?.address}, {rental.property?.city}
                  </p>

                  <div className="rental-info-grid">
                    <div className="info-item">
                      <span className="info-label">Property Type</span>
                      <span className="info-value">{rental.property?.propertyType || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Move-In Date</span>
                      <span className="info-value">{formatDate(rental.moveInDate)}</span>
                    </div>
                    {rental.moveOutDate && (
                      <div className="info-item">
                        <span className="info-label">Move-Out Date</span>
                        <span className="info-value">{formatDate(rental.moveOutDate)}</span>
                      </div>
                    )}
                    <div className="info-item">
                      <span className="info-label">Monthly Rent</span>
                      <span className="info-value rent-amount">NPR {Number(rental.monthlyRent).toLocaleString('en-NP')}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Bedrooms</span>
                      <span className="info-value">{rental.property?.bedrooms || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Bathrooms</span>
                      <span className="info-value">{rental.property?.bathrooms || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="rental-owner-info">
                    <h4>Property Owner</h4>
                    <div className="owner-details">
                      <div className="owner-avatar">
                        {rental.vendor?.fullName?.[0]?.toUpperCase() || 'O'}
                      </div>
                      <div>
                        <p className="owner-name">{rental.vendor?.fullName || 'N/A'}</p>
                        <p className="owner-contact">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                          {rental.vendor?.phone || 'N/A'}
                        </p>
                        <p className="owner-contact">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                          {rental.vendor?.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rental-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setActiveTab('payments')}
                  style={{ flex: 1 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  View Payments
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => setActiveTab('maintenance')}
                  style={{ flex: 1 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                  Request Maintenance
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <div className="loading">Loading...</div>;
    }

    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'browse':
        return renderBrowse();
      case 'saved':
        return <div className="placeholder">Saved Favorites - Coming Soon</div>;
      case 'applications':
        return renderApplications();
      case 'rentals':
        return renderRentals();
      case 'payments':
        return <PaymentManagement />;
      case 'maintenance':
        return <div className="placeholder">Maintenance Requests - Coming Soon</div>;
      case 'messages':
        return <div className="placeholder">Messages - Coming Soon</div>;
      case 'settings':
        return <Settings />;
      default:
        return renderOverview();
      
      case 'ratings':
        return <RatingPage />;
    }
  };

  // If user context is missing, show something explicit instead of a seemingly blank UI.
  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Not logged in</h2>
        <p>Please login to view your dashboard.</p>
        <button onClick={() => navigate('/login')}>Go to login</button>
      </div>
    );
  }

  return (
    <div className="user-dashboard flex h-screen min-h-screen bg-white" style={{ background: 'white' }}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setMobileMenuOpen(false);
        }} 
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      <main className="main-content flex-1 flex flex-col h-screen min-h-screen overflow-x-hidden relative z-10">
          <Header
          activeTab={activeTab} 
          setMobileMenuOpen={setMobileMenuOpen}
        />
          <div className="content-area flex-1 overflow-y-auto bg-white min-h-screen w-full px-0 sm:px-0 md:px-0">
          {activeTab === 'overview' && <Overview fullWidth setActiveTab={setActiveTab} />}
          {activeTab === 'browse' && <Browse onViewProperty={handleViewProperty} />}
          {activeTab === 'applications' && <Applications />}
          {activeTab === 'saved' && <Saved />}
          {activeTab === 'report' && <Report />}
          {activeTab === 'rentals' && <Rentals />}
          {activeTab === 'payments' && <Payments />}
          {activeTab === 'settings' && <Settings />}
        </div>
        {modalProperty && (
          <PropertyModal property={modalProperty} onClose={handleCloseModal} />
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
