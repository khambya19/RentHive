
import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  Key, 
  CreditCard, 
  Settings as SettingsIcon, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Hexagon,
  Heart,
  Flag,
  MessageSquare
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, collapsed, mobileMenuOpen, setMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside 
        className={`
          sidebar fixed inset-y-0 left-0 z-50 text-white transition-transform duration-300 ease-in-out bg-[#465A66] flex flex-col
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0
          ${collapsed ? 'w-64 sm:w-20' : 'w-64 sm:w-72'}
        `}
        style={{ minWidth: collapsed ? 80 : 288, maxWidth: 288 }}
      >
      <div className="sidebar-header p-6 flex items-center justify-between border-b border-white/10">
        <div className="sidebar-brand flex items-center gap-3">
          <div className="brand-icon-wrapper p-2 rounded-lg" style={{ background: 'rgba(244,251,253,0.10)' }}>
            <Hexagon className="brand-icon text-white" size={24} />
          </div>
          {!collapsed && <span className="brand-name text-xl font-bold tracking-tight">RentHive</span>}
        </div>
        
        {/* Mobile Close Button */}
        <button 
          className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          onClick={() => setMobileMenuOpen(false)}
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="user-profile p-6 border-b border-white/10 flex items-center gap-4">
        <div className="user-avatar w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg" style={{ background: 'rgba(244,251,253,0.10)' }}>
          {user?.photo ? <img src={user.photo} alt="User" className="w-full h-full rounded-full object-cover" /> : (user?.fullName?.[0] || 'U')}
        </div>
        {!collapsed && (
          <div className="user-info overflow-hidden">
            <p className="user-name font-semibold truncate hover:text-clip">{user?.fullName || 'User'}</p>
            <p className="user-role text-xs text-gray-400 uppercase tracking-wider">Tenant</p>
          </div>
        )}
      </div>

      <nav className="sidebar-menu flex-1 py-6 overflow-y-auto custom-scrollbar">
        <button 
          className={`menu-item flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${activeTab === 'overview' ? 'text-white border-r-4 border-indigo-400' : 'text-gray-400 hover:text-white'}`} style={activeTab === 'overview' ? { background: 'rgba(248,250,252,0.10)' } : {}} 
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard size={20} />
          {!collapsed && <span className="font-medium">Overview</span>}
        </button>

        <button 
          className={`menu-item flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${activeTab === 'browse' ? 'text-white border-r-4 border-indigo-400' : 'text-gray-400 hover:text-white'}`} style={activeTab === 'browse' ? { background: 'rgba(248,250,252,0.10)' } : {}} 
          onClick={() => setActiveTab('browse')}
        >
          <Search size={20} />
          {!collapsed && <span className="font-medium">Browse Properties</span>}
        </button>

        <button 
          className={`menu-item flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${activeTab === 'applications' ? 'text-white border-r-4 border-indigo-400' : 'text-gray-400 hover:text-white'}`} style={activeTab === 'applications' ? { background: 'rgba(248,250,252,0.10)' } : {}} 
          onClick={() => setActiveTab('applications')}
        >
          <FileText size={20} />
          {!collapsed && <span className="font-medium">My Applications</span>}
        </button>

        {/* Saved Section */}
        <button 
          className={`menu-item flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${activeTab === 'saved' ? 'text-white border-r-4 border-indigo-400' : 'text-gray-400 hover:text-white'}`} style={activeTab === 'saved' ? { background: 'rgba(248,250,252,0.10)' } : {}} 
          onClick={() => setActiveTab('saved')}
        >
          <Heart size={20} />
          {!collapsed && <span className="font-medium">Saved</span>}
        </button>

        {/* Report Section */}
        <button 
          className={`menu-item flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${activeTab === 'report' ? 'text-white border-r-4 border-indigo-400' : 'text-gray-400 hover:text-white'}`} style={activeTab === 'report' ? { background: 'rgba(248,250,252,0.10)' } : {}} 
          onClick={() => setActiveTab('report')}
        >
          <Flag size={20} />
          {!collapsed && <span className="font-medium">Report</span>}
        </button>

        <button 
          className={`menu-item flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${activeTab === 'rentals' ? 'text-white border-r-4 border-indigo-400' : 'text-gray-400 hover:text-white'}`} style={activeTab === 'rentals' ? { background: 'rgba(248,250,252,0.10)' } : {}} 
          onClick={() => setActiveTab('rentals')}
        >
          <Key size={20} />
          {!collapsed && <span className="font-medium">My Rentals</span>}
        </button>

        <button 
          className={`menu-item flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${activeTab === 'messages' ? 'text-white border-r-4 border-indigo-400' : 'text-gray-400 hover:text-white'}`} style={activeTab === 'messages' ? { background: 'rgba(248,250,252,0.10)' } : {}} 
          onClick={() => setActiveTab('messages')}
        >
          <MessageSquare size={20} />
          {!collapsed && <span className="font-medium">Messages</span>}
        </button>

        <button 
          className={`menu-item flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${activeTab === 'payments' ? 'text-white border-r-4 border-indigo-400' : 'text-gray-400 hover:text-white'}`} style={activeTab === 'payments' ? { background: 'rgba(248,250,252,0.10)' } : {}} 
          onClick={() => setActiveTab('payments')}
        >
          <CreditCard size={20} />
          {!collapsed && <span className="font-medium">Payments</span>}
        </button>

        <button 
          className={`menu-item flex items-center gap-3 px-6 py-3 w-full text-left transition-colors ${activeTab === 'settings' ? 'text-white border-r-4 border-indigo-400' : 'text-gray-400 hover:text-white'}`} style={activeTab === 'settings' ? { background: 'rgba(248,250,252,0.10)' } : {}} 
          onClick={() => setActiveTab('settings')}
        >
          <SettingsIcon size={20} />
          {!collapsed && <span className="font-medium">Settings</span>}
        </button>
      </nav>

      <div className="sidebar-footer p-6 border-t border-white/10">
        <button
          className="logout-button flex items-center gap-3 w-full text-left text-gray-400 hover:text-white p-3 rounded-lg transition-colors"
          style={{ background: 'rgba(248,250,252,0.05)' }}
          onClick={() => {
            if (window.confirm('Are you sure you want to logout?')) {
              logout();
              navigate('/login');
            }
          }}
        >
          <LogOut size={20} />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
