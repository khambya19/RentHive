import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationBell from '../../components/NotificationBell';
import DashboardNotifications from '../../components/DashboardNotifications';
import BikeInventory from './BikeInventory';
import RentalBookings from './RentalBookings';
import CustomerManagement from './CustomerManagement';
import BikeAnalytics from './BikeAnalytics';
import ShopLocationManager from './ShopLocationManager';
import './BikeVendorDashboard.css';
import './ShopLocationManager.css';

const BikeVendorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBikes: 0,
    availableBikes: 0,
    activeRentals: 0,
    monthlyRevenue: 0,
    totalBookings: 0,
    pendingBookings: 0,
  });
  const [bikes, setBikes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  useEffect(() => {
    fetchData();
    if (user?.profileImage) {
      setProfilePicture(user.profileImage);
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Please login first');
        navigate('/login');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      // Fetch bike stats, bikes, and bookings
      const [statsResponse, bikesResponse, bookingsResponse] = await Promise.all([
        fetch('http://localhost:3001/api/bikes/stats', { headers }),
        fetch('http://localhost:3001/api/bikes/vendor', { headers }),
        fetch('http://localhost:3001/api/bikes/vendor/bookings', { headers }),
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats || {});
      }

      if (bikesResponse.ok) {
        const bikesData = await bikesResponse.json();
        setBikes(bikesData || []);
      }

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Image size should be less than 5MB');
      return;
    }

    setUploadingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch('http://localhost:3001/api/vendors/upload-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      const data = await response.json();
      setProfilePicture(data.profilePicture);
      showSuccess('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      showError('Failed to upload profile picture');
    } finally {
      setUploadingProfile(false);
    }
  };

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
        throw new Error(data.error || 'Failed to update booking status');
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

  const renderOverview = () => (
    <div className="overview-container">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12V7a1 1 0 0 1 1-1h4l2-3h4a1 1 0 0 1 1 1v7.5"/>
                <path d="M16 8h2a1 1 0 0 1 1 1v2"/>
                <circle cx="8" cy="16" r="3"/>
                <circle cx="16" cy="16" r="3"/>
              </svg>
            </div>
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.totalBikes}</h3>
            <p className="stat-label">Total Bikes</p>
            <p className="stat-description">{stats.availableBikes} available for rent</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
          </div>
          <div className="stat-content">
            <h3 className="stat-number">NPR {stats.monthlyRevenue?.toLocaleString() || '0'}</h3>
            <p className="stat-label">Monthly Revenue</p>
            <p className="stat-description">From bike rentals</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.activeRentals}</h3>
            <p className="stat-label">Active Rentals</p>
            <p className="stat-description">{stats.totalBookings} total bookings</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4"/>
                <path d="M12 16h.01"/>
              </svg>
            </div>
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.pendingBookings}</h3>
            <p className="stat-label">Pending Bookings</p>
            <p className="stat-description">Awaiting approval</p>
          </div>
        </div>
      </div>

      {/* Recent Bookings Section */}
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Recent Bike Rental Requests</h2>
            <p className="section-subtitle">Manage your bike rental bookings</p>
          </div>
          <button className="btn-outline" onClick={() => setActiveTab('bookings')}>View All</button>
        </div>
        
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Bike</th>
                <th>Rental Period</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length > 0 ? bookings.slice(0, 5).map(booking => (
                <tr key={booking.id}>
                  <td>
                    <div className="customer-info">
                      <div className="customer-avatar">
                        {booking.customer?.name?.[0] || booking.lessor?.fullName?.[0] || 'C'}
                      </div>
                      <div>
                        <div className="customer-name">{booking.customer?.name || booking.lessor?.fullName || 'N/A'}</div>
                        <div className="customer-email">{booking.customer?.email || booking.lessor?.email || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="bike-cell">
                    <div className="bike-info">
                      <div className="bike-name">{booking.bike?.name || `${booking.bike?.brand || ''} ${booking.bike?.model || ''}`.trim() || 'N/A'}</div>
                      <div className="bike-model">{booking.bike?.type || ''}</div>
                    </div>
                  </td>
                  <td>
                    <div className="rental-period">
                      <div>{new Date(booking.startDate).toLocaleDateString()}</div>
                      <div className="text-muted">to {new Date(booking.endDate).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="price-cell">NPR {parseInt(booking.totalAmount || 0).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge status-${booking.status?.toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {booking.status === 'Pending' && (
                        <>
                          <button 
                            className="btn-sm btn-success"
                            onClick={() => handleBookingAction(booking.id, 'Approved')}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Approve
                          </button>
                          <button 
                            className="btn-sm btn-danger"
                            onClick={() => handleBookingAction(booking.id, 'Rejected')}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            Reject
                          </button>
                        </>
                      )}
                      {booking.status !== 'Pending' && <span className="text-muted">No actions</span>}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12V7a1 1 0 0 1 1-1h4l2-3h4a1 1 0 0 1 1 1v7.5"/>
                        <circle cx="8" cy="16" r="3"/>
                        <circle cx="16" cy="16" r="3"/>
                      </svg>
                      <p>No rental requests yet</p>
                      <span>Rental requests will appear here when customers book your bikes</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'inventory':
        return <BikeInventory 
          bikes={bikes} 
          setBikes={setBikes} 
          fetchData={fetchData} 
          showSuccess={showSuccess}
          showError={showError}
        />;
      case 'bookings':
        return <RentalBookings 
          bookings={bookings} 
          setBookings={setBookings} 
          fetchData={fetchData} 
          showSuccess={showSuccess}
          showError={showError}
        />;
      case 'customers':
        return <CustomerManagement customers={customers} setCustomers={setCustomers} />;
      case 'analytics':
        return <BikeAnalytics stats={stats} bikes={bikes} bookings={bookings} />;
      case 'location':
        return <ShopLocationManager />;
      case 'settings':
        return (
          <div className="placeholder-content">
            <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m5.66-14.66l-4.24 4.24m0 8.48l4.24 4.24M23 12h-6m-6 0H1m14.66 5.66l-4.24-4.24m0-8.48l4.24-4.24"/>
            </svg>
            <h2>Account Settings</h2>
            <p>Customize your account preferences and manage your profile. Coming soon.</p>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading bike vendor dashboard...</p>
      </div>
    );
  }

  return (
    <div className="bike-vendor-dashboard">
      {/* Dashboard Notifications */}
      <DashboardNotifications 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      {/* Modern Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon-wrapper">
              <svg className="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12V7a1 1 0 0 1 1-1h4l2-3h4a1 1 0 0 1 1 1v7.5"/>
                <circle cx="8" cy="16" r="3"/>
                <circle cx="16" cy="16" r="3"/>
              </svg>
            </div>
            {!sidebarCollapsed && <span className="brand-name">BikeHive</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarCollapsed ? (
                <path d="M9 18l6-6-6-6"/>
              ) : (
                <path d="M15 18l-6-6 6-6"/>
              )}
            </svg>
          </button>
        </div>

        <div className="user-profile">
          <div className="user-avatar-container">
            {profilePicture ? (
              <img src={`http://localhost:3001/uploads/profiles/${profilePicture}`} alt="Profile" className="user-avatar-img" />
            ) : (
              <div className="user-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            )}
            <label className="avatar-upload-btn" title="Upload profile picture">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleProfilePictureUpload}
                style={{ display: 'none' }}
                disabled={uploadingProfile}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </label>
          </div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <p className="user-name">{user?.businessName || user?.fullName || 'Bike Vendor'}</p>
              <p className="user-role">Bike Rental Shop</p>
            </div>
          )}
        </div>

        <nav className="sidebar-menu">
          <div className="menu-section">
            <button 
              className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`} 
              onClick={() => setActiveTab('overview')}
              title="Overview"
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
              className={`menu-item ${activeTab === 'inventory' ? 'active' : ''}`} 
              onClick={() => setActiveTab('inventory')}
              title="Bike Inventory"
            >
              <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12V7a1 1 0 0 1 1-1h4l2-3h4a1 1 0 0 1 1 1v7.5"/>
                <circle cx="8" cy="16" r="3"/>
                <circle cx="16" cy="16" r="3"/>
              </svg>
              {!sidebarCollapsed && <span>My Bikes</span>}
            </button>
            <button 
              className={`menu-item ${activeTab === 'bookings' ? 'active' : ''}`} 
              onClick={() => setActiveTab('bookings')}
              title="Rental Bookings"
            >
              <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {!sidebarCollapsed && <span>Bookings</span>}
              {bookings.length > 0 && <span className="badge">{bookings.length}</span>}
            </button>
            <button 
              className={`menu-item ${activeTab === 'customers' ? 'active' : ''}`} 
              onClick={() => setActiveTab('customers')}
              title="Customers"
            >
              <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              {!sidebarCollapsed && <span>Customers</span>}
            </button>
            <button 
              className={`menu-item ${activeTab === 'analytics' ? 'active' : ''}`} 
              onClick={() => setActiveTab('analytics')}
              title="Analytics"
            >
              <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              {!sidebarCollapsed && <span>Analytics</span>}
            </button>
            <button 
              className={`menu-item ${activeTab === 'location' ? 'active' : ''}`} 
              onClick={() => setActiveTab('location')}
              title="Shop Location"
            >
              <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {!sidebarCollapsed && <span>Shop Location</span>}
            </button>
            <button 
              className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`} 
              onClick={() => setActiveTab('settings')}
              title="Settings"
            >
              <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m5.66-14.66l-4.24 4.24m0 8.48l4.24 4.24M23 12h-6m-6 0H1m14.66 5.66l-4.24-4.24m0-8.48l4.24-4.24"/>
              </svg>
              {!sidebarCollapsed && <span>Settings</span>}
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button" onClick={() => { logout(); navigate('/login'); }} title="Logout">
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Modern Main Content */}
      <main className="main-content">
        <div className="content-header">
          <div className="header-left">
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <p className="header-subtitle">
              {activeTab === 'overview' && 'Welcome back! Here\'s your bike rental dashboard'}
              {activeTab === 'inventory' && 'Manage your bike inventory and availability'}
              {activeTab === 'bookings' && 'View and manage bike rental bookings'}
              {activeTab === 'customers' && 'Manage your customer relationships'}
              {activeTab === 'analytics' && 'Track your business performance'}
              {activeTab === 'settings' && 'Customize your account preferences'}
            </p>
          </div>
          <div className="header-actions">
            <NotificationBell userId={user?.id} />
            <div className="user-menu">
              {profilePicture ? (
                <img 
                  src={`http://localhost:3001/uploads/profiles/${profilePicture}`} 
                  alt={user?.fullName || 'User'} 
                  className="header-user-avatar"
                />
              ) : (
                <div className="header-user-avatar-placeholder">
                  {user?.fullName?.[0] || user?.businessName?.[0] || 'U'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="content-area">
          {renderActiveComponent()}
        </div>
      </main>
    </div>
  );
};

export default BikeVendorDashboard;