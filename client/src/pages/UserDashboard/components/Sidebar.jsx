
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
  MessageSquare,
  Menu
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, collapsed, mobileMenuOpen, setMobileMenuOpen, savedCount = 0, applicationsCount = 0, messagesCount = 0, rentalsCount = 0, paymentsCount = 0, reportsCount = 0, setShowLogoutModal }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[99999] lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside 
        className={`
          user-sidebar-container 
          fixed lg:sticky top-0 left-0 z-[100000] lg:z-30
          text-white transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          
          w-72 flex-shrink-0 h-screen
          bg-[#5D5FEF] flex flex-col shadow-2xl border-r border-indigo-400/20 overflow-hidden
        `}
      >
        <div className="sidebar-header p-6 flex items-center gap-3 border-b border-white/10 h-20">
          <button 
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3">
            <img 
              src="/src/assets/rentHivelogo.png" 
              alt="RentHive Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-2xl font-extrabold tracking-tight text-white">RentHive</span>
          </div>
        </div>

        <div className="user-profile p-6 border-b border-white/10 flex items-center gap-4 bg-black/10">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-white/30 p-0.5">
              <div className="w-full h-full rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                {(user?.profilePic || user?.profileImage || user?.photo) ? (
                  <img 
                    src={(user.profilePic || user.profileImage || user.photo).startsWith('http') 
                      ? (user.profilePic || user.profileImage || user.photo) 
                      : `${SERVER_BASE_URL}/uploads/profiles/${(user.profilePic || user.profileImage || user.photo).split('/').pop()}`} 
                    alt="User" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="font-bold text-lg text-white">{(user?.fullName || 'U')[0]}</span>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#5D5FEF] rounded-full"></div>
          </div>
          <div className="overflow-hidden">
            <p className="font-bold truncate text-white text-base">{user?.fullName?.split(' ')[0] || 'User'}</p>
            <p className="text-xs text-indigo-200 font-medium uppercase tracking-wider">Tenant</p>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
            { id: 'browse', icon: Search, label: 'Browse Properties' },
            { id: 'applications', icon: FileText, label: 'My Applications', count: applicationsCount },
            { id: 'rentals', icon: Key, label: 'My Rentals', count: rentalsCount },
            { id: 'payments', icon: CreditCard, label: 'Payments', count: paymentsCount },
            { id: 'messages', icon: MessageSquare, label: 'Messages', count: messagesCount },
            { id: 'saved', icon: Heart, label: 'Saved', count: savedCount },
            { id: 'report', icon: Flag, label: 'Report Issue', count: reportsCount },
            { id: 'settings', icon: SettingsIcon, label: 'Settings' }
          ].map((item) => (
             <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative
                  ${activeTab === item.id 
                    ? 'bg-white text-[#5D5FEF] shadow-lg font-bold' 
                    : 'text-indigo-100 hover:bg-white/10 hover:text-white font-medium'}
                `}
             >
                <item.icon size={20} className={`shrink-0 ${activeTab === item.id ? 'stroke-[2.5px]' : ''}`} />
                <span className="whitespace-nowrap flex-1 text-left">{item.label}</span>
                
                {item.count > 0 && (
                  <span className={`
                    px-2 py-0.5 rounded-full text-[10px] font-bold min-w-[20px] text-center
                    ${activeTab === item.id 
                      ? 'bg-[#5D5FEF] text-white' 
                      : 'bg-white text-[#5D5FEF] shadow-sm'}
                  `}>
                    {item.count}
                  </span>
                )}
             </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/10">
          <button 
            onClick={() => setShowLogoutModal?.(true)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-indigo-200 hover:bg-rose-500/20 hover:text-rose-300 transition-all group font-medium"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
