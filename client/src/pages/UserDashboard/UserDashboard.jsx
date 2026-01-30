import React, { useState, useEffect } from 'react';
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
import PropertyModal from './components/PropertyModal';
import UserMessages from './components/UserMessages';
import './UserDashboard.css';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize from sessionStorage
    const storedTab = sessionStorage.getItem('dashboardTab');
    ;
  const [modalProperty, setModalProperty] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Listen for tab changes from sessionStorage (for notifications)
  useEffect(() => {
    const checkTabChange = () => {
      const storedTab = sessionStorage.getItem('dashboardTab');
      if (storedTab) {
        setActiveTab(storedTab);
        
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

  // Handler for opening property modal from Browse
  const handleViewProperty = (property) => {
    setModalProperty(property);
  };

  // Handler for closing property modal
  const handleCloseModal = () => {
    setModalProperty(null);
  };

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
    <div className="user-dashboard flex h-screen min-h-screen bg-white overflow-hidden" style={{ background: 'white' }}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setMobileMenuOpen(false);
        }} 
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      <main className="main-content flex-1 flex flex-col h-screen min-h-screen overflow-hidden relative">
          <Header
          activeTab={activeTab} 
          setMobileMenuOpen={setMobileMenuOpen}
        />
          <div className="content-area flex-1 overflow-y-auto bg-white min-h-screen w-full px-0">
          {activeTab === 'overview' && <Overview fullWidth setActiveTab={setActiveTab} />}
          {activeTab === 'browse' && <Browse onViewProperty={handleViewProperty} />}
          {activeTab === 'applications' && <Applications />}
          {activeTab === 'saved' && <Saved />}
          {activeTab === 'report' && <Report />}
          {activeTab === 'rentals' && <Rentals />}
          {activeTab === 'messages' && <UserMessages />}
          {activeTab === 'payments' && <Payments />}
          {activeTab === 'settings' && <Settings />}
        </div>
        {modalProperty && (
          <PropertyModal 
            property={modalProperty} 
            onClose={handleCloseModal} 
            onContactOwner={handleContactOwner}
          />
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
