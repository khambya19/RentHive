import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API_BASE_URL, { SERVER_BASE_URL } from '../../../config/api';
import { 
  RefreshCw, 
  MapPin, 
  Home, 
  Bike, 
  BedDouble, 
  Bath, 
  Ruler, 
  Calendar, 
  Palette, 
  Hash, 
  ClipboardList,
  Eye,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import noImage from '../../../assets/no-image.png';

const Browse = React.memo(({ onViewProperty, properties, bikes, loading, onRefresh, savedListings, onSave, onUnsave }) => {
  const { logout } = useAuth();
  const [filterType, setFilterType] = useState('all'); // 'all', 'properties', 'automobiles'
  const [animatingId, setAnimatingId] = useState(null); // Handle saving/unsaving logic

  const handleSaveClick = (listing) => {
    // Robust type detection that handles both DB naming and manual additions
    const currentType = listing.type || (listing.dailyRate ? 'bike' : 'property');
    const isSaved = savedListings.some((l) => String(l.id) === String(listing.id) && l.type === currentType);
    
    setAnimatingId(listing.id);
    if (isSaved) {
      onUnsave(listing);
    } else {
      onSave(listing);
    }
    setTimeout(() => setAnimatingId(null), 500);
  };

  // Props for save/unsave
  // Use props directly
  // ...existing code...

  const handleRefresh = () => {
    if (onRefresh) onRefresh();
  };

  const getFilteredListings = () => {
    if (filterType === 'properties') return { properties, bikes: [] };
    if (filterType === 'automobiles') return { properties: [], bikes };
    return { properties, bikes };
  };

  const filteredData = getFilteredListings();
  const totalListingsCount = properties.length + bikes.length;

  // Helper to check if listing is saved
  const isListingSaved = (listing) => {
    return savedListings.some((l) => String(l.id) === String(listing.id) && l.type === (listing.type || (listing.dailyRate ? 'bike' : 'property')));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-center">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6 shadow-lg shadow-indigo-100/50"></div>
        <p className="text-slate-500 font-bold text-lg animate-pulse">Scanning the hive for fresh deals...</p>
      </div>
    );
  }

  return (
    <div className="browse-container w-full max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
            <Sparkles size={12} className="animate-pulse" /> Live Listings
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Browse Hive Properties</h1>
          <p className="text-slate-500 font-medium max-w-lg">
            Find your perfect home or premium vehicle from our verified collection of listings.
          </p>
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className="group flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-bold shadow-sm hover:border-indigo-500 hover:text-indigo-600 hover:shadow-xl transition-all duration-300 disabled:opacity-50 active:scale-95"
        >
          <RefreshCw size={18} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
          Sync Fresh Ads
        </button>
      </div>

      {/* Stats & Filter Cards (Owner Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {/* Total Listings Card */}
        <div 
          onClick={() => setFilterType('all')} 
          className={`relative bg-linear-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-2xl p-6 overflow-hidden group cursor-pointer transform hover:scale-[1.02] transition-all duration-300 shadow-xl ${filterType === 'all' ? 'ring-4 ring-indigo-200 shadow-indigo-200/50' : ''}`}
        >
          <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-lg border border-white/30">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                <span className="text-white text-[10px] font-black tracking-widest uppercase">ALL ADS</span>
              </div>
            </div>
            <div>
              <h3 className="text-5xl font-black text-white mb-1 tracking-tighter">{totalListingsCount}</h3>
              <p className="text-white/80 font-bold text-xs uppercase tracking-wider">Total Available Listings</p>
            </div>
          </div>
        </div>

        {/* Properties Stats Card */}
        <div 
          onClick={() => setFilterType('properties')} 
          className={`relative bg-white rounded-2xl p-6 border-2 overflow-hidden group cursor-pointer transition-all duration-300 shadow-md hover:shadow-2xl ${filterType === 'properties' ? 'border-emerald-500 ring-4 ring-emerald-100 bg-emerald-50/10' : 'border-slate-100 hover:border-emerald-300 bg-white'}`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-emerald-50 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-200/50 group-hover:scale-110 transition-transform">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest opacity-60">PROPERTIES</div>
            </div>
            <div>
              <h3 className="text-5xl font-black text-slate-900 mb-1 tracking-tighter group-hover:text-emerald-600 transition-colors uppercase">{properties.length}</h3>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Vacant Living Spaces</p>
            </div>
          </div>
        </div>

        {/* Automobiles Stats Card */}
        <div 
          onClick={() => setFilterType('automobiles')} 
          className={`relative bg-white rounded-2xl p-6 border-2 overflow-hidden group cursor-pointer transition-all duration-300 shadow-md hover:shadow-2xl ${filterType === 'automobiles' ? 'border-orange-500 ring-4 ring-orange-100 bg-orange-50/10' : 'border-slate-100 hover:border-orange-300 bg-white'}`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-orange-50 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg shadow-orange-200/50 group-hover:scale-110 transition-transform">
                <Bike className="w-6 h-6 text-white" />
              </div>
              <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest opacity-60">VEHICLES</div>
            </div>
            <div>
              <h3 className="text-5xl font-black text-slate-900 mb-1 tracking-tighter group-hover:text-orange-600 transition-colors uppercase">{bikes.length}</h3>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Available Automobiles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Display Section */}
      <div className="space-y-16 pb-20">
        {/* Properties Section */}
        {filteredData.properties.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                  <Home size={20} />
                </span>
                Recommended Properties
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.properties.map((property) => (
                <div
                  key={`property-${property.id}`}
                  className="bg-slate-50/50 rounded-3xl overflow-hidden shadow-sm border-2 border-transparent hover:border-indigo-500/20 hover:bg-white hover:shadow-2xl hover:-translate-y-2.5 transition-all duration-500 relative group cursor-pointer h-full flex flex-col"
                >
                  <div className="h-64 overflow-hidden relative" onClick={() => onViewProperty && onViewProperty(property)}>
                                        {/* Heart Button for Save/Unsave */}
                                        <button
                                          className={`absolute top-4 left-4 z-20 bg-white/90 rounded-full p-2 shadow-lg border-2 ${isListingSaved(property) ? 'border-rose-400' : 'border-slate-200'} hover:border-rose-500 transition-all ${animatingId === property.id ? 'animate-heart-pop' : ''}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSaveClick(property);
                                          }}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" fill={isListingSaved(property) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" className={`w-6 h-6 ${isListingSaved(property) ? 'text-rose-500' : 'text-slate-400'}`}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21C12 21 7 16.6863 4.5 13.5C2.5 10.8333 4.5 7.5 8 7.5C9.5 7.5 11 8.5 12 10C13 8.5 14.5 7.5 16 7.5C19.5 7.5 21.5 10.8333 19.5 13.5C17 16.6863 12 21 12 21Z" /></svg>
                                        </button>
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={`${SERVER_BASE_URL}/uploads/properties/${property.images[0]}`}
                        alt={property.title}
                        loading="lazy"
                        className="w-full h-full object-cover opacity-0 transition-all duration-700 group-hover:scale-110"
                        onError={(e) => { e.target.onerror = null; e.target.src = noImage; }}
                        onLoad={(e) => e.target.classList.add('opacity-100')}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-slate-50 text-slate-300">
                        <Home size={64} className="opacity-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-2">
                       <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                       <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{property.status}</span>
                    </div>
                    <div className="absolute bottom-6 left-6 right-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className="text-2xl font-black tracking-tight mb-2 drop-shadow-2xl leading-tight line-clamp-2">{property.title}</h3>
                      <div className="flex items-center gap-2 text-white/90 font-medium text-xs drop-shadow-md">
                        <MapPin size={14} className="text-emerald-400" />
                        {property.city}, {property.address}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-7 flex-1 flex flex-col justify-between" onClick={() => onViewProperty && onViewProperty(property)}>
                    <div className="flex items-center justify-between mb-8">
                         <div className="space-y-3">
                            <div className="flex flex-col">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                  {property.listingType === 'For Sale' ? 'Price' : 'Monthly Rent'}
                               </p>
                               <p className="text-2xl font-black text-emerald-600 tracking-tighter leading-none pt-1">
                                  <span className="text-xs align-top mr-1">Rs</span>
                                  {Number(property.rentPrice).toLocaleString()}
                                  {property.listingType !== 'For Sale' && <span className="text-xs text-slate-400 font-bold ml-1">/mo</span>}
                               </p>
                            </div>
                            {property.securityDeposit && (
                               <div className="flex flex-col">
                                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none">Deposit</p>
                                  <p className="text-sm font-bold text-slate-500 tracking-tight">
                                     Rs {Number(property.securityDeposit).toLocaleString()}
                                  </p>
                               </div>
                            )}
                         </div>
                       <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 rotate-0 group-hover:rotate-12 transition-all duration-300 shadow-inner">
                          <Eye size={20} />
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                        <BedDouble size={20} className="text-indigo-500" />
                        <span className="text-[10px] font-black text-slate-800 uppercase">{property.bedrooms} Beds</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">
                        <Bath size={20} className="text-blue-500" />
                        <span className="text-[10px] font-black text-slate-800 uppercase">{property.bathrooms} Baths</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">
                        <Ruler size={20} className="text-violet-500" />
                        <span className="text-[10px] font-black text-slate-800 uppercase">{property.area} sqft</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Automobiles Section */}
        {filteredData.bikes.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
                  <Bike size={20} />
                </span>
                Verified Automobiles
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.bikes.map((bike) => (
                <div
                  key={`bike-${bike.id}`}
                  className="bg-slate-50/50 rounded-3xl overflow-hidden shadow-sm border-2 border-transparent hover:border-orange-500/20 hover:bg-white hover:shadow-2xl hover:-translate-y-2.5 transition-all duration-500 relative group cursor-pointer h-full flex flex-col"
                >
                  <div className="h-64 overflow-hidden relative" onClick={() => onViewProperty && onViewProperty({ ...bike, type: 'bike' })}>
                                        {/* Heart Button for Save/Unsave */}
                                        <button
                                          className={`absolute top-4 left-4 z-20 bg-white/90 rounded-full p-2 shadow-lg border-2 ${isListingSaved({ ...bike, type: 'bike' }) ? 'border-rose-400' : 'border-slate-200'} hover:border-rose-500 transition-all ${animatingId === bike.id ? 'animate-heart-pop' : ''}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSaveClick({ ...bike, type: 'bike' });
                                          }}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" fill={isListingSaved({ ...bike, type: 'bike' }) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" className={`w-6 h-6 ${isListingSaved({ ...bike, type: 'bike' }) ? 'text-rose-500' : 'text-slate-400'}`}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21C12 21 7 16.6863 4.5 13.5C2.5 10.8333 4.5 7.5 8 7.5C9.5 7.5 11 8.5 12 10C13 8.5 14.5 7.5 16 7.5C19.5 7.5 21.5 10.8333 19.5 13.5C17 16.6863 12 21 12 21Z" /></svg>
                                        </button>
                    {bike.images && bike.images.length > 0 ? (
                      <img
                        src={`${SERVER_BASE_URL}/uploads/bikes/${bike.images[0]}`}
                        alt={bike.name || `${bike.brand} ${bike.model}`}
                        loading="lazy"
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                        onError={(e) => { e.target.onerror = null; e.target.src = noImage; }}
                        onLoad={(e) => e.target.classList.add('opacity-100')}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-slate-50 text-slate-300">
                        <Bike size={64} className="opacity-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-2">
                       <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                       <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{bike.status}</span>
                    </div>
                    <div className="absolute bottom-6 left-6 right-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className="text-2xl font-black tracking-tight mb-2 drop-shadow-2xl leading-tight line-clamp-2 uppercase">
                        {bike.brand} {bike.name || bike.model}
                      </h3>
                      <div className="flex items-center gap-2 text-white/90 font-medium text-xs drop-shadow-md">
                        <MapPin size={14} className="text-orange-400" />
                        {bike.location}
                      </div>
                    </div>
                  </div>

                  <div className="p-7 flex-1 flex flex-col justify-between" onClick={() => onViewProperty && onViewProperty({ ...bike, type: 'bike' })}>
                    <div className="flex items-center justify-between mb-8">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Daily Pricing</p>
                          <p className="text-3xl font-black text-orange-600 tracking-tighter leading-none pt-1">
                             <span className="text-sm align-top mr-1">Rs</span>
                             {Number(bike.dailyRate).toLocaleString()}
                             <span className="text-xs text-slate-400 font-bold ml-1">/day</span>
                          </p>
                       </div>
                       <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-orange-600 group-hover:text-white group-hover:scale-110 rotate-0 group-hover:rotate-12 transition-all duration-300 shadow-inner">
                          <Eye size={20} />
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                        <Calendar size={20} className="text-blue-500 mb-1" />
                        <span className="text-[10px] font-black text-slate-800 uppercase">{bike.year}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                        <Palette size={20} className="text-amber-500 mb-1" />
                        <span className="text-[10px] font-black text-slate-800 uppercase truncate max-w-full text-center">{bike.fuelType || 'Petrol'}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                        <Hash size={20} className="text-rose-500 mb-1" />
                        <span className="text-[10px] font-black text-slate-800 uppercase truncate max-w-full text-center">{bike.engineCapacity || 'N/A'} cc</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty States */}
      {(filteredData.properties.length === 0 && filteredData.bikes.length === 0) && (
        <div className="flex flex-col items-center justify-center py-32 text-center animate-in zoom-in duration-500">
          <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100 shadow-inner">
            <ClipboardList size={56} className="text-slate-200" />
          </div>
          <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tighter">Deserted Hive!</h3>
          <p className="text-slate-500 font-medium max-w-xs mx-auto text-lg leading-relaxed">
            We couldn't find any active listings in this category. 
            <br/>Try syncing data or checking back later!
          </p>
          <button 
             onClick={handleRefresh}
             className="mt-8 px-8 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
          >
             SYNCHRONIZE NOW
          </button>
        </div>
      )}
    </div>
  );
});

export default Browse;
