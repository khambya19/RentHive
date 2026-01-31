import React, { useState, useEffect, useCallback } from 'react';
import API_BASE_URL from '../../config/api';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  CreditCard, 
  User, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Activity,
  Mail,
  Phone
} from 'lucide-react';

const PaymentsTable = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
const [searchQuery, setSearchQuery] = useState('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/payments/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data);
    } catch (err) {
      console.error('Error fetching admin payments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    socket.on('payment_update', () => {
      // console.log('🔔 Payment update received, refreshing table...');
      fetchPayments();
    });
    
    return () => {
      socket.off('payment_update');
    };
  }, [socket, fetchPayments]);

const filteredPayments = payments.filter(p => {
    const searchLower = searchQuery.toLowerCase();
    const entityTitle = (p.Booking?.property?.title || p.bikeBooking?.bike?.name || '').toLowerCase();
    const tenantName = (p.tenant?.fullName || '').toLowerCase();
    const ownerName = (p.owner?.fullName || '').toLowerCase();
    const transactionId = (p.transactionId || '').toLowerCase();
    
    return entityTitle.includes(searchLower) || 
           tenantName.includes(searchLower) || 
           ownerName.includes(searchLower) ||
           transactionId.includes(searchLower);
  });



  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold">Fetching financial records...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
        {/* Search Bar - Full Width since filters are removed */}
            <div className="relative w-full">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
               <input 
                 type="text" 
                 placeholder="Search transaction, property, tenant..."
                 className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all shadow-sm"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            </div>


        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">T-ID</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rental Asset</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parties</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Financials</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPayments.length === 0 ? (
                <tr>
                    <td colSpan="6" className="px-6 py-20 text-center text-slate-400 font-medium">
                        No transactions found for the selected criteria.
                    </td>
                </tr>
              ) : (
                filteredPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-indigo-50/20 transition-colors group cursor-default">
                    <td className="px-6 py-5">
                       <span className="font-mono text-[10px] font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">
                          {payment.transactionId || `#${payment.id}`}
                       </span>
                    </td>
                    <td className="px-6 py-5">
                       <div className="space-y-1">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                             {payment.Booking?.property?.title || payment.bikeBooking?.bike?.name || `${payment.bikeBooking?.bike?.brand} ${payment.bikeBooking?.bike?.model}`}
                          </p>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${payment.Booking ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                             {payment.Booking ? 'Property Rental' : 'Vehicle Booking'}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-sky-100 rounded text-sky-600 flex items-center justify-center text-[8px] font-black">T</div>
                                <span className="text-xs font-black text-slate-900">{payment.tenant?.fullName || 'N/A'}</span>
                             </div>
                             <div className="pl-7 space-y-0.5">
                                <p className="text-[10px] text-slate-500 font-medium lowercase flex items-center gap-1">
                                   <Mail size={10} className="text-slate-300" /> {payment.tenant?.email}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                   <Phone size={10} className="text-slate-300" /> {payment.tenant?.phone || 'No phone'}
                                </p>
                             </div>
                          </div>
                          <div className="w-full h-px bg-slate-100"></div>
                          <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-amber-100 rounded text-amber-600 flex items-center justify-center text-[8px] font-black">O</div>
                                <span className="text-xs font-black text-slate-900">{payment.owner?.fullName || 'N/A'}</span>
                             </div>
                             <div className="pl-7 space-y-0.5">
                                <p className="text-[10px] text-slate-500 font-medium lowercase flex items-center gap-1">
                                   <Mail size={10} className="text-slate-300" /> {payment.owner?.email}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                   <Phone size={10} className="text-slate-300" /> {payment.owner?.phone || 'No phone'}
                                </p>
                             </div>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="space-y-0.5">
                          <p className="text-sm font-black text-slate-900 leading-none">Rs. {payment.amount?.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{payment.paymentMethod || 'Wallet'}</p>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {new Date(payment.createdAt).toLocaleDateString('en-GB')}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};



const StatusBadge = ({ status }) => {
    switch (status.toLowerCase()) {
        case 'paid': 
            return <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-100"><CheckCircle size={10} /> Paid</div>;
        case 'pending': 
            return <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-amber-100"><Clock size={10} /> Pending</div>;
        case 'overdue': 
            return <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-rose-100"><AlertTriangle size={10} /> Overdue</div>;
        default: 
            return <div className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase">{status}</div>;
    }
};

export default PaymentsTable;
