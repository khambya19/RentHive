import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import DashboardNotifications from '../../components/DashboardNotifications';
import NotificationBell from '../../components/NotificationBell';
import PaymentManagement from '../../components/PaymentManagement';
import './UserDashboard.css';
import bikeFallback from '../../assets/bike3.jpg';
import API_BASE_URL, { SERVER_BASE_URL } from '../../config/api';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Browse data
  const [properties, setProperties] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'properties', 'bikes'
  
  // Advanced filters
  const [filters, setFilters] = useState({
    // Property filters
    propertyType: 'all',
    city: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    amenities: [],
    
    // Bike filters
    bikeType: 'all',
    location: '',
    fuelType: 'all',
    minEngine: '',
    maxEngine: '',
    features: [],
    
    // Common filters
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  });
  
  // User's rental data
  const [myApplications, setMyApplications] = useState([]);
  const [myRentals, setMyRentals] = useState([]);
  const [savedListings, setSavedListings] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);

  // Property details and booking modal state
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    moveInDate: '',
    moveOutDate: '',
    message: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  // Handle tab from URL query parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
    fetchMyApplications();
  }, [filters, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Auth required', 'Please login first');
        navigate('/login');
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };

      // Build query parameters for properties
      const propertyParams = new URLSearchParams();
      if (searchQuery) propertyParams.append('search', searchQuery);
      if (filters.propertyType !== 'all') propertyParams.append('type', filters.propertyType);
      if (filters.city) propertyParams.append('city', filters.city);
      if (filters.minPrice) propertyParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) propertyParams.append('maxPrice', filters.maxPrice);
      if (filters.bedrooms) propertyParams.append('bedrooms', filters.bedrooms);
      if (filters.bathrooms) propertyParams.append('bathrooms', filters.bathrooms);
      if (filters.amenities.length > 0) propertyParams.append('amenities', filters.amenities.join(','));
      propertyParams.append('sortBy', filters.sortBy);
      propertyParams.append('sortOrder', filters.sortOrder);

      // Build query parameters for bikes
      const bikeParams = new URLSearchParams();
      if (searchQuery) bikeParams.append('search', searchQuery);
      if (filters.bikeType !== 'all') bikeParams.append('type', filters.bikeType);
      if (filters.location) bikeParams.append('location', filters.location);
      if (filters.fuelType !== 'all') bikeParams.append('fuelType', filters.fuelType);
      if (filters.minPrice) bikeParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) bikeParams.append('maxPrice', filters.maxPrice);
      if (filters.minEngine) bikeParams.append('minEngine', filters.minEngine);
      if (filters.maxEngine) bikeParams.append('maxEngine', filters.maxEngine);
      if (filters.features.length > 0) bikeParams.append('features', filters.features.join(','));
      bikeParams.append('sortBy', filters.sortBy);
      bikeParams.append('sortOrder', filters.sortOrder);

      // Tenant/Lessor browsing endpoints (NOT vendor-owned routes)
      const [propertiesRes, bikesRes] = await Promise.all([
        // Properties available to rent
        fetch(`${API_BASE_URL}/properties/available?${propertyParams}`, { headers }),
        // Bikes available to rent
        fetch(`${API_BASE_URL}/bikes/available?${bikeParams}`, { headers }),
      ]);

      // If backend rejects the token, force re-auth.
      if ([401, 403].includes(propertiesRes.status) || [401, 403].includes(bikesRes.status)) {
        showError('Session expired', 'Please login again');
        logout();
        navigate('/login');
        return;
      }

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json();
        console.log('Properties data:', propertiesData);
        // API shape may differ; normalize to an array.
        const list = Array.isArray(propertiesData) ? propertiesData : (propertiesData?.data || propertiesData?.properties || []);
        setProperties(list);
      } else {
        const errorText = await propertiesRes.text();
        console.error('Failed to load properties:', propertiesRes.status, errorText);
        showError('Error', `Failed to load properties: ${propertiesRes.status}`);
      }

      if (bikesRes.ok) {
        const bikesData = await bikesRes.json();
        const list = Array.isArray(bikesData) ? bikesData : (bikesData?.data || bikesData?.bikes || []);
        setBikes(list);
      } else {
        console.warn('Failed to load bikes:', bikesRes.status);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Error', 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/users/my-applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Applications data:', data);
        const allApplications = data.applications || [];
        setMyApplications(allApplications);
        
        // Filter approved/active bookings for "My Current Rentals"
        const activeRentals = allApplications.filter(app => 
          app.status?.toLowerCase() === 'approved' || app.status?.toLowerCase() === 'active'
        );
        setMyRentals(activeRentals);
      } else {
        console.error('Failed to fetch applications:', response.status);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

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
                      src={`${SERVER_BASE_URL}/uploads/properties/${application.property.images[0]}`} 
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
                      src={`${SERVER_BASE_URL}/uploads/properties/${rental.property.images[0]}`} 
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
        return <div className="placeholder">Settings - Coming Soon</div>;
      default:
        return renderOverview();
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
    <div className="tenant-dashboard">
      {/* Dashboard Notifications */}
      <DashboardNotifications 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon-wrapper">
              <svg className="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            {!sidebarCollapsed && <span className="brand-name">RentHive</span>}
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarCollapsed ? (
                <path d="M9 18l6-6-6-6"/>
              ) : (
                <path d="M15 18l-6-6 6-6"/>
              )}
            </svg>
          </button>
        </div>

        {/* User Profile in Sidebar */}
        <div className="user-profile">
          <div className="user-avatar">
            {user?.profilePicture ? (
              <img 
                src={`${SERVER_BASE_URL}${user.profilePicture}`} 
                alt={user.fullName} 
              />
            ) : (
              user?.fullName?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <p className="user-name">{user?.fullName || 'User'}</p>
              <p className="user-role">Tenant</p>
            </div>
          )}
        </div>

        <nav className="sidebar-menu">
          <button
            className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            {!sidebarCollapsed && <span>Overview</span>}
          </button>

          <button
            className={`menu-item ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            {!sidebarCollapsed && <span>Browse / Search</span>}
          </button>

          <button
            className={`menu-item ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {!sidebarCollapsed && <span>Saved / Favorites</span>}
          </button>

          <button
            className={`menu-item ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            {!sidebarCollapsed && <span>My Applications</span>}
          </button>

          <button
            className={`menu-item ${activeTab === 'rentals' ? 'active' : ''}`}
            onClick={() => setActiveTab('rentals')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            {!sidebarCollapsed && <span>My Current Rentals</span>}
          </button>

          <button
            className={`menu-item ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            {!sidebarCollapsed && <span>Payments</span>}
          </button>

          <button
            className={`menu-item ${activeTab === 'maintenance' ? 'active' : ''}`}
            onClick={() => setActiveTab('maintenance')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            {!sidebarCollapsed && <span>Maintenance Requests</span>}
          </button>

          <button
            className={`menu-item ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {!sidebarCollapsed && <span>Messages</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button" onClick={() => { logout(); navigate('/login'); }}>
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="content-header">
          <div className="header-left">
            <h1>
              {activeTab === 'overview' && 'Dashboard'}
              {activeTab === 'browse' && 'Browse Listings'}
              {activeTab === 'saved' && 'Saved Favorites'}
              {activeTab === 'applications' && 'My Applications'}
              {activeTab === 'rentals' && 'My Current Rentals'}
              {activeTab === 'payments' && 'Payments'}
              {activeTab === 'maintenance' && 'Maintenance Requests'}
              {activeTab === 'messages' && 'Messages'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
            <p className="header-subtitle">
              {activeTab === 'overview' && 'Welcome back! Find your perfect rental'}
              {activeTab === 'browse' && 'Discover properties and vehicles available for rent'}
              {activeTab === 'saved' && 'View all your saved and favorited listings'}
              {activeTab === 'applications' && 'Track your rental applications'}
              {activeTab === 'rentals' && 'Manage your active rentals'}
              {activeTab === 'payments' && 'View payment history and upcoming dues'}
              {activeTab === 'maintenance' && 'Submit and track maintenance requests'}
              {activeTab === 'messages' && 'Communicate with property owners'}
              {activeTab === 'settings' && 'Manage your account settings'}
            </p>
          </div>
          <div className="header-right">
            <NotificationBell userId={user?.id} />
            <button 
              className="settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m-5.66-15.66l4.24 4.24m0 8.48l-4.24 4.24M1 12h6m6 0h6m-15.66 5.66l4.24-4.24m8.48 0l4.24 4.24"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="content-area">
          {renderContent()}
        </div>

        {/* Settings Modal/Panel */}
        {showSettings && (
          <div className="settings-modal">
            <div className="settings-content">
              <div className="settings-header">
                <h2>Settings</h2>
                <button className="close-btn" onClick={() => setShowSettings(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="settings-body">
                <div className="placeholder">Settings - Coming Soon</div>
              </div>
            </div>
          </div>
        )}

        {/* Property Details & Booking Modal */}
        {showPropertyModal && selectedProperty && (
          <div className="modal-backdrop" onClick={() => setShowPropertyModal(false)}>
            <div className="modal-dialog property-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedProperty.title}</h2>
                <button className="modal-close" onClick={() => setShowPropertyModal(false)}>×</button>
              </div>
              
              <div className="modal-body">
                {/* Property Images */}
                {selectedProperty.images && selectedProperty.images.length > 0 && (
                  <div className="property-images">
                    <img 
                      src={`${SERVER_BASE_URL}${selectedProperty.images[0]}`} 
                      alt={selectedProperty.title}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                      style={{ width: '100%', borderRadius: '8px', marginBottom: '20px' }}
                    />
                  </div>
                )}

                {/* Property Details Grid */}
                <div className="property-details-grid">
                  <div className="detail-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <div>
                      <strong>Location</strong>
                      <p>{selectedProperty.address}, {selectedProperty.city}</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    </svg>
                    <div>
                      <strong>Property Type</strong>
                      <p>{selectedProperty.propertyType}</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                      <rect x="3" y="3" width="18" height="18"/>
                    </svg>
                    <div>
                      <strong>Area</strong>
                      <p>{selectedProperty.area} sq.ft</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                      <rect x="3" y="3" width="18" height="18"/>
                    </svg>
                    <div>
                      <strong>Area</strong>
                      <p>{selectedProperty.area} sq.ft</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                      <path d="M12 2l9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9l9-7z"/>
                    </svg>
                    <div>
                      <strong>Bedrooms</strong>
                      <p>{selectedProperty.bedrooms}</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                    <div>
                      <strong>Bathrooms</strong>
                      <p>{selectedProperty.bathrooms}</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    <div>
                      <strong>Monthly Rent</strong>
                      <p>NPR {selectedProperty.rentPrice?.toLocaleString('en-NP')}</p>
                    </div>
                  </div>
                </div>

                {/* Booking Form */}
                <form onSubmit={handleBookProperty} style={{ marginTop: '30px' }}>
                  <h3>Book This Property</h3>
                  <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Move-In Date</label>
                      <input
                        type="date"
                        required
                        value={bookingForm.moveInDate}
                        onChange={(e) => setBookingForm({ ...bookingForm, moveInDate: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Move-Out Date (Optional)</label>
                      <input
                        type="date"
                        value={bookingForm.moveOutDate}
                        onChange={(e) => setBookingForm({ ...bookingForm, moveOutDate: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Message to Owner</label>
                      <textarea
                        rows="4"
                        placeholder="Tell the owner about yourself and why you're interested..."
                        value={bookingForm.message}
                        onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      disabled={bookingLoading}
                      style={{ padding: '12px', fontSize: '16px' }}
                    >
                      {bookingLoading ? 'Submitting...' : 'Submit Booking Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
