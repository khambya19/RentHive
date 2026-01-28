import React, { useState } from 'react';
import PropertyLocationMap from './PropertyLocationMap';
import './AddPropertyForm.css';

const AddPropertyForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialData?.latitude && initialData?.longitude ? { lat: initialData.latitude, lng: initialData.longitude } : null);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [floorPlanPreview, setFloorPlanPreview] = useState(null);

  // Tag selection states
  const [featuresSearch, setFeaturesSearch] = useState('');

  const [formData, setFormData] = useState({
    // Basic Information
    title: initialData?.title || '',
    propertyType: initialData?.propertyType || 'Apartment',
    listingType: initialData?.listingType || 'For Rent',
    price: initialData?.price || '',
    area: initialData?.area || '',
    areaUnit: initialData?.areaUnit || 'sq ft',
    
    // Location
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zipCode: initialData?.zipCode || '',
    country: initialData?.country || 'Nepal',
    neighborhood: initialData?.neighborhood || '',
    latitude: initialData?.latitude || null,
    longitude: initialData?.longitude || null,
    
    // Property Details
    bedrooms: initialData?.bedrooms || 1,
    bathrooms: initialData?.bathrooms || 1,
    halfBathrooms: initialData?.halfBathrooms || 0,
    yearBuilt: initialData?.yearBuilt || '',
    lotSize: initialData?.lotSize || '',
    lotSizeUnit: initialData?.lotSizeUnit || 'sq ft',
    garageSpaces: initialData?.garageSpaces || '0',
    parkingType: initialData?.parkingType || [],
    
    // Combined Features
    combinedFeatures: initialData?.combinedFeatures || [],
    
    // Interior & Appliances
    flooring: initialData?.flooring || [],
    heatingSystem: initialData?.heatingSystem || [],
    coolingSystem: initialData?.coolingSystem || [],
    appliancesIncluded: initialData?.appliancesIncluded || [],
    basementType: initialData?.basementType || 'None',
    basementArea: initialData?.basementArea || '',
    fireplaceCount: initialData?.fireplaceCount || 0,
    fireplaceType: initialData?.fireplaceType || 'None',
    
    // Exterior & Lot
    exteriorMaterial: initialData?.exteriorMaterial || [],
    roofType: initialData?.roofType || '',
    roofAge: initialData?.roofAge || '',
    poolSpa: initialData?.poolSpa || [],
    fenceType: initialData?.fenceType || 'None',
    view: initialData?.view || [],
    
    // Features & Amenities
    amenities: initialData?.amenities || [],
    customFeatures: initialData?.customFeatures || '',
    
    // Pricing & Financial
    propertyTaxes: initialData?.propertyTaxes || '',
    hoaFees: initialData?.hoaFees || '',
    hoaFeesFrequency: initialData?.hoaFeesFrequency || 'Monthly',
    hoaName: initialData?.hoaName || '',
    maintenanceFees: initialData?.maintenanceFees || '',
    
    // Rental Specific
    monthlyRent: initialData?.monthlyRent || '',
    securityDeposit: initialData?.securityDeposit || '',
    leaseTerms: initialData?.leaseTerms || '1 Year',
    petPolicy: initialData?.petPolicy || 'No',
    petDetails: initialData?.petDetails || '',
    furnished: initialData?.furnished || 'No',
    
    // Energy & Green Features
    solarPanels: initialData?.solarPanels || 'No',
    energyEfficient: initialData?.energyEfficient || 'No',
    greenCertification: initialData?.greenCertification || '',
    
    // Description & Marketing
    description: initialData?.description || '',
    keywords: initialData?.keywords || '',
    
    // Additional Info
    propertyCondition: initialData?.propertyCondition || 'Move-in Ready',
    schoolDistrict: initialData?.schoolDistrict || '',
    zoningType: initialData?.zoningType || '',
    taxId: initialData?.taxId || '',
    
    // Media
    images: [],
    floorPlan: null,
    virtualTourLink: initialData?.virtualTourLink || '',
    additionalDocuments: [],
    
    // Contact
    contactName: initialData?.contactName || '',
    contactEmail: initialData?.contactEmail || '',
    contactPhone: initialData?.contactPhone || '',
  });

  const totalSteps = 7;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => {
      const current = prev[field] || [];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setFormData(prev => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng
    }));
  };

  const clearLocation = () => {
    setSelectedLocation(null);
    setFormData(prev => ({
      ...prev,
      latitude: null,
      longitude: null
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleFloorPlanUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, floorPlan: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setFloorPlanPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // First, upload images if any
    let uploadedImageFilenames = [];
    if (formData.images.length > 0) {
      try {
        const imageFormData = new FormData();
        formData.images.forEach(file => {
          imageFormData.append('images', file);
        });

        const token = localStorage.getItem('token');
        const uploadResponse = await fetch('http://localhost:5001/api/properties/upload-images', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: imageFormData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          uploadedImageFilenames = uploadData.images;
          console.log('Images uploaded:', uploadedImageFilenames);
        } else {
          console.error('Failed to upload images');
          alert('Failed to upload images. Please try again.');
          return;
        }
      } catch (error) {
        console.error('Error uploading images:', error);
        alert('Error uploading images. Please try again.');
        return;
      }
    }

    // Prepare data for submission - map form fields to backend expected fields
    const propertyData = {
      title: formData.title,
      propertyType: formData.propertyType,
      address: formData.address,
      city: formData.city,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      area: formData.area,
      // Map the price fields correctly
      rentPrice: formData.listingType === 'For Rent' ? formData.monthlyRent : formData.price,
      securityDeposit: formData.securityDeposit,
      amenities: formData.combinedFeatures,
      description: formData.description,
      images: uploadedImageFilenames,
      latitude: formData.latitude,
      longitude: formData.longitude
    };

    console.log('Submitting property data:', propertyData);
    onSubmit(propertyData);
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {[1, 2, 3, 4, 5, 6].map(step => (
        <div key={step} className={`step ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}>
          <div className="step-number">{step}</div>
          <div className="step-label">{getStepLabel(step)}</div>
        </div>
      ))}
    </div>
  );

  const getStepLabel = (step) => {
    const labels = ['Basic Info', 'Location', 'Details', 'Media', 'Pricing', 'Additional'];
    return labels[step - 1];
  };

  // Tag selection helper - Free form input (no predefined list)
  const renderFreeFormTagInput = (label, selectedValues, onAdd, onRemove, searchValue, onSearchChange) => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && searchValue.trim()) {
        e.preventDefault();
        if (!selectedValues.includes(searchValue.trim())) {
          onAdd(searchValue.trim());
        }
        onSearchChange('');
      }
    };

    return (
      <div className="form-group">
        <label>{label}</label>
        <div className="tag-select-container">
          {/* Selected Tags */}
          {selectedValues.length > 0 && (
            <div className="selected-tags">
              {selectedValues.map(value => (
                <span key={value} className="tag">
                  {value}
                  <button type="button" onClick={() => onRemove(value)} className="tag-remove">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          
          {/* Free Input */}
          <div className="tag-input-wrapper">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Type a feature and press Enter to add...`}
              className="tag-search-input"
            />
            {searchValue.trim() && (
              <button
                type="button"
                className="add-tag-btn"
                onClick={() => {
                  if (!selectedValues.includes(searchValue.trim())) {
                    onAdd(searchValue.trim());
                  }
                  onSearchChange('');
                }}
              >
                + Add "{searchValue.trim()}"
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="add-property-form-container">
      {renderStepIndicator()}
      
      <form onSubmit={handleSubmit} className="add-property-form">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="form-step">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label>Property Title / Headline <span className="required">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Spacious 2 BHK Apartment in Prime Location"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Property Type <span className="required">*</span></label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                  required
                >
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Condo">Condo</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Villa">Villa</option>
                  <option value="Land">Land</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Office">Office</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Listing Type <span className="required">*</span></label>
                <select
                  value={formData.listingType}
                  onChange={(e) => handleInputChange('listingType', e.target.value)}
                  required
                >
                  <option value="For Sale">For Sale</option>
                  <option value="For Rent">For Rent</option>
                  <option value="Lease">Lease</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price <span className="required">*</span></label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="e.g., 25000"
                  required
                />
              </div>

              <div className="form-group">
                <label>Area <span className="required">*</span></label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    value={formData.area}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    placeholder="e.g., 1200"
                    required
                  />
                  <select
                    value={formData.areaUnit}
                    onChange={(e) => handleInputChange('areaUnit', e.target.value)}
                    className="unit-select"
                  >
                    <option value="sq ft">sq ft</option>
                    <option value="m²">m²</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Property Condition <span className="required">*</span></label>
              <select
                value={formData.propertyCondition}
                onChange={(e) => handleInputChange('propertyCondition', e.target.value)}
                required
              >
                <option value="New Construction">New Construction</option>
                <option value="Move-in Ready">Move-in Ready</option>
                <option value="Renovated">Renovated</option>
                <option value="Fixer-Upper">Fixer-Upper</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <div className="form-step">
            <h2>Location Details</h2>

            <div className="form-group">
              <label>Street Address <span className="required">*</span></label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="e.g., 123 Main Street"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="e.g., Kathmandu"
                  required
                />
              </div>

              <div className="form-group">
                <label>State / Province</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="e.g., Bagmati"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>ZIP / Postal Code</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="e.g., 44600"
                />
              </div>

              <div className="form-group">
                <label>Country <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="e.g., Nepal"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Neighborhood / Suburb</label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                placeholder="e.g., Thamel"
              />
            </div>

            <div className="form-group">
              <label>School District</label>
              <input
                type="text"
                value={formData.schoolDistrict}
                onChange={(e) => handleInputChange('schoolDistrict', e.target.value)}
                placeholder="e.g., District 5"
              />
            </div>

            {/* Map Location Picker */}
            <div className="location-picker-section">
              <div className="location-section-header">
                <h3>Pin Property Location on Map</h3>
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
                  <span>Click on the map to set the exact property location (helps tenants find your property)</span>
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
          </div>
        )}

        {/* Step 3: Property Details */}
        {currentStep === 3 && (
          <div className="form-step">
            <h2>Property Details</h2>

            <div className="form-row">
              <div className="form-group">
                <label>Bedrooms <span className="required">*</span></label>
                <select
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value))}
                  required
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Bathrooms <span className="required">*</span></label>
                <select
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value))}
                  required
                >
                  {[0, 1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Half Bathrooms</label>
                <select
                  value={formData.halfBathrooms}
                  onChange={(e) => handleInputChange('halfBathrooms', parseInt(e.target.value))}
                >
                  {[0, 1, 2, 3].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Year Built</label>
                <input
                  type="number"
                  value={formData.yearBuilt}
                  onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
                  placeholder="e.g., 2015"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>

              <div className="form-group">
                <label>Lot Size</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    value={formData.lotSize}
                    onChange={(e) => handleInputChange('lotSize', e.target.value)}
                    placeholder="e.g., 5000"
                  />
                  <select
                    value={formData.lotSizeUnit}
                    onChange={(e) => handleInputChange('lotSizeUnit', e.target.value)}
                    className="unit-select"
                  >
                    <option value="sq ft">sq ft</option>
                    <option value="m²">m²</option>
                    <option value="acres">acres</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Garage Spaces</label>
                <select
                  value={formData.garageSpaces}
                  onChange={(e) => handleInputChange('garageSpaces', e.target.value)}
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5+">5+</option>
                </select>
              </div>

              <div className="form-group">
                <label>Balcony Count</label>
                <input
                  type="number"
                  value={formData.fireplaceCount}
                  onChange={(e) => handleInputChange('fireplaceCount', parseInt(e.target.value) || 0)}
                  min="0"
                  max="10"
                />
              </div>

              {formData.fireplaceCount > 0 && (
                <div className="form-group">
                  <label>Balcony Type</label>
                  <select
                    value={formData.fireplaceType}
                    onChange={(e) => handleInputChange('fireplaceType', e.target.value)}
                  >
                    <option value="Wood">Open Balcony</option>
                    <option value="Gas">Covered Balcony</option>
                    <option value="Electric">Enclosed Balcony</option>
                    <option value="Pellet">Juliet Balcony</option>
                  </select>
                </div>
              )}
            </div>

            {renderFreeFormTagInput(
              'Features',
              formData.combinedFeatures,
              (value) => handleMultiSelect('combinedFeatures', value),
              (value) => handleMultiSelect('combinedFeatures', value),
              featuresSearch,
              setFeaturesSearch
            )}
          </div>
        )}

        {/* Step 4: Media */}
        {currentStep === 4 && (
          <div className="form-step">
            <h2>Property Media</h2>

            <div className="form-group">
              <label>Property Images <span className="required">*</span> (Add 30-35 photos for best results)</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="property-images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="property-images" className="file-upload-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Click to upload or drag and drop images</span>
                  <span className="file-upload-hint">PNG, JPG, JPEG up to 10MB each • Upload 30-35 photos</span>
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div className="image-previews">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Floor Plan (Optional)</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="floor-plan"
                  accept="image/*,.pdf"
                  onChange={handleFloorPlanUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="floor-plan" className="file-upload-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span>Upload floor plan</span>
                </label>
              </div>
              {floorPlanPreview && (
                <div className="floor-plan-preview">
                  <img src={floorPlanPreview} alt="Floor plan preview" />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Virtual Tour / Video Link</label>
              <input
                type="url"
                value={formData.virtualTourLink}
                onChange={(e) => handleInputChange('virtualTourLink', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or virtual tour URL"
              />
            </div>
          </div>
        )}

        {/* Step 5: Pricing & Financial */}
        {currentStep === 5 && (
          <div className="form-step">
            <h2>Pricing & Financial Details</h2>

            <div className="form-group">
              <label>Annual Property Taxes (NPR)</label>
              <input
                type="number"
                value={formData.propertyTaxes}
                onChange={(e) => handleInputChange('propertyTaxes', e.target.value)}
                placeholder="e.g., 25000"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Building/Society Maintenance Fees (NPR)</label>
                <input
                  type="number"
                  value={formData.hoaFees}
                  onChange={(e) => handleInputChange('hoaFees', e.target.value)}
                  placeholder="e.g., 2000"
                />
              </div>

              <div className="form-group">
                <label>Payment Frequency</label>
                <select
                  value={formData.hoaFeesFrequency}
                  onChange={(e) => handleInputChange('hoaFeesFrequency', e.target.value)}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Other Monthly Expenses (NPR)</label>
              <input
                type="number"
                value={formData.maintenanceFees}
                onChange={(e) => handleInputChange('maintenanceFees', e.target.value)}
                placeholder="Water, electricity, internet, etc."
              />
            </div>

            {/* Rental Specific Fields */}
            {formData.listingType === 'For Rent' && (
              <>
                <hr className="section-divider" />
                <h3>Rental Information</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label>Monthly Rent (NPR) <span className="required">*</span></label>
                    <input
                      type="number"
                      value={formData.monthlyRent}
                      onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                      placeholder="e.g., 25000"
                      required={formData.listingType === 'For Rent'}
                    />
                  </div>

                  <div className="form-group">
                    <label>Security Deposit (NPR)</label>
                    <input
                      type="number"
                      value={formData.securityDeposit}
                      onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
                      placeholder="e.g., 50000"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Minimum Lease Period</label>
                    <select
                      value={formData.leaseTerms}
                      onChange={(e) => handleInputChange('leaseTerms', e.target.value)}
                    >
                      <option value="1 Month">1 Month</option>
                      <option value="3 Months">3 Months</option>
                      <option value="6 Months">6 Months</option>
                      <option value="11 Months">11 Months</option>
                      <option value="1 Year">1 Year</option>
                      <option value="2 Years">2 Years</option>
                      <option value="3 Years">3 Years</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Furnishing Status</label>
                    <select
                      value={formData.furnished}
                      onChange={(e) => handleInputChange('furnished', e.target.value)}
                    >
                      <option value="Unfurnished">Unfurnished</option>
                      <option value="Semi-Furnished">Semi-Furnished</option>
                      <option value="Fully Furnished">Fully Furnished</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Pet Policy</label>
                    <select
                      value={formData.petPolicy}
                      onChange={(e) => handleInputChange('petPolicy', e.target.value)}
                    >
                      <option value="No">No Pets Allowed</option>
                      <option value="Yes">Pets Allowed</option>
                      <option value="Negotiable">Negotiable</option>
                    </select>
                  </div>
                </div>

                {formData.petPolicy !== 'No' && (
                  <div className="form-group">
                    <label>Pet Policy Details</label>
                    <textarea
                      rows="3"
                      value={formData.petDetails}
                      onChange={(e) => handleInputChange('petDetails', e.target.value)}
                      placeholder="e.g., Small pets allowed, additional deposit may apply..."
                    />
                  </div>
                )}
              </>
            )}

            <hr className="section-divider" />
            <h3>Utilities & Energy</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Solar Panels/Solar Water Heater</label>
                <select
                  value={formData.solarPanels}
                  onChange={(e) => handleInputChange('solarPanels', e.target.value)}
                >
                  <option value="No">No</option>
                  <option value="Solar Panels">Solar Panels</option>
                  <option value="Solar Water Heater">Solar Water Heater</option>
                  <option value="Both">Both</option>
                </select>
              </div>

              <div className="form-group">
                <label>Backup Power</label>
                <select
                  value={formData.energyEfficient}
                  onChange={(e) => handleInputChange('energyEfficient', e.target.value)}
                >
                  <option value="No">No</option>
                  <option value="Inverter">Inverter</option>
                  <option value="Generator">Generator</option>
                  <option value="Both">Both</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Water Supply</label>
              <input
                type="text"
                value={formData.greenCertification}
                onChange={(e) => handleInputChange('greenCertification', e.target.value)}
                placeholder="e.g., 24/7 Municipal, Boring, Water Tank"
              />
            </div>
          </div>
        )}

        {/* Step 6: Additional Info & Description */}
        {currentStep === 6 && (
          <div className="form-step">
            <h2>Description & Additional Information</h2>

            <div className="form-group">
              <label>Detailed Description <span className="required">*</span></label>
              <textarea
                rows="8"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Provide a detailed description of your property, highlighting its best features, nearby amenities, neighborhood information, etc."
                required
              />
              <div className="character-count">{formData.description.length} characters</div>
            </div>

            <div className="form-group">
              <label>Keywords / Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
                placeholder="e.g., modern, spacious, pet-friendly, near metro"
              />
            </div>

            <div className="form-group">
              <label>Tax ID / Parcel Number</label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                placeholder="Property tax identification number"
              />
            </div>

            <hr className="section-divider" />
            <h3>Contact Information</h3>

            <div className="form-group">
              <label>Contact Name <span className="required">*</span></label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                placeholder="Your name or agent name"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Contact Email <span className="required">*</span></label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Phone <span className="required">*</span></label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="+977-9801234567"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="form-navigation">
          {currentStep > 1 && (
            <button type="button" className="btn-secondary" onClick={prevStep}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Previous
            </button>
          )}

          {currentStep < totalSteps ? (
            <button type="button" className="btn-primary" onClick={nextStep}>
              Next
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          ) : (
            <button type="submit" className="btn-primary btn-large">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Submit Property
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddPropertyForm;
