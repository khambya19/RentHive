import React from 'react';
import { Home, Bike, MapPin, BedDouble, Bath, Ruler, Calendar, Fuel, Gauge, ArrowRight, Flag } from 'lucide-react';

const ListingCard = ({ item, onClick, onReport }) => {
  const isProperty = item.type === 'property';
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5050';
  const folder = isProperty ? 'properties' : 'bikes';
  const imageUrl = item.images?.[0]
    ? `${baseUrl}/uploads/${folder}/${item.images[0]}`
    : null;

  return (
    <div
      className="rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col h-full relative w-full max-w-full min-w-0 p-0"
      onClick={() => onClick(item)}
    >
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden bg-gray-100 rounded-t-2xl">
        <span className={`absolute top-4 right-4 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md z-10 shadow-lg
          ${isProperty ? 'bg-green-500/90 text-white' : 'bg-blue-500/90 text-white'}`}>
          {isProperty ? 'Property' : 'Automobile'}
        </span>
        
        {/* Report Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onReport) onReport(item);
          }}
          className="absolute top-4 left-4 p-2 bg-white/90 hover:bg-red-50 rounded-full shadow-lg backdrop-blur-sm transition-all z-10 group/report"
          title="Report this listing"
        >
          <Flag size={16} className="text-gray-600 group-hover/report:text-red-600 transition-colors" />
        </button>
        
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={item.title || item.brand}
            className="w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
            onError={e => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300?text=No+Image'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-2xl font-bold rounded-2xl">
            No Image
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col p-4 gap-2">
        <div className="flex items-center gap-2">
          {isProperty ? <Home size={20} className="text-blue-500" /> : <Bike size={20} className="text-green-500" />}
          <span className="font-semibold text-lg truncate">{item.title || item.brand}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-gray-500 text-xs">
          {isProperty ? (
            <>
              <MapPin size={16} className="inline mr-1" /> {item.location || 'N/A'}
              <BedDouble size={16} className="inline ml-3 mr-1" /> {item.bedrooms || 0} Beds
              <Bath size={16} className="inline ml-3 mr-1" /> {item.bathrooms || 0} Baths
              <Ruler size={16} className="inline ml-3 mr-1" /> {item.area || 0} sqft
            </>
          ) : (
            <>
              <Gauge size={16} className="inline mr-1" /> {item.mileage || 0} km
              <Fuel size={16} className="inline ml-3 mr-1" /> {item.fuelType || 'N/A'}
              <Calendar size={16} className="inline ml-3 mr-1" /> {item.year || 'N/A'}
            </>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between pt-4 sm:pt-5 border-t border-gray-100">
          <div>
            <span className="text-lg sm:text-xl font-bold text-blue-600">
              NPR {(item.rentPrice || item.dailyRate || 0).toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 font-medium ml-1">
              /{isProperty ? 'mo' : 'day'}
            </span>
          </div>
          <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border shadow-sm
            ${(item.status || 'available').toLowerCase() === 'available' 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
            {item.status || 'Available'}
          </span>
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <button
          className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-all flex items-center gap-2 text-sm sm:text-base min-w-30 sm:min-w-40"
          onClick={e => { e.stopPropagation(); onClick(item); }}
        >
          View Details <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default ListingCard;
