import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { RefreshCw, Home, Banknote, FileText, Heart, Search, Sparkles } from 'lucide-react';

const Overview = ({ fullWidth, setActiveTab, stats = {} }) => {
  const { user } = useAuth();

  const statsCards = [
    {
      icon: <Home size={28} />, label: 'Active Rentals', value: stats.activeRentals || 0, desc: 'Properties & Bikes',
      gradient: 'bg-gradient-to-br from-indigo-500 to-purple-600', textColor: 'text-white'
    },
    {
      icon: <Banknote size={28} />, label: 'Total Payments', value: `NPR ${stats.totalPayments || 0}`, desc: 'Lifetime spend',
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-600', textColor: 'text-white'
    },
    {
      icon: <FileText size={28} />, label: 'Applications', value: stats.pendingApplications || 0, desc: 'Pending approval',
      gradient: 'bg-gradient-to-br from-blue-500 to-cyan-600', textColor: 'text-white'
    },
    {
      icon: <Heart size={28} />, label: 'Saved', value: stats.savedListings || 0, desc: 'Favorites',
      gradient: 'bg-gradient-to-br from-pink-500 to-rose-600', textColor: 'text-white'
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
    <div className="overview-wrapper w-full flex flex-col gap-8 pb-8">
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

      {/* KYC Verification Banner */}
      {user?.kycStatus !== 'approved' && (
        <div className={`kyc-banner rounded-2xl p-5 md:p-6 shadow-lg border-2 ${
          user?.kycStatus === 'rejected' ? 'bg-red-50 border-red-200' :
          user?.kycStatus === 'pending' ? 'bg-amber-50 border-amber-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${
              user?.kycStatus === 'rejected' ? 'bg-red-100 text-red-600' :
              user?.kycStatus === 'pending' ? 'bg-amber-100 text-amber-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {user?.kycStatus === 'rejected' ? '❌' :
               user?.kycStatus === 'pending' ? '⏳' : '🔐'}
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold mb-2 ${
                user?.kycStatus === 'rejected' ? 'text-red-800' :
                user?.kycStatus === 'pending' ? 'text-amber-800' :
                'text-blue-800'
              }`}>
                {user?.kycStatus === 'rejected' ? 'KYC Verification Rejected' :
                 user?.kycStatus === 'pending' ? 'KYC Verification Pending' :
                 'Complete KYC Verification Required'}
              </h3>
              <p className={`text-sm mb-3 ${
                user?.kycStatus === 'rejected' ? 'text-red-700' :
                user?.kycStatus === 'pending' ? 'text-amber-700' :
                'text-blue-700'
              }`}>
                {user?.kycStatus === 'rejected' ? 'Your KYC documents were rejected. Please review and resubmit with correct information.' :
                 user?.kycStatus === 'pending' ? 'Your KYC documents are under review. You will be able to browse and apply for listings once approved.' :
                 'To browse properties and apply for rentals, you must first complete your KYC verification in Settings.'}
              </p>
              <button 
                onClick={() => setActiveTab && setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  user?.kycStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700 text-white' :
                  user?.kycStatus === 'pending' ? 'bg-amber-600 hover:bg-amber-700 text-white' :
                  'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {user?.kycStatus === 'rejected' ? 'Resubmit Documents' :
                 user?.kycStatus === 'pending' ? 'View Status' :
                 'Complete Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 w-full px-0 sm:px-0">
        {statsCards.map((card, idx) => (
          <div key={idx} className="stat-card bg-white rounded-2xl shadow-md hover:shadow-lg p-5 flex flex-col items-center text-center gap-2 min-w-0 transition-all border border-gray-100">
            <div className={`icon-wrapper w-14 h-14 rounded-xl ${card.gradient} flex items-center justify-center mb-2 shadow-lg ${card.textColor}`}>
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
