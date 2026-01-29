import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import AdminNavBar from './AdminNavBar';
import SuperAdmin from './SuperAdmin';
import AdminNotifications from './AdminNotifications';
import './AdminDashboard.css';
import API_BASE_URL from '../../config/api';
import axios from 'axios';
import { 
  ShieldCheck, 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  Home, 
  Banknote, 
  Bell, 
  Settings, 
  LogOut, 
  Calendar, 
  DollarSign 
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });


  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <ShieldCheck size={28} />
            {!sidebarCollapsed && <span>Admin Panel</span>}
          </div>
          <button 
            className="collapse-btn" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={20} />
            {!sidebarCollapsed && <span>Overview</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={20} />
            {!sidebarCollapsed && <span>Users</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            <Home size={20} />
            {!sidebarCollapsed && <span>Properties</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <Banknote size={20} />
            {!sidebarCollapsed && <span>Payments</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={20} />
            {!sidebarCollapsed && <span>Notifications</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <button 
            className="nav-item" 
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={20} />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>

          <button className="nav-item logout" onClick={handleLogout}>
            <LogOut size={20} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Top Bar */}
        <div className="dashboard-topbar">
          <h1 className="page-title">
            {activeTab === 'overview' && 'Admin Overview'}
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'properties' && 'Property Management'}
            {activeTab === 'payments' && 'Payment Management'}
            {activeTab === 'notifications' && 'Notifications'}
          </h1>

          <div className="topbar-actions">
            <div className="notification-bell">
              <Bell size={24} />
              {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
            </div>

            <div className="user-profile">
              <div className="user-avatar">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="user-info">
                <p className="user-name">{user?.name || 'Admin'}</p>
                <p className="user-role">Super Admin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card gradient-primary">
                  <div className="stat-icon">
                    <Users size={24} />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">Total Users</p>
                    <h3 className="stat-value">{stats.totalUsers}</h3>
                    <p className="stat-detail">Registered users</p>
                  </div>
                </div>

                <div className="stat-card gradient-success">
                  <div className="stat-icon">
                    <Home size={24} />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">Total Properties</p>
                    <h3 className="stat-value">{stats.totalProperties}</h3>
                    <p className="stat-detail">Listed properties</p>
                  </div>
                </div>

                <div className="stat-card gradient-info">
                  <div className="stat-icon">
                    <Calendar size={24} />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">Total Bookings</p>
                    <h3 className="stat-value">{stats.totalBookings}</h3>
                    <p className="stat-detail">All time bookings</p>
                  </div>
                </div>

                <div className="stat-card gradient-warning">
                  <div className="stat-icon">
                    <DollarSign size={24} />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">Total Revenue</p>
                    <h3 className="stat-value">NPR {stats.totalRevenue.toLocaleString()}</h3>
                    <p className="stat-detail">Platform earnings</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && <SuperAdmin />}
          {activeTab === 'properties' && <div className="content-placeholder">Property Management - Coming Soon</div>}
          {activeTab === 'payments' && <div className="content-placeholder">Payment Management - Coming Soon</div>}
          {activeTab === 'notifications' && <AdminNotifications />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
