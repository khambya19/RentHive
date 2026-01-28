import React, { useState } from 'react';
import PropertyManagement from './PropertyManagement';
import PropertyLocationMap from '../../components/PropertyLocationMap';
import './UnifiedPostingForm.css';
import API_BASE_URL from '../../config/api';

const UnifiedPostingForm = ({ showSuccess, showError }) => {
  const [listingType, setListingType] = useState(null); // 'property' or 'automobile'
  const [currentStep, setCurrentStep] = useState(1);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [bikeForm, setBikeForm] = useState({
    name: '',
    brand: '',
    model: '',
    type: 'Scooter',
    year: new Date().getFullYear(),
    color: '',
    registrationNumber: '',
    dailyRate: '',
    weeklyRate: '',
    securityDeposit: '',
    location: '',
    description: '',
    features: [],
    images: [],
    latitude: null,
    longitude: null
  });

  const handleBikeSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Append all bike form fields
      Object.keys(bikeForm).forEach(key => {
        if (key === 'images' && bikeForm.images.length > 0) {
          bikeForm.images.forEach(image => {
            formData.append('images', image);
          });
        } else if (key === 'features') {
          formData.append('features', JSON.stringify(bikeForm.features));
        } else {
          formData.append(key, bikeForm[key]);
        }
      });

      const response = await fetch(`${API_BASE_URL}/bikes/vendor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        showSuccess('Success', 'Automobile listed successfully!');
        resetBikeForm();
        setListingType(null);
      } else {
        const errorData = await response.json();
        showError('Error', `Failed to add automobile: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding automobile:', error);
      showError('Error', 'Failed to add automobile');
    }
  };

  const resetBikeForm = () => {
    setBikeForm({
      name: '',
      brand: '',
      model: '',
      type: 'Scooter',
      year: new Date().getFullYear(),
      color: '',
      registrationNumber: '',
      dailyRate: '',
      weeklyRate: '',
      securityDeposit: '',
      location: '',
      description: '',
      features: [],
      images: [],
      latitude: null,
      longitude: null
    });
    setCurrentStep(1);
    setSelectedLocation(null);
    setShowLocationPicker(false);
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setBikeForm({ ...bikeForm, latitude: location.lat, longitude: location.lng });
  };

  const clearLocation = () => {
    setSelectedLocation(null);
    setBikeForm({ ...bikeForm, latitude: null, longitude: null });
  };

  const nextStep = () => {
    const totalSteps = 4;
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {[1, 2, 3, 4].map(step => (
        <div key={step} className={`step ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}>
          <div className="step-number">{step}</div>
          <div className="step-label">{getStepLabel(step)}</div>
        </div>
      ))}
    </div>
  );

  const getStepLabel = (step) => {
    const labels = ['Basic Info', 'Pricing & Location', 'Features', 'Media'];
    return labels[step - 1];
  };

  const handleBikeImageChange = (e) => {
    const files = Array.from(e.target.files);
    setBikeForm({ ...bikeForm, images: files });
  };

  const toggleBikeFeature = (feature) => {
    const features = bikeForm.features.includes(feature)
      ? bikeForm.features.filter(f => f !== feature)
      : [...bikeForm.features, feature];
    setBikeForm({ ...bikeForm, features });
  };

  // If no listing type selected, show the choice screen
  if (!listingType) {
    return (
      <div className="unified-posting-form">
        <div className="posting-type-selector">
          <h2>What would you like to list?</h2>
          <p>Choose the type of rental you want to add</p>
          
          <div className="type-cards">
            <div 
              className="type-card property-card"
              onClick={() => setListingType('property')}
            >
              <div className="type-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <h3>Property</h3>
              <p>List apartments, houses, rooms, or commercial spaces</p>
              <button className="select-btn">
                Select Property
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>

            <div 
              className="type-card automobile-card"
              onClick={() => setListingType('automobile')}
            >
              <div className="type-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="5.5" cy="17.5" r="3.5"/>
                  <circle cx="18.5" cy="17.5" r="3.5"/>
                  <path d="M5.5 17.5h13"/>
                  <path d="M12 14l-8-6h2l8 6"/>
                </svg>
              </div>
              <h3>Automobile</h3>
              <p>List bikes, scooters, motorcycles, or other vehicles</p>
              <button className="select-btn">
                Select Automobile
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If property selected, show property form
  if (listingType === 'property') {
    return (
      <div className="unified-posting-form">
        <div className="form-header">
          <button className="back-btn" onClick={() => setListingType(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Selection
          </button>
          <h2>List a Property</h2>
        </div>
        <PropertyManagement inlineMode={true} />
      </div>
    );
  }

  // If automobile selected, show automobile form
  if (listingType === 'automobile') {
    const totalSteps = 4;
    
    return (
      <div className="unified-posting-form">
        <div className="form-header">
          <button className="back-btn" onClick={() => setListingType(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Selection
          </button>
          <h2>List an Automobile</h2>
        </div>

        <div className="add-property-form-container">
          {renderStepIndicator()}
          
          <form className="add-property-form" onSubmit={handleBikeSubmit}>
            <div className="form-step">
              
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <>
                  <h2>Basic Information</h2>
                  
                  <div className="form-group">
                    <label>Vehicle Name <span className="required">*</span></label>
                    <input
                      type="text"
                      value={bikeForm.name}
                      onChange={(e) => setBikeForm({ ...bikeForm, name: e.target.value })}
                      placeholder="e.g., Red Honda Activa 2023"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Brand <span className="required">*</span></label>
                      <input
                        type="text"
                        value={bikeForm.brand}
                        onChange={(e) => setBikeForm({ ...bikeForm, brand: e.target.value })}
                        placeholder="e.g., Honda, Yamaha, Hero"
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>Model <span className="required">*</span></label>
                      <input
                        type="text"
                        value={bikeForm.model}
                        onChange={(e) => setBikeForm({ ...bikeForm, model: e.target.value })}
                        placeholder="e.g., Activa, FZ, Splendor"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Type <span className="required">*</span></label>
                      <select
                        value={bikeForm.type}
                        onChange={(e) => setBikeForm({ ...bikeForm, type: e.target.value })}
                        required
                      >
                        <option value="Scooter">Scooter</option>
                        <option value="Motorcycle">Motorcycle</option>
                        <option value="Sport Bike">Sport Bike</option>
                        <option value="Cruiser">Cruiser</option>
                        <option value="Electric">Electric</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Year <span className="required">*</span></label>
                      <input
                        type="number"
                        value={bikeForm.year}
                        onChange={(e) => setBikeForm({ ...bikeForm, year: parseInt(e.target.value) })}
                        min="1990"
                        max={new Date().getFullYear() + 1}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Color</label>
                      <input
                        type="text"
                        value={bikeForm.color}
                        onChange={(e) => setBikeForm({ ...bikeForm, color: e.target.value })}
                        placeholder="e.g., Black, Red, Blue"
                      />
                    </div>

                    <div className="form-field">
                      <label>Registration Number</label>
                      <input
                        type="text"
                        value={bikeForm.registrationNumber}
                        onChange={(e) => setBikeForm({ ...bikeForm, registrationNumber: e.target.value })}
                        placeholder="e.g., BA-01-PA-1234"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Pricing & Location */}
              {currentStep === 2 && (
                <>
                  <h2>Pricing & Location</h2>
                  
                  <div className="form-row">
                    <div className="form-field">
                      <label>Daily Rate (NPR) <span className="required">*</span></label>
                      <input
                        type="number"
                        value={bikeForm.dailyRate}
                        onChange={(e) => setBikeForm({ ...bikeForm, dailyRate: e.target.value })}
                        placeholder="e.g., 500"
                        min="0"
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>Weekly Rate (NPR)</label>
                      <input
                        type="number"
                        value={bikeForm.weeklyRate}
                        onChange={(e) => setBikeForm({ ...bikeForm, weeklyRate: e.target.value })}
                        placeholder="e.g., 3000"
                        min="0"
                      />
                      <small style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                        Optional - Leave empty to use daily rate
                      </small>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Security Deposit (NPR) <span className="required">*</span></label>
                      <input
                        type="number"
                        value={bikeForm.securityDeposit}
                        onChange={(e) => setBikeForm({ ...bikeForm, securityDeposit: e.target.value })}
                        placeholder="e.g., 5000"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={bikeForm.description}
                      onChange={(e) => setBikeForm({ ...bikeForm, description: e.target.value })}
                      placeholder="Describe your vehicle, its condition, and any special notes..."
                      rows="4"
                    />
                  </div>

                  {/* Map Location Picker */}
                  <div className="location-picker-section">
                    <div className="location-section-header">
                      <h3>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        Pin Vehicle Location on Map
                      </h3>
                      <button
                        type="button"
                        className={`location-toggle-btn ${showLocationPicker ? 'active' : ''}`}
                        onClick={() => setShowLocationPicker(!showLocationPicker)}
                      >
                        {showLocationPicker ? 'Hide Map' : 'Show Map'}
                      </button>
                    </div>

                    {selectedLocation ? (
                      <div className="location-status success">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <span>Location selected ({selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)})</span>
                        <button type="button" onClick={clearLocation} className="clear-btn">Clear</button>
                      </div>
                    ) : (
                      <div className="location-status info">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <span>Click on the map to set the exact vehicle pickup location (helps renters find you)</span>
                      </div>
                    )}

                    {showLocationPicker && (
                      <PropertyLocationMap
                        selectedLocation={selectedLocation}
                        onLocationSelect={handleLocationSelect}
                        showLocationPicker={true}
                        searchQuery={locationSearchQuery}
                        onSearchLocationChange={setLocationSearchQuery}
                        height="400px"
                        properties={[]}
                      />
                    )}
                  </div>
                </>
              )}

              {/* Step 3: Features */}
              {currentStep === 3 && (
                <>
                  <h2>Features & Amenities</h2>
                  <div className="checkbox-grid">
                    {['Helmet Included', 'Full Tank', 'Insurance Included', 'Free Delivery', 'GPS Tracker', 'Spare Key'].map(feature => (
                      <label key={feature} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={bikeForm.features.includes(feature)}
                          onChange={() => toggleBikeFeature(feature)}
                        />
                        <span>{feature}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {/* Step 4: Media */}
              {currentStep === 4 && (
                <>
                  <h2>Images</h2>
                  <div className="form-group">
                    <label>Upload Images (Max 5) <span className="required">*</span></label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleBikeImageChange}
                      max="5"
                    />
                    {bikeForm.images.length > 0 && (
                      <p className="file-info" style={{ marginTop: '0.5rem', color: '#10b981', fontSize: '0.9rem', fontWeight: '600' }}>
                        {bikeForm.images.length} file(s) selected
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="form-navigation">
                {currentStep > 1 && (
                  <button type="button" className="btn-secondary" onClick={prevStep}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Previous
                  </button>
                )}
                {currentStep < totalSteps ? (
                  <button type="button" className="btn-primary" onClick={nextStep}>
                    Next
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                ) : (
                  <button type="submit" className="btn-primary">
                    List Automobile
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default UnifiedPostingForm;
