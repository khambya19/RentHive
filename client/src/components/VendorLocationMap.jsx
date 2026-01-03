import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom bike shop icon
const bikeShopIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="15" fill="#667eea" stroke="#fff" stroke-width="2"/>
      <path d="M10 20c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zM22 20c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zM16 8l-2 6h4l-2-6z" fill="#fff"/>
      <path d="M10 8h12v2H10zM14 14h4v2h-4z" fill="#fff"/>
    </svg>
  `),
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

const VendorLocationMap = ({ 
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
      console.error('Error searching location:', error);
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
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
                  <p>Lat: {selectedLocation.lat.toFixed(6)}</p>
                  <p>Lng: {selectedLocation.lng.toFixed(6)}</p>
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
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>{vendor.address}</span>
                      </div>
                      <div className="popup-detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        <span>{vendor.phone}</span>
                      </div>
                      {vendor.totalBikes && (
                        <div className="popup-detail">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12V7a1 1 0 0 1 1-1h4l2-3h4a1 1 0 0 1 1 1v7.5"/>
                            <circle cx="8" cy="16" r="3"/>
                            <circle cx="16" cy="16" r="3"/>
                          </svg>
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
                  <h4>📍 Your Location</h4>
                  <p>You are here</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      
      {showLocationPicker && (
        <div className="map-instructions">
          <p>💡 Click anywhere on the map to select a location for your bike shop</p>
        </div>
      )}
    </div>
  );
};

export default VendorLocationMap;