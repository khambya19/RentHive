import React from 'react';
import NotificationBell from '../../../components/NotificationBell';
import { useAuth } from '../../../context/AuthContext';
import { List } from 'lucide-react';

const Header = ({ activeTab, setMobileMenuOpen, mobileMenuOpen }) => {
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
    <div className="content-header bg-white/80 backdrop-blur-md border-b border-gray-200/60 px-6 py-4 flex justify-between items-center shadow-sm relative z-30">
      <div className="header-left flex items-center gap-4">
        {/* Mobile/Tablet Menu Toggle */}
        <button 
          className="xl:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer relative z-[1000] active:scale-95"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <List size={24} />
        </button>
        
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 truncate">{getTitle()}</h1>
          <p className="header-subtitle hidden md:block text-sm text-slate-500 mt-0.5">{getSubtitle()}</p>
        </div>
      </div>
      <div className="header-right flex items-center gap-4">
        <NotificationBell user={user} />
      </div>
    </div>
  );
};

export default Header;
