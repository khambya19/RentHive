import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../config/api';
import { 
  Home, Bike, MapPin, DollarSign, Shield, Calendar, Palette, Hash, 
  Fuel, Gauge, Droplet, Key, Clock, User, Eye, 
  BedDouble, Bath, Ruler, Building, Hammer, Dog, Wifi, 
  Thermometer, Zap, Leaf, ChevronLeft, ChevronRight, Sparkles, ClipboardList,
  CalendarDays, Check, Heart, MessageCircle, AlertTriangle,
  Star, PenTool, Info
} from 'lucide-react';
import noImage from '../../../assets/no-image.png';
import { SERVER_BASE_URL } from '../../../config/api';


const ListingDetail = ({ listing, onBack, onToggleSave, isSaved, onReport, onBook, onChat, onUpdateApplication, onCancelApplication }) => {
   const isBike = listing?.type === 'bike' || !!listing?.dailyRate;
   // Review State
   const [reviews, setReviews] = useState([]);
   const [reviewLoading, setReviewLoading] = useState(false);
   const [reviewError, setReviewError] = useState(null);
   const [showReviewForm, setShowReviewForm] = useState(false);
   const [reviewComment, setReviewComment] = useState('');
   const [reviewRating, setReviewRating] = useState(0);
   const [submittingReview, setSubmittingReview] = useState(false);
   const [reviewSuccess, setReviewSuccess] = useState(false);

   // Simulate current user (replace with context if available)
   const currentUser = JSON.parse(localStorage.getItem('user')) || {};

   // Determine review association
   const reviewQuery = isBike
      ? `bikeId=${listing?.id}`
      : `propertyId=${listing?.id}`;

   // Fetch reviews for this ad
   useEffect(() => {
      if (!listing?.id) return;
      setReviewLoading(true);
      setReviewError(null);
      fetch(`${API_BASE_URL}/reviews?${reviewQuery}`)
         .then(res => res.json())
         .then(data => {
            setReviews(Array.isArray(data) ? data : []);
            setReviewLoading(false);
         })
         .catch(err => {
            setReviewError('Failed to load reviews');
            setReviewLoading(false);
         });
   }, [listing?.id]);


   // Check if current user already reviewed
   const alreadyReviewed = reviews.some(r => r.reviewerName === currentUser?.name);

   // Pending check for editing capabilities (move up for useEffect)
   const isPending = listing?.status?.toLowerCase() === 'pending';
   const isApprovedOrPaid = ['approved', 'paid'].includes(listing?.status?.toLowerCase());

   // Always show review section, but control form enabled state
   useEffect(() => {
      setShowReviewForm(true);
   }, [isApprovedOrPaid, alreadyReviewed]);

   // Handle review submit
   const handleReviewSubmit = async (e) => {
      e.preventDefault();
      if (!reviewRating || !reviewComment) return;
      setSubmittingReview(true);
      setReviewError(null);
      try {
         const body = {
            reviewerName: currentUser?.name || 'Anonymous',
            rating: reviewRating,
            comment: reviewComment,
            ...(isBike ? { bikeId: listing.id } : { propertyId: listing.id })
         };
         const res = await fetch(`${API_BASE_URL}/reviews/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
         });
         if (!res.ok) throw new Error('Failed to submit review');
         setReviewSuccess(true);
         setReviewComment('');
         setReviewRating(0);
         // Refetch reviews
         fetch(`${API_BASE_URL}/reviews?${reviewQuery}`)
            .then(res => res.json())
            .then(data => setReviews(Array.isArray(data) ? data : []));
      } catch (err) {
         setReviewError('Failed to submit review');
      } finally {
         setSubmittingReview(false);
      }
   };
   const [activeImage, setActiveImage] = useState(0);
   const [isAnimating, setIsAnimating] = useState(false);
  
   // Application Mode Check
   const isApplication = !!listing?.applicationId || (listing?.status && ['pending', 'approved', 'rejected', 'cancelled', 'paid'].includes(listing.status.toLowerCase()));

  const handleSaveToggle = () => {
    setIsAnimating(true);
    onToggleSave?.(listing);
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Booking State - Initialize from application if available
  const [startDate, setStartDate] = useState(listing?.startDate ? listing.startDate.split('T')[0] : '');
  const [endDate, setEndDate] = useState(listing?.endDate ? listing.endDate.split('T')[0] : '');
  const [duration, setDuration] = useState(listing?.duration || 0);

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
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
      
      setDuration(diffDays);

      let baseCost = 0;
      if (!isBike) {
         // Property: Monthly Rent Pro-rated
         const rentVal = String(data.rentPrice || data.monthlyRent || 0).replace(/[^0-9.]/g, '');
         const monthlyRent = Number(rentVal);
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
      const fee = 0; // Service Fee removed as per user request
      setServiceFee(fee);
      const calculatedTax = baseCost * 0.13; // 13% VAT
      setTax(calculatedTax);
      const deposit = Number(String(data.securityDeposit || 0).replace(/[^0-9.]/g, ''));
      const calculatedGrandTotal = baseCost + calculatedTax + deposit;
      setGrandTotal(Number(calculatedGrandTotal.toFixed(2)));
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
      {/* ...existing code... */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 md:px-8 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
        >
          <ChevronLeft size={16} /> Back
        </button>
        
        <div className="flex items-center gap-2">
            {isApplication && (
               <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${listing.status?.toLowerCase() === 'pending' ? 'bg-orange-100 text-orange-600' : isApprovedOrPaid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
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
              <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap wrap-break-word">
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

            {/* Comprehensive Property/Bike Details */}
            {/* Comprehensive Property/Bike Details */}
            <div className="space-y-6">
               <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-xl space-y-10">
                  {/* Policies & Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-6">
                           <Shield size={18} className="text-indigo-500" /> Rules & Policies
                        </h3>
                        <div className="grid gap-4">
                           {!isBike ? (
                              <>
                                 <DetailRow label="Pet Policy" value={data.petPolicy} icon={Dog} />
                                 {data.petDetails && <p className="text-xs text-slate-500 ml-8 italic bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">"{data.petDetails}"</p>}
                                 <DetailRow label="Furnished" value={data.furnished} icon={Home} />
                                 <DetailRow label="Condition" value={data.propertyCondition} icon={Hammer} />
                                 <DetailRow label="Zoning" value={data.zoningType} icon={MapPin} />
                              </>
                           ) : (
                              <>
                                 <DetailRow label="Insurance" value={data.insurance ? 'Full Coverage' : 'Basic/None'} icon={Shield} />
                                 <DetailRow label="Helmet" value={data.helmetIncluded ? 'Included' : 'Not Included'} icon={Zap} />
                                 <DetailRow label="Member Since" value="2024" icon={Calendar} />
                              </>
                           )}
                        </div>
                     </div>

                     <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-6">
                           <Info size={18} className="text-blue-500" /> Key Specs
                        </h3>
                        <div className="grid gap-4">
                           {!isBike ? (
                              <>
                                 <DetailRow label="Total Area" value={data.area} icon={Ruler} />
                                 <DetailRow label="Year Built" value={data.yearBuilt} icon={Calendar} />
                                 <DetailRow label="Garage" value={`${data.garageSpaces} Spaces`} icon={Key} />
                                 <DetailRow label="Half Baths" value={data.halfBathrooms} icon={Bath} />
                              </>
                           ) : (
                              <>
                                 <DetailRow label="Engine" value={`${data.engineCapacity || 'N/A'} cc`} icon={Zap} />
                                 <DetailRow label="Fuel Type" value={data.fuelType} icon={Droplet} />
                                 <DetailRow label="Mileage" value={data.mileage ? `${data.mileage} km/l` : 'N/A'} icon={Gauge} />
                                 <DetailRow label="Color" value={data.color} icon={Palette} />
                              </>
                           )}
                        </div>
                     </div>
                  </div>

                  {!isBike && (
                     <>
                        <div className="h-px bg-linear-to-r from-transparent via-slate-200 to-transparent"></div>
                        
                        {/* Interior & Appliances Section */}
                        <div className="space-y-6">
                           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                              <Zap size={18} className="text-amber-500" /> Interior & Systems
                           </h3>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-4">
                                 <TagList label="Flooring" items={data.flooring} />
                                 <TagList label="Heating" items={data.heatingSystem} />
                              </div>
                              <div className="space-y-4">
                                 <TagList label="Cooling" items={data.coolingSystem} />
                                 <TagList label="Appliances" items={data.appliancesIncluded} />
                              </div>
                              <div className="space-y-4">
                                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Basement</p>
                                    <p className="text-sm font-bold text-slate-800">{data.basementType || 'None'} {data.basementArea ? `(${data.basementArea})` : ''}</p>
                                 </div>
                                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fireplace</p>
                                    <p className="text-sm font-bold text-slate-800">{data.fireplaceCount > 0 ? `${data.fireplaceCount}x ${data.fireplaceType}` : 'None'}</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="h-px bg-linear-to-r from-transparent via-slate-200 to-transparent"></div>

                        {/* Exterior & Lot Section */}
                        <div className="space-y-6">
                           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                              <Building size={18} className="text-emerald-500" /> Exterior & Environment
                           </h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Roof</p>
                                    <p className="text-sm font-bold text-slate-800">{data.roofType || 'Standard'} {data.roofAge ? `(${data.roofAge} yrs)` : ''}</p>
                                 </div>
                                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fence</p>
                                    <p className="text-sm font-bold text-slate-800">{data.fenceType || 'None'}</p>
                                 </div>
                                 <TagList label="Exterior Material" items={data.exteriorMaterial} />
                                 <TagList label="Pool & Spa" items={data.poolSpa} />
                              </div>
                              <div className="space-y-4">
                                 <TagList label="Views" items={data.view} />
                                 <div className="grid grid-cols-2 gap-4">
                                    <DetailBox label="Solar Panels" value={data.solarPanels} />
                                    <DetailBox label="Energy Efficient" value={data.energyEfficient} />
                                 </div>
                                 {data.greenCertification && (
                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                                       <Leaf className="text-emerald-500" size={20} />
                                       <div>
                                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Green Certification</p>
                                          <p className="text-sm font-bold text-emerald-900">{data.greenCertification}</p>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>

                        <div className="h-px bg-linear-to-r from-transparent via-slate-200 to-transparent"></div>

                        {/* Financials Section */}
                        <div className="space-y-6">
                           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                              <DollarSign size={18} className="text-rose-500" /> Financials & Fees
                           </h3>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100 shadow-sm">
                                 <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Monthly Cost Estimate</p>
                                 <p className="text-2xl font-black text-rose-600 tracking-tighter">Rs {Number(data.rentPrice || data.monthlyRent).toLocaleString()}</p>
                                 <p className="text-[10px] font-bold text-rose-400 mt-2">Excluding specific utility fees</p>
                              </div>
                              <div className="space-y-3">
                                 <DetailRow label="HOA Fee" value={data.hoaFees ? `Rs ${data.hoaFees}` : 'Inclusive'} icon={Shield} />
                                 <DetailRow label="Frequency" value={data.hoaFeesFrequency} icon={Clock} />
                                 <DetailRow label="HOA Name" value={data.hoaName} icon={ClipboardList} />
                              </div>
                              <div className="space-y-3">
                                 <DetailRow label="Property Taxes" value={data.propertyTaxes} icon={DollarSign} />
                                 <DetailRow label="Maintenance" value={data.maintenanceFees} icon={Hammer} />
                              </div>
                           </div>
                        </div>
                     </>
                  )}
               </div>

               {/* Floor Plan & Documents */}
               {data.floorPlan && (
                  <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                     <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                           <Ruler size={32} />
                        </div>
                        <div>
                           <h3 className="font-black text-slate-900 text-xl tracking-tight">Technical Floor Plan</h3>
                           <p className="text-slate-500 font-medium">Review the architectural layout of this property.</p>
                        </div>
                     </div>
                     <a 
                        href={`${SERVER_BASE_URL}/uploads/properties/${data.floorPlan}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 shrink-0"
                     >
                        <Eye size={20} /> View Full Layout
                     </a>
                  </div>
               )}
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

              {/* Booking Card - Blocked for Rentals */}
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
                    {/* Blocked Booking Section for Rentals */}
                    {typeof window !== 'undefined' && window.location.pathname.includes('rentals') ? (
                      <div className="text-center py-8 px-4 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50">
                        <CalendarDays size={28} className="text-slate-300 mx-auto mb-3" />
                        <p className="text-base font-bold text-slate-500">This rental is already paid and active.</p>
                        <p className="text-xs text-slate-400 mt-2">All details are shown below. You cannot book again.</p>
                        <div className="mt-6 text-left text-xs text-slate-500">
                          <div><span className="font-bold text-slate-700">Start Date:</span> {startDate}</div>
                          <div><span className="font-bold text-slate-700">End Date:</span> {endDate}</div>
                          <div><span className="font-bold text-slate-700">Duration:</span> {duration} days</div>
                          <div><span className="font-bold text-slate-700">Total Paid:</span> Rs {grandTotal.toLocaleString()}</div>
                        </div>
                      </div>
                    ) : (
                      <>
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
                              <div className="flex flex-col gap-3">
                                  <div className="p-3 bg-gray-100 rounded-xl text-center text-xs font-bold text-gray-500 uppercase tracking-tighter">
                                     Application Status: {listing.status}
                                  </div>
                                  {isApprovedOrPaid && (
                                     <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 mt-2">
                                        <button className="py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 font-bold text-xs hover:bg-amber-100 flex items-center justify-center gap-2 transition-all">
                                           <Star size={16} fill="currentColor" /> Rate Owner
                                        </button>
                                        <button className="py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 font-bold text-xs hover:bg-blue-100 flex items-center justify-center gap-2 transition-all">
                                           <PenTool size={16} /> Write Review
                                        </button>
                                        <button 
                                           onClick={() => onReport?.(data)}
                                           className="col-span-2 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold text-xs hover:bg-rose-100 flex items-center justify-center gap-2 transition-all"
                                        >
                                           <AlertTriangle size={16} /> Report Issue / Scam
                                        </button>
                                     </div>
                                  )}
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
                               <button 
                                  onClick={() => {
                                     console.log("Chat button clicked inside ListingDetail");
                                     if (onChat) onChat(data);
                                  }}
                                  className="py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:border-slate-300 flex items-center justify-center gap-2 transition-all"
                               >
                                  <MessageCircle size={16} /> Chat
                               </button>
                            </div>

                           {/* REVIEWS SECTION (moved below Save/Chat) */}
                           <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-lg mt-6">
                              <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                 <Star size={20} className="text-yellow-400" /> Reviews & Ratings
                              </h3>
                              {reviewLoading ? (
                                 <div className="text-slate-400 text-sm">Loading reviews...</div>
                              ) : reviews.length === 0 ? (
                                 <div className="text-slate-400 text-sm">No reviews yet for this {isBike ? 'vehicle' : 'property'}.</div>
                              ) : (
                                 <div className="space-y-4">
                                    {reviews.map((r, i) => (
                                       <div key={i} className="border-b border-slate-100 pb-3 mb-3">
                                          <div className="flex items-center gap-2 mb-1">
                                             <span className="font-bold text-slate-800">{r.reviewerName}</span>
                                             <span className="flex gap-0.5">
                                                {[1,2,3,4,5].map(star => (
                                                   <Star key={star} size={14} className={star <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'} />
                                                ))}
                                             </span>
                                          </div>
                                          <div className="text-slate-600 text-sm">{r.comment}</div>
                                          <div className="text-xs text-slate-400 mt-1">{new Date(r.createdAt).toLocaleString()}</div>
                                       </div>
                                    ))}
                                 </div>
                              )}
                              {/* Review Form - always visible, but disabled if not eligible */}
                              {showReviewForm && (
                                 <form onSubmit={handleReviewSubmit} className="mt-6 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2">
                                       <span className="font-bold text-slate-700">Your Rating:</span>
                                       {[1,2,3,4,5].map(star => (
                                          <button
                                             type="button"
                                             key={star}
                                             onClick={() => (isApprovedOrPaid && !alreadyReviewed) && setReviewRating(star)}
                                             className={star <= reviewRating ? 'text-yellow-400' : 'text-slate-300'}
                                             aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                             disabled={!(isApprovedOrPaid && !alreadyReviewed)}
                                          >
                                             <Star size={22} className={star <= reviewRating ? 'fill-yellow-400' : ''} />
                                          </button>
                                       ))}
                                    </div>
                                    <textarea
                                       className="w-full p-2 rounded border border-slate-200 text-sm"
                                       rows={3}
                                       placeholder={isApprovedOrPaid && !alreadyReviewed ? "Write your review..." : "You can review after payment is approved."}
                                       value={reviewComment}
                                       onChange={e => setReviewComment(e.target.value)}
                                       required
                                       disabled={!(isApprovedOrPaid && !alreadyReviewed)}
                                    />
                                    <button
                                       type="submit"
                                       disabled={submittingReview || !reviewRating || !reviewComment || !(isApprovedOrPaid && !alreadyReviewed)}
                                       className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl disabled:bg-slate-300"
                                    >
                                       {submittingReview ? 'Submitting...' : (isApprovedOrPaid && !alreadyReviewed ? 'Submit Review' : 'Review Unavailable')}
                                    </button>
                                    {reviewError && <div className="text-red-500 text-xs mt-1">{reviewError}</div>}
                                    {reviewSuccess && <div className="text-green-600 text-xs mt-1">Review submitted!</div>}
                                    {(!isApprovedOrPaid || alreadyReviewed) && (
                                      <div className="text-xs text-slate-400 mt-2">
                                        {alreadyReviewed ? 'You have already reviewed this listing.' : 'You can review after payment is approved.'}
                                      </div>
                                    )}
                                 </form>
                              )}
                           </div>
                        </div>
                      </>
                    )}
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

// Helper for detail rows
const DetailRow = ({ label, value, icon: Icon }) => (
   <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
         {Icon && <Icon size={14} className="text-slate-400" />}
      </div>
      <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex-1">{label}</span>
      <span className="text-sm font-black text-slate-800">{value !== null && value !== undefined && value !== '' && value !== 0 ? value : 'N/A'}</span>
   </div>
);

const TagList = ({ label, items }) => (
   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
      <div className="flex flex-wrap gap-1.5">
         {(items && items.length > 0) ? items.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-600 shadow-xs">
               {tag}
            </span>
         )) : <span className="text-[10px] text-slate-400 italic">None</span>}
      </div>
   </div>
);

const DetailBox = ({ label, value }) => (
   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-black text-slate-800">{value || 'N/A'}</p>
   </div>
);
