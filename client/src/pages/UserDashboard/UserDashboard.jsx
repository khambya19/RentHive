import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
import API_BASE_URL from '../../config/api';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user, loading } = useAuth();
  
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
        // Ensure uniqueness
        const uniqueApps = apps.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setApplications(uniqueApps);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setApplicationsLoading(false);
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
    }
  }, [user?.id]);

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
        }
      } catch (err) {
        setSavedListings(prev => prev.filter(l => !(String(l.id) === String(listing.id) && l.type === listingType)));
        setToast({ type: 'error', message: 'Connection error' });
      }
    }
    setTimeout(() => setToast(null), 2500);
  }, [savedListings]);

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
    // console.log("Reporting:", property.title || property.name);
    // Future: Open Report Modal
  }, []);

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
      const response = await fetch(`${API_BASE_URL}/bookings/apply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          listingId: listing.id,
          listingType: type || (listing.title ? 'property' : 'bike'),
          startDate: bookingDetails.startDate,
          endDate: bookingDetails.endDate,
          duration: bookingDetails.duration,
          totalAmount: bookingDetails.grandTotal
        })
      });
      
      if (response.ok) {
        setConfirmationData(null);
        setSelectedListing(null);
        setActiveTab('applications');
        hasFetchedApplications.current = false;
        fetchApplications(true);
        showToast('Application submitted! Owner will review your request.', 'success');
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to submit application', 'error');
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

      // Close modal and switch to messages tab
      setModalProperty(null);
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
        savedCount={savedListings.length}
        applicationsCount={applications.filter(a => (a.status || '').toLowerCase() === 'pending').length}
      />
      <main className="main-content flex-1 flex flex-col h-screen overflow-hidden relative min-w-0 z-0 bg-slate-50" style={{ width: '100%', maxWidth: '100%' }}>
        <Header
          activeTab={activeTab} 
          setMobileMenuOpen={handleSetMobileMenuOpen}
          mobileMenuOpen={mobileMenuOpen}
        />
        <div className="flex-1 overflow-y-auto bg-linear-to-br from-slate-50 via-white to-blue-50/30">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {activeTab === 'overview' && (
              <Overview 
                fullWidth 
                setActiveTab={setActiveTab} 
                stats={{
                  activeRentals: rentals.length,
                  pendingApplications: applications.filter(a => a.status === 'Pending').length,
                  savedListings: savedListings.length,
                  totalPayments: rentals.reduce((sum, r) => sum + (r.cost || 0), 0) // Basic estimation
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
              />
            )}
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
            {activeTab === 'messages' && <UserMessages />}
            {/* Toast UI */}
            {toast && (
              <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-9999 px-6 py-3 rounded-xl shadow-lg font-bold text-sm transition-all animate-in fade-in duration-300 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
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
        <div className="fixed inset-0 md:left-20 xl:left-64 bg-white z-[10001] animate-in fade-in zoom-in duration-300 overflow-hidden flex flex-col">
          <ListingDetail 
            listing={selectedListing} 
            onBack={handleCloseDetail}
            onToggleSave={handleToggleSave}
            isSaved={savedListings.some(l => String(l.id) === String(selectedListing.id) && l.type === (selectedListing.type || (selectedListing.dailyRate ? 'bike' : 'property')))}
            onReport={handleReport}
            onBook={handleBook}
            onUpdateApplication={handleUpdateApplication}
            onCancelApplication={handleCancelApplication}
          />
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
