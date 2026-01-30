import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  ShieldCheck, 
  Lock, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Wallet,
  AlertTriangle
} from 'lucide-react';
import API_BASE_URL from '../../../config/api';

const PaymentModal = ({ bookingData, onClose, onPaymentComplete }) => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState('method'); // 'method' | 'processing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  if (!bookingData) return null;

  const { type, id, vendorId, title, bookingDetails } = bookingData;
  const { grandTotal, duration, startDate, endDate } = bookingDetails;
  
  // Payment Handlers
  const handlePayment = async () => {
     if (!paymentMethod) return;
     setProcessing(true);
     setPaymentStep('processing');
     setErrorMessage('');
     try {
        // 1. Simulate Payment Gateway Delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 2. Mark application as paid and create rental
        const token = localStorage.getItem('token');
        if (bookingData.applicationId) {
          const payRes = await fetch(`${API_BASE_URL}/bookings/pay/${bookingData.applicationId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          const payData = await payRes.json();
          if (!payRes.ok) throw new Error(payData.message || 'Payment failed');
        }

        setProcessing(false);
        setPaymentStep('success');
        setTimeout(() => {
           onPaymentComplete();
        }, 2000);
     } catch (err) {
        console.error("Booking Error:", err);
        setProcessing(false);
        setPaymentStep('error');
        setErrorMessage(err.message || "Payment processed but booking failed. Please contact support.");
     }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
         
         {/* Method Selection Step */}
         {paymentStep === 'method' && (
           <>
             {/* Header */}
             <div className="bg-gray-900 px-6 py-5 flex items-center justify-between">
                <div className="text-white">
                   <h2 className="text-lg font-bold flex items-center gap-2">
                     <ShieldCheck size={20} className="text-green-400" /> Secure Checkout
                   </h2>
                   <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Transaction ID: RH-{Math.floor(100000 + Math.random() * 900000)}</p>
                </div>
                <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
                   <X size={20} />
                </button>
             </div>

             {/* Order Summary */}
             <div className="p-6 bg-gray-50 border-b border-gray-100">
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Payable For</p>
                      <h3 className="text-lg font-black text-gray-900 leading-tight">{title || 'Rental Booking'}</h3>
                      <p className="text-sm text-gray-600 mt-1">{duration} Days • {startDate} to {endDate}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Amount</p>
                      <p className="text-2xl font-black text-orange-600 tracking-tight">NPR {grandTotal?.toLocaleString()}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2 text-xs bg-blue-50 text-blue-700 font-bold px-3 py-2 rounded-lg border border-blue-100">
                   <Lock size={12} /> 256-bit SSL Encrypted Payment Gateway
                </div>
             </div>

             {/* Method Selection */}
             <div className="p-6">
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Choose Payment Method</h4>
                <div className="space-y-3">
                   {/* Khalti - ONLY OPTION */}
                   <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'khalti' ? 'border-purple-500 bg-purple-50/50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        className="hidden"
                        onChange={() => setPaymentMethod('khalti')} 
                        checked={paymentMethod === 'khalti'}
                      />
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'khalti' ? 'border-purple-500' : 'border-gray-300'}`}>
                         {paymentMethod === 'khalti' && <div className="w-3 h-3 rounded-full bg-purple-500" />}
                      </div>
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-black text-[10px]">Khalti</div>
                      <div className="flex-1">
                         <p className="font-bold text-gray-900">Khalti Digital Wallet</p>
                         <p className="text-xs text-gray-500">Fast & Secure Payments</p>
                      </div>
                   </label>
                </div>
             </div>

             {/* Footer */}
             <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="text-xs text-gray-500 font-medium">
                   <p>By paying you agree to our</p>
                   <span className="text-orange-600 cursor-pointer hover:underline">Terms of Service</span>
                </div>
                <button 
                  onClick={handlePayment}
                  disabled={!paymentMethod}
                  className="px-8 py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black uppercase text-sm rounded-xl shadow-xl transition-all flex items-center gap-2"
                >
                   Pay NPR {grandTotal?.toLocaleString()} <ArrowRight size={18} />
                </button>
             </div>
           </>
         )}

         {/* Processing Step */}
         {paymentStep === 'processing' && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
               <div className="w-24 h-24 mb-6 relative">
                  <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <Lock size={32} className="text-orange-500" />
                  </div>
               </div>
               <h3 className="text-2xl font-black text-gray-900 mb-2">Processing Payment</h3>
               <p className="text-gray-500 mb-8 max-w-xs">Connecting to secure gateway. Please do not close this window...</p>
               <div className="w-full max-w-xs bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 animate-progress"></div>
               </div>
               <style jsx>{`
                 @keyframes progress {
                   0% { width: 0% }
                   100% { width: 100% }
                 }
                 .animate-progress {
                   animation: progress 3s ease-in-out forwards;
                 }
               `}</style>
            </div>
         )}

         {/* Success Step */}
         {paymentStep === 'success' && (
            <div className="p-12 flex flex-col items-center justify-center text-center bg-green-50 h-full">
               <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl mb-6 animate-bounce">
                  <CheckCircle size={48} strokeWidth={3} />
               </div>
               <h3 className="text-2xl font-black text-gray-900 mb-2">Payment Successful!</h3>
               <p className="text-gray-600 mb-8 max-w-xs">Your booking has been confirmed. You can view the details in the 'Rentals' tab.</p>
               <div className="mt-4 p-4 bg-white rounded-xl border border-green-200 w-full max-w-xs">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Receipt ID</p>
                  <p className="text-lg font-mono font-bold text-gray-800 tracking-widest">#RH-{Math.floor(100000 + Math.random() * 900000)}</p>
               </div>
            </div>
         )}
         
         {/* Error Step */}
         {paymentStep === 'error' && (
            <div className="p-12 flex flex-col items-center justify-center text-center bg-red-50 h-full w-full absolute inset-0 z-50">
               <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl mb-6 animate-pulse">
                  <AlertTriangle size={48} strokeWidth={3} />
               </div>
               <h3 className="text-2xl font-black text-gray-900 mb-2">Transaction Failed</h3>
               <p className="text-gray-600 mb-8 max-w-xs">{errorMessage || 'We could not process your booking. Any deducted amount will be refunded automatically.'}</p>
               <button 
                  onClick={() => setPaymentStep('method')}
                  className="px-8 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105"
               >
                  Try Again
               </button>
            </div>
         )}
      </div>
    </div>
  );
};

export default PaymentModal;
