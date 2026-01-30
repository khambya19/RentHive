
import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SERVER_BASE_URL } from '../../../config/api';
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  Key, 
  CreditCard, 
  Settings as SettingsIcon, 
  LogOut, 
  Hexagon,
  Heart,
  Flag,
  User,
  MessageSquare
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, collapsed, mobileMenuOpen, setMobileMenuOpen, savedCount = 0, applicationsCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[9998] lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside 
        style={{ backgroundColor: '#0f172a', zIndex: 9999 }}
        className={`
          fixed inset-y-0 left-0 
          text-white transition-all duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          
          /* MD: FIXED Sidebar - Icon only by default, expands OVER content */
          md:translate-x-0 md:fixed md:inset-y-0 md:left-0 md:z-[9999]
          ${mobileMenuOpen ? 'md:w-64' : 'md:w-20'}

          /* XL: RELATIVE Sidebar - Pushes content, always expanded */
          xl:relative xl:w-64 xl:translate-x-0 xl:z-auto

          flex flex-col shadow-2xl border-r border-slate-700/50 flex-shrink-0 h-full overflow-hidden
        `}
      >
        <div className="sidebar-header p-6 flex items-center justify-center xl:justify-between border-b border-white/10 h-20">
          <div className="sidebar-brand flex items-center gap-3">
            <div className="brand-icon-wrapper bg-indigo-500/20 p-2 rounded-lg backdrop-blur-sm border border-indigo-500/30 shrink-0">
              <Hexagon className="brand-icon text-indigo-400" size={24} />
            </div>
            <span className={`brand-name text-xl font-bold tracking-tight text-white md:hidden xl:block ${mobileMenuOpen ? '!block' : ''}`}>RentHive</span>
          </div>
        </div>

        <div className={`user-profile p-4 xl:p-6 border-b border-slate-100 flex items-center gap-4 bg-white md:justify-center xl:justify-start h-24 xl:h-auto ${mobileMenuOpen ? '!justify-start !px-6' : ''}`}>
          <div className="user-avatar w-10 h-10 xl:w-12 xl:h-12 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg ring-4 ring-slate-100 overflow-hidden">
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
          <div className={`user-info overflow-hidden md:hidden xl:block ${mobileMenuOpen ? '!block' : ''}`}>
            <p className="user-name font-semibold truncate hover:text-clip text-slate-900">{user?.fullName || 'Tenant'}</p>
            <p className="user-role text-xs text-slate-500 uppercase tracking-wider font-medium">Tenant</p>
          </div>
        </div>

        <nav className="sidebar-menu flex-1 py-6 overflow-y-auto custom-scrollbar px-3 space-y-1">
          <button 
            className={`menu-item flex items-center gap-3 px-3 xl:px-4 py-3 w-full text-left transition-all rounded-xl group relative ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-300 hover:bg-white/10 hover:text-white'} ${mobileMenuOpen ? 'justify-start' : 'justify-center xl:justify-start'}`}
            onClick={() => setActiveTab('overview')}
            title="Overview"
          >
            <LayoutDashboard size={20} className={`shrink-0 ${activeTab === 'overview' ? 'text-white' : 'text-slate-300 group-hover:text-white transition-colors'}`} />
            <span className={`font-medium md:hidden xl:block whitespace-nowrap ${mobileMenuOpen ? '!block' : ''}`}>Overview</span>
          </button>

          <button 
            className={`menu-item flex items-center gap-3 px-3 xl:px-4 py-3 w-full text-left transition-all rounded-xl group relative ${activeTab === 'browse' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-300 hover:bg-white/10 hover:text-white'} ${mobileMenuOpen ? 'justify-start' : 'justify-center xl:justify-start'}`}
            onClick={() => setActiveTab('browse')}
            title="Browse Properties"
          >
            <Search size={20} className={`shrink-0 ${activeTab === 'browse' ? 'text-white' : 'text-slate-300 group-hover:text-white transition-colors'}`} />
            <span className={`font-medium md:hidden xl:block whitespace-nowrap ${mobileMenuOpen ? '!block' : ''}`}>Browse</span>
          </button>

          <button 
            className={`menu-item flex items-center gap-3 px-3 xl:px-4 py-3 w-full text-left transition-all rounded-xl group relative ${activeTab === 'applications' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-300 hover:bg-white/10 hover:text-white'} ${mobileMenuOpen ? 'justify-start' : 'justify-center xl:justify-start'}`}
            onClick={() => setActiveTab('applications')}
            title="My Applications"
          >
            <FileText size={20} className={`shrink-0 ${activeTab === 'applications' ? 'text-white' : 'text-slate-300 group-hover:text-white transition-colors'}`} />
            <span className={`font-medium md:hidden xl:block flex-1 whitespace-nowrap ${mobileMenuOpen ? '!block' : ''}`}>Applications</span>
            {applicationsCount > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full absolute top-2 right-2 xl:static xl:bg-opacity-100 ${activeTab === 'applications' ? 'bg-white text-indigo-600' : 'bg-indigo-500 text-white md:bg-indigo-600 xl:bg-indigo-500/20 xl:text-indigo-300'} ${(mobileMenuOpen && applicationsCount > 0) ? '!static !bg-white !text-indigo-600' : ''}`}>
                {applicationsCount}
              </span>
            )}
          </button>
          
          <button 
            className={`menu-item flex items-center gap-3 px-3 xl:px-4 py-3 w-full text-left transition-all rounded-xl group relative ${activeTab === 'messages' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-300 hover:bg-white/10 hover:text-white'} ${mobileMenuOpen ? 'justify-start' : 'justify-center xl:justify-start'}`}
            onClick={() => setActiveTab('messages')}
            title="My Messages"
          >
            <MessageSquare size={20} className={`shrink-0 ${activeTab === 'messages' ? 'text-white' : 'text-slate-300 group-hover:text-white transition-colors'}`} />
            <span className={`font-medium md:hidden xl:block whitespace-nowrap ${mobileMenuOpen ? '!block' : ''}`}>Messages</span>
          </button>

          <button 
            className={`menu-item flex items-center gap-3 px-3 xl:px-4 py-3 w-full text-left transition-all rounded-xl group relative ${activeTab === 'saved' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-300 hover:bg-white/10 hover:text-white'} ${mobileMenuOpen ? 'justify-start' : 'justify-center xl:justify-start'}`}
            onClick={() => setActiveTab('saved')}
            title="Saved Properties"
          >
            <Heart size={20} className={`shrink-0 ${activeTab === 'saved' ? 'text-white' : 'text-slate-300 group-hover:text-white transition-colors'}`} />
            <span className={`font-medium md:hidden xl:block flex-1 whitespace-nowrap ${mobileMenuOpen ? '!block' : ''}`}>Saved</span>
            {savedCount > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full absolute top-2 right-2 xl:static xl:bg-opacity-100 ${activeTab === 'saved' ? 'bg-white text-indigo-600' : 'bg-indigo-500 text-white md:bg-indigo-600 xl:bg-indigo-500/20 xl:text-indigo-300'} ${(mobileMenuOpen && savedCount > 0) ? '!static !bg-white !text-indigo-600' : ''}`}>
                {savedCount}
              </span>
            )}
          </button>

          <button 
            className={`menu-item flex items-center gap-3 px-3 xl:px-4 py-3 w-full text-left transition-all rounded-xl group relative ${activeTab === 'report' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-300 hover:bg-white/10 hover:text-white'} ${mobileMenuOpen ? 'justify-start' : 'justify-center xl:justify-start'}`}
            onClick={() => setActiveTab('report')}
            title="Report Issue"
          >
            <Flag size={20} className={`shrink-0 ${activeTab === 'report' ? 'text-white' : 'text-slate-300 group-hover:text-white transition-colors'}`} />
            <span className={`font-medium md:hidden xl:block whitespace-nowrap ${mobileMenuOpen ? '!block' : ''}`}>Report</span>
          </button>

          <button 
            className={`menu-item flex items-center gap-3 px-3 xl:px-4 py-3 w-full text-left transition-all rounded-xl group relative ${activeTab === 'rentals' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-300 hover:bg-white/10 hover:text-white'} ${mobileMenuOpen ? 'justify-start' : 'justify-center xl:justify-start'}`}
            onClick={() => setActiveTab('rentals')}
            title="My Rentals"
          >
            <Key size={20} className={`shrink-0 ${activeTab === 'rentals' ? 'text-white' : 'text-slate-300 group-hover:text-white transition-colors'}`} />
            <span className={`font-medium md:hidden xl:block whitespace-nowrap ${mobileMenuOpen ? '!block' : ''}`}>Rentals</span>
          </button>


          <button 
            className={`menu-item flex items-center gap-3 px-3 xl:px-4 py-3 w-full text-left transition-all rounded-xl group relative ${activeTab === 'payments' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-300 hover:bg-white/10 hover:text-white'} ${mobileMenuOpen ? 'justify-start' : 'justify-center xl:justify-start'}`}
            onClick={() => setActiveTab('payments')}
            title="Payments"
          >
            <CreditCard size={20} className={`shrink-0 ${activeTab === 'payments' ? 'text-white' : 'text-slate-300 group-hover:text-white transition-colors'}`} />
            <span className={`font-medium md:hidden xl:block whitespace-nowrap ${mobileMenuOpen ? '!block' : ''}`}>Payments</span>
          </button>

          <button 
            className={`menu-item flex items-center gap-3 px-3 xl:px-4 py-3 w-full text-left transition-all rounded-xl group relative ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-300 hover:bg-white/10 hover:text-white'} ${mobileMenuOpen ? 'justify-start' : 'justify-center xl:justify-start'}`}
            onClick={() => setActiveTab('settings')}
            title="Settings"
          >
            <SettingsIcon size={20} className={`shrink-0 ${activeTab === 'settings' ? 'text-white' : 'text-slate-300 group-hover:text-white transition-colors'}`} />
            <span className={`font-medium md:hidden xl:block whitespace-nowrap ${mobileMenuOpen ? '!block' : ''}`}>Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer p-6 border-t border-white/10 bg-white/5">
          <button className={`logout-button flex items-center gap-3 w-full text-left text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 p-3 rounded-xl transition-all group ${mobileMenuOpen ? 'justify-start' : 'justify-center xl:justify-start'}`} onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform shrink-0" />
            <span className={`font-medium md:hidden xl:block whitespace-nowrap ${mobileMenuOpen ? '!block' : ''}`}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
