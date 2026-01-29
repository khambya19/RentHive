import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { RefreshCw, Home, Banknote, FileText, Heart, Search, Sparkles } from 'lucide-react';

const Overview = ({ fullWidth, setActiveTab }) => {
  const { user } = useAuth();

  // Placeholder stats for now - in a real app these would come from an API
  const stats = {
    activeRentals: 0,
    totalPayments: 0,
    pendingApplications: 0,
    savedProperties: 0,
  };

  const statsCards = [
    {
      icon: <Home size={28} />, label: 'Active Rentals', value: stats.activeRentals, desc: 'Properties & Bikes',
    },
    {
      icon: <Banknote size={28} />, label: 'Total Payments', value: `NPR ${stats.totalPayments}`, desc: 'Lifetime spend',
    },
    {
      icon: <FileText size={28} />, label: 'Applications', value: stats.pendingApplications, desc: 'Pending approval',
    },
    {
      icon: <Heart size={28} />, label: 'Saved', value: stats.savedProperties, desc: 'Favorites',
    },
  ];

  const quickActions = [
    {
      icon: <Search size={32} />, label: 'Browse Properties', desc: 'Find your next home', onClick: () => setActiveTab && setActiveTab('browse'),
    },
    {
      icon: <FileText size={32} />, label: 'Check Status', desc: 'View application progress', onClick: () => setActiveTab && setActiveTab('applications'),
    },
  ];

  const onRefresh = () => {
    // Placeholder for refresh logic
    window.location.reload();
  };

  return (
    <div className={`overview-wrapper w-full flex flex-col gap-8 ${fullWidth ? '' : 'max-w-6xl mx-auto'} pb-8 px-0 sm:px-0`}>
      {/* Welcome Banner */}
      <div className="welcome-banner bg-linear-to-br from-[#eaf6fa] via-[#f4fbfd] to-[#d6eef5] rounded-2xl p-4 sm:p-6 md:p-10 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, {user?.fullName || 'User'}! <span className="inline-block">✨</span></h2>
          <p className="text-lg text-blue-700 font-medium mb-2">Find your perfect home or vehicle today</p>
        </div>
        <button className="refresh-btn flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-600 font-semibold shadow hover:bg-blue-50 border border-blue-100 transition-all text-base mt-2 md:mt-0" onClick={onRefresh}>
          <RefreshCw size={18} /> Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 w-full px-0 sm:px-0">
        {statsCards.map((card, idx) => (
          <div key={idx} className="stat-card bg-linear-to-br from-[#eaf6fa] via-[#f4fbfd] to-[#d6eef5] rounded-2xl shadow-md p-4 flex flex-col items-center text-center gap-2 min-w-0">
            <div className="icon-wrapper w-10 h-10 rounded-lg bg-white/70 flex items-center justify-center mb-2">
              {card.icon}
            </div>
            <div className="stat-label text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{card.label}</div>
            <div className="stat-value text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="stat-desc text-sm text-gray-400">{card.desc}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions w-full">
        <h3 className="text-lg font-bold mb-4 text-gray-800">Quick Actions</h3>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 px-0 sm:px-0">
          {quickActions.map((action, idx) => (
            <button key={idx} className="quick-action-card bg-linear-to-br from-[#eaf6fa] via-[#f4fbfd] to-[#d6eef5] rounded-2xl shadow-md p-4 flex flex-col items-center text-center gap-2 hover:shadow-lg transition-all min-w-0" onClick={action.onClick}>
              <div className="icon-wrapper w-12 h-12 rounded-full bg-white/80 flex items-center justify-center mb-2 text-blue-600">
                {action.icon}
              </div>
              <div className="action-label text-base font-bold text-gray-900 mb-1">{action.label}</div>
              <div className="action-desc text-xs text-gray-500">{action.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

};

export default Overview;

