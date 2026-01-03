import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNotifications } from '../../hooks/useNotifications';
import DashboardNotifications from '../../components/DashboardNotifications';
import PropertyManagement from './PropertyManagement';
import BikeRental from './BikeRental';
import VendorManagement from './VendorManagement';
import LessorBookings from './LessorBookings';
import './LessorDashboard.css';

const LessorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const socket = useSocket();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newBikeCount, setNewBikeCount] = useState(0);
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
      
      console.log('🚀 Making API request to:', 'http://localhost:3001/api/lessors/stats');
      
      // Fetch lessor stats (properties they own + bike rentals they've made)
      const response = await fetch('http://localhost:3001/api/lessors/stats', { headers });
      
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
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.totalProperties}</h3>
            <p className="stat-label">My Properties</p>
            <p className="stat-description">{stats.availableProperties} available for rent</p>
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
            <h3 className="stat-number">NPR {stats.monthlyRevenue.toLocaleString()}</h3>
            <p className="stat-label">Monthly Income</p>
            <p className="stat-description">From property rentals</p>
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
            <h3 className="stat-number">{stats.totalBookings}</h3>
            <p className="stat-label">Property Bookings</p>
            <p className="stat-description">Total rental requests</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.bikeRentals}</h3>
            <p className="stat-label">Bike Rentals</p>
            <p className="stat-description">Bikes rented from vendors</p>
          </div>
        </div>
      </div>

      <div className="section-card">
        <h2>Welcome to Your RentHive Dashboard</h2>
        <p>Manage your properties and rent bikes all in one place.</p>
        <div className="quick-actions">
          <button 
            className="btn-primary"
            onClick={() => handleTabChange('properties')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            List a Property
          </button>
          <button 
            className="btn-outline"
            onClick={() => handleTabChange('bikes')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="m4.93 4.93 4.24 4.24"/>
              <path d="m14.83 9.17 4.24-4.24"/>
              <path d="m14.83 14.83 4.24 4.24"/>
              <path d="m9.17 14.83-4.24 4.24"/>
            </svg>
            Rent a Bike
          </button>
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
    <div className="lessor-dashboard">
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
              <p className="user-name">{user?.fullName || 'Lessor'}</p>
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
            className={`menu-item ${activeTab === 'properties' ? 'active' : ''}`} 
            onClick={() => handleTabChange('properties')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            {!sidebarCollapsed && <span>My Properties</span>}
          </button>

          <button 
            className={`menu-item ${activeTab === 'bikes' ? 'active' : ''}`} 
            onClick={() => handleTabChange('bikes')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="5.5" cy="17.5" r="3.5"/>
              <circle cx="18.5" cy="17.5" r="3.5"/>
              <path d="M5.5 17.5h13"/>
              <path d="M12 14l-8-6h2l8 6"/>
              <path d="M16 8h4l-2 4"/>
              <path d="M12 14v3"/>
              <path d="M9 8h6"/>
            </svg>
            {!sidebarCollapsed && (
              <span>
                Rent Bikes
                {newBikeCount > 0 && <span className="badge">{newBikeCount}</span>}
              </span>
            )}
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
            {!sidebarCollapsed && <span>My Bookings</span>}
          </button>

          <button 
            className={`menu-item ${activeTab === 'vendors' ? 'active' : ''}`} 
            onClick={() => handleTabChange('vendors')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {!sidebarCollapsed && <span>Vendors</span>}
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
              {activeTab === 'properties' && 'My Properties'}
              {activeTab === 'bikes' && 'Rent Bikes'}
              {activeTab === 'bookings' && 'My Bookings'}
              {activeTab === 'vendors' && 'Vendor Management'}
            </h1>
            <p className="header-subtitle">
              {activeTab === 'overview' && 'Welcome back! Manage your properties and bike rentals'}
              {activeTab === 'properties' && 'List and manage your rental properties'}
              {activeTab === 'bikes' && 'Find and rent bikes from local vendors'}
              {activeTab === 'bookings' && 'Track your property and bike rental bookings'}
              {activeTab === 'vendors' && 'Manage and monitor all vendors on the platform'}
            </p>
          </div>
        </div>

        <div className="content-area">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'properties' && <PropertyManagement />}
          {activeTab === 'bikes' && <BikeRental showSuccess={showSuccess} showError={showError} />}
          {activeTab === 'bookings' && <LessorBookings showSuccess={showSuccess} showError={showError} />}
          {activeTab === 'vendors' && <VendorManagement />}
        </div>
      </main>
    </div>
  );
};

export default LessorDashboard;