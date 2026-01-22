import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PropertyLocationMap from '../../components/PropertyLocationMap';
import AddPropertyForm from '../../components/AddPropertyForm';
import '../../components/PropertyLocationMap.css';

const PropertyManagement = ({ inlineMode = false, showSuccess, showError }) => {
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
    if (!inlineMode) {
      fetchProperties();
    } else {
      // In inline mode, open form immediately
      setShowPropertyModal(true);
      setLoading(false);
    }
  }, [inlineMode]);

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

  const handleAddProperty = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      
      // Include location data in the property form
      const propertyData = {
        ...formData,
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
        if (showSuccess) showSuccess('Success', 'Property added successfully!');
        else alert('Property added successfully!');
      } else {
        const errorData = await response.json();
        if (showError) showError('Error', `Failed to add property: ${errorData.error || 'Unknown error'}`);
        else alert(`Failed to add property: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding property:', error);
      if (showError) showError('Error', 'Failed to add property');
      else alert('Failed to add property');
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

  // In inline mode, just render the form without the list
  if (inlineMode) {
    return (
      <div className="property-management inline-mode">
        {showPropertyModal && (
          <div className="inline-form-container">
            <AddPropertyForm
              onSubmit={handleAddProperty}
              onCancel={() => setShowPropertyModal(false)}
              initialData={null}
            />
          </div>
        )}
      </div>
    );
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
                src={property.images?.[0] ? `http://localhost:3001/uploads/properties/${property.images[0]}` : 'https://via.placeholder.com/300x200'}
                alt={property.title}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                }}
              />
              <span className={`status-badge status-${property.status?.toLowerCase()}`}>
                {property.status || 'Available'}
              </span>
            </div>
            <div className="property-content">
              <h3>{property.title}</h3>
              <p className="property-type">{property.propertyType}</p>
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
                <span>🛏️ {property.bedrooms} Bed{property.bedrooms > 1 ? 's' : ''}</span>
                <span>🚿 {property.bathrooms} Bath{property.bathrooms > 1 ? 's' : ''}</span>
                <span>📐 {property.area} sq.ft</span>
              </div>
              <div className="property-price">
                NPR {property.rentPrice ? Number(property.rentPrice).toLocaleString() : '0'}/month
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
            
            <div className="modal-body">
              <AddPropertyForm
                onSubmit={handleAddProperty}
                onCancel={() => setShowPropertyModal(false)}
                initialData={editingProperty}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyManagement;