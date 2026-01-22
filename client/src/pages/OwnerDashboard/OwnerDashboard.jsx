import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNotifications } from '../../hooks/useNotifications';
import DashboardNotifications from '../../components/DashboardNotifications';
import NotificationBell from '../../components/NotificationBell';
import OwnerBookings from "./OwnerBookings";
import UnifiedPostingForm from "./UnifiedPostingForm";
import AllListings from "./AllListings";
import "./OwnerDashboard.css";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const socket = useSocket();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newBikeCount, setNewBikeCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({
    totalProperties: 0,
    availableProperties: 0,
    totalBookings: 0,
    monthlyRevenue: 0,
    bikeRentals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen for real-time bike availability notifications
  useEffect(() => {
    if (socket && socket.connected) {
      const handleNewNotification = (notification) => {
        if (notification.type === 'bike_available') {
          // Increment new bike counter for badge
          setNewBikeCount(prev => prev + 1);
          
          // Show success notification
          showSuccess(
            notification.title,
            notification.message
          );
        }
      };

      socket.on('new-notification', handleNewNotification);

      return () => {
        socket.off('new-notification', handleNewNotification);
      };
    }
  }, [socket, showSuccess]);

  // Clear new bike count when user visits bikes tab
  const handleTabChange = (tab) => {
    if (tab === 'bikes' && newBikeCount > 0) {
      setNewBikeCount(0);
    }
    setActiveTab(tab);
  };

  const fetchDashboardData = async () => {
    console.log('🔍 Starting to fetch dashboard data...');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      console.log('📝 Token exists:', !!token);
      console.log('👤 User exists:', !!user);
      
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };
      
      console.log('🚀 Making API request to:', 'http://localhost:3001/api/owners/stats');
      
      // Fetch owner stats (properties they own + bike rentals they've made)
      const response = await fetch('http://localhost:3001/api/owners/stats', { headers });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Dashboard data received:', data);
        setStats(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch dashboard data:', response.status, errorText);
        showError('Error', `Failed to load dashboard data: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showError('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      console.log('Finished fetching dashboard data');
    }
  };

  const renderOverview = () => (
    <div className="overview-container">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <h1>Welcome back, {user?.fullName || 'Owner'}! 👋</h1>
          <p>Here's what's happening with your rentals today</p>
        </div>
        <button className="refresh-dashboard-btn" onClick={fetchDashboardData} disabled={loading}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card gradient-primary">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Properties</p>
            <h3 className="stat-value">{stats.totalProperties}</h3>
            <p className="stat-detail">{stats.availableProperties} available</p>
          </div>
        </div>

        <div className="stat-card gradient-success">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div className="stat-info">
            <p className="stat-label">Monthly Revenue</p>
            <h3 className="stat-value">NPR {stats.monthlyRevenue.toLocaleString()}</h3>
            <p className="stat-detail">From rentals</p>
          </div>
        </div>

        <div className="stat-card gradient-info">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div className="stat-info">
            <p className="stat-label">Property Bookings</p>
            <h3 className="stat-value">{stats.totalBookings}</h3>
            <p className="stat-detail">Total requests</p>
          </div>
        </div>

        <div className="stat-card gradient-warning">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="5.5" cy="17.5" r="3.5"/>
              <circle cx="18.5" cy="17.5" r="3.5"/>
              <path d="M5.5 17.5h13"/>
            </svg>
          </div>
          <div className="stat-info">
            <p className="stat-label">Bike Rentals</p>
            <h3 className="stat-value">{stats.bikeRentals}</h3>
            <p className="stat-detail">Active rentals</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="action-cards">
          <div className="action-card" onClick={() => setActiveTab('add-listing')}>
            <div className="action-icon add">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <h3>Add New Listing</h3>
            <p>List a property or automobile</p>
          </div>

          <div className="action-card" onClick={() => handleTabChange('bookings')}>
            <div className="action-icon bookings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <h3>View Bookings</h3>
            <p>Check rental requests</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="owner-dashboard">
      {/* Dashboard Notifications */}
      <DashboardNotifications 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
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
          <div className="user-avatar">
            {user?.fullName?.[0] || 'L'}
          </div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <p className="user-name">{user?.fullName || 'Owner'}</p>
              <p className="user-role">Property Owner</p>
            </div>
          )}
        </div>

        <nav className="sidebar-menu">
          <button 
            className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`} 
            onClick={() => handleTabChange('overview')}
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
            className={`menu-item ${activeTab === 'add-listing' ? 'active' : ''}`} 
            onClick={() => handleTabChange('add-listing')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {!sidebarCollapsed && <span>Add New Listing</span>}
          </button>

          <button 
            className={`menu-item ${activeTab === 'listings' ? 'active' : ''}`} 
            onClick={() => handleTabChange('listings')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            {!sidebarCollapsed && <span>All Listings</span>}
          </button>

          <button 
            className={`menu-item ${activeTab === 'bookings' ? 'active' : ''}`} 
            onClick={() => handleTabChange('bookings')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {!sidebarCollapsed && <span>Incoming Bookings</span>}
          </button>

          <button 
            className={`menu-item ${activeTab === 'payments' ? 'active' : ''}`} 
            onClick={() => handleTabChange('payments')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            {!sidebarCollapsed && <span>Payments & Finances</span>}
          </button>

          <button 
            className={`menu-item ${activeTab === 'messages' ? 'active' : ''}`} 
            onClick={() => handleTabChange('messages')}
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

      <main className="main-content">
        <div className="content-header">
          <div className="header-left">
            <h1>
              {activeTab === 'overview' && 'Dashboard'}
              {activeTab === 'listings' && 'All Listings'}
              {activeTab === 'bookings' && 'Incoming Bookings'}
              {activeTab === 'payments' && 'Payments & Finances'}
              {activeTab === 'messages' && 'Messages'}
              {activeTab === 'add-listing' && 'Add New Listing'}
            </h1>
            <p className="header-subtitle">
              {activeTab === 'overview' && 'Welcome back! Manage your properties and automobiles'}
              {activeTab === 'listings' && 'View and manage all your posted properties and automobiles'}
              {activeTab === 'bookings' && 'Review and manage incoming rental requests'}
              {activeTab === 'payments' && 'Track income, expenses, and payouts'}
              {activeTab === 'messages' && 'Communicate with tenants and prospective renters'}
              {activeTab === 'add-listing' && 'Choose what you want to list - property or automobile'}
            </p>
          </div>
          <div className="header-right">
            <NotificationBell 
              notifications={notifications}
              onNotificationClick={(notif) => {
                // Handle notification click
                console.log('Notification clicked:', notif);
              }}
            />
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
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'listings' && <AllListings showSuccess={showSuccess} showError={showError} />}
          {activeTab === 'bookings' && <OwnerBookings showSuccess={showSuccess} showError={showError} />}
          {activeTab === 'payments' && <div className="placeholder">Payments & Finances - Coming Soon</div>}
          {activeTab === 'messages' && <div className="placeholder">Messages - Coming Soon</div>}
          {activeTab === 'add-listing' && <UnifiedPostingForm showSuccess={showSuccess} showError={showError} />}
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
      </main>
    </div>
  );
};

export default OwnerDashboard;