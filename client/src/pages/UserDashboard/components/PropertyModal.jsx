import React, { useState, useEffect } from 'react';
import PropertyLocationMap from '../../../components/PropertyLocationMap';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  BedDouble, 
  Bath, 
  Ruler, 
  Calendar, 
  Palette, 
  Fuel, 
  Gauge, 
  MessageCircle, 
  Heart,
  Zap,
  Tag,
  Maximize2,
  ShieldCheck,
  Check,
  Star,
  Home,
  Bike,
  Navigation,
  Phone,
  Mail,
  UserCheck,
  ArrowRight,
  CreditCard,
  Lock,
  Clock,
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import { SERVER_BASE_URL } from '../../../config/api';
import noImage from '../../../assets/no-image.png';

const PropertyModal = ({ property, onClose, isSaved = false, onToggleSave, onReport, onReview, onContactOwner, onBook }) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [booking, setBooking] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Booking State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [tax, setTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  // Contact Owner handler
  const handleContactOwner = () => {
    if (onContactOwner) onContactOwner(property);
  };

  // Book Now handler
  const handleBookNow = async () => {
    if (booking) return;
    
    setBooking(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
      
      const isProperty = property.type === 'property';
      const endpoint = isProperty 
        ? `${API_BASE_URL}/properties/book`
        : `${API_BASE_URL}/bikes/book`;
      
      const bookingData = isProperty 
        ? {
            propertyId: property.id,
            moveInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
            message: `I'm interested in booking this property.`
          }
        : {
            bikeId: property.id,
            vendorId: property.vendorId || property.vendor?.id,
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            message: `I'm interested in booking this bike.`
          };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        alert('Booking request sent successfully! The owner will contact you soon.');
        onClose();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to send booking request. Please try again.');
      }
    } catch (error) {
      console.error('Error booking:', error);
      alert('Failed to send booking request. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (!property) return null;

  const isProperty = property.type === 'property' || property.propertyType !== undefined;
  const baseUrl = (import.meta.env.VITE_API_URL || API_BASE_URL)?.replace('/api', '') || 'http://localhost:5050';
  
  // Fix image path logic - handle both formats
  const getImageUrl = (img) => {
    if (!img) return null;
    // Check if path already includes /uploads prefix
    if (img.startsWith('/uploads')) {
      return `${baseUrl}${img}`;
    }
    const folder = isProperty ? 'properties' : 'bikes';
    return `${baseUrl}/uploads/${folder}/${img}`;
  };

  const images = property.images || [];
  const hasImages = images.length > 0;
  const galleryImages = images;

  const openLightbox = (index) => {
    setSelectedImageIndex(index);
    setIsFullScreen(true);
  };

  const nextImage = (e) => {
    e?.stopPropagation();
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e?.stopPropagation();
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Pricing Calculation Logic
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      setDuration(diffDays);

      let baseCost = 0;
      // Dynamic Pricing Logic for Vehicles
      if (isProperty) {
         // Property logic: Simple Rent Calculation
         // Assumption: rentPrice is Monthly
         const monthlyRent = Number(property.rentPrice || 0);
         baseCost = (monthlyRent / 30) * diffDays;
      } else {
         // Vehicle logic: Best Rate Application
         // Hierarchy: Monthly > Weekly > Daily
         const dailyRate = Number(property.dailyRate || 0);
         const weeklyRate = Number(property.weeklyRate || 0);
         const monthlyRate = Number(property.monthlyRate || 0);

         // Helper to calculate cost based on the best available package
         // If 19 days -> 2 weeks + 5 days? Or just pro-rated weekly?
         // User requested: "if 19 days ... week rate should be divide" -> Pro-rated Weekly Rate
         
         if (diffDays >= 30 && monthlyRate > 0) {
            // Apply Pro-rated Monthly Rate
            baseCost = (monthlyRate / 30) * diffDays;
         } else if (diffDays >= 7 && weeklyRate > 0) {
            // Apply Pro-rated Weekly Rate
            baseCost = (weeklyRate / 7) * diffDays;
         } else {
            // Apply Daily Rate
            baseCost = dailyRate * diffDays;
         }
      }

      setTotalCost(baseCost);
      
      // Calculate Fees
      const fee = baseCost * 0.05; // 5% Service Fee
      setServiceFee(fee);

      const calculatedTax = baseCost * 0.13; // 13% VAT
      setTax(calculatedTax);

      const deposit = Number(property.securityDeposit || 0);

      setGrandTotal(baseCost + fee + calculatedTax + deposit);
    } else {
      setDuration(0);
      setTotalCost(0);
      setServiceFee(0);
      setTax(0);
      setGrandTotal(0);
    }
  }, [startDate, endDate, property]);

  // Format data for display
  const title = isProperty ? property.title : (property.name || `${property.brand} ${property.model}`);
  const address = isProperty ? `${property.address}, ${property.city}` : property.location;
  // Dynamic Price Display based on viewing context (not booking context yet)
  const price = isProperty ? property.rentPrice : property.dailyRate;
  const priceType = isProperty ? '/ Month' : '/ Day';
  const category = isProperty ? property.propertyType : (property.type || 'Automobile');

  const handleBookClick = () => {
    if (!startDate || !endDate) {
      alert("Please select booking dates first.");
      return;
    }
    // Pass booking details to parent handler
    onBook?.({
      ...property,
      bookingDetails: {
        startDate,
        endDate,
        duration,
        totalCost,
        grandTotal
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[9999] p-0 sm:p-0 m-0" onClick={onClose}>
      {/* Search Header and Scrollable Content are inside the relative div below */}
        
        {/* Close Button */}
        <button 
          className="absolute top-4 right-4 z-[1001] text-gray-800 rounded-full p-2 transition-all shadow-sm" style={{ background: 'rgba(244,251,253,0.8)' }}
          onClick={onClose}
        >
          <X size={24} />
        </button>

      {/* Full Screen Image View */}
      {isFullScreen && (
        <div className="fixed inset-0 z-1100 bg-black flex flex-col items-center justify-center">
           <button 
             onClick={() => setIsFullScreen(false)}
             className="absolute top-6 right-6 text-white p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all z-50"
           >
             <X size={24} />
           </button>
           <div className="relative w-full h-full flex items-center justify-center group">
              <img 
                src={`${SERVER_BASE_URL}/uploads/${isProperty ? 'properties' : 'bikes'}/${images[selectedImageIndex]}`}
                alt="Full screen view"
                className="max-h-full max-w-full object-contain"
                onError={(e) => { e.target.src = noImage; }}
              />
              {images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 p-4 text-white hover:scale-110 transition-transform bg-black/50 rounded-full"><ChevronLeft size={32} /></button>
                  <button onClick={nextImage} className="absolute right-4 p-4 text-white hover:scale-110 transition-transform bg-black/50 rounded-full"><ChevronRight size={32} /></button>
                </>
              )}
           </div>
        </div>
      )}

      {/* Main Modal - Centered Vertical Scroll */}
      <div 
        className="relative w-full max-w-5xl h-full md:h-[90vh] bg-white md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 transform-gpu"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Sticky Header with Title */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shadow-sm shrink-0">
           <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isProperty ? (property.listingType === 'For Sale' ? 'bg-green-50 text-green-600' : 'bg-indigo-50 text-indigo-600') : 'bg-orange-50 text-orange-600'}`}>
                    {isProperty ? (property.listingType || 'PROPERTY') : 'VEHICLE'}
                 </span>
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden sm:inline">ID: #{property.id}</span>
              </div>
              <h2 className="text-base md:text-lg font-bold text-gray-900 truncate">{title}</h2>
           </div>
           <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-all shrink-0">
             <X size={24} />
           </button>
        </div>

        {/* Layout: Content Left, Booking Sticky Right */}
        <div className="flex flex-col lg:flex-row h-full overflow-hidden"> 
           
           {/* Left Content Column (Scrollable) */}
           <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 scroll-smooth">
              
               {/* 1. Hero Image */}
               <div className="w-full h-62.5 sm:h-87.5 md:h-100 relative bg-gray-200 group">
                  {hasImages ? (
                    <>
                      <img 
                        src={`${SERVER_BASE_URL}/uploads/${isProperty ? 'properties' : 'bikes'}/${images[selectedImageIndex]}`}
                        alt="Main listing"
                        className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => setIsFullScreen(true)}
                        onError={(e) => { e.target.src = noImage; }}
                      />
                      
                      {/* Navigation */}
                      {images.length > 1 && (
                         <>
                            <button onClick={prevImage} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-xl opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><ChevronLeft size={18} className="md:w-5 md:h-5" /></button>
                            <button onClick={nextImage} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-xl opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><ChevronRight size={18} className="md:w-5 md:h-5" /></button>
                         </>
                      )}

                      {/* Controls */}
                      <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 flex gap-1.5 md:gap-2">
                         <span className="px-2 md:px-3 py-1 bg-black/70 text-white text-[10px] md:text-xs font-bold rounded-lg backdrop-blur-md flex items-center gap-1 md:gap-2">
                            {selectedImageIndex + 1} / {images.length}
                         </span>
                         <button onClick={() => setIsFullScreen(true)} className="p-1.5 bg-black/70 text-white rounded-lg hover:bg-black/90 backdrop-blur-md transition-colors">
                            <Maximize2 size={14} className="w-3 h-3 md:w-3.5 md:h-3.5" />
                         </button>
                      </div>

                      {/* Thumbnails */}
                      <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 hidden sm:flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 bg-black/40 backdrop-blur-md rounded-xl max-w-[50%] md:max-w-[60%] overflow-x-auto no-scrollbar opacity-0 group-hover:opacity-100 transition-opacity">
                          {images.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${idx === selectedImageIndex ? 'border-white opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                            >
                               <img src={`${SERVER_BASE_URL}/uploads/${isProperty ? 'properties' : 'bikes'}/${img}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                      </div>
                    </>
                  ) : ( /* No Image Fallback */ 
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                        {isProperty ? <Home size={64} strokeWidth={1} /> : <Bike size={64} strokeWidth={1} />}
                        <span className="text-sm font-medium mt-3 uppercase tracking-widest">No Visual Assets</span>
                    </div>
                  )}
               </div>


               {/* 2. Specs Grid & Details */}
               <div className="p-6 sm:p-8 bg-white border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <Tag size={16} strokeWidth={2.5} />
                     </div>
                     <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Asset Specifications</h3>
                  </div>
                  
                  {/* Primary Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
                     {isProperty ? (
                       <>
                         <>
                           <div className="p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100 flex flex-col items-center text-center hover:bg-white hover:shadow-md transition-all min-w-0">
                              <BedDouble className="text-indigo-500 mb-1.5 md:mb-2 shrink-0" size={20} />
                              <span className="text-base md:text-lg font-black text-gray-900 truncate w-full">{property.bedrooms}</span>
                              <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate w-full">Bedrooms</span>
                           </div>
                           <div className="p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100 flex flex-col items-center text-center hover:bg-white hover:shadow-md transition-all min-w-0">
                              <Bath className="text-blue-500 mb-1.5 md:mb-2 shrink-0" size={20} />
                              <span className="text-base md:text-lg font-black text-gray-900 truncate w-full">{property.bathrooms}</span>
                              <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate w-full">Bathrooms</span>
                           </div>
                           <div className="p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100 flex flex-col items-center text-center hover:bg-white hover:shadow-md transition-all min-w-0">
                              <Ruler className="text-emerald-500 mb-1.5 md:mb-2 shrink-0" size={20} />
                              <span className="text-base md:text-lg font-black text-gray-900 truncate w-full">{property.area} <span className="text-xs font-normal text-gray-400">{property.areaUnit || 'sq ft'}</span></span>
                              <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate w-full">Area</span>
                           </div>
                           <div className="p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100 flex flex-col items-center text-center hover:bg-white hover:shadow-md transition-all min-w-0">
                              <Calendar className="text-rose-500 mb-1.5 md:mb-2 shrink-0" size={20} />
                              <span className="text-base md:text-lg font-black text-gray-900 truncate w-full">{property.yearBuilt || 'N/A'}</span>
                              <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate w-full">Year Built</span>
                           </div>
                         </>
                       </>
                     ) : (
                       <>
                         <div className="p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100 flex flex-col items-center text-center hover:bg-white hover:shadow-md transition-all min-w-0">
                            <Calendar className="text-orange-500 mb-1.5 md:mb-2 shrink-0" size={20} />
                            <span className="text-lg md:text-xl font-black text-gray-900 truncate w-full">{property.year}</span>
                            <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate w-full">Model Year</span>
                         </div>
                         <div className="p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100 flex flex-col items-center text-center hover:bg-white hover:shadow-md transition-all min-w-0">
                            <Fuel className="text-amber-500 mb-1.5 md:mb-2 shrink-0" size={20} />
                            <span className="text-xs md:text-sm font-black text-gray-900 uppercase mt-1 truncate w-full">{property.fuelType || 'Petrol'}</span>
                            <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate w-full">Fuel Type</span>
                         </div>
                         <div className="p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100 flex flex-col items-center text-center hover:bg-white hover:shadow-md transition-all min-w-0">
                            <Gauge className="text-blue-500 mb-1.5 md:mb-2 shrink-0" size={20} />
                            <span className="text-lg md:text-xl font-black text-gray-900 truncate w-full">{property.engineCapacity || 'N/A'}</span>
                            <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate w-full">CC Capacity</span>
                         </div>
                         <div className="p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100 flex flex-col items-center text-center hover:bg-white hover:shadow-md transition-all min-w-0">
                            <Palette className="text-purple-500 mb-1.5 md:mb-2 shrink-0" size={20} />
                            <span className="text-xs md:text-sm font-black text-gray-900 uppercase mt-1 truncate w-full">{property.color || 'N/A'}</span>
                            <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate w-full">Color</span>
                         </div>
                       </>
                     )}
                  </div>
                  
                  {/* Rate Card for Vehicles */}
                  {(!isProperty) && (
                     <div className="mb-4 md:mb-6 grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 md:p-3 bg-gray-50 rounded-lg md:rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                           <span className="block text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Daily Rate</span>
                           <span className="text-xs md:text-sm font-black text-gray-900">NPR {Number(property.dailyRate || 0).toLocaleString()}</span>
                        </div>
                        <div className="p-2 md:p-3 bg-gray-50 rounded-lg md:rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                           <span className="block text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Weekly Rate</span>
                           <span className="text-xs md:text-sm font-black text-gray-900">{property.weeklyRate ? `NPR ${Number(property.weeklyRate).toLocaleString()}` : '-'}</span>
                        </div>
                        <div className="p-2 md:p-3 bg-gray-50 rounded-lg md:rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                           <span className="block text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Monthly Rate</span>
                           <span className="text-xs md:text-sm font-black text-gray-900">{property.monthlyRate ? `NPR ${Number(property.monthlyRate).toLocaleString()}` : '-'}</span>
                        </div>
                     </div>
                  )}

                  {/* Secondary Details List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 md:gap-x-8 gap-y-3 md:gap-y-4 text-xs md:text-sm text-gray-700 bg-gray-50/50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-100">
                      {isProperty ? (
                        <>
                           <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                              <span className="text-gray-500 font-medium">Listing Type</span>
                              <span className={`font-bold uppercase ${property.listingType === 'For Sale' ? 'text-green-600' : 'text-blue-600'}`}>{property.listingType || 'Rent'}</span>
                           </div>
                           {property.listingType !== 'For Sale' && property.leaseTerms && (
                              <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                                 <span className="text-gray-500 font-medium">Min. Lease Period</span>
                                 <span className="font-bold">{property.leaseTerms}</span>
                              </div>
                           )}
                           <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                              <span className="text-gray-500 font-medium">Condition</span>
                              <span className="font-bold">{property.propertyCondition || 'N/A'}</span>
                           </div>
                           <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                              <span className="text-gray-500 font-medium">Furnished</span>
                              <span className="font-bold">{property.furnished === 'Yes' || property.furnished === true ? 'Yes' : 'No'}</span>
                           </div>
                           <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                              <span className="text-gray-500 font-medium">Pet Policy</span>
                              <span className="font-bold">{property.petPolicy || 'Unknown'} {property.petDetails && `(${property.petDetails})`}</span>
                           </div>
                           <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                              <span className="text-gray-500 font-medium">Lot Size</span>
                              <span className="font-bold">{property.lotSize ? `${property.lotSize} ${property.lotSizeUnit}` : 'N/A'}</span>
                           </div>
                           <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                              <span className="text-gray-500 font-medium">Garage Spaces</span>
                              <span className="font-bold">{property.garageSpaces || 0}</span>
                           </div>
                           <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                              <span className="text-gray-500 font-medium">Deposit</span>
                              <span className="font-bold">NPR {Number(property.securityDeposit).toLocaleString()}</span>
                           </div>
                           {property.hoaFees > 0 && (
                             <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                                <span className="text-gray-500 font-medium">HOA Fees</span>
                                <span className="font-bold">NPR {property.hoaFees} / {property.hoaFeesFrequency}</span>
                             </div>
                           )}
                           {property.virtualTourLink && (
                             <div className="col-span-2 mt-2">
                                <a href={property.virtualTourLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors w-full">
                                   <Zap size={16} /> View 3D Virtual Tour
                                </a>
                             </div>
                           )}
                        </>
                      ) : (
                        <>
                           <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                              <span className="text-gray-500 font-medium">Transmission</span>
                              <span className="font-bold">{property.transmission || 'Manual'}</span>
                           </div>
                           <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                              <span className="text-gray-500 font-medium">Registration</span>
                              <span className="font-bold uppercase">{property.registrationNumber || 'Hidden'}</span>
                           </div>
                           <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                              <span className="text-gray-500 font-medium">License Required</span>
                              <span className={`font-bold ${property.licenseRequired ? 'text-red-600' : 'text-green-600'}`}>{property.licenseRequired ? 'Yes' : 'No'}</span>
                           </div>
                           <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                              <span className="text-gray-500 font-medium">Minimum Age</span>
                              <span className="font-bold">{property.minimumAge || 18}+ Years</span>
                           </div>
                           <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                              <span className="text-gray-500 font-medium">Pickup Location</span>
                              <span className="font-bold truncate max-w-37.5">{property.pickupLocation || property.location}</span>
                           </div>
                           <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                              <span className="text-gray-500 font-medium">Security Deposit</span>
                              <span className="font-bold">NPR {Number(property.securityDeposit).toLocaleString()}</span>
                           </div>
                        </>
                      )}
                  </div>
               </div>

               {/* 3. Narrative Description */}
               <div className="p-4 md:p-6 lg:p-8 bg-white border-b border-gray-100 overflow-hidden">
                  <h3 className="text-xs md:text-sm font-black text-gray-900 uppercase tracking-widest mb-2 md:mb-3">Narrative Description</h3>
                  <p className="text-gray-600 leading-relaxed text-xs md:text-sm whitespace-pre-wrap break-words">
                     {property.description || 'No detailed description provided.'}
                  </p>
               </div>

               {/* 4. Amenities */}
               <div className="p-4 md:p-6 lg:p-8 bg-white border-b border-gray-100">
                  <h3 className="text-xs md:text-sm font-black text-gray-900 uppercase tracking-widest mb-3 md:mb-4">Features & Amenities</h3>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                     {(isProperty ? (Array.isArray(property.amenities) ? property.amenities : JSON.parse(property.amenities || "[]")) : (Array.isArray(property.features) ? property.features : JSON.parse(property.features || "[]")))?.map((feat, i) => (
                        <div key={i} className="px-2 md:px-3 py-1.5 md:py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-1.5 md:gap-2 hover:border-green-300 transition-colors">
                           <Check size={12} className="text-green-500 md:w-3.5 md:h-3.5" strokeWidth={3} />
                           <span className="text-[10px] md:text-xs font-bold text-gray-700 uppercase">{feat}</span>
                        </div>
                     ))}
                     {(!property.amenities?.length && !property.features?.length) && (
                        <span className="text-xs md:text-sm text-gray-400 italic">No specific amenities listed.</span>
                     )}
                  </div>
               </div>
               
               {/* 4.5 Floor Plan (Property Only) */}
               {/* Floor Plan section removed as requested */}

               {/* 5. Location Details (Static) */}
               {(property.latitude && property.longitude) && (
                  <div className="p-4 md:p-6 lg:p-8 bg-white border-b border-gray-100">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-4 gap-2">
                        <h3 className="text-xs md:text-sm font-black text-gray-900 uppercase tracking-widest">Location Coordinates</h3>
                        <a 
                          href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                           <Navigation size={12} /> Open in Google Maps
                        </a>
                     </div>
                     <a 
                        href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block bg-gray-50 p-4 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors group"
                     >
                        <div className="flex items-center gap-3">
                           <div className="p-3 bg-red-100 text-red-600 rounded-full group-hover:scale-110 transition-transform">
                              <MapPin size={24} />
                           </div>
                           <div>
                              <p className="font-bold text-gray-900">{property.address}, {property.city}</p>
                              <p className="text-xs text-gray-500 font-mono mt-1">
                                 Lat: {Number(property.latitude).toFixed(6)}, Lng: {Number(property.longitude).toFixed(6)}
                              </p>
                              <p className="text-[10px] text-blue-500 font-bold mt-2 flex items-center gap-1">
                                 <ArrowRight size={10} /> Click to navigate
                              </p>
                           </div>
                        </div>
                     </a>
                  </div>
               )}

               {/* 6. Host Card */}
               <div className="p-4 md:p-6 lg:p-8 bg-gray-50">
                  <h3 className="text-xs md:text-sm font-black text-gray-900 uppercase tracking-widest mb-3 md:mb-4">Verified Host</h3>
                  <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3 md:gap-5">
                     <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-lg md:text-xl font-black border-2 md:border-4 border-orange-50 shrink-0">
                        {(property.vendor?.name || property.vendorName || 'H')[0].toUpperCase()}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="text-base md:text-lg font-bold text-gray-900 truncate">{property.vendor?.name || property.vendorName || 'RentHive Host'}</h4>
                        <div className="flex flex-wrap gap-1.5 md:gap-2 mt-1.5 md:mt-2">
                           <span className="text-[9px] md:text-[10px] font-bold bg-gray-100 px-1.5 md:px-2 py-0.5 md:py-1 rounded text-gray-600 flex items-center gap-1"><Phone size={8} className="md:w-2.5 md:h-2.5" /> {property.vendor?.phone || 'Hidden'}</span>
                           <span className="text-[9px] md:text-[10px] font-bold bg-gray-100 px-1.5 md:px-2 py-0.5 md:py-1 rounded text-gray-600 flex items-center gap-1"><Mail size={8} className="md:w-2.5 md:h-2.5" /> {property.vendor?.email || 'Hidden'}</span>
                        </div>
                     </div>
                  </div>
               </div>
           </div>

           {/* Right Booking Column (Sticky) */}
           <div className="w-full lg:w-95 bg-white border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col shrink-0 shadow-lg z-20">
              <div className="p-4 md:p-6 flex-1 overflow-y-auto">
                 <div className="mb-4 md:mb-6">
                    <span className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                       <span className="text-xs md:text-sm font-bold text-gray-400 mr-1">NPR</span>
                       {Number(price).toLocaleString()}
                    </span>
                    <span className="text-xs md:text-sm font-bold text-gray-400 ml-1">{priceType}</span>
                 </div>

                 <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-4 mb-4 md:mb-6">
                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                       <div className="col-span-1">
                          <label className="text-[9px] md:text-[10px] font-bold uppercase text-gray-500 mb-1 block">Start Date</label>
                          <input 
                            type="date" 
                            className="w-full text-xs font-bold p-2 rounded border border-gray-300 focus:outline-none focus:border-orange-500"
                            value={startDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                       </div>
                       <div className="col-span-1">
                          <label className="text-[9px] md:text-[10px] font-bold uppercase text-gray-500 mb-1 block">End Date</label>
                          <input 
                            type="date" 
                            className="w-full text-xs font-bold p-2 rounded border border-gray-300 focus:outline-none focus:border-orange-500"
                            value={endDate}
                            min={startDate || new Date().toISOString().split('T')[0]}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                       </div>
                    </div>
                    {duration > 0 && (
                       <div className="text-center bg-white border border-gray-100 rounded-lg p-2">
                          <span className="text-green-600 font-bold text-[10px] md:text-xs flex items-center justify-center gap-1">
                             <Check size={10} className="md:w-3 md:h-3" strokeWidth={3} /> {duration} Days selected
                          </span>
                       </div>
                    )}
                 </div>

                 {duration > 0 ? (
                    <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                       <div className="flex justify-between text-xs md:text-sm text-gray-600">
                          <span>NPR {Number(price).toLocaleString()} x {duration} days</span>
                          <span>NPR {totalCost.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between text-xs md:text-sm text-gray-600">
                          <span>Security Deposit</span>
                          <span>NPR {Number(property.securityDeposit || 0).toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between text-xs md:text-sm text-gray-600">
                          <span>Service Fee (5%)</span>
                          <span>NPR {serviceFee.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between text-xs md:text-sm text-gray-600">
                          <span>VAT (13%)</span>
                          <span>NPR {tax.toLocaleString()}</span>
                       </div>
                       <div className="h-px bg-gray-200 my-2" />
                       <div className="flex justify-between text-sm md:text-base font-black text-gray-900">
                          <span>Total</span>
                          <span>NPR {grandTotal.toLocaleString()}</span>
                       </div>
                    </div>
                 ) : (
                    <div className="text-center p-4 md:p-6 border-2 border-dashed border-gray-200 rounded-xl mb-4 md:mb-6">
                       <CalendarDays size={20} className="text-gray-300 mx-auto mb-2 md:w-6 md:h-6" />
                       <p className="text-[10px] md:text-xs font-bold text-gray-400">Select dates to see total pricing</p>
                    </div>
                 )}
                 
                 <div className="flex gap-2 mb-4">
                    <button 
                       onClick={() => onToggleSave?.(property)}
                       className={`p-2 md:p-3 rounded-lg md:rounded-xl border w-full flex items-center justify-center gap-1.5 md:gap-2 ${isSaved ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                       <Heart size={16} className={`md:w-4.5 md:h-4.5 ${isSaved ? 'fill-rose-500' : ''}`} /> <span className="text-[10px] md:text-xs font-bold">Save</span>
                    </button>
                    <button 
                       onClick={() => onEnquire?.(property)}
                       className="p-2 md:p-3 rounded-lg md:rounded-xl border bg-white border-gray-200 text-gray-500 hover:border-gray-300 w-full flex items-center justify-center gap-1.5 md:gap-2 transition-all"
                    >
                       <MessageCircle size={16} className="md:w-4.5 md:h-4.5" /> <span className="text-[10px] md:text-xs font-bold">Chat</span>
                    </button>
                 </div>
              </div>
              
              <div className="p-3 md:p-4 border-t border-gray-200 bg-gray-50">
                 <button 
                   onClick={handleBookClick}
                   disabled={!duration}
                   className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-3 md:py-4 px-4 md:px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide text-xs md:text-sm"
                 >
                    <Zap size={16} className="fill-white md:w-4.5 md:h-4.5" /> {duration ? 'Proceed to Book' : 'Select Dates'}
                 </button>
                 <p className="text-[9px] md:text-[10px] text-center text-gray-400 font-bold mt-2 md:mt-3">You won't be charged yet</p>
              </div>
           </div>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9fafb;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
      `}} />
    </div>
  );
};

export default PropertyModal;
