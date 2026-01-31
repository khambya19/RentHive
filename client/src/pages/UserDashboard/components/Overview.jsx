import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { RefreshCw, Home, Banknote, FileText, Heart, Search, CheckCircle, ArrowRight, ShieldCheck, Clock, AlertCircle } from 'lucide-react';

const Overview = ({ fullWidth, setActiveTab, stats = {} }) => {
  const { user } = useAuth();

  const statsCards = [
    {
      icon: <Home size={24} className="text-white" />, 
      label: 'Active Rentals', 
      value: stats.activeRentals || 0, 
      desc: 'Properties & Bikes',
      gradient: 'bg-linear-to-br from-indigo-500 to-violet-600',
      shadow: 'shadow-indigo-200'
    },
    {
      icon: <Banknote size={24} className="text-white" />, 
      label: 'Total Payments', 
      value: `NPR ${stats.totalPayments || 0}`, 
      desc: 'Lifetime spend',
      gradient: 'bg-linear-to-br from-rose-400 to-red-600',
      shadow: 'shadow-rose-200'
    },
    {
      icon: <FileText size={24} className="text-white" />, 
      label: 'Applications', 
      value: stats.pendingApplications || 0, 
      desc: 'Pending approval',
      gradient: 'bg-linear-to-br from-blue-400 to-cyan-600',
      shadow: 'shadow-blue-200'
    },
    {
      icon: <Heart size={24} className="text-white" />, 
      label: 'Saved', 
      value: stats.savedListings || 0, 
      desc: 'Favorites',
      gradient: 'bg-linear-to-br from-pink-500 to-rose-600',
      shadow: 'shadow-pink-200'
    },
  ];

  const quickActions = [
    {
      icon: <Search size={28} />, 
      label: 'Browse Properties', 
      desc: 'Find your next home or vehicle', 
      onClick: () => setActiveTab && setActiveTab('browse'),
      color: 'text-blue-600',
      bg: 'bg-blue-50 hover:bg-blue-100',
      border: 'border-blue-100'
    },
    {
      icon: <FileText size={28} />, 
      label: 'Check Status', 
      desc: 'View application progress', 
      onClick: () => setActiveTab && setActiveTab('applications'),
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 hover:bg-indigo-100',
      border: 'border-indigo-100'
    },
    {
      icon: <CheckCircle size={28} />, 
      label: 'My Rentals', 
      desc: 'Manage active rentals', 
      onClick: () => setActiveTab && setActiveTab('rentals'),
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 hover:bg-emerald-100',
      border: 'border-emerald-100'
    },
    {
      icon: <Heart size={28} />, 
      label: 'Saved Items', 
      desc: 'View your wishlist', 
      onClick: () => setActiveTab && setActiveTab('saved'),
      color: 'text-rose-600',
      bg: 'bg-rose-50 hover:bg-rose-100',
      border: 'border-rose-100'
    },
  ];

  const onRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="overview-wrapper w-full flex flex-col gap-8 pb-10">
      {/* Premium Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-violet-600 to-indigo-600 shadow-xl shadow-indigo-200">
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-white space-y-2">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Welcome back, {user?.fullName?.split(' ')[0] || 'User'}! <span className="animate-pulse inline-block">✨</span>
            </h2>
            <p className="text-indigo-100 text-lg font-medium max-w-lg">
              Check your rental status, explore new properties, and manage your payments all in one place.
            </p>
          </div>
          <button 
            onClick={onRefresh}
            className="group flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold transition-all border border-white/20 shadow-lg"
          >
            <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
            <span>Refresh Dashboard</span>
          </button>
        </div>
      </div>

      {/* KYC Verification Banner (Conditional) */}
      {user?.kycStatus !== 'approved' && (
        <div className={`rounded-2xl p-6 border-l-4 shadow-sm flex flex-col md:flex-row gap-5 items-start md:items-center justify-between ${
          user?.kycStatus === 'rejected' ? 'bg-red-50 border-red-500' :
          user?.kycStatus === 'pending' ? 'bg-amber-50 border-amber-500' :
          'bg-blue-50 border-blue-500'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full shrink-0 ${
              user?.kycStatus === 'rejected' ? 'bg-red-100 text-red-600' :
              user?.kycStatus === 'pending' ? 'bg-amber-100 text-amber-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {user?.kycStatus === 'rejected' ? <AlertCircle size={24} /> :
               user?.kycStatus === 'pending' ? <Clock size={24} /> : <ShieldCheck size={24} />}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${
                user?.kycStatus === 'rejected' ? 'text-red-900' :
                user?.kycStatus === 'pending' ? 'text-amber-900' :
                'text-blue-900'
              }`}>
                {user?.kycStatus === 'rejected' ? 'Verification Rejected' :
                 user?.kycStatus === 'pending' ? 'Verification In Progress' :
                 'Identity Verification Required'}
              </h3>
              <p className={`text-sm mt-1 ${
                user?.kycStatus === 'rejected' ? 'text-red-700' :
                user?.kycStatus === 'pending' ? 'text-amber-700' :
                'text-blue-700'
              }`}>
                {user?.kycStatus === 'rejected' ? 'Please update your documents in settings.' :
                 user?.kycStatus === 'pending' ? 'We are reviewing your submission. This usually takes 24 hours.' :
                 'Access to rentals is restricted until you verify your identity.'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab && setActiveTab('settings')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap shadow-md transition-transform active:scale-95 ${
              user?.kycStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700 text-white' :
              user?.kycStatus === 'pending' ? 'bg-white border border-amber-200 text-amber-700' :
              'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {user?.kycStatus === 'rejected' ? 'Fix Issues' :
             user?.kycStatus === 'pending' ? 'View Status' :
             'Complete Verification'}
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
          Overview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statsCards.map((card, idx) => (
            <div key={idx} className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-start relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-20 h-20 opacity-5 rounded-bl-full ${card.gradient.replace('to-', 'bg-')}`}></div>
              
              <div className={`w-12 h-12 rounded-xl ${card.gradient} flex items-center justify-center shadow-lg ${card.shadow} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {card.icon}
              </div>
              
              <div className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-1">{card.label}</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{card.value}</div>
              <div className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md">{card.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {quickActions.map((action, idx) => (
            <button 
              key={idx} 
              onClick={action.onClick}
              className={`group relative text-left p-5 rounded-2xl border transition-all duration-300 ${action.bg} ${action.border} hover:shadow-lg`}
            >
              <div className={`mb-4 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow ${action.color}`}>
                {action.icon}
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">{action.label}</h4>
              <p className="text-sm text-gray-500 font-medium">{action.desc}</p>
              
              <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">
                <ArrowRight size={20} className="text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Overview;
