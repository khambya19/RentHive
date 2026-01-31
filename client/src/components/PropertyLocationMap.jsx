import React, { useState, useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Banknote, Bed, Lightbulb, Loader2 } from 'lucide-react';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom property icon
const propertyIconMarkup = renderToStaticMarkup(
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: '#10b981', border: '2px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>
    <MapPin size={20} color="white" />
  </div>
);

const propertyIcon = new L.DivIcon({
  html: propertyIconMarkup,
  className: 'custom-leaflet-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Component to handle map click events
const LocationPicker = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

const PropertyLocationMap = ({ 
  selectedLocation,
  onLocationSelect,
  showLocationPicker = false,
  searchQuery,
  onSearchLocationChange,
  height = '400px',
  properties = []
}) => {
  const [map, setMap] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Default center (Kathmandu, Nepal)
  const defaultCenter = [27.7172, 85.3240];
  const mapCenter = selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : defaultCenter;

  // Search for locations using Nominatim (OpenStreetMap)
  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=np&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      // console.error('Error searching location:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchLocation(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchResultClick = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    if (map) {
      map.setView([lat, lng], 15);
    }
    
    if (onLocationSelect) {
      onLocationSelect({ lat, lng });
    }
    
    setSearchResults([]);
  };

  return (
    <div className="relative rounded-xl overflow-hidden shadow-md bg-white border border-gray-100">
      {/* Search Box */}
      <div className="relative p-2 md:p-3 pb-0 z-[400]">
        <div className="relative flex items-center bg-white border-2 border-gray-200 rounded-xl px-4 py-3 transition-all focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-500/10 shadow-sm">
          <Search size={20} className="text-gray-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 font-medium"
            placeholder="Search for property location in Nepal..."
            value={searchQuery}
            onChange={(e) => onSearchLocationChange && onSearchLocationChange(e.target.value)}
          />
          {isSearching && (
            <div className="absolute right-4 text-green-500 animate-spin">
              <Loader2 size={18} />
            </div>
          )}
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-2 right-2 md:left-3 md:right-3 z-[1000] bg-white border border-gray-100 rounded-xl shadow-xl mt-1 max-h-60 overflow-y-auto divide-y divide-gray-50">
            {searchResults.map((result, index) => (
              <div 
                key={index} 
                className="px-4 py-3 cursor-pointer hover:bg-green-50 transition-colors"
                onClick={() => handleSearchResultClick(result)}
              >
                <div className="font-semibold text-gray-800 text-sm mb-0.5 truncate">{result.display_name.split(',')[0]}</div>
                <div className="text-xs text-gray-500 truncate">{result.display_name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="w-full relative z-0 mt-2" style={{ height }}>
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={setMap}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Location Picker for selecting locations */}
          {showLocationPicker && (
            <LocationPicker onLocationSelect={onLocationSelect} />
          )}

          {/* Selected Location Marker */}
          {selectedLocation && (
            <Marker 
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={propertyIcon}
            >
              <Popup className="custom-popup rounded-xl shadow-xl border-0">
                <div className="p-1 min-w-[200px]">
                  <h4 className="font-bold text-gray-900 mb-2 border-b border-gray-100 pb-2">Selected Location</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium text-gray-800">Lat:</span> {Number(selectedLocation.lat).toFixed(6)}</p>
                    <p><span className="font-medium text-gray-800">Lng:</span> {Number(selectedLocation.lng).toFixed(6)}</p>
                    {selectedLocation.address && (
                      <p className="mt-2 text-xs bg-gray-50 p-2 rounded border border-gray-100">{selectedLocation.address}</p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Existing Properties Markers */}
          {properties.map((property) => (
            property.latitude && property.longitude && (
              <Marker
                key={property.id}
                position={[parseFloat(property.latitude), parseFloat(property.longitude)]}
                icon={propertyIcon}
              >
                <Popup className="custom-popup rounded-xl shadow-xl border-0 overflow-hidden p-0">
                  <div className="min-w-[240px]">
                    <div className="bg-white border-b border-gray-100 p-3 flex justify-between items-start">
                      <h4 className="font-bold text-gray-900 leading-tight m-0 pr-2">{property.title}</h4>
                      <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
                        {property.propertyType}
                      </span>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} className="text-green-500 flex-shrink-0" />
                        <span className="truncate">{property.address}, {property.city}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Banknote size={14} className="text-green-500 flex-shrink-0" />
                        <span className="font-semibold text-gray-900">NPR {parseInt(property.rentPrice || 0).toLocaleString()}</span><span className="text-xs text-gray-400">/mo</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 pt-1 border-t border-gray-50 mt-2">
                        <Bed size={14} className="text-gray-400" />
                        <span>{property.bedrooms} bed • {property.bathrooms} bath • {property.area} sq ft</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>
      
      {showLocationPicker && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] w-full max-w-sm px-4">
          <div className="bg-green-600/90 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm font-medium animate-bounce-in">
            <Lightbulb size={16} className="text-yellow-300" />
            Click map to pin exact location
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyLocationMap;