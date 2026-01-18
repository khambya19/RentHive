import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import DashboardNotifications from '../../components/DashboardNotifications';
import NotificationBell from '../../components/NotificationBell';
import './UserDashboard.css';
import bikeFallback from '../../assets/bike3.jpg';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Browse data
  const [properties, setProperties] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'properties', 'bikes'
  
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

  useEffect(() => {
    fetchData();
  }, []);

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

      // Tenant/Lessor browsing endpoints (NOT vendor-owned routes)
      const [propertiesRes, bikesRes] = await Promise.all([
        // Properties available to rent
        fetch('http://localhost:3001/api/properties/available', { headers }),
        // Bikes available to rent
        fetch('http://localhost:3001/api/bikes/available', { headers }),
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
      const response = await fetch('http://localhost:3001/api/properties/book', {
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
                          src={`http://localhost:3001/uploads/properties/${property.images[0]}`} 
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
                        <img src={`http://localhost:3001${bike.images[0]}`} alt={bike.name} />
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
        return <div className="placeholder">My Applications - Coming Soon</div>;
      case 'rentals':
        return <div className="placeholder">My Current Rentals - Coming Soon</div>;
      case 'payments':
        return <div className="placeholder">Payments - Coming Soon</div>;
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
                src={`http://localhost:3001${user.profilePicture}`} 
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
                      src={`http://localhost:3001${selectedProperty.images[0]}`} 
                      alt={selectedProperty.title}
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
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                    </svg>
                    <div>
                      <strong>Rooms</strong>
                      <p>{selectedProperty.bedrooms} Bedrooms, {selectedProperty.bathrooms} Bathrooms</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedProperty.description && (
                  <div style={{ marginTop: '20px' }}>
                    <h3>Description</h3>
                    <p style={{ color: '#666', lineHeight: '1.6' }}>{selectedProperty.description}</p>
                  </div>
                )}

                {/* Amenities */}
                {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h3>Amenities</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                      {selectedProperty.amenities.map((amenity, index) => (
                        <span key={index} style={{ 
                          padding: '6px 12px', 
                          background: '#f0f0f0', 
                          borderRadius: '20px',
                          fontSize: '14px'
                        }}>
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price */}
                <div style={{ 
                  marginTop: '20px', 
                  padding: '20px', 
                  background: '#f8f9fa', 
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Monthly Rent</p>
                    <h2 style={{ margin: '5px 0 0 0', color: '#2563eb' }}>
                      NPR {selectedProperty.rentPrice?.toLocaleString('en-NP')}
                    </h2>
                  </div>
                  {selectedProperty.securityDeposit && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Security Deposit</p>
                      <p style={{ margin: '5px 0 0 0', fontWeight: 'bold' }}>
                        NPR {selectedProperty.securityDeposit?.toLocaleString('en-NP')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Booking Form */}
                <div style={{ marginTop: '30px', padding: '20px', border: '2px solid #e5e7eb', borderRadius: '8px' }}>
                  <h3 style={{ marginTop: 0 }}>Book This Property</h3>
                  <form onSubmit={handleBookProperty}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>
                          Move-In Date <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          value={bookingForm.moveInDate}
                          onChange={(e) => setBookingForm({ ...bookingForm, moveInDate: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>
                          Move-Out Date (Optional)
                        </label>
                        <input
                          type="date"
                          min={bookingForm.moveInDate || new Date().toISOString().split('T')[0]}
                          value={bookingForm.moveOutDate}
                          onChange={(e) => setBookingForm({ ...bookingForm, moveOutDate: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>
                        Message to Owner (Optional)
                      </label>
                      <textarea
                        rows="3"
                        placeholder="Tell the owner about yourself, your rental needs, or ask any questions..."
                        value={bookingForm.message}
                        onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setShowPropertyModal(false)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          background: 'white',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={bookingLoading}
                        style={{
                          flex: 2,
                          padding: '12px',
                          border: 'none',
                          background: bookingLoading ? '#9ca3af' : '#2563eb',
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: bookingLoading ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {bookingLoading ? 'Submitting...' : 'Submit Booking Request'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
