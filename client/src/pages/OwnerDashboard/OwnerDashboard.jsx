import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

import { useNotifications } from '../../hooks/useNotifications';
import DashboardNotifications from '../../components/DashboardNotifications';
import NotificationBell from '../../components/NotificationBell';
import PaymentManagement from '../../components/PaymentManagement';
import OwnerBookings from "./OwnerBookings";
import UnifiedPostingForm from "./UnifiedPostingForm";
import AllListings from "./AllListings";
import Settings from "../Settings/Settings";
import Messages from "./Messages";
import API_BASE_URL, { SERVER_BASE_URL } from '../../config/api';
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
  Construction,
  Shield,
  X
} from 'lucide-react';
import "./OwnerDashboard.css";

const OwnerDashboard = () => {
    useEffect(() => {
      document.body.style.background = '#d6eef5';
      return () => { document.body.style.background = ''; };
    }, []);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, login } = useAuth();
  const { socket } = useSocket();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize from sessionStorage
    const storedTab = sessionStorage.getItem('dashboardTab');
    return storedTab || 'overview';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // New state for mobile menu
  
  // Listen for tab changes from sessionStorage (for notifications)
  useEffect(() => {
    const checkTabChange = () => {
      const storedTab = sessionStorage.getItem('dashboardTab');
      if (storedTab) {
        setActiveTab(storedTab);
        sessionStorage.removeItem('dashboardTab');
      }
    };
    
    // Check immediately
    checkTabChange();
    
    // Also listen for storage events (in case notification is clicked from another tab/window)
    window.addEventListener('storage', checkTabChange);
    
    // Check periodically (as a fallback since storage event doesn't fire in same tab)
    const interval = setInterval(checkTabChange, 100);
    
    return () => {
      window.removeEventListener('storage', checkTabChange);
      clearInterval(interval);
    };
  }, []);

  // Real-time KYC listener
  useEffect(() => {
    if (!socket || !user) return;

    socket.on('kyc-status-updated', (data) => {
      // console.log('⚡ Your KYC status was updated by admin:', data.status);
      const token = localStorage.getItem('token');
      // Update local storage and context
      const updatedUser = { 
        ...user, 
        kycStatus: data.status,
        isVerified: data.isVerified 
      };
      if (typeof login === 'function') {
        login(updatedUser, token);
      }
      
      if (data.status === 'approved') {
        showSuccess('KYC Approved', 'Congratulations! You can now post listings.');
      } else {
        showError('KYC Rejected', 'Please check your documents in settings.');
      }
    });

    return () => {
      socket.off('kyc-status-updated');
    };
  }, [socket, user, login, showSuccess, showError]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    availableProperties: 0,
    totalBookings: 0,
    monthlyRevenue: 0,
    bikeRentals: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Edit mode state
  const [editData, setEditData] = useState(null);
  const [editType, setEditType] = useState(null); // 'property' or 'automobile'

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    // Clear edit data when changing tabs (except when going to add-listing)
    if (tab !== 'add-listing') {
      setEditData(null);
      setEditType(null);
    }
  };
  
  // Handle edit from AllListings
  const handleEditListing = (data, type) => {
    setEditData(data);
    setEditType(type);
    setActiveTab('add-listing'); // Switch to posting form
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
        // console.log('📊 Dashboard Stats Received:', data);
        setStats(data);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load dashboard data:', response.status, errorText);
        showError('Error', `Failed to load dashboard data: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      showError('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [navigate, showError]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const renderOverview = () => (
    <div className="overview-container w-full space-y-6">
      {/* Welcome Banner */}
      <div className="welcome-banner rounded-2xl p-5 md:p-8 flex flex-col md:flex-row flex-wrap gap-4 justify-between items-center shadow-lg relative overflow-hidden bg-gradient-to-r from-slate-700 to-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="welcome-content relative z-10 text-center md:text-left">
          <h1 className="flex items-center justify-center md:justify-start gap-2 text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">
            Welcome, {user?.fullName?.split(' ')[0] || 'Owner'}! <span className="animate-wave origin-bottom-right inline-block">👋</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-lg font-medium">Here's your rental summary for today.</p>
        </div>
        
        <button 
          className="refresh-btn relative z-10 flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold backdrop-blur-sm transition-all text-sm md:text-base border border-white/10"
          onClick={fetchDashboardData} 
          disabled={loading}
        >
          <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Properties */}
        <div className="stat-card bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
              <Home size={22} />
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">TOTAL</span>
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-1">{stats.totalProperties}</h3>
            <p className="text-sm font-medium text-slate-500">{stats.availableProperties} Available Now</p>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="stat-card bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
              <Banknote size={22} />
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">REVENUE</span>
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-1">
              <span className="text-lg text-slate-400 font-bold mr-1">NPR</span>
              {stats.monthlyRevenue.toLocaleString()}
            </h3>
            <p className="text-sm font-medium text-slate-500">This Month</p>
          </div>
        </div>

        {/* Property Bookings */}
        <div className="stat-card bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
              <CalendarCheck size={22} />
            </div>
             <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">REQUESTS</span>
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-1">{stats.totalBookings}</h3>
            <p className="text-sm font-medium text-slate-500">Property Bookings</p>
          </div>
        </div>

        {/* Bike Rentals */}
        <div className="stat-card bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
           <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 rounded-xl text-orange-600 group-hover:scale-110 transition-transform">
              <Bike size={22} />
            </div>
             <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">RENTALS</span>
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-1">{stats.bikeRentals}</h3>
            <p className="text-sm font-medium text-slate-500">Active Bike Rentals</p>
          </div>
        </div>
      </div>

      {/* KYC Status & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KYC Status Card */}
        <div className={`col-span-1 p-6 rounded-2xl border flex flex-col justify-center items-center text-center relative overflow-hidden ${
             user?.kycStatus === 'approved' ? 'bg-emerald-50 border-emerald-100' : 
             user?.kycStatus === 'pending' ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'
        }`}>
          <div className={`p-4 rounded-full mb-3 ${
             user?.kycStatus === 'approved' ? 'bg-emerald-100 text-emerald-600' : 
             user?.kycStatus === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
          }`}>
             <Shield size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">KYC Status</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-3 ${
             user?.kycStatus === 'approved' ? 'bg-emerald-200 text-emerald-800' : 
             user?.kycStatus === 'pending' ? 'bg-amber-200 text-amber-800' : 'bg-rose-200 text-rose-800'
          }`}>
            {user?.kycStatus === 'approved' ? 'Verified Account' : (user?.kycStatus?.replace('_', ' ') || 'Not Submitted')}
          </span>
          <button 
            onClick={() => setActiveTab('settings')}
            className="text-sm font-semibold underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity"
          >
            {user?.kycStatus === 'approved' ? 'View Details' : 'Complete Verification'}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
             onClick={() => setActiveTab('add-listing')}
             className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-400 hover:shadow-md transition-all group text-left"
          >
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <PlusCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Add New Listing</h3>
              <p className="text-xs text-slate-500 mt-0.5">List a property or vehicle</p>
            </div>
          </button>

          <button 
             onClick={() => handleTabChange('bookings')}
             className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all group text-left"
          >
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <CalendarDays size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Check Bookings</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage incoming requests</p>
            </div>
          </button>
          
           <button 
             onClick={() => handleTabChange('listings')}
             className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-purple-400 hover:shadow-md transition-all group text-left sm:col-span-2"
          >
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <List size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">View All Listings</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage your active details</p>
            </div>
          </button>
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
    <div className="owner-dashboard flex h-screen overflow-hidden bg-slate-50">
      {/* Dashboard Notifications - Absolute position to avoid layout shift */}
      <div className="absolute top-0 left-0 w-full z-[10002] pointer-events-none">
        <DashboardNotifications 
          notifications={notifications} 
          onRemove={removeNotification} 
        />
      </div>

      {/* Sidebar - Physically first in DOM for natural flex layout */}
      <aside 
        style={{ backgroundColor: '#0f172a', zIndex: 9999 }}
        className={`
          sidebar fixed inset-y-0 left-0 z-30 text-white transition-all duration-300 ease-in-out w-72 bg-[#465A66]
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:w-64
          w-64 flex flex-col shadow-2xl border-r border-slate-700/50 flex-shrink-0 h-full
        `}
      >
        <div className="sidebar-header p-6 flex items-center justify-between border-b border-white/10">
          <div className="sidebar-brand flex items-center gap-3">
            <div className="brand-icon-wrapper bg-indigo-500/20 p-2 rounded-lg backdrop-blur-sm border border-indigo-500/30">
              <Hexagon className="brand-icon text-indigo-400" size={24} />
            </div>
            <span className="brand-name text-xl font-bold tracking-tight text-white">RentHive</span>
          </div>
          {/* Close button removed */}
        </div>

        <div className="user-profile p-6 border-b border-slate-100 flex items-center gap-4 bg-white">
          <div className="user-avatar w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg ring-4 ring-slate-100 overflow-hidden">
            {(user?.profilePic || user?.profileImage || user?.photo) ? (
              <img 
                src={(user.profilePic || user.profileImage || user.photo).startsWith('http') 
                  ? (user.profilePic || user.profileImage || user.photo) 
                  : `${SERVER_BASE_URL}/uploads/profiles/${(user.profilePic || user.profileImage || user.photo).split('/').pop()}`} 
                alt="User" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <User size={24} />
            )}
          </div>
          <div className="user-info overflow-hidden">
            <p className="user-name font-semibold truncate hover:text-clip text-slate-900">{user?.fullName || 'Owner'}</p>
            <p className="user-role text-xs text-slate-500 uppercase tracking-wider font-medium">Property Owner</p>
          </div>
        </div>

        <nav className="sidebar-menu flex-1 py-6 overflow-y-auto custom-scrollbar px-3 space-y-1">
          <button 
            className={`menu-item flex items-center gap-3 px-4 py-3 w-full text-left transition-all rounded-xl group ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`} 
            onClick={() => handleTabChange('overview')}
            title="Overview"
          >
            <LayoutDashboard size={20} className={activeTab === 'overview' ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
            <span className="font-medium">Overview</span>
          </button>

          <button 
            className={`menu-item flex items-center gap-3 px-4 py-3 w-full text-left transition-all rounded-xl group ${activeTab === 'add-listing' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`} 
            onClick={() => handleTabChange('add-listing')}
            title="Add New Listing"
          >
            <PlusCircle size={20} className={activeTab === 'add-listing' ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
            <span className="font-medium">Add Listing</span>
          </button>

          <button 
            className={`menu-item flex items-center gap-3 px-4 py-3 w-full text-left transition-all rounded-xl group ${activeTab === 'listings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`} 
            onClick={() => handleTabChange('listings')}
            title="All Listings"
          >
            <List size={20} className={activeTab === 'listings' ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
            <span className="font-medium">All Listings</span>
          </button>

          <button 
            className={`menu-item flex items-center gap-3 px-4 py-3 w-full text-left transition-all rounded-xl group ${activeTab === 'bookings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`} 
            onClick={() => handleTabChange('bookings')}
            title="Incoming Bookings"
          >
            <CalendarDays size={20} className={activeTab === 'bookings' ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
            <span className="font-medium">Bookings</span>
          </button>

          <button 
            className={`menu-item flex items-center gap-3 px-4 py-3 w-full text-left transition-all rounded-xl group ${activeTab === 'payments' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`} 
            onClick={() => handleTabChange('payments')}
            title="Payments & Finances"
          >
            <CreditCard size={20} className={activeTab === 'payments' ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
            <span className="font-medium">Finances</span>
          </button>

          <button 
            className={`menu-item flex items-center gap-3 px-4 py-3 w-full text-left transition-all rounded-xl group ${activeTab === 'messages' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`} 
            onClick={() => handleTabChange('messages')}
            title="Messages"
          >
            <MessageSquare size={20} className={activeTab === 'messages' ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
            <span className="font-medium">Messages</span>
          </button>

          <button 
            className={`menu-item flex items-center gap-3 px-4 py-3 w-full text-left transition-all rounded-xl group ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`} 
            onClick={() => handleTabChange('settings')}
            title="Settings"
          >
            <SettingsIcon size={20} className={activeTab === 'settings' ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
            <span className="font-medium">Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer p-6 border-t border-white/10 bg-white/5">
          <button className="logout-button flex items-center gap-3 w-full text-left text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-3 rounded-xl transition-all group" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-300 bg-white">
        <div className="content-header bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
          <div className="header-left flex items-center gap-4">
             {/* Mobile/Tablet Menu Toggle */}
             <button 
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer relative z-[1000] active:scale-95"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <List size={24} color={mobileMenuOpen ? 'white' : '#4b5563'} />
            </button>

            <div className="relative z-0">
              <h1 className="text-xl md:text-2xl font-black text-slate-800 truncate max-w-[200px] md:max-w-none flex items-center gap-2">
                {activeTab === 'overview' && 'Dashboard'}
                {activeTab === 'listings' && 'All Listings'}
                {activeTab === 'bookings' && 'Bookings'}
                {activeTab === 'payments' && 'Finance'}
                {activeTab === 'messages' && 'Messages'}
                {activeTab === 'add-listing' && 'Add Listing'}
                {activeTab === 'settings' && 'Settings'}
              </h1>
            </div>
          </div>
          <div className="header-right flex items-center gap-4">
            <NotificationBell user={user} />
          </div>
        </div>

        <div className="owner-content-area flex-1 overflow-y-auto p-4 md:px-6 md:py-6 bg-slate-50 relative z-0">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'listings' && <AllListings showSuccess={showSuccess} showError={showError} onEdit={handleEditListing} />}
          {activeTab === 'bookings' && <OwnerBookings showSuccess={showSuccess} showError={showError} />}
          {activeTab === 'payments' && <PaymentManagement />}
          {activeTab === 'messages' && <Messages />}
          {activeTab === 'add-listing' && (
            <UnifiedPostingForm 
              showSuccess={showSuccess} 
              showError={showError} 
              editData={editData} 
              editType={editType} 
              onEditComplete={() => { 
                setEditData(null); 
                setEditType(null); 
                setActiveTab('listings'); 
              }} 
            />
          )}
          {activeTab === 'settings' && <Settings />}
        </div>
      </main>

      {/* Mobile Overlay - High Z-index */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[998] lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default OwnerDashboard;