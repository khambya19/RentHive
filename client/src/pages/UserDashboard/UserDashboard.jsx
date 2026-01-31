import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './components/Overview';
import Browse from './components/Browse';
import Applications from './components/Applications';
import Rentals from './components/Rentals';
import Payments from './components/Payments';
import Settings from '../Settings/Settings';
import Saved from './components/Saved';
import Report from './components/Report';
import UserMessages from './components/UserMessages';
import ListingDetail from './components/ListingDetail';
import PropertyModal from './components/PropertyModal';
import PaymentModal from './components/PaymentModal';
import BookingConfirmationModal from './components/BookingConfirmationModal';
import ReportModal from './components/ReportModal';
import API_BASE_URL from '../../config/api';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user, loading, logout } = useAuth();
  // Tab and UI State
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize from sessionStorage
    const storedTab = sessionStorage.getItem('dashboardTab');
    return storedTab || 'overview';
  });
  const [selectedListing, setSelectedListing] = useState(null);
  const [modalProperty, setModalProperty] = useState(null); // Keep for backwards compatibility if needed
  const [bookingData, setBookingData] = useState(null);
  const [confirmationData, setConfirmationData] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [itemToReport, setItemToReport] = useState(null);
  const [toast, setToast] = useState(null);

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

  // Data States
  const [marketProperties, setMarketProperties] = useState([]);
  const [marketBikes, setMarketBikes] = useState([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [rentals, setRentals] = useState([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  const [savedListings, setSavedListings] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [counts, setCounts] = useState({
    applications: 0,
    rentals: 0,
    payments: 0,
    messages: 0,
    saved: 0,
    reports: 0
  });
  const { socket } = useSocket(); /* Move socket access up */

  // Fetch Guards
  const hasFetchedMarketData = React.useRef(false);
  const hasFetchedApplications = React.useRef(false);
  const hasFetchedRentals = React.useRef(false);
  const hasFetchedSavedListings = React.useRef(false);
  const isViewingDetails = React.useRef(false);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // --- Fetching Methods ---

  const fetchMarketListings = useCallback(async (force = false) => {
    if (hasFetchedMarketData.current && !force) return;
    setMarketLoading(true);
    hasFetchedMarketData.current = true;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const headers = { 'Authorization': `Bearer ${token}` };
      const [propsRes, bikesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/properties/available`, { headers }),
        fetch(`${API_BASE_URL}/bikes/available`, { headers })
      ]);
      if (propsRes.ok) {
        const data = await propsRes.json();
        setMarketProperties(Array.isArray(data) ? data : []);
      }
      if (bikesRes.ok) {
        const data = await bikesRes.json();
        setMarketBikes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Market Fetch Error:', error);
    } finally {
      setMarketLoading(false);
    }
  }, []);

  const fetchApplications = useCallback(async (force = false) => {
    /* ... existing application fetch logic ... */
    if (hasFetchedApplications.current && !force) return;
    setApplicationsLoading(true);
    hasFetchedApplications.current = true;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/bookings/my-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const apps = Array.isArray(data) ? data : [];
        const uniqueApps = apps.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setApplications(uniqueApps);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setApplicationsLoading(false);
    }
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

  const fetchRentals = useCallback(async (force = false) => {
    if (hasFetchedRentals.current && !force) return;
    setRentalsLoading(true);
    hasFetchedRentals.current = true;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/my-rentals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRentals(Array.isArray(data.rentals) ? data.rentals : []);
        setTotalPaid(data.totalPaid || 0);
      }
    } catch (error) {
      console.error('Failed to fetch rentals', error);
    } finally {
      setRentalsLoading(false);
    }
  }, []);

  const fetchSavedListings = useCallback(async (force = false) => {
    if (hasFetchedSavedListings.current && !force) return;
    hasFetchedSavedListings.current = true;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/users/saved-listings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const props = (data.properties || []).map(p => ({ ...p, type: 'property' }));
        const bikes = (data.bikes || []).map(b => ({ ...b, type: 'bike' }));
        // Ensure uniqueness when setting state
        const combined = [...props, ...bikes];
        const unique = combined.filter((v, i, a) => a.findIndex(t => (t.id === v.id && t.type === v.type)) === i);
        setSavedListings(unique);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('❌ Server returned error for saved-listings:', res.status, errData);
      }
    } catch (err) {
      console.error('❌ Network error fetching saved listings:', err);
    }
  }, []);

  // --- Tab-Based Lazy Fetching ---
  // Only fetch data when the user actually navigates to the tab
  useEffect(() => {
    if (!user?.id) return;

    // Fetch initial data if not already done
    if (!hasFetchedSavedListings.current) {
      fetchSavedListings();
    }

    // Lazy load other sections based on navigation
    // Use guards directly in effect to be 100% safe
    if (activeTab === 'browse' && !hasFetchedMarketData.current) {
      fetchMarketListings();
    }
    if (activeTab === 'applications' && !hasFetchedApplications.current) {
      fetchApplications();
    }
    if (activeTab === 'rentals' && !hasFetchedRentals.current) {
      fetchRentals();
    }
    if (activeTab === 'overview') {
      if (!hasFetchedApplications.current) fetchApplications();
      if (!hasFetchedRentals.current) fetchRentals();
    }
  }, [activeTab, user?.id, fetchMarketListings, fetchApplications, fetchRentals, fetchSavedListings]);

  // Handle initial transition state
  useEffect(() => {
    if (user?.id) {
      // Mark initial load as "done" when we have a user
      setIsInitialLoadDone(true);
      fetchUnreadMessages(); /* Initial fetch */
      fetchAllDashboardCounts();
    }
  }, [user?.id, fetchUnreadMessages]);

  const fetchAllDashboardCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      const [appsRes, rentalsRes, paymentsRes, msgRes, savedRes, reportsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/bookings/my-applications`, { headers }),
        fetch(`${API_BASE_URL}/users/my-rentals`, { headers }),
        fetch(`${API_BASE_URL}/payments/tenant`, { headers }),
        fetch(`${API_BASE_URL}/messages/unread-count`, { headers }),
        fetch(`${API_BASE_URL}/users/saved-listings`, { headers }),
        fetch(`${API_BASE_URL}/reports/my-reports`, { headers })
      ]);

      const [apps, rentalsData, payments, msg, saved, reports] = await Promise.all([
        appsRes.ok ? appsRes.json() : [],
        rentalsRes.ok ? rentalsRes.json() : { rentals: [] },
        paymentsRes.ok ? paymentsRes.json() : [],
        msgRes.ok ? msgRes.json() : { count: 0 },
        savedRes.ok ? savedRes.json() : { properties: [], bikes: [] },
        reportsRes.ok ? reportsRes.json() : []
      ]);

      setCounts({
        applications: (apps || []).filter(a => (a.status || '').toLowerCase() === 'pending').length,
        rentals: (rentalsData.rentals || []).length,
        payments: (payments || []).filter(p => p.status === 'Pending' || p.status === 'Overdue').length,
        messages: msg.count || 0,
        saved: (saved.properties?.length || 0) + (saved.bikes?.length || 0),
        reports: (reports || []).filter(r => r.status === 'pending').length
      });
      setMessagesCount(msg.count || 0);
    } catch (err) {
      console.error('Error fetching all counts:', err);
    }
  }, []);

  // Real-time Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', () => {
      setMessagesCount(prev => prev + 1);
      showToast('New message received!', 'info');
    });

    socket.on('booking_updated', () => {
      fetchApplications(true);
      // Optionally refresh rentals if status changed to active
      fetchRentals(true);
      showToast('Booking status updated', 'info');
    });

    socket.on('refresh_counts', () => {
      fetchAllDashboardCounts();
    });

    return () => {
      socket.off('new_message');
      socket.off('booking_updated');
      socket.off('refresh_counts');
    };
  }, [socket, fetchApplications, fetchRentals, showToast, fetchAllDashboardCounts]);

  // --- Handlers ---

  const handleToggleSave = useCallback(async (listing) => {
    if (!listing) return;
    const listingType = listing.type || (listing.dailyRate ? 'bike' : 'property');
    const isSaved = savedListings.some(l => String(l.id) === String(listing.id) && l.type === listingType);

    if (isSaved) {
      // Unsave Logic
      setSavedListings(prev => prev.filter(l => !(String(l.id) === String(listing.id) && l.type === listingType)));
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/users/unsave-listing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ listingId: listing.id, listingType: listingType })
        });
        if (!res.ok) {
          setSavedListings(prev => [...prev, listing]);
          setToast({ type: 'error', message: 'Failed to remove from favorites' });
        } else {
          setToast({ type: 'success', message: 'Removed from favorites' });
          // Refresh counts
          fetchAllDashboardCounts();
        }
      } catch (err) {
        setSavedListings(prev => [...prev, listing]);
        setToast({ type: 'error', message: 'Connection error' });
      }
    } else {
      // Save Logic
      const simplifiedListing = { ...listing, type: listingType };
      setSavedListings(prev => {
        // Double check for uniqueness in state
        if (prev.some(l => String(l.id) === String(listing.id) && l.type === listingType)) return prev;
        return [...prev, simplifiedListing];
      });

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/users/save-listing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ listingId: listing.id, listingType: listingType })
        });
        if (!res.ok) {
          setSavedListings(prev => prev.filter(l => !(String(l.id) === String(listing.id) && l.type === listingType)));
          setToast({ type: 'error', message: 'Failed to add to favorites' });
        } else {
          setToast({ type: 'success', message: 'Added to favorites' });
          // Refresh counts
          fetchAllDashboardCounts();
        }
      } catch (err) {
        setSavedListings(prev => prev.filter(l => !(String(l.id) === String(listing.id) && l.type === listingType)));
        setToast({ type: 'error', message: 'Connection error' });
      }
    }
    setTimeout(() => setToast(null), 2500);
  }, [savedListings, fetchAllDashboardCounts]);

  const handleUnsaveListing = handleToggleSave;
  const handleSaveListing = handleToggleSave;

  // Culprit Fix: Memoize the KYC check so the Browse component doesn't 
  // get destroyed every time the user object updates (e.g. notifications sync)
  const isKycApproved = React.useMemo(() => user?.kycStatus === 'approved', [user?.kycStatus]);

  // Handler for opening property detailed view from Browse
  const handleViewProperty = useCallback((listing) => {
    // Prevent multiple rapid clicks
    if (isViewingDetails.current) return;
    isViewingDetails.current = true;

    // Better type detection: properties have 'title', bikes have 'dailyRate' or 'brand'
    const type = listing.type || (listing.dailyRate ? 'bike' : 'property');
    // Set immediately with available data to show detail view
    setSelectedListing({ ...listing, type });

    // Reset after a short delay
    setTimeout(() => {
      isViewingDetails.current = false;
    }, 500);
  }, []);

  const handleEnquire = useCallback((property) => {
    // console.log("Enquiring about:", property.title || property.name);
    // Future: Open Chat or Inquiry Modal
  }, []);

  const handleReport = useCallback((property) => {
    setItemToReport(property);
    setReportModalOpen(true);
  }, []);

  const handleReportSuccess = useCallback((message) => {
    setReportModalOpen(false);
    setItemToReport(null);
    showToast(message || 'Report submitted successfully', 'success');
    fetchAllDashboardCounts();
  }, [fetchAllDashboardCounts, showToast]);

  const handleBook = useCallback((propertyWithBookingDetails) => {
    console.log("Booking initiated:", propertyWithBookingDetails);
    // Show confirmation modal instead of submitting immediately
    setConfirmationData(propertyWithBookingDetails);
  }, []);

  const handleConfirmBooking = useCallback(async () => {
    if (!confirmationData) return;

    try {
      const token = localStorage.getItem('token');
      const { bookingDetails, type, ...listing } = confirmationData;

      // Submit booking application
      const rawType = type || (listing.title ? 'property' : 'bike');
      const normalizedType = (rawType === 'automobile' || rawType === 'bike') ? 'bike' : 'property';

      const response = await fetch(`${API_BASE_URL}/bookings/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          listingId: listing.id,
          listingType: normalizedType,
          startDate: bookingDetails.startDate,
          endDate: bookingDetails.endDate,
          duration: bookingDetails.duration,
          totalAmount: bookingDetails.grandTotal || 0
        })
      });

      if (response.ok) {
        setConfirmationData(null);
        setSelectedListing(null);
        setActiveTab('applications');
        hasFetchedApplications.current = false;
        fetchApplications(true);
        fetchAllDashboardCounts();
        showToast('Application submitted! Owner will review your request.', 'success');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Booking Application Failed:', errorData);

        let displayMessage = errorData.message || 'Failed to submit application';
        if (displayMessage.includes('already has a booking')) {
          displayMessage = 'These dates are already reserved or paid for by another user. Please choose different dates.';
        }

        showToast(displayMessage, 'error');
      }
    } catch (error) {
      console.error('Booking error:', error);
      showToast('Failed to submit application. Please try again.', 'error');
    }
  }, [confirmationData, fetchApplications, showToast]);

  const handlePaymentComplete = useCallback(() => {
    setBookingData(null);
    setActiveTab('rentals');
  }, []);

  const handlePaymentInitiate = useCallback((application) => {
    console.log("Initiating payment for application:", application);
    // Convert application to booking data format for PaymentModal
    setBookingData({
      ...application,
      bookingDetails: {
        startDate: application.startDate,
        endDate: application.endDate,
        duration: application.duration,
        grandTotal: application.grandTotal || application.totalAmount
      },
      applicationId: application.id
    });
  }, []);

  const handleViewApplicationDetails = useCallback((application) => {
    console.log("Viewing application details:", application);
    // Show the listing details in PropertyModal
    setSelectedListing(application);
  }, []);

  // const handleToggleSave = useCallback((_property) => {
  //   // Future: Call API to save/unsave
  // }, []);

  // Handler for closing property detail view
  const handleCloseDetail = useCallback(() => {
    setSelectedListing(null);
  }, []);

  const handleSetActiveTab = useCallback((tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setSelectedListing(null);
  }, []);

  const handleSetMobileMenuOpen = useCallback((isOpen) => {
    setMobileMenuOpen(isOpen);
  }, []);

  const handleRefreshMarket = useCallback(() => {
    fetchMarketListings(true);
  }, [fetchMarketListings]);

  const handleRefreshApplications = useCallback(() => {
    fetchApplications(true);
  }, [fetchApplications]);

  const handleRefreshRentals = useCallback(() => {
    fetchRentals(true);
  }, [fetchRentals]);

  const handleUpdateApplication = useCallback(async (appId, updatedDetails) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/bookings/applications/${appId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedDetails)
      });
      if (response.ok) {
        showToast('Application updated successfully', 'success');
        hasFetchedApplications.current = false;
        fetchApplications(true);
        setSelectedListing(null); // Close modal
      } else {
        const error = await response.json();
        showToast(error.message, 'error');
      }
    } catch (err) {
      showToast('Failed to update application', 'error');
    }
  }, [fetchApplications, showToast]);

  const handleCancelApplication = useCallback(async (appId) => {
    if (!window.confirm("Are you sure you want to cancel this application?")) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/bookings/applications/${appId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        showToast('Application cancelled', 'success');
        hasFetchedApplications.current = false;
        fetchApplications(true);
        setSelectedListing(null);
      } else {
        const error = await response.json();
        showToast(error.message, 'error');
      }
    } catch (err) {
      showToast('Failed to cancel application', 'error');
    }
  }, [fetchApplications, showToast]);

  // Prevent rendering until user is loaded
  if (loading || !user) {
    return <div className="flex items-center justify-center h-screen text-xl text-gray-500">Loading...</div>;
  }

  // Handler for contacting owner - open messages and start conversation
  const handleContactOwner = async (property) => {
    try {
      // Send initial message to start conversation
      const token = localStorage.getItem('token');
      const API_BASE_URL = (await import('../../config/api')).default;

      const initialMessage = `Hi! I'm interested in your ${property.type === 'property' ? 'property' : 'bike'}: ${property.title || property.brand || ''}. Could you provide more details?`;

      await fetch(`${API_BASE_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: property.vendorId,
          message: initialMessage,
          propertyId: property.type === 'property' ? property.id : null,
          bikeId: property.type === 'bike' ? property.id : null
        })
      });

      // Close modal and detail view, then switch to messages tab
      setModalProperty(null);
      setSelectedListing(null);
      setActiveTab('messages');
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  return (
    <div className="user-dashboard flex h-screen min-h-screen bg-slate-50 overflow-hidden relative">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={handleSetMobileMenuOpen}
        savedCount={counts.saved}
        applicationsCount={counts.applications}
        messagesCount={counts.messages}
        rentalsCount={counts.rentals}
        paymentsCount={counts.payments}
        reportsCount={counts.reports}
        setShowLogoutModal={setShowLogoutModal}
      />
      <main className="user-main-content flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 relative min-w-0">
        <Header
          activeTab={activeTab}
          setMobileMenuOpen={handleSetMobileMenuOpen}
          mobileMenuOpen={mobileMenuOpen}
        />
        <div className="flex-1 overflow-y-auto bg-linear-to-br from-slate-50 via-white to-blue-50/30 px-6 sm:px-10 py-6">
          <div className="w-full max-w-full">
            {activeTab === 'overview' && (
              <Overview
                fullWidth
                setActiveTab={setActiveTab}
                stats={{
                  activeRentals: rentals.length,
                  pendingApplications: applications.filter(a => a.status === 'Pending').length,
                  savedListings: savedListings.length,
                  totalPayments: totalPaid
                }}
              />
            )}
            {/* Browse - Requires KYC */}
            {activeTab === 'browse' && (
              isKycApproved ? (
                <Browse
                  onViewProperty={handleViewProperty}
                  properties={marketProperties}
                  bikes={marketBikes}
                  loading={marketLoading}
                  onRefresh={handleRefreshMarket}
                  savedListings={savedListings}
                  onSave={handleSaveListing}
                  onUnsave={handleUnsaveListing}
                />
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center max-w-2xl mx-auto">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🔐</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">KYC Verification Required</h2>
                  <p className="text-gray-600 mb-6">
                    To browse and view property listings, you need to complete your KYC verification first.
                    This helps us ensure a safe and trusted community.
                  </p>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
                  >
                    Complete Verification Now
                  </button>
                </div>
              )
            )}
            {/* Applications - Requires KYC */}
            {activeTab === 'applications' && (
              isKycApproved ? (
                <Applications
                  onPaymentInitiate={handlePaymentInitiate}
                  onViewDetails={handleViewApplicationDetails}
                  applications={applications}
                  loading={applicationsLoading}
                  onRefresh={handleRefreshApplications}
                  onCancelApplication={handleCancelApplication}
                />
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center max-w-2xl mx-auto">
                  <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">📋</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Verification Needed</h2>
                  <p className="text-gray-600 mb-6">
                    You need to verify your identity before you can submit rental applications.
                    Complete your KYC verification in Settings.
                  </p>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all"
                  >
                    Verify Identity
                  </button>
                </div>
              )
            )}
            {/* Rentals */}
            {activeTab === 'rentals' && (
              <Rentals
                rentals={rentals}
                loading={rentalsLoading}
                onRefresh={handleRefreshRentals}
                setActiveTab={setActiveTab}
                showToast={showToast}
              />
            )}
            {/* Payments */}
            {activeTab === 'payments' && <Payments />}
            {/* Saved */}
            {activeTab === 'saved' && (
              <Saved
                savedListings={savedListings}
                handleUnsaveListing={handleUnsaveListing}
                onViewProperty={handleViewProperty}
              />
            )}
            {/* Settings */}
            {activeTab === 'settings' && <Settings />}
            {/* Report */}
            {activeTab === 'report' && <Report />}
            {/* Messages */}
            {activeTab === 'messages' && <UserMessages onRead={fetchUnreadMessages} />}
            {/* Toast UI */}
            {toast && (
              <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[120000] px-6 py-3 rounded-xl shadow-lg font-bold text-sm transition-all animate-in fade-in duration-300 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                {toast.message}
              </div>
            )}
          </div>
        </div>
        {bookingData && (
          <PaymentModal
            bookingData={bookingData}
            onClose={() => setBookingData(null)}
            onPaymentComplete={handlePaymentComplete}
          />
        )}
        {confirmationData && (
          <BookingConfirmationModal
            listing={confirmationData}
            bookingDetails={confirmationData.bookingDetails}
            onConfirm={handleConfirmBooking}
            onCancel={() => setConfirmationData(null)}
          />
        )}
      </main>

      {/* Full Screen Overlay for Details - High Z-Index to cover Sidebar */}
      {selectedListing && (
        <div className="fixed inset-0 lg:left-72 bg-white z-[10001] animate-in fade-in zoom-in duration-300 overflow-hidden flex flex-col">
          <ListingDetail
            listing={selectedListing}
            onBack={handleCloseDetail}
            onToggleSave={handleToggleSave}
            isSaved={savedListings.some(l => String(l.id) === String(selectedListing.id) && l.type === (selectedListing.type || (selectedListing.dailyRate ? 'bike' : 'property')))}
            onReport={handleReport}
            onBook={handleBook}
            onChat={handleContactOwner}
            onUpdateApplication={handleUpdateApplication}
            onCancelApplication={handleCancelApplication}
          />
        </div>
      )}

      {/* Modals - Must be at root level for proper Z-Index stacking */}
      {bookingData && (
        <div className="fixed inset-0 z-[10005]">
          <PaymentModal
            bookingData={bookingData}
            onClose={() => setBookingData(null)}
            onPaymentComplete={handlePaymentComplete}
          />
        </div>
      )}

      {confirmationData && (
        <div className="fixed inset-0 z-[10005]">
          <BookingConfirmationModal
            listing={confirmationData}
            bookingDetails={confirmationData.bookingDetails}
            onConfirm={handleConfirmBooking}
            onCancel={() => setConfirmationData(null)}
          />
        </div>
      )}

      {reportModalOpen && itemToReport && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          item={itemToReport}
          onReportSuccess={handleReportSuccess}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
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

export default UserDashboard;
