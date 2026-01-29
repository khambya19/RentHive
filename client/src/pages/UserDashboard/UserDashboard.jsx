import React, { useState } from 'react';
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
import './UserDashboard.css';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [modalProperty, setModalProperty] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handler for opening property modal from Browse
  const handleViewProperty = (property) => {
    setModalProperty(property);
  };

  // Handler for closing property modal
  const handleCloseModal = () => {
    setModalProperty(null);
  };

  return (
    <div className="user-dashboard flex h-screen min-h-screen bg-white" style={{ background: 'white' }}>
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
      <main className="main-content flex-1 flex flex-col h-screen min-h-screen overflow-x-hidden relative z-10">
          <Header
          activeTab={activeTab} 
          setMobileMenuOpen={setMobileMenuOpen}
        />
          <div className="content-area flex-1 overflow-y-auto bg-white min-h-screen w-full px-0 sm:px-0 md:px-0">
          {activeTab === 'overview' && <Overview fullWidth setActiveTab={setActiveTab} />}
          {activeTab === 'browse' && <Browse onViewProperty={handleViewProperty} />}
          {activeTab === 'applications' && <Applications />}
          {activeTab === 'saved' && <Saved />}
          {activeTab === 'report' && <Report />}
          {activeTab === 'rentals' && <Rentals />}
          {activeTab === 'payments' && <Payments />}
          {activeTab === 'settings' && <Settings />}
        </div>
        {modalProperty && (
          <PropertyModal property={modalProperty} onClose={handleCloseModal} />
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
