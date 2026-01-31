import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
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
  const [loading, setLoading] = useState(true);


  const fetchPayments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = (user.type?.toLowerCase() === 'owner' || user.type?.toLowerCase() === 'vendor')
        ? '/payments/owner' 
        : '/payments/tenant';
      
      let url = `${API_BASE_URL}${endpoint}`;

      
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [user.type]);



  useEffect(() => {
    fetchPayments();
  }, [fetchPayments, user.type]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    
      socket.on('payment_update', () => {
      // console.log('🔔 Payment update received, refreshing list...');
      fetchPayments();
    });
    
    return () => {
      socket.off('payment_update');
    };
  }, [socket, fetchPayments, user.type]);

  /* Modal State */
  const [selectedPayment, setSelectedPayment] = useState(null);

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
  };

  const closeModal = () => {
    setSelectedPayment(null);
  };

  if (loading) return <div className="flex items-center justify-center p-12 text-slate-400 font-medium">Loading payments...</div>;

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payment Management</h2>
          <p className="text-sm text-slate-500">Track your rental financial history.</p>
        </div>
      </div>





      <div className="space-y-4">
        {payments.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
             <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 shadow-sm mb-4"><Inbox size={24} /></div>
             <h3 className="font-bold text-slate-800">No payments found</h3>
             <p className="text-xs text-slate-500 mt-1">No payments found in history.</p>
           </div>
        ) : (
          payments.map(payment => (
            <div key={payment.id} className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
               <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 pb-4 border-b border-slate-50">
                 <div>
                   <h3 className="font-bold text-slate-900 text-lg">
                      {payment.Booking?.property?.title || (payment.bikeBooking?.bike ? `${payment.bikeBooking.bike.brand} ${payment.bikeBooking.bike.model}` : 'Rental Booking')}
                   </h3>
                   <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                     <MapPin size={12} /> {payment.Booking?.property?.address || payment.bikeBooking?.bike?.location || 'Digital Service'}
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${payment.Booking ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                      {payment.Booking ? 'Property' : 'Vehicle'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      payment.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 
                      payment.status === 'Overdue' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {payment.status}
                    </span>
                 </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Amount</p>
                    <p className={`text-lg font-black ${
                      user.type?.toLowerCase() === 'owner' || user.type?.toLowerCase() === 'vendor'
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}>
                      {user.type?.toLowerCase() === 'owner' || user.type?.toLowerCase() === 'vendor' ? '+' : '-'} Rs. {Number(payment.amount || 0).toLocaleString()}
                    </p>
                  </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Due Date</p>
                   <p className="font-medium text-slate-700">{new Date(payment.dueDate).toLocaleDateString()}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">{user.type?.toLowerCase() === 'owner' ? 'Tenant' : 'Owner'}</p>
                   <p className="font-medium text-slate-700">{user.type?.toLowerCase() === 'owner' ? payment.tenant?.fullName : (payment.owner?.fullName || payment.owner?.name)}</p>
                 </div>
                 <div className="flex items-end justify-end">
                    <button onClick={() => handleViewDetails(payment)} className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                      View Details <ChevronRight size={14} />
                    </button>
                 </div>
               </div>
            </div>
          ))
        )}
      </div>
      
      {/* Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6 transform animate-in slide-in-from-bottom-8 duration-300">
              <div className="flex justify-between items-start">
                 <div>
                    <h3 className="text-xl font-black text-slate-900">Payment Details</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Transaction Info</p>
                 </div>
                 <button onClick={closeModal} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    <Inbox size={20} className="hidden" /> {/* Using explicit close button icon would be better but reusing imported Inbox just to save space? No, let's use x-mark if available or text */}
                    <span className="text-xl font-bold leading-none">×</span>
                 </button>
              </div>

              <div className="space-y-4">
                 <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedPayment.Booking ? 'Property' : 'Vehicle'}</p>
                    <p className="font-bold text-slate-900 leading-tight">
                       {selectedPayment.Booking?.property?.title || selectedPayment.bikeBooking?.bike?.name || 
                        (selectedPayment.bikeBooking?.bike ? `${selectedPayment.bikeBooking.bike.brand} ${selectedPayment.bikeBooking.bike.model}` : 'Rental Item')}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                       <MapPin size={12} />
                       {selectedPayment.Booking?.property?.address || selectedPayment.bikeBooking?.bike?.location || 'Location Info'}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-sm">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
                       <p className="text-lg font-black text-slate-800">Rs {Number(selectedPayment.amount).toLocaleString()}</p>
                    </div>
                    <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-sm">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                       <p className={`text-sm font-bold uppercase tracking-wide ${selectedPayment.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {selectedPayment.status}
                       </p>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                       <span className="font-medium text-slate-500">Start Date</span>
                       <span className="font-bold text-slate-700">
                          {new Date(selectedPayment.Booking?.startDate || selectedPayment.bikeBooking?.startDate || Date.now()).toLocaleDateString()}
                       </span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                       <span className="font-medium text-slate-500">End Date</span>
                       <span className="font-bold text-slate-700">
                           {new Date(selectedPayment.Booking?.endDate || selectedPayment.bikeBooking?.endDate || Date.now()).toLocaleDateString()}
                       </span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                       <span className="font-medium text-slate-500">Duration</span>
                       <span className="font-bold text-slate-700">
                          {selectedPayment.Booking?.duration || selectedPayment.bikeBooking?.duration || '?'} Days
                       </span>
                    </div>
                 </div>
              </div>
              
              <button onClick={closeModal} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl uppercase tracking-widest text-xs hover:bg-black transition-colors shadow-lg">
                 Close Details
              </button>
           </div>
        </div>
      )}
      </div>
  );
};

export default PaymentManagement;
