import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import VendorLocationMap from '../../components/VendorLocationMap';
import './VendorProfileDashboard.css';

const VendorProfileDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [shopLocation, setShopLocation] = useState({
    latitude: null,
    longitude: null,
    address: '',
    city: '',
    businessHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      Friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '15:00', closed: false },
      sunday: { open: '10:00', close: '14:00', closed: true }
    }
  });
  
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  const fetchVendorProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/vendors/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVendorProfile(data.vendor);
        
        // Set location data if exists
        if (data.vendor.latitude && data.vendor.longitude) {
          setSelectedLocation({
            lat: parseFloat(data.vendor.latitude),
            lng: parseFloat(data.vendor.longitude)
          });
          setShopLocation(prev => ({
            ...prev,
            latitude: data.vendor.latitude,
            longitude: data.vendor.longitude,
            address: data.vendor.address || '',
            city: data.vendor.city || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setShopLocation(prev => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng
    }));
  };

  const saveShopLocation = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/vendors/location', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          latitude: shopLocation.latitude,
          longitude: shopLocation.longitude,
          address: shopLocation.address,
          city: shopLocation.city,
          businessHours: shopLocation.businessHours
        })
      });

      if (response.ok) {
        alert('Shop location updated successfully!');
      } else {
        alert('Failed to update shop location');
      }
    } catch (error) {
      console.error('Error saving shop location:', error);
      alert('Error saving shop location');
    }
  };

  const renderShopLocation = () => (
    <div className="shop-location-tab">
      <div className="section-header">
        <h2>🗺️ Shop Location</h2>
        <p>Set your shop location to help customers find you</p>
      </div>

      <div className="location-form">
        <div className="form-row">
          <div className="form-field">
            <label>Shop Address *</label>
            <input
              type="text"
              value={shopLocation.address}
              onChange={(e) => setShopLocation({...shopLocation, address: e.target.value})}
              placeholder="Enter your shop address"
            />
          </div>
          <div className="form-field">
            <label>City *</label>
            <input
              type="text"
              value={shopLocation.city}
              onChange={(e) => setShopLocation({...shopLocation, city: e.target.value})}
              placeholder="Enter city"
            />
          </div>
        </div>

        <div className="location-picker-section">
          <div className="location-header">
            <h3>📍 Pin Your Exact Location</h3>
            <button
              className={`location-toggle-btn ${showLocationPicker ? 'active' : ''}`}
              onClick={() => setShowLocationPicker(!showLocationPicker)}
            >
              {showLocationPicker ? 'Hide Map' : 'Set Location on Map'}
            </button>
          </div>

          {selectedLocation && (
            <div className="location-status">
              <span className="location-indicator">✅ Location set</span>
              <span className="coordinates">
                Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
              </span>
            </div>
          )}

          {showLocationPicker && (
            <div className="map-container">
              <VendorLocationMap
                selectedLocation={selectedLocation}
                onLocationSelect={handleLocationSelect}
                height="400px"
              />
            </div>
          )}
        </div>

        <div className="business-hours-section">
          <h3>🕒 Business Hours</h3>
          <div className="hours-grid">
            {Object.entries(shopLocation.businessHours).map(([day, hours]) => (
              <div key={day} className="hours-row">
                <div className="day-name">
                  <span>{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={!hours.closed}
                      onChange={(e) => setShopLocation(prev => ({
                        ...prev,
                        businessHours: {
                          ...prev.businessHours,
                          [day]: { ...hours, closed: !e.target.checked }
                        }
                      }))}
                    />
                    Open
                  </label>
                </div>
                {!hours.closed && (
                  <div className="time-inputs">
                    <input
                      type="time"
                      value={hours.open}
                      onChange={(e) => setShopLocation(prev => ({
                        ...prev,
                        businessHours: {
                          ...prev.businessHours,
                          [day]: { ...hours, open: e.target.value }
                        }
                      }))}
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={hours.close}
                      onChange={(e) => setShopLocation(prev => ({
                        ...prev,
                        businessHours: {
                          ...prev.businessHours,
                          [day]: { ...hours, close: e.target.value }
                        }
                      }))}
                    />
                  </div>
                )}
                {hours.closed && (
                  <span className="closed-indicator">Closed</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-secondary" onClick={fetchVendorProfile}>
            Reset Changes
          </button>
          <button className="btn-primary" onClick={saveShopLocation}>
            Save Shop Location
          </button>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="vendor-overview">
      <div className="profile-summary">
        <h2>Welcome back, {vendorProfile?.ownerName}! 👋</h2>
        <p>Manage your shop profile and location settings</p>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">🏪</div>
          <div className="stat-content">
            <h3>{vendorProfile?.businessName}</h3>
            <p>Business Name</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <h3>{selectedLocation ? 'Set' : 'Not Set'}</h3>
            <p>Shop Location</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🕒</div>
          <div className="stat-content">
            <h3>Mon-Sat</h3>
            <p>Business Days</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <button 
          className="btn-primary"
          onClick={() => setActiveTab('location')}
        >
          📍 Set Shop Location
        </button>
        <button 
          className="btn-outline"
          onClick={() => setActiveTab('profile')}
        >
          ✏️ Edit Profile
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading vendor dashboard...</p>
      </div>
    );
  }

  return (
    <div className="vendor-profile-dashboard">
      <div className="dashboard-header">
        <h1>🏪 Vendor Dashboard</h1>
        <p>Manage your shop profile and settings</p>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab ${activeTab === 'location' ? 'active' : ''}`}
          onClick={() => setActiveTab('location')}
        >
          📍 Shop Location
        </button>
        <button 
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile Settings
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'location' && renderShopLocation()}
        {activeTab === 'profile' && (
          <div className="profile-settings">
            <h2>Profile Settings</h2>
            <p>Profile management features coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorProfileDashboard;