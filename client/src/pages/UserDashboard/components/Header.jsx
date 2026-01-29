import React from 'react';
import NotificationBell from '../../../components/NotificationBell';
import { useAuth } from '../../../context/AuthContext';
import { List } from 'lucide-react';

const Header = ({ activeTab, setMobileMenuOpen }) => {
  const { user } = useAuth();

  const getTitle = () => {
    switch(activeTab) {
      case 'overview': return 'Dashboard';
      case 'browse': return 'Browse Properties';
      case 'applications': return 'My Applications';
      case 'rentals': return 'My Rentals';
      case 'payments': return 'Payments';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const getSubtitle = () => {
    switch(activeTab) {
      case 'overview': return 'Welcome back! Explore properties and manage your rentals';
      case 'browse': return 'Find your perfect home or vehicle';
      case 'applications': return 'Track the status of your rental applications';
      case 'rentals': return 'Manage your active rentals and bookings';
      case 'payments': return 'View your payment history and upcoming dues';
      case 'settings': return 'Manage your account settings and preferences';
      default: return '';
    }
  };

  return (
    <div className="content-header border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm z-10 w-full" style={{ background: '#f4fbfd' }}>
      <div className="header-left flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button 
          className="lg:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100"
          onClick={() => setMobileMenuOpen(true)}
        >
          <List size={24} />
        </button>
        
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate max-w-[200px] md:max-w-none">{getTitle()}</h1>
          <p className="header-subtitle hidden md:block text-sm text-gray-500 mt-1">{getSubtitle()}</p>
        </div>
      </div>
      <div className="header-right flex items-center gap-4">
        <NotificationBell userId={user?.id} />
      </div>
    </div>
  );
};

export default Header;
