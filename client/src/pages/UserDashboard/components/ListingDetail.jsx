import React, { useState, useEffect } from 'react';
import { 
  Home, Bike, MapPin, DollarSign, Shield, Calendar, Palette, Hash, 
  Fuel, Gauge, Droplet, Key, Clock, User, Eye, 
  BedDouble, Bath, Ruler, Building, Hammer, Dog, Wifi, 
  Thermometer, Zap, Leaf, ChevronLeft, ChevronRight, Sparkles, ClipboardList,
  CalendarDays, Check, Heart, MessageCircle, AlertTriangle
} from 'lucide-react';
import noImage from '../../../assets/no-image.png';
import { SERVER_BASE_URL } from '../../../config/api';

const ListingDetail = ({ listing, onBack, onToggleSave, isSaved, onReport, onBook, onUpdateApplication, onCancelApplication }) => {
  const [activeImage, setActiveImage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const isBike = listing?.type === 'bike' || !!listing?.dailyRate;
  
  // Application Mode Check
  const isApplication = !!listing?.applicationId || (listing?.status && ['pending', 'approved', 'rejected', 'cancelled', 'available'].includes(listing.status.toLowerCase()));
  // Treat available as pending for editing purposes
  const isPending = listing?.status?.toLowerCase() === 'pending' || listing?.status?.toLowerCase() === 'available';

  const handleSaveToggle = () => {
    setIsAnimating(true);
    onToggleSave?.(listing);
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Booking State - Initialize from application if available
  const [startDate, setStartDate] = useState(listing?.startDate ? listing.startDate.split('T')[0] : '');
  const [endDate, setEndDate] = useState(listing?.endDate ? listing.endDate.split('T')[0] : '');
  const [duration, setDuration] = useState(listing?.duration || 0);
  // ... other state initialization handled by useEffect largely, but we could init defaults if needed

  const [totalCost, setTotalCost] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [tax, setTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  // Normalize data
  const data = listing || {};
  const images = data.images || [];
  const mainImage = images[activeImage] 
    ? `${SERVER_BASE_URL}/uploads/${isBike ? 'bikes' : 'properties'}/${images[activeImage]}`
    : noImage;
  const otherImages = images.slice(0, 5);

  // Pricing Logic (Ported from PropertyModal)
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      setDuration(diffDays);

      let baseCost = 0;
      if (!isBike) {
         // Property: Monthly Rent Pro-rated
         const monthlyRent = Number(data.rentPrice || data.monthlyRent || 0);
         baseCost = (monthlyRent / 30) * diffDays;
      } else {
         // Bike: Dynamic Rate
         const dailyRate = Number(data.dailyRate || 0);
         const weeklyRate = Number(data.weeklyRate || 0);
         const monthlyRate = Number(data.monthlyRate || 0);

         if (diffDays >= 30 && monthlyRate > 0) {
            baseCost = (monthlyRate / 30) * diffDays;
         } else if (diffDays >= 7 && weeklyRate > 0) {
            baseCost = (weeklyRate / 7) * diffDays;
         } else {
            baseCost = dailyRate * diffDays;
         }
      }

      setTotalCost(baseCost);
      const fee = baseCost * 0.05; // 5% Service Fee
      setServiceFee(fee);
      const calculatedTax = baseCost * 0.13; // 13% VAT
      setTax(calculatedTax);
      const deposit = Number(data.securityDeposit || 0);
      setGrandTotal(baseCost + fee + calculatedTax + deposit);
    } else {
      setDuration(0);
      setTotalCost(0);
      setServiceFee(0);
      setTax(0);
      setGrandTotal(0);
    }
  }, [startDate, endDate, data.rentPrice, data.monthlyRent, data.dailyRate, data.weeklyRate, data.monthlyRate, data.securityDeposit, isBike]);

  const priceDiscount = isBike && duration >= 7 ? (duration >= 30 ? 'Monthly Rate Applied' : 'Weekly Rate Applied') : null;

  return (
   <div className="detail-container w-full flex-1 overflow-y-auto custom-scrollbar bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50">
      
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 md:px-8 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
        >
          <ChevronLeft size={16} /> Back
        </button>
        
        <div className="flex items-center gap-2">
            {isApplication && (
               <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${listing.status === 'pending' ? 'bg-orange-100 text-orange-600' : listing.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {listing.status} Application
               </span>
            )}
            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${isBike ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                {isBike ? 'Vehicle' : 'Property'}
            </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        
        {/* LEFT COLUMN: Gallery & Details */}
        <div className="xl:col-span-2 space-y-6 md:space-y-8 min-w-0">
           
           {/* Gallery Section */}
           <div className="space-y-4">
              <div className="relative aspect-square md:aspect-video w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm group">
                 <img
                    src={mainImage}
                    alt="Listing"
                    loading="lazy"
                    className="w-full h-full object-cover opacity-0 transition-opacity duration-700"
                     onError={e => { e.target.onerror = null; e.target.src = noImage; }}
                    onLoad={(e) => e.target.classList.add('opacity-100')}
                 />
                 <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-6 text-white md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <p className="font-bold text-lg">{activeImage + 1} / {images.length || 1}</p>
                 </div>
              </div>
              
              {otherImages.length > 0 && (
                <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                  {otherImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${activeImage === idx ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-transparent opacity-70 hover:opacity-100 hover:border-gray-300'}`}
                    >
                      <img 
                        src={`${SERVER_BASE_URL}/uploads/${isBike ? 'bikes' : 'properties'}/${img}`} 
                        className="w-full h-full object-cover" 
                        alt="thumb" 
                        onError={e => { e.target.onerror = null; e.target.src = noImage; }}
                      />
                    </button>
                  ))}
                </div>
              )}
           </div>

           {/* Title & Stats */}
           <div className="bg-linear-to-br from-white via-purple-50/30 to-indigo-50/40 rounded-2xl p-6 md:p-8 border border-purple-100 shadow-lg">
              <div className="flex items-start justify-between gap-4 mb-4">
                 <div className="min-w-0">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-2 truncate">
                       {isBike 
                          ? `${data.brand} ${data.model || data.name}`
                          : data.title}
                    </h1>
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                       <MapPin size={16} className={isBike ? "text-orange-500 shrink-0" : "text-green-500 shrink-0"} />
                       <span className="truncate">{isBike ? data.location : `${data.city}, ${data.address}`}</span>
                    </div>
                 </div>
                 <div className="hidden md:block text-right shrink-0">
                    <div className="text-2xl font-black text-indigo-600">
                       Rs {Number(isBike ? data.dailyRate : (data.rentPrice || data.monthlyRent)).toLocaleString()}
                       <span className="text-sm text-slate-400 font-bold ml-1">
                          /{isBike ? 'day' : 'mo'}
                       </span>
                    </div>
                    {data.securityDeposit && (
                       <p className="text-xs text-slate-400 font-bold mt-1">
                          Deposit: Rs {Number(data.securityDeposit).toLocaleString()}
                       </p>
                    )}
                 </div>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                 {isBike ? (
                    <>
                       <SpecItem icon={Calendar} label="Year" value={data.year} />
                       <SpecItem icon={Fuel} label="Fuel" value={data.fuelType} />
                       <SpecItem icon={Gauge} label="Details" value={`${data.engineCapacity || '?'} cc`} />
                       <SpecItem icon={Palette} label="Color" value={data.color || 'N/A'} />
                    </>
                 ) : (
                    <>
                       <SpecItem icon={BedDouble} label="Beds" value={data.bedrooms} />
                       <SpecItem icon={Bath} label="Baths" value={data.bathrooms} />
                       <SpecItem icon={Ruler} label="Area" value={`${data.area} ${data.areaUnit || 'sqft'}`} />
                       <SpecItem icon={Building} label="Type" value={data.propertyType} />
                    </>
                 )}
              </div>
           </div>

           {/* Description */}
           <div className="bg-linear-to-br from-white via-blue-50/30 to-cyan-50/40 rounded-2xl p-6 md:p-8 border border-blue-100 shadow-lg overflow-hidden">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <ClipboardList size={16} /> Description
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap break-words">
                 {data.description || 'No description provided.'}
              </p>
           </div>

           {/* Amenities/Features */}
           <div className="bg-linear-to-br from-white via-emerald-50/30 to-teal-50/40 rounded-2xl p-6 md:p-8 border border-emerald-100 shadow-lg">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Zap size={16} /> Features & Amenities
              </h3>
              <div className="flex flex-wrap gap-2">
                 {((isBike ? data.features : data.amenities) || []).map((feat, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1.5 hover:border-indigo-200 transition-colors">
                       <Check size={12} className="text-indigo-500" /> {feat}
                    </span>
                 ))}
                 {(!((isBike ? data.features : data.amenities) || []).length) && (
                    <span className="text-sm text-slate-400 italic">No specific features listed.</span>
                 )}
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN: Booking Sidebar */}
        <div className="lg:col-span-1">
           <div className="sticky top-24 space-y-4">
              
              {/* Report Button (Top Right) */}
              <div className="flex justify-end">
                <button onClick={() => onReport?.(data)} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">
                   <AlertTriangle size={12} /> Report Listing
                </button>
              </div>

              {/* Booking Card */}
              <div className="bg-linear-to-br from-white via-rose-50/20 to-orange-50/30 rounded-2xl shadow-xl border-2 border-pink-100 overflow-hidden">
                 <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-baseline gap-1">
                       <span className="text-3xl font-black text-slate-900">
                          Rs {Number(isBike ? data.dailyRate : (data.rentPrice || data.monthlyRent)).toLocaleString()}
                       </span>
                       <span className="text-sm font-bold text-slate-400">/{isBike ? 'day' : 'month'}</span>
                    </div>
                    {isBike && (
                       <div className="flex gap-2 mt-2 text-[10px] font-bold text-slate-500 uppercase">
                          {data.weeklyRate && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">Weekly: Rs {Number(data.weeklyRate).toLocaleString()}</span>}
                          {data.monthlyRate && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Monthly: Rs {Number(data.monthlyRate).toLocaleString()}</span>}
                       </div>
                    )}
                 </div>

                 <div className="p-6 space-y-6">
                    {/* Date Inputs */}
                    <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Start Date</label>
                          <input 
                             type="date" 
                             className={`w-full text-xs font-bold p-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-indigo-500 transition-all ${isApplication && !isPending ? 'cursor-not-allowed opacity-60' : ''}`}
                             value={startDate}
                             min={new Date().toISOString().split('T')[0]}
                             onChange={(e) => setStartDate(e.target.value)}
                             disabled={isApplication && !isPending}
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">End Date</label>
                          <input 
                             type="date" 
                             className={`w-full text-xs font-bold p-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-indigo-500 transition-all ${isApplication && !isPending ? 'cursor-not-allowed opacity-60' : ''}`}
                             value={endDate}
                             min={startDate || new Date().toISOString().split('T')[0]}
                             onChange={(e) => setEndDate(e.target.value)}
                             disabled={isApplication && !isPending}
                          />
                       </div>
                    </div>

                    {/* Cost Breakdown */}
                    {duration > 0 ? (
                       <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                          {priceDiscount && (
                             <div className="text-xs font-bold text-green-600 bg-green-50 p-2 rounded text-center mb-2 border border-green-100">
                                {priceDiscount}
                             </div>
                          )}
                          <div className="flex justify-between text-xs text-slate-600">
                             <span>Base Rate x {duration} days</span>
                             <span className="font-bold">Rs {totalCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-600">
                             <span>Security Deposit</span>
                             <span className="font-bold">Rs {Number(data.securityDeposit || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-600">
                             <span>Service Fee (5%)</span>
                             <span className="font-bold">Rs {serviceFee.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-600">
                             <span>VAT (13%)</span>
                             <span className="font-bold">Rs {tax.toLocaleString()}</span>
                          </div>
                          <div className="h-px bg-slate-200 my-2"></div>
                          <div className="flex justify-between text-sm font-black text-slate-900">
                             <span>Total</span>
                             <span>Rs {grandTotal.toLocaleString()}</span>
                          </div>
                       </div>
                    ) : (
                       <div className="text-center py-6 px-4 border-2 border-dashed border-slate-100 rounded-xl">
                          <CalendarDays size={20} className="text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-400">Select dates to calculate price</p>
                       </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                       {isApplication && isPending ? (
                          <>
                             <button
                                onClick={() => {
                                   if (!duration) return;
                                   onUpdateApplication?.(listing.applicationId || listing.id, { startDate, endDate, duration, totalAmount: grandTotal });
                                }}
                                disabled={!duration}
                                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                             >
                                <Zap size={18} /> Update Booking
                             </button>
                             
                             <button
                                onClick={() => onCancelApplication?.(listing.applicationId || listing.id)}
                                className="w-full py-3 bg-white border-2 border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center gap-2"
                             >
                                <AlertTriangle size={18} /> Cancel Application
                             </button>
                          </>
                       ) : isApplication ? (
                          <div className="p-3 bg-gray-100 rounded-xl text-center text-xs font-bold text-gray-500">
                             Application is {listing.status}
                          </div>
                       ) : (
                          <button 
                             onClick={() => {
                                if (!duration) return;
                                onBook({ ...data, bookingDetails: { startDate, endDate, duration, totalCost, grandTotal } });
                             }}
                             disabled={!duration}
                             className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                             <Zap size={18} /> {duration ? 'Proceed to Book' : 'Select Dates'}
                          </button>
                       )}
                       
                       <div className="grid grid-cols-2 gap-3">
                           <button 
                              onClick={handleSaveToggle}
                              className={`py-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-xs ${isSaved ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'} ${isAnimating ? 'animate-heart-pop' : ''}`}
                           >
                              <Heart size={16} className={isSaved ? 'fill-rose-500 text-rose-500' : ''} /> {isSaved ? 'Saved' : 'Save'}
                           </button>
                          <button className="py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:border-slate-300 flex items-center justify-center gap-2 transition-all">
                             <MessageCircle size={16} /> Chat
                          </button>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Verified Host Badge */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-black text-lg">
                    {(data.vendor?.name || 'H')[0]}
                 </div>
                 <div>
                    <h4 className="font-bold text-slate-900 text-sm">{data.vendor?.name || 'Verified Host'}</h4>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Member Since 2024</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

// Helper for specs
const SpecItem = ({ icon: Icon, label, value }) => (
   <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl border border-slate-100 min-w-0">
      <Icon size={18} className="text-slate-400 mb-1 shrink-0" />
      <span className="text-sm font-bold text-slate-800 truncate w-full text-center">{value || '-'}</span>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
   </div>
);

export default ListingDetail;
