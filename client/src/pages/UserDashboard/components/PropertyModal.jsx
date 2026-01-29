import React, { useState } from 'react';
import PropertyLocationMap from '../../../components/PropertyLocationMap';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Bed, 
  Bath, 
  Ruler, 
  Calendar, 
  Palette, 
  Fuel, 
  Settings, 
  MessageCircle, 
  Flag,
  Home,
  Bike,
  Building2,
  Gauge,
  BedDouble
} from 'lucide-react';


const PropertyModal = ({ property, onClose, isSaved = false, onToggleSave, onReport, onReview }) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  // Save button handler
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    if (onToggleSave) await onToggleSave(property);
    setSaving(false);
  };

  // Report button handler
  const handleReport = () => {
    if (onReport) onReport(property);
  };

  // Review button handler
  const handleReview = () => {
    if (onReview) onReview(property);
  };

  if (!property) return null;

  const isProperty = property.type === 'property';
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5050';
  
  // Fix image path logic
  const getImageUrl = (img) => {
    if (!img) return null;
    const folder = isProperty ? 'properties' : 'bikes';
    return `${baseUrl}/uploads/${folder}/${img}`;
  };

  const mainImage = property.images?.[0] ? getImageUrl(property.images[0]) : null;
  const galleryImages = property.images || [];

  const openLightbox = (index) => {
    setSelectedImageIndex(index);
    setShowLightbox(true);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[1000] p-0 sm:p-0 m-0" onClick={onClose}>
      <div className="rounded-2xl shadow-2xl w-full max-w-3xl md:max-w-5xl max-h-[95vh] overflow-y-auto relative m-0" style={{ background: '#f4fbfd' }} onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button 
          className="absolute top-4 right-4 z-10 text-gray-800 rounded-full p-2 transition-all shadow-sm" style={{ background: 'rgba(244,251,253,0.8)' }}
          onClick={onClose}
        >
          <X size={24} />
        </button>

        {/* Hero Image */}
        <div 
          className="h-48 sm:h-72 md:h-96 w-full relative bg-gray-100 cursor-pointer group"
          onClick={() => openLightbox(0)}
        >
          {mainImage ? (
            <>
              <img 
                src={mainImage} 
                alt={property.title || property.brand}
                className="w-full h-full object-cover"
                onError={(e) => { 
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/800x600?text=Error+Loading+Image'; 
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="text-gray-900 px-4 py-2 rounded-full font-semibold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all" style={{ background: 'rgba(244,251,253,0.9)' }}>
                  View Photos
                </span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
               {isProperty ? <Home size={64} /> : <Bike size={64} />}
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 md:p-8 pointer-events-none">
            <span className={`inline-block px-3 py-1 text-white text-xs font-bold uppercase tracking-wider rounded-full mb-2 ${isProperty ? 'bg-green-600' : 'bg-blue-600'}`}>
              {property.propertyType || property.type}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">
              {property.title || `${property.brand} ${property.model}`}
            </h2>
            <p className="text-white/90 text-lg flex items-center">
              <MapPin className="w-5 h-5 mr-1" />
              {property.location || property.address || property.city}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-2 sm:p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
          
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6 md:space-y-8 min-w-0">
            
            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-2 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
              {isProperty ? (
                <>
                  <div className="text-center">
                    <span className="mb-1 text-purple-600 flex justify-center"><BedDouble size={28} /></span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">{property.bedrooms} Beds</span>
                  </div>
                  <div className="text-center">
                    <span className="mb-1 text-purple-600 flex justify-center"><Bath size={28} /></span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">{property.bathrooms} Baths</span>
                  </div>
                  <div className="text-center">
                    <span className="mb-1 text-purple-600 flex justify-center"><Ruler size={28} /></span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">{property.area} sq.ft</span>
                  </div>
                  <div className="text-center">
                    <span className="mb-1 text-purple-600 flex justify-center"><Building2 size={28} /></span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">{property.city}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <span className="mb-1 text-blue-600 flex justify-center"><Calendar size={28} /></span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">{property.year}</span>
                  </div>
                  <div className="text-center">
                    <span className="mb-1 text-blue-600 flex justify-center"><Palette size={28} /></span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">{property.color || 'N/A'}</span>
                  </div>
                  <div className="text-center">
                    <span className="mb-1 text-blue-600 flex justify-center"><Fuel size={28} /></span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">{property.fuelType || 'Petrol'}</span>
                  </div>
                  <div className="text-center">
                    <span className="mb-1 text-blue-600 flex justify-center"><Gauge size={28} /></span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">{property.engineCapacity ? `${property.engineCapacity}cc` : 'N/A'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Description</h3>
              <div className="whitespace-pre-line text-gray-700 text-sm bg-gray-50 rounded-xl p-4 border border-gray-100">
                {property.description || 'No description provided.'}
              </div>
            </div>

            {/* Additional Details / Technical Specs */}
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                {isProperty ? 'Additional Details' : 'Technical Specifications'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                {!isProperty && (
                  <>
                    <div className="flex justify-between border-b border-blue-200 pb-2">
                      <span className="text-gray-600">Brand</span>
                      <span className="font-medium text-gray-900">{property.brand || <span className='italic text-gray-400'>N/A</span>}</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-200 pb-2">
                      <span className="text-gray-600">Model</span>
                      <span className="font-medium text-gray-900">{property.model || <span className='italic text-gray-400'>N/A</span>}</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-200 pb-2">
                      <span className="text-gray-600">Registration No.</span>
                      <span className="font-medium text-gray-900">{property.registrationNumber || <span className='italic text-gray-400'>N/A</span>}</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-200 pb-2">
                      <span className="text-gray-600">License Required</span>
                      <span className="font-medium text-gray-900">{property.licenseRequired ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-200 pb-2">
                      <span className="text-gray-600">Min. Age</span>
                      <span className="font-medium text-gray-900">{property.minimumAge || 18}+</span>
                    </div>
                    {property.pickupLocation && (
                      <div className="col-span-1 md:col-span-2 mt-2">
                        <span className="block text-gray-600 text-sm mb-1">Pickup Location</span>
                        <p className="font-medium text-gray-900 p-2 rounded border border-blue-200 text-sm" style={{ background: '#f4fbfd' }}>
                          📍 {property.pickupLocation}
                        </p>
                      </div>
                    )}
                  </>
                )}
                {isProperty && (
                   <>
                    <div className="flex justify-between border-b border-blue-200 pb-2">
                      <span className="text-gray-600">Property Type</span>
                      <span className="font-medium text-gray-900">{property.propertyType || <span className='italic text-gray-400'>N/A</span>}</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-200 pb-2">
                      <span className="text-gray-600">Security Deposit</span>
                      <span className="font-medium text-gray-900">
                        {property.securityDeposit ? `NPR ${Number(property.securityDeposit).toLocaleString()}` : <span className='italic text-gray-400'>None</span>}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-blue-200 pb-2">
                      <span className="text-gray-600">Views</span>
                      <span className="font-medium text-gray-900">{property.viewCount || 0}</span>
                    </div>
                   </>
                )}
              </div>
            </div>

            {/* Features / Amenities */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 border-b pb-2">
                {isProperty ? 'Amenities' : 'Features'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {/* Property Amenities */}
                {isProperty && property.amenities && property.amenities.length > 0 && (
                  property.amenities.map((amenity, index) => (
                    <span key={`amenity-${index}`} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
                      {amenity}
                    </span>
                  ))
                )}

                {/* Bike Features */}
                {!isProperty && property.features && property.features.length > 0 && (
                  property.features.map((feature, index) => (
                    <span key={`feature-${index}`} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
                      {feature}
                    </span>
                  ))
                )}

                {/* Fallback if no amenities/features */}
                {((isProperty && (!property.amenities || property.amenities.length === 0)) || 
                  (!isProperty && (!property.features || property.features.length === 0))) && (
                  <span className="text-gray-500 italic">No specific features listed.</span>
                )}
              </div>
            </div>

            {/* Location Map */}
            {property.latitude && property.longitude && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 border-b pb-2">Location</h3>
                <div className="rounded-xl overflow-hidden border border-gray-200 h-[300px]">
                  <PropertyLocationMap 
                    selectedLocation={{ lat: parseFloat(property.latitude), lng: parseFloat(property.longitude) }}
                    showLocationPicker={false}
                    height="100%"
                  />
                </div>
              </div>
            )}

            {/* Photo Gallery */}
            {galleryImages.length > 1 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 border-b pb-2">Gallery</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {galleryImages.slice(1).map((img, index) => (
                    <div 
                      key={index} 
                      className="aspect-video rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openLightbox(index + 1)}
                    >
                      <img 
                        src={getImageUrl(img)} 
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Error'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar / Action Card */}
          <div className="md:col-span-1">
            <div className="rounded-xl p-4 border border-gray-200 sticky top-6 shadow-lg bg-[#f4fbfd] w-full">
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">Price</p>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-blue-600">
                    NPR {property.rentPrice?.toLocaleString() || property.dailyRate?.toLocaleString()}
                  </span>
                  <span className="text-gray-500 ml-1">/{isProperty ? 'mo' : 'day'}</span>
                </div>
                {!isProperty && property.weeklyRate && (
                  <div className="flex items-baseline mt-1">
                    <span className="text-lg font-semibold text-blue-500">
                      NPR {property.weeklyRate.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">/week</span>
                  </div>
                )}
                {!isProperty && property.monthlyRate && (
                  <div className="flex items-baseline mt-1">
                    <span className="text-lg font-semibold text-blue-500">
                      NPR {property.monthlyRate.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">/mo</span>
                  </div>
                )}
                {property.securityDeposit && (
                  <p className="text-sm text-gray-500 mt-2">
                    + NPR {property.securityDeposit.toLocaleString()} Deposit
                  </p>
                )}
              </div>


              <div className="space-y-3">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center shadow-lg shadow-blue-200">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Now
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl border border-gray-200 transition-colors">
                    <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
                    Chat
                  </button>
                  <button
                    className="flex items-center justify-center bg-gray-50 hover:bg-red-50 text-red-600 font-semibold py-3 px-4 rounded-xl border border-red-200 transition-colors"
                    onClick={handleReport}
                  >
                    <Flag className="w-5 h-5 mr-2" />
                    Report
                  </button>
                </div>

                <button
                  className={`w-full flex items-center justify-center py-3 px-4 rounded-xl font-semibold border transition-colors shadow-sm mt-2 ${isSaved ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200'}`}
                  onClick={handleSave}
                  disabled={saving}
                >
                  <svg className="w-5 h-5 mr-2" fill={isSaved ? '#22c55e' : 'none'} stroke={isSaved ? '#22c55e' : '#64748b'} strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
                  </svg>
                  {isSaved ? 'Saved' : 'Save'}
                </button>

                <button
                  className="w-full flex items-center justify-center py-3 px-4 rounded-xl font-semibold border border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 shadow-sm mt-2"
                  onClick={handleReview}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="#eab308" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20l9-5-9-5-9 5 9 5zm0 0V4" />
                  </svg>
                  Review
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-2">Owner Info</h4>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold mr-3">
                    {property.vendorName?.[0] || 'O'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{property.vendorName || 'Verified Owner'}</p>
                    <p className="text-xs text-gray-500">Response rate: 100%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-95 flex items-center justify-center" onClick={() => setShowLightbox(false)}>
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2"
            onClick={() => setShowLightbox(false)}
          >
            <X className="w-8 h-8" />
          </button>

          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-4"
            onClick={prevImage}
          >
            <ChevronLeft className="w-10 h-10" />
          </button>

          <div className="max-w-7xl max-h-[90vh] p-4" onClick={e => e.stopPropagation()}>
            <img 
              src={getImageUrl(galleryImages[selectedImageIndex])} 
              alt={`Gallery ${selectedImageIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain mx-auto"
            />
            <p className="text-white text-center mt-4 text-lg">
              {selectedImageIndex + 1} / {galleryImages.length}
            </p>
          </div>

          <button 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-4"
            onClick={nextImage}
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PropertyModal;
