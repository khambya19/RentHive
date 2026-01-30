import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import AdminNavBar from './AdminNavBar';
import SuperAdmin from './SuperAdmin';
import AdminNotifications from './AdminNotifications';
import PropertiesTable from './PropertiesTable';
import AutomobilesTable from './AutomobilesTable';
import ReportsTable from './ReportsTable';
import './AdminDashboard.css';
import API_BASE_URL from '../../config/api';
import axios from 'axios';
import { 
  ShieldCheck, 
  Menu, 
  X, 
  LayoutDashboard, 
  Briefcase, 
  Home, 
  Banknote, 
  Bell, 
  Settings, 
  LogOut, 
  Calendar, 
  DollarSign,
  FileCheck,
  Bike,
  AlertTriangle,
  Users,
  MessageSquare
} from 'lucide-react';
import AdminChat from './AdminChat';

import { useSearchParams, useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Derived state from URL or default to 'overview'
  const activeTab = searchParams.get('tab') || 'overview';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

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

          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={20} />
            {!sidebarCollapsed && <span>Overview</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'owners' ? 'active' : ''}`}
            onClick={() => setActiveTab('owners')}
          >
            <Briefcase size={20} />
            {!sidebarCollapsed && <span>Owner</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={20} />
            {!sidebarCollapsed && <span>User</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            <Home size={20} />
            {!sidebarCollapsed && <span>Properties</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'automobiles' ? 'active' : ''}`}
            onClick={() => setActiveTab('automobiles')}
          >
            <Bike size={20} />
            {!sidebarCollapsed && <span>Automobiles</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <AlertTriangle size={20} />
            {!sidebarCollapsed && <span>Report</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'kyc' ? 'active' : ''}`}
            onClick={() => setActiveTab('kyc')}
          >
            <FileCheck size={20} />
            {!sidebarCollapsed && <span>KYC Requests</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={20} />
            {!sidebarCollapsed && <span>Support Chat</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={20} />
            {!sidebarCollapsed && <span>Notification</span>}
          </button>

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
            {activeTab === 'owners' && 'Owner Management'}
            {activeTab === 'users' && 'User (Tenant) Management'}
            {activeTab === 'properties' && 'Property Management'}
            {activeTab === 'automobiles' && 'Automobile Management'}
            {activeTab === 'reports' && 'Reports & Issues'}
            {activeTab === 'kyc' && 'KYC Verification Requests'}
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

          {activeTab === 'owners' && <SuperAdmin initialRoleFilter="owner" />}
          {activeTab === 'users' && <SuperAdmin initialRoleFilter="user" />}
          {activeTab === 'properties' && <PropertiesTable />}
          {activeTab === 'automobiles' && <AutomobilesTable />}
          {activeTab === 'reports' && <ReportsTable />}
          {activeTab === 'kyc' && <SuperAdmin initialKycFilter="pending" />}
          {activeTab === 'chat' && <AdminChat />}
          {activeTab === 'notifications' && <AdminNotifications />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
