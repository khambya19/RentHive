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

// Custom property icon
const propertyIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="15" fill="#10b981" stroke="#fff" stroke-width="2"/>
      <path d="M8 20V12l8-6 8 6v8a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" fill="#fff"/>
      <path d="M12 20v-6h8v6" fill="#10b981" opacity="0.3"/>
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
    <div className="property-map-container">
      {/* Search Box */}
      <div className="map-search-container">
        <div className="map-search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search for property location in Nepal..."
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
              icon={propertyIcon}
            >
              <Popup>
                <div className="map-popup">
                  <h4>Selected Property Location</h4>
                  <p><strong>Latitude:</strong> {selectedLocation.lat.toFixed(6)}</p>
                  <p><strong>Longitude:</strong> {selectedLocation.lng.toFixed(6)}</p>
                  {selectedLocation.address && (
                    <p><strong>Address:</strong> {selectedLocation.address}</p>
                  )}
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
                <Popup>
                  <div className="property-popup">
                    <div className="popup-header">
                      <h4>{property.title}</h4>
                      <span className="property-type">{property.propertyType}</span>
                    </div>
                    <div className="popup-content">
                      <div className="popup-detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>{property.address}, {property.city}</span>
                      </div>
                      <div className="popup-detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="1" x2="12" y2="23"/>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                        <span>NPR {parseInt(property.rentPrice || 0).toLocaleString()}/month</span>
                      </div>
                      <div className="popup-detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
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
        <div className="map-instructions">
          <p>💡 Click anywhere on the map to select your property location</p>
        </div>
      )}
    </div>
  );
};

export default PropertyLocationMap;