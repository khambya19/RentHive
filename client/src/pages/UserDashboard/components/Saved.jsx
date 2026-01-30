
import React from 'react';
import { Heart, Home, Bike, MapPin } from 'lucide-react';
import noImage from '../../../assets/no-image.png';
import { SERVER_BASE_URL } from '../../../config/api';

const Saved = ({ savedListings = [], handleUnsaveListing, onViewProperty }) => {
  const [animatingId, setAnimatingId] = React.useState(null);

  const handleUnsaveClick = (listing) => {
    setAnimatingId(listing.id);
    handleUnsaveListing(listing);
    setTimeout(() => setAnimatingId(null), 500);
  };
  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Saved Listings</h2>
        <p className="text-sm text-slate-500">Your favorite properties and vehicles.</p>
      </div>

      {savedListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 shadow-sm mb-4">
            <Heart size={24} />
          </div>
          <h3 className="font-bold text-slate-800">No saved items</h3>
          <p className="text-xs text-slate-500 mt-1">Found something you like? Click the heart icon to save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedListings
            .filter((v, i, a) => a.findIndex(t => (String(t.id) === String(v.id) && t.type === v.type)) === i)
            .map((listing) => {
            const isBike = listing.type === 'bike' || !!listing.dailyRate;
            const mainImage = listing.images && listing.images.length > 0
              ? `${SERVER_BASE_URL}/uploads/${isBike ? 'bikes' : 'properties'}/${listing.images[0]}`
              : noImage;
            const uniqueKey = `saved-${String(listing.id)}-${listing.type || (isBike ? 'bike' : 'property')}`;
            return (
              <div key={uniqueKey}
                className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden flex flex-col group relative cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                onClick={() => onViewProperty && onViewProperty({ ...listing, type: isBike ? 'bike' : 'property' })}>
                <div className="h-48 w-full overflow-hidden relative">
                  <img 
                    src={mainImage} 
                    alt="Saved" 
                    loading="lazy"
                    className="w-full h-full object-cover opacity-0 transition-opacity duration-700" 
                    onError={e => { e.target.onerror = null; e.target.src = noImage; }} 
                    onLoad={(e) => e.target.classList.add('opacity-100')}
                  />
                  <button
                    className={`absolute top-3 left-3 z-10 bg-white/90 rounded-full p-2 shadow-lg border-2 border-rose-400 hover:border-rose-500 transition-all ${animatingId === listing.id ? 'animate-heart-pop' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent opening details when clicking heart
                      handleUnsaveClick(listing);
                    }}
                  >
                    <Heart size={20} className="fill-rose-500 text-rose-500" />
                  </button>
                  <div className="absolute top-3 right-3 bg-white/80 rounded-xl px-2 py-1 text-xs font-bold text-slate-600 shadow">
                    {isBike ? <Bike size={14} className="inline mr-1 text-orange-500" /> : <Home size={14} className="inline mr-1 text-emerald-500" />} {isBike ? 'Vehicle' : 'Property'}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 mb-1 line-clamp-2">{isBike ? `${listing.brand} ${listing.model || listing.name}` : listing.title}</h3>
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                      <MapPin size={14} className={isBike ? "text-orange-500" : "text-emerald-500"} />
                      {isBike ? listing.location : `${listing.city || ''}, ${listing.address || ''}`}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-xl font-black text-indigo-600">
                        Rs {Number(isBike ? listing.dailyRate : (listing.rentPrice || listing.monthlyRent)).toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 font-bold ml-1">
                        /{isBike ? 'day' : 'mo'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-indigo-500 group-hover:underline">View Details →</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Saved;
