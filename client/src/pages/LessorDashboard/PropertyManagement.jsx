import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PropertyLocationMap from '../../components/PropertyLocationMap';
import '../../components/PropertyLocationMap.css';

const PropertyManagement = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [propertyForm, setPropertyForm] = useState({
    title: '',
    propertyType: 'Apartment',
    address: '',
    city: '',
    bedrooms: 1,
    bathrooms: 1,
    area: '',
    rentPrice: '',
    securityDeposit: '',
    amenities: [],
    description: '',
    latitude: null,
    longitude: null,
  });

  // Location-related states
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/properties', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Include location data in the property form
      const propertyData = {
        ...propertyForm,
        latitude: selectedLocation?.lat || null,
        longitude: selectedLocation?.lng || null,
      };

      const response = await fetch('http://localhost:3001/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(propertyData),
      });

      if (response.ok) {
        const newProperty = await response.json();
        setProperties([...properties, newProperty]);
        setShowPropertyModal(false);
        resetForm();
        alert('Property added successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to add property: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding property:', error);
      alert('Failed to add property');
    }
  };

  const resetForm = () => {
    setPropertyForm({
      title: '',
      propertyType: 'Apartment',
      address: '',
      city: '',
      bedrooms: 1,
      bathrooms: 1,
      area: '',
      rentPrice: '',
      securityDeposit: '',
      amenities: [],
      description: '',
      latitude: null,
      longitude: null,
    });
    setSelectedLocation(null);
    setShowLocationPicker(false);
    setLocationSearchQuery('');
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setPropertyForm(prev => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng
    }));
  };

  const clearLocation = () => {
    setSelectedLocation(null);
    setPropertyForm(prev => ({
      ...prev,
      latitude: null,
      longitude: null
    }));
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="property-management">
      <div className="section-header">
        <div>
          <h2>My Properties</h2>
          <p>Manage your rental properties</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => { setEditingProperty(null); resetForm(); setShowPropertyModal(true); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Property
        </button>
      </div>

      <div className="properties-grid">
        {properties.length > 0 ? properties.map(property => (
          <div key={property.id} className="property-card">
            <div className="property-image">
              <img 
                src={property.images?.[0] ? `http://localhost:5000/uploads/properties/${property.images[0]}` : 'https://via.placeholder.com/300x200'}
                alt={property.title}
              />
              <span className={`status-badge status-${property.status?.toLowerCase()}`}>
                {property.status || 'Available'}
              </span>
            </div>
            <div className="property-content">
              <h3>{property.title}</h3>
              <p className="property-location">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {property.address}, {property.city}
                {property.latitude && property.longitude && (
                  <span className="location-indicator">📍</span>
                )}
              </p>
              <div className="property-features">
                <span>{property.bedrooms} Bed</span>
                <span>{property.bathrooms} Bath</span>
                <span>{property.area} sq ft</span>
              </div>
              <div className="property-price">
                NPR {parseInt(property.rentPrice).toLocaleString()}/month
              </div>
              <div className="property-actions">
                <button className="btn-outline" onClick={() => {/* Edit logic */}}>Edit</button>
                <button className="btn-danger" onClick={() => {/* Delete logic */}}>Delete</button>
              </div>
            </div>
          </div>
        )) : (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <h3>No properties yet</h3>
            <p>Start by adding your first property to rent out</p>
            <button 
              className="btn-primary"
              onClick={() => { setEditingProperty(null); resetForm(); setShowPropertyModal(true); }}
            >
              Add Your First Property
            </button>
          </div>
        )}
      </div>

      {/* Property Modal */}
      {showPropertyModal && (
        <div className="modal-backdrop" onClick={() => setShowPropertyModal(false)}>
          <div className="modal-dialog large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProperty ? 'Edit Property' : 'Add New Property'}</h2>
              <button className="modal-close" onClick={() => setShowPropertyModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleAddProperty} className="modal-body">
              {/* Basic Information */}
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-row">
                  <div className="form-field">
                    <label>Property Title *</label>
                    <input
                      type="text"
                      value={propertyForm.title}
                      onChange={(e) => setPropertyForm({ ...propertyForm, title: e.target.value })}
                      placeholder="e.g., Spacious 2 BHK Apartment"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Property Type *</label>
                    <select
                      value={propertyForm.propertyType}
                      onChange={(e) => setPropertyForm({ ...propertyForm, propertyType: e.target.value })}
                      required
                    >
                      <option value="Apartment">Apartment</option>
                      <option value="Room">Room</option>
                      <option value="House">House</option>
                      <option value="Villa">Villa</option>
                      <option value="Studio">Studio</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>City *</label>
                    <input
                      type="text"
                      value={propertyForm.city}
                      onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })}
                      placeholder="e.g., Kathmandu"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Address *</label>
                    <input
                      type="text"
                      value={propertyForm.address}
                      onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                      placeholder="Full address"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location Selection */}
              <div className="form-section">
                <div className="location-section-header">
                  <h3>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Property Location
                  </h3>
                  <button
                    type="button"
                    className={`location-toggle-btn ${showLocationPicker ? 'active' : ''}`}
                    onClick={() => setShowLocationPicker(!showLocationPicker)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {showLocationPicker ? 'Hide Map' : 'Set Location'}
                  </button>
                </div>

                {/* Location Status */}
                {selectedLocation ? (
                  <div className="location-status success">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span>Property location selected</span>
                    <button 
                      type="button" 
                      onClick={clearLocation}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#15803d', cursor: 'pointer' }}
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="location-status info">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="m9 12 2 2 4-4"/>
                    </svg>
                    <span>Adding a precise location helps tenants find your property easily</span>
                  </div>
                )}

                {/* Map Component */}
                {showLocationPicker && (
                  <PropertyLocationMap
                    selectedLocation={selectedLocation}
                    onLocationSelect={handleLocationSelect}
                    showLocationPicker={true}
                    searchQuery={locationSearchQuery}
                    onSearchLocationChange={setLocationSearchQuery}
                    height="350px"
                    properties={properties}
                  />
                )}

                {/* Coordinates Display */}
                {selectedLocation && (
                  <div className="location-coordinates">
                    <div className="coordinate-item">
                      <span className="coordinate-label">Latitude</span>
                      <span className="coordinate-value">{selectedLocation.lat.toFixed(6)}</span>
                    </div>
                    <div className="coordinate-item">
                      <span className="coordinate-label">Longitude</span>
                      <span className="coordinate-value">{selectedLocation.lng.toFixed(6)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Property Details */}
              <div className="form-section">
                <h3>Property Details</h3>
                <div className="form-row">
                  <div className="form-field">
                    <label>Bedrooms *</label>
                    <input
                      type="number"
                      min="1"
                      value={propertyForm.bedrooms}
                      onChange={(e) => setPropertyForm({ ...propertyForm, bedrooms: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Bathrooms *</label>
                    <input
                      type="number"
                      min="1"
                      value={propertyForm.bathrooms}
                      onChange={(e) => setPropertyForm({ ...propertyForm, bathrooms: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Area (sq ft) *</label>
                    <input
                      type="number"
                      value={propertyForm.area}
                      onChange={(e) => setPropertyForm({ ...propertyForm, area: e.target.value })}
                      placeholder="e.g., 1200"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Monthly Rent (NPR) *</label>
                    <input
                      type="number"
                      value={propertyForm.rentPrice}
                      onChange={(e) => setPropertyForm({ ...propertyForm, rentPrice: e.target.value })}
                      placeholder="e.g., 25000"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Security Deposit (NPR)</label>
                    <input
                      type="number"
                      value={propertyForm.securityDeposit}
                      onChange={(e) => setPropertyForm({ ...propertyForm, securityDeposit: e.target.value })}
                      placeholder="e.g., 50000"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field full-width">
                    <label>Description</label>
                    <textarea
                      rows="4"
                      value={propertyForm.description}
                      onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                      placeholder="Describe your property..."
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowPropertyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingProperty ? 'Update Property' : 'Add Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyManagement;