import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import AdminNavBar from './AdminNavBar';
import SuperAdmin from './SuperAdmin';
import AdminNotifications from './AdminNotifications';
import PropertiesTable from './PropertiesTable';
import AutomobilesTable from './AutomobilesTable';
import ReportsTable from './ReportsTable';
import PaymentsTable from './PaymentsTable';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
    setMobileMenuOpen(false); // Close mobile menu on tab change
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return; // Skip if no token
      
      const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      // Silently handle 401 errors (not authenticated)
      if (error.response?.status !== 401) {
        console.error('Error fetching admin stats:', error);
      }
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <ShieldCheck size={28} />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>Admin Panel</span>}
          </div>
          <button 
            className="collapse-btn desktop-only" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
          <button 
            className="collapse-btn mobile-only" 
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={20} />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>Overview</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'owners' ? 'active' : ''}`}
            onClick={() => setActiveTab('owners')}
          >
            <Briefcase size={20} />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>Owner</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={20} />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>User</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            <Home size={20} />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>Properties</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'automobiles' ? 'active' : ''}`}
            onClick={() => setActiveTab('automobiles')}
          >
            <Bike size={20} />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>Automobiles</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <AlertTriangle size={20} />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>Report</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <Banknote size={20} />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>Financials</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'kyc' ? 'active' : ''}`}
            onClick={() => setActiveTab('kyc')}
          >
            <FileCheck size={20} />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>KYC Requests</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={20} />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>Support Chat</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={20} />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>Notification</span>}
          </button>
        </div>

        <div className="sidebar-footer">
          <button className="nav-item logout" onClick={handleLogout}>
            <LogOut size={20} />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`dashboard-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        {/* Top Bar */}
        <div className="dashboard-topbar">
          <div className="topbar-left">
            <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="page-title">
              {activeTab === 'overview' && 'Admin Overview'}
              {activeTab === 'owners' && 'Owner Management'}
              {activeTab === 'users' && 'All Users Management'}
              {activeTab === 'properties' && 'Property Management'}
              {activeTab === 'automobiles' && 'Automobile Management'}
              {activeTab === 'reports' && 'Reports & Issues'}
              {activeTab === 'kyc' && 'KYC Verification Requests'}
              {activeTab === 'notifications' && 'Notifications'}
              {activeTab === 'payments' && 'Financial Transactions'}
            </h1>
          </div>

          <div className="topbar-actions">
            {/* Removed notification bell and user profile */}
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

          {activeTab === 'owners' && <SuperAdmin initialRoleFilter="owners" />}
          {activeTab === 'users' && <SuperAdmin initialRoleFilter="renters" />}
          {activeTab === 'properties' && <PropertiesTable />}
          {activeTab === 'automobiles' && <AutomobilesTable />}
          {activeTab === 'reports' && <ReportsTable />}
          {activeTab === 'kyc' && <SuperAdmin initialKycFilter="pending" />}
          {activeTab === 'chat' && <AdminChat />}
          {activeTab === 'notifications' && <AdminNotifications />}
          {activeTab === 'payments' && <PaymentsTable />}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                <LogOut size={24} className="text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Confirm Logout</h3>
            </div>
            <p className="text-slate-600 mb-6">Are you sure you want to log out? You'll need to sign in again to access your dashboard.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
