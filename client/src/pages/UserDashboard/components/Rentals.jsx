import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Key, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  CreditCard,
  MessageCircle,
  MoreVertical,
  Home,
  Bike
} from 'lucide-react';
import API_BASE_URL, { SERVER_BASE_URL } from '../../../config/api';

const Rentals = ({ rentals, loading, onRefresh }) => {
  const [filter, setFilter] = useState('all'); // 'all', 'property', 'bike'

  const filteredRentals = rentals.filter(r => filter === 'all' || r.type === filter);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200 animate-pulse';
      case 'Completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Cancelled': return 'bg-red-50 text-red-600 border-red-100';
      case 'Rejected': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-orange-50 text-orange-600 border-orange-100';
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <button onClick={onRefresh} className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Rentals</h1>
          <p className="text-slate-500 font-medium">Manage your ongoing and upcoming bookings</p>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
           <button 
             onClick={() => setFilter('all')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             All
           </button>
           <button 
             onClick={() => setFilter('property')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${filter === 'property' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <Home size={14} /> Properties
           </button>
           <button 
             onClick={() => setFilter('bike')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${filter === 'bike' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <Bike size={14} /> Vehicles
           </button>
        </div>
      </div>

      {filteredRentals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-6">
            <Key size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No rentals found</h3>
          <p className="text-slate-500 mt-2 max-w-md">You haven't made any bookings yet. Browse our marketplace to find your next stay or ride.</p>
        </div>
      ) : (
        <div className="space-y-4">
           {filteredRentals.map((rental) => (
             <div key={`${rental.type}-${rental.id}`} className="group bg-white rounded-2xl p-4 border border-slate-100 hover:border-orange-200 transition-all shadow-sm hover:shadow-md flex flex-col md:flex-row gap-6">
                
                {/* Image */}
                <div className="w-full md:w-64 h-48 md:h-auto rounded-xl overflow-hidden relative flex-shrink-0 bg-slate-100">
                   {rental.image ? (
                     <img 
                       src={`${SERVER_BASE_URL}/uploads/${rental.type === 'property' ? 'properties' : 'bikes'}/${rental.image}`} 
                       alt={rental.title}
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                     />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-400">
                        {rental.type === 'property' ? <Home size={32} /> : <Bike size={32} />}
                     </div>
                   )}
                   <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(rental.status)}`}>
                         {rental.status}
                      </span>
                   </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between py-2">
                   <div>
                      <div className="flex justify-between items-start">
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                               {rental.type === 'property' ? 'Residential Lease' : 'Vehicle Rental'}
                            </p>
                            <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">{rental.title}</h3>
                         </div>
                         <div className="text-right hidden md:block">
                            <p className="text-2xl font-black text-slate-900 tracking-tight">NPR {Number(rental.cost).toLocaleString()}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase">Total Paid</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                         <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                               <MapPin size={16} />
                            </div>
                            <span className="truncate max-w-[150px]">{rental.location}</span>
                         </div>
                         <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                               <Calendar size={16} />
                            </div>
                            <span>{new Date(rental.startDate).toLocaleDateString()} - {rental.endDate ? new Date(rental.endDate).toLocaleDateString() : 'Ongoing'}</span>
                         </div>
                         <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                           <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                               <Clock size={16} />
                            </div> 
                            <span>
                               {Math.ceil((new Date(rental.endDate || new Date()) - new Date(rental.startDate)) / (1000 * 60 * 60 * 24))} Days
                            </span>
                         </div>
                         <div className="flex items-center gap-3 text-sm text-emerald-600 font-bold">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                               <CreditCard size={16} />
                            </div>
                            <span>Payment Verified</span>
                         </div>
                      </div>
                   </div>
                   
                   {/* Mobile Price */}
                   <div className="mt-4 flex justify-between items-end md:hidden">
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Total Paid</p>
                        <p className="text-xl font-black text-slate-900 tracking-tight">NPR {Number(rental.cost).toLocaleString()}</p>
                      </div>
                   </div>

                   {/* Actions Foot */}
                   <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden">
                            {/* Vendor Avatar placeholder */}
                            <div className="w-full h-full bg-orange-200 flex items-center justify-center text-[10px] font-bold text-orange-700">
                               {(rental.vendor?.name?.[0] || 'V').toUpperCase()}
                            </div>
                         </div>
                         <p className="text-xs font-bold text-slate-600">Hosted by <span className="text-slate-900">{rental.vendor?.name || 'Partner'}</span></p>
                      </div>
                      
                      <div className="flex gap-2">
                         <button className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold uppercase rounded-lg transition-colors border border-slate-200">
                            Download Receipt
                         </button>
                         <button className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase rounded-lg transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl">
                            <MessageCircle size={14} /> Contact
                         </button>
                      </div>
                   </div>
                </div>

             </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default Rentals;
