import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import { 
  CreditCard, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Inbox, 
  MapPin, 
  ChevronRight
} from 'lucide-react';

const PaymentManagement = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchPayments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = user.type === 'owner' 
        ? '/payments/owner' 
        : '/payments/tenant';
      
      let url = `${API_BASE_URL}${endpoint}`;
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [filter, user.type]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/payments/owner/stats`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setStats(await response.json());
    } catch (error) { console.error(error); }
  }, []);

  useEffect(() => {
    fetchPayments();
    if (user.type === 'owner') fetchStats();
  }, [fetchPayments, fetchStats, user.type]);

  const filteredPayments = payments.filter(p => filter === 'all' || p.status.toLowerCase() === filter);

  if (loading) return <div className="flex items-center justify-center p-12 text-slate-400 font-medium">Loading payments...</div>;

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payment Management</h2>
          <p className="text-sm text-slate-500">Track your rental financial history.</p>
        </div>
      </div>

      {/* Stats Cards (Owner Only) */}
      {user.type === 'owner' && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200/50">
             <div className="flex items-center gap-3 mb-2">
               <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center text-orange-600"><Clock size={20} /></div>
               <span className="text-xs font-bold uppercase text-orange-800 tracking-wider">Pending</span>
             </div>
             <p className="text-2xl font-black text-slate-900">Rs. {stats.totalPending?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200/50">
             <div className="flex items-center gap-3 mb-2">
               <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center text-red-600"><AlertTriangle size={20} /></div>
               <span className="text-xs font-bold uppercase text-red-800 tracking-wider">Overdue</span>
             </div>
             <p className="text-2xl font-black text-slate-900">Rs. {stats.totalOverdue?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200/50">
             <div className="flex items-center gap-3 mb-2">
               <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center text-emerald-600"><CheckCircle size={20} /></div>
               <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Collected</span>
             </div>
             <p className="text-2xl font-black text-slate-900">Rs. {stats.totalCollected?.toLocaleString() || 0}</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 w-full overflow-x-auto pb-2">
         {['all', 'pending', 'overdue', 'paid'].map(f => (
           <button 
             key={f}
             onClick={() => setFilter(f)}
             className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
               filter === f ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
             }`}
           >
             {f} ({payments.filter(p => f === 'all' || p.status.toLowerCase() === f).length})
           </button>
         ))}
      </div>

      {/* Payment List */}
      <div className="space-y-4">
        {filteredPayments.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
             <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 shadow-sm mb-4"><Inbox size={24} /></div>
             <h3 className="font-bold text-slate-800">No payments found</h3>
             <p className="text-xs text-slate-500 mt-1">No payments matching your filter.</p>
           </div>
        ) : (
          filteredPayments.map(payment => (
            <div key={payment.id} className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
               <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 pb-4 border-b border-slate-50">
                 <div>
                   <h3 className="font-bold text-slate-900 text-lg">{payment.Booking?.property?.title || 'Unknown Property'}</h3>
                   <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                     <MapPin size={12} /> {payment.Booking?.property?.address}
                   </div>
                 </div>
                 <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                   payment.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 
                   payment.status === 'Overdue' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                 }`}>
                   {payment.status}
                 </span>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Amount</p>
                   <p className="text-lg font-black text-slate-900">Rs. {payment.amount?.toLocaleString()}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Due Date</p>
                   <p className="font-medium text-slate-700">{new Date(payment.dueDate).toLocaleDateString()}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">{user.type === 'owner' ? 'Tenant' : 'Owner'}</p>
                   <p className="font-medium text-slate-700">{user.type === 'owner' ? payment.tenant?.fullName : payment.owner?.fullName}</p>
                 </div>
                 <div className="flex items-end justify-end">
                    <button className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                      View Details <ChevronRight size={14} />
                    </button>
                 </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PaymentManagement;
