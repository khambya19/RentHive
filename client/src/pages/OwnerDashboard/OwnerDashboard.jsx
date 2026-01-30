import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import { useNotifications } from '../../hooks/useNotifications';
import DashboardNotifications from '../../components/DashboardNotifications';
import NotificationBell from '../../components/NotificationBell';
import PaymentManagement from '../../components/PaymentManagement';
import OwnerBookings from "./OwnerBookings";
import UnifiedPostingForm from "./UnifiedPostingForm";
import AllListings from "./AllListings";
import Settings from "../Settings/Settings";
import Messages from "./Messages";
import API_BASE_URL from '../../config/api';
import { 
  LayoutDashboard, 
  PlusCircle, 
  List, 
  CalendarDays, 
  CreditCard, 
  MessageSquare, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Home, 
  Banknote, 
  CalendarCheck, 
  Bike,
  Settings as SettingsIcon,
  Hexagon,
  User,
  Construction
} from 'lucide-react';
import "./OwnerDashboard.css";

const OwnerDashboard = () => {
    useEffect(() => {
      document.body.style.background = '#d6eef5';
      return () => { document.body.style.background = ''; };
    }, []);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // New state for mobile menu
  const [stats, setStats] = useState({
    totalProperties: 0,
    availableProperties: 0,
    totalBookings: 0,
    monthlyRevenue: 0,
    bikeRentals: 0,
  });
  const [loading, setLoading] = useState(true);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // Handle tab from URL query parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await fetch(`${API_BASE_URL}/owners/stats`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const errorText = await response.text();
        showError('Error', `Failed to load dashboard data: ${response.status} ${errorText}`);
      }
    } catch (error) {
      showError('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [navigate, showError]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const renderOverview = () => (
    <div className="overview-container max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="welcome-banner rounded-2xl p-6 md:p-10 mb-8 flex flex-col md:flex-row flex-wrap gap-4 justify-between items-center shadow-lg relative overflow-hidden" style={{ background: '#465A66' }}>
        <div className="welcome-content relative z-10 text-center md:text-left mb-4 md:mb-0">
          <h1 className="flex items-center justify-center md:justify-start gap-2 text-2xl md:text-3xl font-bold text-white mb-2">Welcome back, {user?.fullName || 'Owner'}! <span className="text-2xl">👋</span></h1>
          <p className="text-indigo-100 text-lg">Here's what's happening with your rentals today</p>
        </div>
        <button 
          className="refresh-dashboard-btn relative z-10 flex items-center gap-2 px-6 py-3 text-indigo-600 rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95" style={{ background: '#f8fafc' }} 
          onClick={fetchDashboardData} 
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="stat-card p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow" style={{ background: '#f4fbfd' }}>
          <div className="stat-icon w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
            <Home size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Total Properties</p>
            <h3 className="stat-value text-3xl font-bold text-gray-900 mb-1">{stats.totalProperties}</h3>
            <p className="stat-detail text-sm text-gray-400">{stats.availableProperties} available</p>
          </div>
        </div>

        <div className="stat-card p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow" style={{ background: '#f8fafc' }}>
          <div className="stat-icon w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4">
            <Banknote size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Monthly Revenue</p>
            <h3 className="stat-value text-3xl font-bold text-gray-900 mb-1">NPR {stats.monthlyRevenue.toLocaleString()}</h3>
            <p className="stat-detail text-sm text-gray-400">From rentals</p>
          </div>
        </div>

        <div className="stat-card p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow" style={{ background: '#f8fafc' }}>
          <div className="stat-icon w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
            <CalendarCheck size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Property Bookings</p>
            <h3 className="stat-value text-3xl font-bold text-gray-900 mb-1">{stats.totalBookings}</h3>
            <p className="stat-detail text-sm text-gray-400">Total requests</p>
          </div>
        </div>

        <div className="stat-card p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow" style={{ background: '#f8fafc' }}>
          <div className="stat-icon w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
            <Bike size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Bike Rentals</p>
            <h3 className="stat-value text-3xl font-bold text-gray-900 mb-1">{stats.bikeRentals}</h3>
            <p className="stat-detail text-sm text-gray-400">Active rentals</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="quick-actions-section">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        <div className="action-cards grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            className="action-card p-8 rounded-2xl border border-gray-100 hover:border-indigo-500 cursor-pointer transition-all hover:shadow-lg text-center group" style={{ background: '#f4fbfd' }} 
            onClick={() => setActiveTab('add-listing')}
          >
            <div className="action-icon w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <PlusCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Add New Listing</h3>
            <p className="text-gray-500">List a property or automobile</p>
          </div>

          <div 
            className="action-card p-8 rounded-2xl border border-gray-100 hover:border-blue-500 cursor-pointer transition-all hover:shadow-lg text-center group" style={{ background: '#f4fbfd' }} 
            onClick={() => handleTabChange('bookings')}
          >
            <div className="action-icon w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <CalendarDays size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">View Bookings</h3>
            <p className="text-gray-500">Check rental requests</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="owner-dashboard flex h-screen overflow-hidden bg-white">
      {/* Dashboard Notifications */}
      <DashboardNotifications 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Mobile: Fixed Slide-over, Desktop: Static/Sticky */}
      <aside 
        className={`
          sidebar fixed inset-y-0 left-0 z-30 text-white transition-all duration-300 ease-in-out w-72 bg-[#465A66]
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}
          flex flex-col shadow-xl
        `}
      >
        <div className="sidebar-header p-6 flex items-center justify-between border-b border-white/10">
          <div className="sidebar-brand flex items-center gap-3">
            <div className="brand-icon-wrapper bg-white/10 p-2 rounded-lg">
              <Hexagon className="brand-icon text-white" size={24} />
            </div>
            {!sidebarCollapsed && <span className="brand-name text-xl font-bold tracking-tight">RentHive</span>}
          </div>
          <button 
            className="sidebar-toggle hidden lg:flex items-center justify-center p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          {/* Mobile Close Button */}
          <button 
            className="lg:hidden flex items-center justify-center p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        <div className="user-profile p-6 border-b border-white/10 flex items-center gap-4">
          <div className="user-avatar w-12 h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
            {user?.photo ? <img src={user.photo} alt="User" className="w-full h-full rounded-full object-cover" /> : <User size={24} />}
          </div>
          {!sidebarCollapsed && (
            <div className="user-info overflow-hidden">
              <p className="user-name font-semibold truncate hover:text-clip">{user?.fullName || 'Owner'}</p>
              <p className="user-role text-xs text-gray-400 uppercase tracking-wider">Property Owner</p>
            </div>
          )}
        </div>

        <nav className="sidebar-menu flex-1 py-6 overflow-y-auto custom-scrollbar">
          <button 
            className={`menu-item flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${activeTab === 'overview' ? 'bg-white/10 text-white border-r-4 border-indigo-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} 
            onClick={() => handleTabChange('overview')}
          >
            <LayoutDashboard size={20} />
            {!sidebarCollapsed && <span className="font-medium">Overview</span>}
          </button>

          <button 
            className={`menu-item flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${activeTab === 'add-listing' ? 'bg-white/10 text-white border-r-4 border-indigo-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} 
            onClick={() => handleTabChange('add-listing')}
          >
            <PlusCircle size={20} />
            {!sidebarCollapsed && <span className="font-medium">Add New Listing</span>}
          </button>

          <button 
            className={`menu-item flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${activeTab === 'listings' ? 'bg-white/10 text-white border-r-4 border-indigo-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} 
            onClick={() => handleTabChange('listings')}
          >
            <List size={20} />
            {!sidebarCollapsed && <span className="font-medium">All Listings</span>}
          </button>

          <button 
            className={`menu-item flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${activeTab === 'bookings' ? 'bg-white/10 text-white border-r-4 border-indigo-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} 
            onClick={() => handleTabChange('bookings')}
          >
            <CalendarDays size={20} />
            {!sidebarCollapsed && <span className="font-medium">Incoming Bookings</span>}
          </button>

          <button 
            className={`menu-item flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${activeTab === 'payments' ? 'bg-white/10 text-white border-r-4 border-indigo-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} 
            onClick={() => handleTabChange('payments')}
          >
            <CreditCard size={20} />
            {!sidebarCollapsed && <span className="font-medium">Payments & Finances</span>}
          </button>

          <button 
            className={`menu-item flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${activeTab === 'messages' ? 'bg-white/10 text-white border-r-4 border-indigo-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} 
            onClick={() => handleTabChange('messages')}
          >
            <MessageSquare size={20} />
            {!sidebarCollapsed && <span className="font-medium">Messages</span>}
          </button>

          <button 
            className={`menu-item flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${activeTab === 'settings' ? 'bg-white/10 text-white border-r-4 border-indigo-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} 
            onClick={() => handleTabChange('settings')}
          >
            <SettingsIcon size={20} />
            {!sidebarCollapsed && <span className="font-medium">Settings</span>}
          </button>
        </nav>

        <div className="sidebar-footer p-6 border-t border-white/10">
          <button className="logout-button flex items-center gap-3 w-full text-left text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-lg transition-colors" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={20} />
            {!sidebarCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="main-content flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-300 bg-white">
        <div className="content-header bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
          <div className="header-left flex items-center gap-4">
             {/* Mobile Menu Toggle */}
             <button 
              className="lg:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(true)}
            >
              <List size={24} />
            </button>

            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate max-w-[200px] md:max-w-none">
                {activeTab === 'overview' && 'Dashboard'}
                {activeTab === 'listings' && 'All Listings'}
                {activeTab === 'bookings' && 'Incoming Bookings'}
                {activeTab === 'payments' && 'Payments & Finances'}
                {activeTab === 'messages' && 'Messages'}
                {activeTab === 'add-listing' && 'Add New Listing'}
                {activeTab === 'settings' && 'Settings'}
              </h1>
              <p className="header-subtitle hidden md:block text-sm text-gray-500 mt-1">
                {activeTab === 'overview' && 'Welcome back! Manage your properties and automobiles'}
                {activeTab === 'listings' && 'View and manage all your posted properties and automobiles'}
                {activeTab === 'bookings' && 'Review and manage incoming rental requests'}
                {activeTab === 'payments' && 'Track income, expenses, and payouts'}
                {activeTab === 'messages' && 'Communicate with tenants and prospective renters'}
                {activeTab === 'add-listing' && 'Choose what you want to list - property or automobile'}
                {activeTab === 'settings' && 'Manage your account and preferences'}
              </p>
            </div>
          </div>
          <div className="header-right flex items-center gap-4">
            <NotificationBell userId={user?.id} />
          </div>
        </div>

        <div className="content-area flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'listings' && <AllListings showSuccess={showSuccess} showError={showError} />}
          {activeTab === 'bookings' && <OwnerBookings showSuccess={showSuccess} showError={showError} />}
          {activeTab === 'payments' && <PaymentManagement />}
          {activeTab === 'messages' && <Messages />}
          {activeTab === 'add-listing' && <UnifiedPostingForm showSuccess={showSuccess} showError={showError} />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  );
};

export default OwnerDashboard;