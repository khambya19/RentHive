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
import Report from "./Report";
import API_BASE_URL, { SERVER_BASE_URL } from '../../config/api';
import {
  LayoutDashboard,
  PlusCircle,
  List,
  CalendarDays,
  CreditCard,
  MessageSquare,
  LogOut,
  AlertTriangle,
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
  Menu
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
  const { notifications, removeNotification, showSuccess, showError, showInfo } = useNotifications();
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize from sessionStorage
    const storedTab = sessionStorage.getItem('dashboardTab');
    return storedTab || 'overview';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [messagesCount, setMessagesCount] = useState(0);
  const [counts, setCounts] = useState({
    bookings: 0,
    payments: 0,
    messages: 0,
    reports: 0
  });

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

  const fetchUnreadMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessagesCount(data.count || 0);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAllDashboardCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [bookingsRes, paymentsRes, msgRes, reportsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/owners/all-bookings`, { headers }),
        fetch(`${API_BASE_URL}/payments/owner`, { headers }),
        fetch(`${API_BASE_URL}/messages/unread-count`, { headers }),
        fetch(`${API_BASE_URL}/reports/vendor`, { headers })
      ]);

      const [bookings, payments, msg, reports] = await Promise.all([
        bookingsRes.ok ? bookingsRes.json() : { propertyBookings: [], bikeBookings: [] },
        paymentsRes.ok ? paymentsRes.json() : [],
        msgRes.ok ? msgRes.json() : { count: 0 },
        reportsRes.ok ? reportsRes.json() : []
      ]);

      setCounts({
        bookings: (bookings.propertyBookings || []).filter(b => b.status === 'Pending').length +
          (bookings.bikeBookings || []).filter(b => b.status === 'Pending').length,
        payments: (payments || []).filter(p => p.status === 'Pending' || p.status === 'Overdue').length,
        messages: msg.count || 0,
        reports: (reports || []).filter(r => r.status === 'pending').length
      });
      setMessagesCount(msg.count || 0);
    } catch (err) {
      console.error('Error fetching owner counts:', err);
    }
  }, []);

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

  // Real-time KYC listener
  useEffect(() => {
    if (!socket || !user) return;

    socket.on('kyc-status-updated', (data) => {
      const token = localStorage.getItem('token');
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

    socket.on('new_message', () => {
      setMessagesCount(prev => prev + 1);
      showSuccess('New Message', 'You have received a new message.');
    });

    socket.on('new-notification', (notification) => {
      if (notification.type === 'booking' || notification.type === 'listing' || notification.type === 'success') {
        showSuccess(notification.title, notification.message);
      } else {
        showInfo(notification.title, notification.message);
      }
      // Refresh counts and overview stats
      fetchAllDashboardCounts();
      fetchDashboardData();
    });

    // Update rented counts instantly when server emits owner_stats_updated
    socket.on('owner_stats_updated', (data) => {
      try {
        if (data && data.breakdown) {
          setStats(prev => ({
            ...prev,
            breakdown: {
              ...(prev.breakdown || {}),
              ...data.breakdown
            }
          }));
        }
        // Ensure we refresh the full overview counts so `availableProperties` and other fields update
        // (some server emits only include rented counts). Fetch the authoritative /owners/stats endpoint.
        fetchAllDashboardCounts();
        fetchDashboardData();
      } catch (err) {
        console.error('Failed to apply owner_stats_updated:', err);
      }
    });

    socket.on('refresh_counts', () => {
      // Refresh both quick counts and the overview stats so rented/available numbers update
      fetchAllDashboardCounts();
      fetchDashboardData();
    });

    fetchUnreadMessages();
    fetchAllDashboardCounts();

    return () => {
      socket.off('kyc-status-updated');
      socket.off('new_message');
      socket.off('refresh_counts');
      socket.off('owner_stats_updated');
    };
  }, [socket, user, login, showSuccess, showError, fetchUnreadMessages, fetchAllDashboardCounts]);

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
            Welcome, {user?.fullName?.split(' ')[0] || (user?.type || user?.role || 'User')}! <span className="animate-wave origin-bottom-right inline-block">👋</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-lg font-medium">Here's your summary for today.</p>
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
        <div className="stat-card properties-card bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="icon-box p-3 bg-indigo-600/10 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
              <div className="icon-inner bg-indigo-600 text-white rounded-lg p-2"><Home size={18} /></div>
            </div>
            <span className="properties-label text-xs font-bold px-2 py-1 text-indigo-600 uppercase tracking-wide">PROPERTIES</span>
          </div>
          <div>
            {/* Prefer per-type breakdown (properties only). Fallback to aggregated fields if breakdown unavailable. */}
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-1">{stats.breakdown?.properties ?? stats.totalProperties}</h3>
            <p className="text-sm font-medium text-slate-500">{stats.breakdown?.availableProperties ?? stats.availableProperties} Available Now</p>
            <div className="mt-3 flex items-center gap-3 text-[13px]">
              <div className="flex items-center gap-2 text-emerald-600">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="font-semibold">{stats.breakdown?.availableProperties ?? stats.availableProperties ?? 0} Available</span>
              </div>
              <div className="text-slate-300">•</div>
              <div className="flex items-center gap-2 text-rose-600">
                <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                <span className="font-semibold">{stats.breakdown?.rentedProperties ?? ( (stats.breakdown?.properties ?? stats.totalProperties ?? 0) - (stats.breakdown?.availableProperties ?? stats.availableProperties ?? 0) )} Rented</span>
              </div>
            </div>
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
            <div className="mt-3 flex items-center gap-3 text-[13px]">
              <div className="flex items-center gap-2 text-emerald-600">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="font-semibold">{stats.breakdown?.availableBikes ?? 0} Available</span>
              </div>
              <div className="text-slate-300">•</div>
              <div className="flex items-center gap-2 text-rose-600">
                <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                <span className="font-semibold">{stats.breakdown?.rentedBikes ?? 0} Rented</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Status & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KYC Status Card */}
        <div className={`col-span-1 p-6 rounded-2xl border flex flex-col justify-center items-center text-center relative overflow-hidden ${user?.kycStatus === 'approved' ? 'bg-emerald-50 border-emerald-100' :
          user?.kycStatus === 'pending' ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'
          }`}>
          <div className={`p-4 rounded-full mb-3 ${user?.kycStatus === 'approved' ? 'bg-emerald-100 text-emerald-600' :
            user?.kycStatus === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
            }`}>
            <Shield size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">KYC Status</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-3 ${user?.kycStatus === 'approved' ? 'bg-emerald-200 text-emerald-800' :
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
      {/* Dashboard Notifications - Super high z-index to be above sidebar */}
      <div className="fixed top-0 left-0 w-full z-[110000] pointer-events-none">
        <DashboardNotifications
          notifications={notifications}
          onRemove={removeNotification}
        />
      </div>

      {/* Sidebar - Physically first in DOM for natural flex layout */}
      <aside
        style={{ backgroundColor: '#0f172a', zIndex: 9999 }}
        className={`
          renthive-sidebar 
          fixed lg:sticky top-0 left-0 z-[100000] lg:z-30 
          transition-transform duration-300 ease-in-out bg-[#0f172a]
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-72 flex flex-col shadow-2xl border-r border-slate-800 flex-shrink-0 h-screen
        `}
      >
        <div className="sidebar-header p-6 flex items-center gap-4 border-b border-slate-800">
          <button className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
            <Menu size={24} />
          </button>
          <div className="sidebar-brand flex items-center gap-3">
            <img
              src="/src/assets/rentHivelogo.png"
              alt="RentHive Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="brand-name text-xl font-bold tracking-tight text-white">RentHive</span>
          </div>
        </div>

        <div
          className="user-profile p-6 border-b border-slate-800 flex items-center gap-4 bg-indigo-100 rounded-2xl mx-4 mt-4 shadow-lg transition-all"
        >
          <div className="user-avatar w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg ring-4 ring-slate-800/50 overflow-hidden shadow-inner">
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
            <p className="user-name font-semibold truncate hover:text-clip text-slate-900">{user?.fullName || (user?.type || user?.role || 'User')}</p>
            <p className="user-role text-xs text-slate-500 uppercase tracking-wider font-medium">
              {user?.type === 'lessor' ? 'Lessor' : user?.type === 'vendor' ? 'Service Vendor' : 'Property Owner'}
            </p>
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
            <span className="font-medium flex-1">Bookings</span>
            {counts.bookings > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                {counts.bookings}
              </span>
            )}
          </button>

          <button
            className={`menu-item flex items-center gap-3 px-4 py-3 w-full text-left transition-all rounded-xl group ${activeTab === 'payments' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
            onClick={() => handleTabChange('payments')}
            title="Payments & Finances"
          >
            <CreditCard size={20} className={activeTab === 'payments' ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
            <span className="font-medium flex-1">Finances</span>
            {counts.payments > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                {counts.payments}
              </span>
            )}
          </button>

          <button
            className={`menu-item flex items-center gap-3 px-4 py-3 w-full text-left transition-all rounded-xl group ${activeTab === 'messages' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
            onClick={() => handleTabChange('messages')}
            title="Messages"
          >
            <MessageSquare size={20} className={activeTab === 'messages' ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
            <span className="font-medium flex-1">Messages</span>
            {messagesCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-bounce">
                {messagesCount}
              </span>
            )}
          </button>

          <button
            className={`menu-item flex items-center gap-3 px-4 py-3 w-full text-left transition-all rounded-xl group ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
            onClick={() => handleTabChange('reports')}
            title="Reports"
          >
            <AlertTriangle size={20} className={activeTab === 'reports' ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
            <span className="font-medium flex-1">Reports</span>
            {counts.reports > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                {counts.reports}
              </span>
            )}
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

        <div className="sidebar-footer p-6 border-t border-slate-800 bg-slate-900/40">
          <button className="logout-button flex items-center gap-3 w-full text-left text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-3 rounded-xl transition-all group" onClick={() => setShowLogoutModal(true)}>
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="owner-main-content flex-1 flex flex-col h-screen overflow-hidden bg-white min-w-0">
        <div className="content-header bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
          <div className="header-left flex items-center gap-4">
            {/* Mobile/Tablet Menu Toggle */}
            <button
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer relative z-[1000] active:scale-95"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={24} />
            </button>

            <div className="relative z-0">
              <h1 className="text-xl md:text-2xl font-black text-slate-800 truncate max-w-[200px] md:max-w-none flex items-center gap-2">
                {activeTab === 'overview' && 'Dashboard'}
                {activeTab === 'listings' && 'All Listings'}
                {activeTab === 'bookings' && 'Bookings'}
                {activeTab === 'payments' && 'Finance'}
                {activeTab === 'messages' && 'Messages'}
                {activeTab === 'reports' && 'Reports'}
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
          {activeTab === 'messages' && <Messages onRead={fetchUnreadMessages} />}
          {activeTab === 'reports' && <Report />}
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
          className="fixed inset-0 bg-black/60 z-[99999] lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

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
                onClick={() => { logout(); window.location.href = '/login'; }}
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

export default OwnerDashboard;