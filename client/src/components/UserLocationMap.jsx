import React, { useState, useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Phone, Bike, Lightbulb } from 'lucide-react';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom bike shop icon
// Custom bike shop icon
const bikeShopIconMarkup = renderToStaticMarkup(
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: '#667eea', border: '2px solid white' }}>
    <Bike size={20} color="white" />
  </div>
);

const bikeShopIcon = new L.DivIcon({
  html: bikeShopIconMarkup,
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

const UserLocationMap = ({ 
  vendors = [], 
  currentLocation, 
  onLocationSelect, 
  showLocationPicker = false,
  selectedLocation,
  searchQuery,
  onSearchLocationChange,
  height = '500px'
}) => {
  const [map, setMap] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Default center (Kathmandu, Nepal)
  const defaultCenter = [27.7172, 85.3240];
  const mapCenter = currentLocation || defaultCenter;

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
    <div className="vendor-map-container">
      {/* Search Box */}
      <div className="map-search-container">
        <div className="map-search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search for locations in Nepal..."
            value={searchQuery}
            onChange={(e) => onSearchLocationChange && onSearchLocationChange(e.target.value)}
          />
          {isSearching && <div className="search-loading">Searching...</div>}
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="map-search-results">
            {searchResults.map((result, index) => (
              <div 
                key={index} 
                className="search-result-item"
                onClick={() => handleSearchResultClick(result)}
              >
                <div className="result-name">{result.display_name.split(',')[0]}</div>
                <div className="result-address">{result.display_name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="leaflet-map-wrapper" style={{ height }}>
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
              icon={bikeShopIcon}
            >
              <Popup>
                <div className="map-popup">
                  <h4>Selected Location</h4>
                  <p>Lat: {Number(selectedLocation.lat).toFixed(6)}</p>
                  <p>Lng: {Number(selectedLocation.lng).toFixed(6)}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Vendor Markers */}
          {vendors.map((vendor) => (
            vendor.latitude && vendor.longitude && (
              <Marker
                key={vendor.id}
                position={[parseFloat(vendor.latitude), parseFloat(vendor.longitude)]}
                icon={bikeShopIcon}
              >
                <Popup>
                  <div className="vendor-popup">
                    <div className="popup-header">
                      <h4>{vendor.businessName || vendor.fullName}</h4>
                      <span className="vendor-type">Bike Rental</span>
                    </div>
                    <div className="popup-content">
                      <div className="popup-detail">
                        <MapPin size={16} />
                        <span>{vendor.address}</span>
                      </div>
                      <div className="popup-detail">
                        <Phone size={16} />
                        <span>{vendor.phone}</span>
                      </div>
                      {vendor.totalBikes && (
                        <div className="popup-detail">
                          <Bike size={16} />
                          <span>{vendor.totalBikes} bikes available</span>
                        </div>
                      )}
                    </div>
                    <div className="popup-actions">
                      <button 
                        className="btn-primary btn-sm"
                        onClick={() => window.location.href = `tel:${vendor.phone}`}
                      >
                        Call Now
                      </button>
                      <button 
                        className="btn-outline btn-sm"
                        onClick={() => {
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${vendor.latitude},${vendor.longitude}`;
                          window.open(url, '_blank');
                        }}
                      >
                        Directions
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          ))}

          {/* Current Location Marker */}
          {currentLocation && (
            <Marker position={currentLocation}>
              <Popup>
                <div className="current-location-popup">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} className="text-blue-500" /> Your Location
                  </h4>
                  <p>You are here</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      
      {showLocationPicker && (
        <div className="map-instructions">
          <p><Lightbulb size={16} className="inline-icon" /> Click anywhere on the map to select a location for your bike shop</p>
        </div>
      )}
    </div>
  );
};

export default UserLocationMap;