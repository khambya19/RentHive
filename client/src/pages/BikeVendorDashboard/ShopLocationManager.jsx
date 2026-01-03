import React, { useState, useEffect } from 'react';
import VendorLocationMap from '../../components/VendorLocationMap';
import '../../components/VendorLocationMap.css';

const ShopLocationManager = () => {
  const [shopLocation, setShopLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [nearbyVendors, setNearbyVendors] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = [position.coords.latitude, position.coords.longitude];
          setCurrentLocation(location);
          setLoading(false);
        },
        (error) => {
          console.log('Error getting location:', error);
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }

    // Load saved shop location from localStorage or API
    const savedLocation = localStorage.getItem('shopLocation');
    if (savedLocation) {
      setShopLocation(JSON.parse(savedLocation));
      setLocationSaved(true);
    }

    // Load nearby vendors
    setNearbyVendors(sampleVendors);
  }, []);

  const handleLocationSelect = (latlng) => {
    const location = { lat: latlng.lat, lng: latlng.lng };
    setShopLocation(location);
    setShowLocationPicker(false);
  };

  const saveShopLocation = async () => {
    if (!shopLocation) {
      alert('Please select a location first');
      return;
    }

    try {
      // Save to localStorage (replace with API call)
      localStorage.setItem('shopLocation', JSON.stringify(shopLocation));
      setLocationSaved(true);
      alert('Shop location saved successfully!');
      
      // Here you would typically make an API call:
      // const response = await fetch('/api/vendor/location', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     latitude: shopLocation.lat,
      //     longitude: shopLocation.lng
      //   })
      // });
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Failed to save location. Please try again.');
    }
  };

  const clearLocation = () => {
    setShopLocation(null);
    setLocationSaved(false);
    localStorage.removeItem('shopLocation');
    setShowLocationPicker(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <div className="shop-location-manager">
      {/* Header */}
      <div className="location-header">
        <div className="header-content">
          <h2>Shop Location Manager</h2>
          <p>Manage your bike rental shop location and discover nearby competitors</p>
        </div>
        <div className="header-actions">
          <button 
            className={`btn-outline ${showLocationPicker ? 'active' : ''}`}
            onClick={() => setShowLocationPicker(!showLocationPicker)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {showLocationPicker ? 'Cancel' : 'Set Location'}
          </button>
          {shopLocation && (
            <>
              <button className="btn-primary" onClick={saveShopLocation}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
                Save Location
              </button>
              <button className="btn-secondary" onClick={clearLocation}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                </svg>
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Location Status */}
      {locationSaved && (
        <div className="location-status success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          <span>Shop location saved successfully!</span>
        </div>
      )}

      {showLocationPicker && !locationSaved && (
        <div className="location-status info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>Click on the map to select your shop location</span>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="location-stats">
        <div className="stat-card">
          <div className="stat-icon location-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{shopLocation ? 'Location Set' : 'No Location'}</h3>
            <p>{shopLocation ? 'Shop location configured' : 'Set your shop location'}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon competitors-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{nearbyVendors.length} Vendors</h3>
            <p>Nearby bike rental shops</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon coverage-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>5 KM</h3>
            <p>Service radius</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon accuracy-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>High</h3>
            <p>Location accuracy</p>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="map-section">
        <div className="section-header">
          <h3>Interactive Map</h3>
          <p>Your shop location and nearby bike rental vendors</p>
        </div>
        
        <VendorLocationMap
          vendors={nearbyVendors}
          currentLocation={currentLocation}
          selectedLocation={shopLocation}
          onLocationSelect={handleLocationSelect}
          showLocationPicker={showLocationPicker}
          searchQuery={searchQuery}
          onSearchLocationChange={setSearchQuery}
          height="500px"
        />
      </div>

      {/* Nearby Vendors List */}
      <div className="nearby-vendors-section">
        <div className="section-header">
          <h3>Nearby Bike Rental Shops</h3>
          <p>Discover competitors and potential partners in your area</p>
        </div>

        <div className="vendors-list">
          {nearbyVendors.map((vendor) => (
            <div key={vendor.id} className="vendor-item">
              <div className="vendor-avatar">
                {vendor.businessName.charAt(0)}
              </div>
              <div className="vendor-info">
                <h4>{vendor.businessName}</h4>
                <div className="vendor-details">
                  <span className="detail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {vendor.address}
                  </span>
                  <span className="detail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12V7a1 1 0 0 1 1-1h4l2-3h4a1 1 0 0 1 1 1v7.5"/>
                      <circle cx="8" cy="16" r="3"/>
                      <circle cx="16" cy="16" r="3"/>
                    </svg>
                    {vendor.totalBikes} bikes
                  </span>
                </div>
              </div>
              <div className="vendor-actions">
                <button 
                  className="btn-outline btn-sm"
                  onClick={() => window.location.href = `tel:${vendor.phone}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  Call
                </button>
                <button 
                  className="btn-primary btn-sm"
                  onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${vendor.latitude},${vendor.longitude}`;
                    window.open(url, '_blank');
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="3,11 22,2 13,21 11,13 3,11"/>
                  </svg>
                  Directions
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShopLocationManager;