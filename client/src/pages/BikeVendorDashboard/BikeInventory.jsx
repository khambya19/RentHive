import React, { useState, useEffect } from 'react';

const BikeInventory = ({ bikes, setBikes, fetchData, showSuccess, showError }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showBikeModal, setShowBikeModal] = useState(false);
  const [editingBike, setEditingBike] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const [bikeForm, setBikeForm] = useState({
    name: '',
    brand: '',
    model: '',
    type: 'Motorcycle',
    year: new Date().getFullYear(),
    engineCapacity: '',
    fuelType: 'Petrol',
    dailyRate: '',
    weeklyRate: '',
    monthlyRate: '',
    securityDeposit: '',
    location: '',
    pickupLocation: '',
    licenseRequired: true,
    minimumAge: '18',
    description: '',
    features: [],
    status: 'Available'
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState({ show: false, bike: null });

  const bikeCategories = {
    'Motorcycles': ['Sport', 'Cruiser', 'Touring', 'Adventure', 'Naked', 'Cafe Racer', 'Dirt Bike'],
    'Scooters': ['Automatic Scooter', 'Manual Scooter', 'Electric Scooter'],
    'Bicycles': ['Mountain Bike', 'Road Bike', 'Hybrid Bike', 'Electric Bike', 'BMX', 'City Bike'],
    'Electric Vehicles': ['Electric Motorcycle', 'Electric Scooter', 'E-Bike']
  };

  const getAvailableFeatures = (bikeType) => {
    const baseFeatures = ['Helmet Included', 'Lock Included', 'Insurance Coverage'];
    
    if (bikeType.includes('Electric') || bikeType === 'Electric Scooter' || bikeType === 'E-Bike') {
      return [...baseFeatures, 'Fast Charging', 'Battery Indicator', 'USB Charging Port', 'Anti-theft Alarm'];
    }
    
    if (bikeType.includes('Motorcycle') || bikeType === 'Sport' || bikeType === 'Cruiser') {
      return [...baseFeatures, 'ABS Braking', 'GPS Tracking', 'Bluetooth Connectivity', 'LED Headlights', 'Disc Brakes'];
    }
    
    if (bikeType.includes('Bike') || bikeType === 'Mountain Bike' || bikeType === 'Road Bike') {
      return [...baseFeatures, 'Gear System', 'Suspension', 'Water Bottle Holder', 'Basket', 'Child Seat'];
    }
    
    return [...baseFeatures, 'Storage Box', 'Phone Holder', 'Rain Cover'];
  };

  useEffect(() => {
    if (bikeForm.dailyRate && !isNaN(bikeForm.dailyRate)) {
      const daily = parseFloat(bikeForm.dailyRate);
      setBikeForm(prev => ({
        ...prev,
        weeklyRate: prev.weeklyRate || Math.round(daily * 6.5),
        monthlyRate: prev.monthlyRate || Math.round(daily * 25),
        securityDeposit: prev.securityDeposit || Math.round(daily * 3)
      }));
    }
  }, [bikeForm.dailyRate]);

  useEffect(() => {
    if (bikeForm.brand && bikeForm.model && !bikeForm.name) {
      setBikeForm(prev => ({
        ...prev,
        name: `${bikeForm.brand} ${bikeForm.model} ${bikeForm.year}`
      }));
    }
  }, [bikeForm.brand, bikeForm.model, bikeForm.year]);

  const validateStep = (step) => {
    const errors = {};
    
    if (step === 1) {
      if (!bikeForm.brand.trim()) errors.brand = 'Brand is required';
      if (!bikeForm.model.trim()) errors.model = 'Model is required';
      if (!bikeForm.type) errors.type = 'Type is required';
      if (!bikeForm.year || bikeForm.year < 1990 || bikeForm.year > new Date().getFullYear() + 1) {
        errors.year = 'Please enter a valid year';
      }
    }
    
    if (step === 2) {
      if (!bikeForm.dailyRate || bikeForm.dailyRate < 100) {
        errors.dailyRate = 'Daily rate must be at least NPR 100';
      }
      if (!bikeForm.location.trim()) errors.location = 'Location is required';
      if (bikeForm.minimumAge < 16 || bikeForm.minimumAge > 80) {
        errors.minimumAge = 'Age must be between 16 and 80';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 5) {
      showError('Maximum 5 images allowed', 'Please select fewer images');
      return;
    }
    
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        showError('Invalid file type', `${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        showError('File too large', `${file.name} must be less than 5MB`);
        return false;
      }
      return true;
    });

    setSelectedImages([...selectedImages, ...validFiles]);
    const previews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreview([...imagePreview, ...previews]);
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreview(newPreviews);
  };

  const handleAddBike = async (e) => {
    e.preventDefault();
    if (!validateStep(2)) return;
    
    try {
      setIsUploading(true);
      const token = localStorage.getItem('token');
      
      let uploadedImages = [];
      if (selectedImages.length > 0) {
        const formData = new FormData();
        selectedImages.forEach(image => {
          formData.append('images', image);
        });

        setUploadProgress(25);
        const uploadResponse = await fetch('http://localhost:3001/api/bikes/upload-images', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          uploadedImages = uploadData.images || [];
          setUploadProgress(50);
        }
      }

      setUploadProgress(75);
      const bikeData = {
        ...bikeForm,
        images: uploadedImages
      };

      const response = await fetch('http://localhost:3001/api/bikes/vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bikeData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add bike');
      }

      setUploadProgress(100);
      const newBike = await response.json();
      setBikes([...bikes, newBike]);
      setShowBikeModal(false);
      resetForm();
      fetchData();
      
      showSuccess(
        'Bike Added Successfully! 🎉',
        `${bikeForm.name} is now available for rent and visible to customers.`
      );
    } catch (error) {
      console.error('Error adding bike:', error);
      showError(
        'Failed to Add Bike',
        error.message || 'An unexpected error occurred while adding the bike.'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEditBike = (bike) => {
    setEditingBike(bike);
    setBikeForm({
      name: bike.name,
      brand: bike.brand,
      model: bike.model,
      type: bike.type,
      year: bike.year,
      engineCapacity: bike.engineCapacity || '',
      fuelType: bike.fuelType,
      dailyRate: bike.dailyRate,
      weeklyRate: bike.weeklyRate,
      monthlyRate: bike.monthlyRate,
      securityDeposit: bike.securityDeposit,
      location: bike.location,
      pickupLocation: bike.pickupLocation || '',
      licenseRequired: bike.licenseRequired,
      minimumAge: bike.minimumAge,
      description: bike.description || '',
      features: bike.features || [],
      status: bike.status
    });
    setShowBikeModal(true);
  };

  const handleDeleteBike = async (bikeId, bikeName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/bikes/${bikeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setBikes(bikes.filter(bike => bike.id !== bikeId));
        showSuccess(
          'Bike Deleted Successfully! ✅',
          `${bikeName} has been removed from your inventory.`
        );
      } else {
        const error = await response.json();
        showError('Delete Failed', error.error || 'Failed to delete the bike');
      }
    } catch (error) {
      console.error('Error deleting bike:', error);
      showError('Delete Failed', 'An error occurred while deleting the bike');
    }
  };

  const handleUpdateBike = async (e) => {
    e.preventDefault();
    if (!validateStep(2)) return;
    
    try {
      setIsUploading(true);
      const token = localStorage.getItem('token');
      
      let uploadedImages = editingBike.images || [];
      
      // Upload new images if any
      if (selectedImages.length > 0) {
        const formData = new FormData();
        selectedImages.forEach(image => {
          formData.append('images', image);
        });

        setUploadProgress(25);
        const uploadResponse = await fetch('http://localhost:3001/api/bikes/upload-images', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          uploadedImages = [...uploadedImages, ...(uploadData.images || [])];
          setUploadProgress(50);
        }
      }

      setUploadProgress(75);
      const bikeData = {
        ...bikeForm,
        images: uploadedImages
      };

      const response = await fetch(`http://localhost:3001/api/bikes/${editingBike.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bikeData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update bike');
      }

      setUploadProgress(100);
      const updatedBike = await response.json();
      setBikes(bikes.map(bike => bike.id === editingBike.id ? updatedBike : bike));
      setShowBikeModal(false);
      setEditingBike(null);
      resetForm();
      fetchData();
      
      showSuccess(
        'Bike Updated Successfully! 🎉',
        `${bikeForm.name} has been updated.`
      );
    } catch (error) {
      console.error('Error updating bike:', error);
      showError(
        'Failed to Update Bike',
        error.message || 'An unexpected error occurred while updating the bike.'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setBikeForm({
      name: '',
      brand: '',
      model: '',
      type: 'Motorcycle',
      year: new Date().getFullYear(),
      engineCapacity: '',
      fuelType: 'Petrol',
      dailyRate: '',
      weeklyRate: '',
      monthlyRate: '',
      securityDeposit: '',
      location: '',
      pickupLocation: '',
      licenseRequired: true,
      minimumAge: '18',
      description: '',
      features: [],
      status: 'Available'
    });
    setSelectedImages([]);
    setImagePreview([]);
    setFormErrors({});
  };

  const toggleFeature = (feature) => {
    setBikeForm(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className="steps">
        <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-number">
            {currentStep > 1 ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : '1'}
          </div>
          <span className="step-label">Basic Info</span>
        </div>
        <div className={`step-line ${currentStep > 1 ? 'completed' : ''}`}></div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-number">
            {currentStep > 2 ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : '2'}
          </div>
          <span className="step-label">Pricing & Details</span>
        </div>
        <div className={`step-line ${currentStep > 2 ? 'completed' : ''}`}></div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <span className="step-label">Photos & Features</span>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="form-step">
      <div className="step-header">
        <h3>🏍️ Basic Bike Information</h3>
        <p>Let's start with the essential details about your bike</p>
      </div>
      
      <div className="form-grid">
        <div className="form-group">
          <label>Brand *</label>
          <input
            type="text"
            value={bikeForm.brand}
            onChange={(e) => setBikeForm({...bikeForm, brand: e.target.value})}
            placeholder="e.g., Honda, Yamaha, KTM"
            className={formErrors.brand ? 'error' : ''}
          />
          {formErrors.brand && <span className="error-text">{formErrors.brand}</span>}
        </div>

        <div className="form-group">
          <label>Model *</label>
          <input
            type="text"
            value={bikeForm.model}
            onChange={(e) => setBikeForm({...bikeForm, model: e.target.value})}
            placeholder="e.g., CB350, R15, Duke"
            className={formErrors.model ? 'error' : ''}
          />
          {formErrors.model && <span className="error-text">{formErrors.model}</span>}
        </div>

        <div className="form-group">
          <label>Year *</label>
          <input
            type="number"
            value={bikeForm.year}
            onChange={(e) => setBikeForm({...bikeForm, year: parseInt(e.target.value)})}
            min="1990"
            max={new Date().getFullYear() + 1}
            className={formErrors.year ? 'error' : ''}
          />
          {formErrors.year && <span className="error-text">{formErrors.year}</span>}
        </div>

        <div className="form-group full-width">
          <label>Bike Type *</label>
          <div className="bike-type-selector">
            {Object.entries(bikeCategories).map(([category, types]) => (
              <div key={category} className="type-category">
                <h4>{category}</h4>
                <div className="type-options">
                  {types.map(type => (
                    <label key={type} className={`type-option ${bikeForm.type === type ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="bikeType"
                        value={type}
                        checked={bikeForm.type === type}
                        onChange={(e) => setBikeForm({...bikeForm, type: e.target.value})}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {(bikeForm.type.includes('Motorcycle') || bikeForm.type.includes('Scooter')) && (
          <div className="form-group">
            <label>Engine Capacity (cc)</label>
            <input
              type="number"
              value={bikeForm.engineCapacity}
              onChange={(e) => setBikeForm({...bikeForm, engineCapacity: e.target.value})}
              placeholder="e.g., 150, 350"
            />
          </div>
        )}

        <div className="form-group">
          <label>Fuel Type</label>
          <select
            value={bikeForm.fuelType}
            onChange={(e) => setBikeForm({...bikeForm, fuelType: e.target.value})}
          >
            <option value="Petrol">Petrol</option>
            <option value="Electric">Electric</option>
            <option value="Diesel">Diesel</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        <div className="form-group full-width">
          <label>Auto-Generated Name</label>
          <div className="auto-generated-name">
            <input
              type="text"
              value={bikeForm.name || `${bikeForm.brand} ${bikeForm.model} ${bikeForm.year}`.trim()}
              onChange={(e) => setBikeForm({...bikeForm, name: e.target.value})}
              placeholder="This will be auto-generated or you can customize it"
            />
            <span className="name-preview">
              Preview: {bikeForm.brand && bikeForm.model ? 
                `${bikeForm.brand} ${bikeForm.model} ${bikeForm.year}` : 
                'Brand Model Year'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="form-step">
      <div className="step-header">
        <h3>💰 Pricing & Rental Details</h3>
        <p>Set your pricing and rental requirements</p>
      </div>
      
      <div className="pricing-section">
        <div className="pricing-grid">
          <div className="form-group primary-rate">
            <label>Daily Rate (NPR) *</label>
            <div className="price-input">
              <span className="currency">NPR</span>
              <input
                type="number"
                value={bikeForm.dailyRate}
                onChange={(e) => setBikeForm({...bikeForm, dailyRate: e.target.value})}
                placeholder="1500"
                min="100"
                className={formErrors.dailyRate ? 'error' : ''}
              />
            </div>
            {formErrors.dailyRate && <span className="error-text">{formErrors.dailyRate}</span>}
          </div>

          <div className="form-group auto-calculated">
            <label>Weekly Rate (NPR)</label>
            <div className="price-input">
              <span className="currency">NPR</span>
              <input
                type="number"
                value={bikeForm.weeklyRate}
                onChange={(e) => setBikeForm({...bikeForm, weeklyRate: e.target.value})}
                placeholder="Auto-calculated"
              />
            </div>
            <span className="auto-hint">💡 Auto-calculated (10% discount)</span>
          </div>

          <div className="form-group auto-calculated">
            <label>Monthly Rate (NPR)</label>
            <div className="price-input">
              <span className="currency">NPR</span>
              <input
                type="number"
                value={bikeForm.monthlyRate}
                onChange={(e) => setBikeForm({...bikeForm, monthlyRate: e.target.value})}
                placeholder="Auto-calculated"
              />
            </div>
            <span className="auto-hint">💡 Auto-calculated (20% discount)</span>
          </div>

          <div className="form-group auto-calculated">
            <label>Security Deposit (NPR)</label>
            <div className="price-input">
              <span className="currency">NPR</span>
              <input
                type="number"
                value={bikeForm.securityDeposit}
                onChange={(e) => setBikeForm({...bikeForm, securityDeposit: e.target.value})}
                placeholder="Auto-calculated"
              />
            </div>
            <span className="auto-hint">💡 Auto-calculated (3 days equivalent)</span>
          </div>
        </div>

        {bikeForm.dailyRate && (
          <div className="pricing-preview">
            <h4>Pricing Preview</h4>
            <div className="preview-grid">
              <div className="preview-item">
                <span>1 Day</span>
                <strong>NPR {parseInt(bikeForm.dailyRate || 0).toLocaleString()}</strong>
              </div>
              <div className="preview-item">
                <span>1 Week</span>
                <strong>NPR {parseInt(bikeForm.weeklyRate || 0).toLocaleString()}</strong>
              </div>
              <div className="preview-item">
                <span>1 Month</span>
                <strong>NPR {parseInt(bikeForm.monthlyRate || 0).toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="location-section">
        <div className="form-grid">
          <div className="form-group">
            <label>Location *</label>
            <input
              type="text"
              value={bikeForm.location}
              onChange={(e) => setBikeForm({...bikeForm, location: e.target.value})}
              placeholder="e.g., Kathmandu, Pokhara"
              className={formErrors.location ? 'error' : ''}
            />
            {formErrors.location && <span className="error-text">{formErrors.location}</span>}
          </div>

          <div className="form-group">
            <label>Pickup Address</label>
            <input
              type="text"
              value={bikeForm.pickupLocation}
              onChange={(e) => setBikeForm({...bikeForm, pickupLocation: e.target.value})}
              placeholder="Specific pickup address"
            />
          </div>
        </div>
      </div>

      <div className="requirements-section">
        <h4>Rental Requirements</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>Minimum Age *</label>
            <select
              value={bikeForm.minimumAge}
              onChange={(e) => setBikeForm({...bikeForm, minimumAge: e.target.value})}
            >
              <option value="16">16+ years</option>
              <option value="18">18+ years</option>
              <option value="21">21+ years</option>
              <option value="25">25+ years</option>
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={bikeForm.licenseRequired}
                onChange={(e) => setBikeForm({...bikeForm, licenseRequired: e.target.checked})}
              />
              <span className="checkmark"></span>
              Valid driving license required
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="form-step">
      <div className="step-header">
        <h3>📸 Photos & Features</h3>
        <p>Add photos and select features to make your listing attractive</p>
      </div>

      <div className="photos-section">
        <div className="form-group">
          <label>Bike Photos (Up to 5 images)</label>
          <div className="image-upload-area">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="file-input"
              id="bike-images"
            />
            <label htmlFor="bike-images" className="upload-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>Click to upload or drag and drop</span>
              <small>PNG, JPG up to 5MB each</small>
            </label>
          </div>

          {imagePreview.length > 0 && (
            <div className="image-preview-grid">
              {imagePreview.map((preview, index) => (
                <div key={index} className="image-preview-item">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  {index === 0 && <span className="primary-badge">Primary</span>}
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => removeImage(index)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="features-section">
        <div className="form-group">
          <label>Features & Amenities</label>
          <div className="features-grid">
            {getAvailableFeatures(bikeForm.type).map(feature => (
              <label key={feature} className="feature-checkbox">
                <input
                  type="checkbox"
                  checked={bikeForm.features.includes(feature)}
                  onChange={() => toggleFeature(feature)}
                />
                <span className="checkmark"></span>
                <span className="feature-text">{feature}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="description-section">
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={bikeForm.description}
            onChange={(e) => setBikeForm({...bikeForm, description: e.target.value})}
            placeholder="Describe your bike's condition, special features, or any important details for renters..."
            rows="4"
          />
          <span className="char-count">{bikeForm.description.length}/500</span>
        </div>
      </div>

      <div className="status-section">
        <div className="form-group">
          <label>Availability Status</label>
          <div className="status-options">
            <label className={`status-option ${bikeForm.status === 'Available' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="status"
                value="Available"
                checked={bikeForm.status === 'Available'}
                onChange={(e) => setBikeForm({...bikeForm, status: e.target.value})}
              />
              <div className="status-indicator available"></div>
              <div>
                <strong>Available</strong>
                <small>Ready for immediate rental</small>
              </div>
            </label>
            <label className={`status-option ${bikeForm.status === 'Maintenance' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="status"
                value="Maintenance"
                checked={bikeForm.status === 'Maintenance'}
                onChange={(e) => setBikeForm({...bikeForm, status: e.target.value})}
              />
              <div className="status-indicator maintenance"></div>
              <div>
                <strong>Maintenance</strong>
                <small>Currently under maintenance</small>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bike-inventory">
      <div className="section-header">
        <div>
          <h2>My Bikes</h2>
          <p>Manage your bike rental inventory</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => { setEditingBike(null); resetForm(); setShowBikeModal(true); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Bike
        </button>
      </div>

      <div className="bikes-grid">
        {bikes.length > 0 ? (
          bikes.map(bike => {
            const imageUrl = bike.images && bike.images.length > 0 
              ? `http://localhost:3001/uploads/bikes/${bike.images[0]}` 
              : 'https://via.placeholder.com/300x200?text=No+Image';
            
            return (
              <div key={bike.id} className="bike-card">
                <div className="bike-image-wrapper">
                  <img 
                    src={imageUrl}
                    alt={bike.name}
                    className="bike-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                    }}
                  />
                  <div className="bike-overlay">
                    <span className={`bike-status-badge status-${bike.status?.toLowerCase().replace(' ', '-')}`}>
                      {bike.status}
                    </span>
                    {bike.images && bike.images.length > 1 && (
                      <span className="image-count-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        {bike.images.length}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="bike-card-content">
                  <div className="bike-header">
                    <h3 className="bike-name">{bike.name}</h3>
                    <div className="bike-type-badge">{bike.type}</div>
                  </div>
                  
                  <p className="bike-brand-model">
                    <span className="brand">{bike.brand}</span>
                    <span className="model">{bike.model}</span>
                  </p>
                  
                  <div className="bike-specs">
                    <div className="spec-item">
                      <span className="spec-label">Year:</span>
                      <span>{bike.year}</span>
                    </div>
                    {bike.engineCapacity && (
                      <div className="spec-item">
                        <span className="spec-label">Engine:</span>
                        <span>{bike.engineCapacity}cc</span>
                      </div>
                    )}
                    <div className="spec-item">
                      <span className="spec-label">Fuel:</span>
                      <span>{bike.fuelType}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Location:</span>
                      <span>{bike.location}</span>
                    </div>
                  </div>

                  <div className="bike-pricing">
                    <div className="price-item">
                      <span className="price-label">Daily Rate</span>
                      <span className="price-value">NPR {parseInt(bike.dailyRate).toLocaleString()}</span>
                    </div>
                    <div className="price-item">
                      <span className="price-label">Weekly Rate</span>
                      <span className="price-value">NPR {parseInt(bike.weeklyRate).toLocaleString()}</span>
                    </div>
                    {bike.monthlyRate && (
                      <div className="price-item">
                        <span className="price-label">Monthly Rate</span>
                        <span className="price-value">NPR {parseInt(bike.monthlyRate).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="bike-features">
                    {bike.features && bike.features.slice(0, 3).map((feature, index) => (
                      <span key={index} className="feature-tag">{feature}</span>
                    ))}
                    {(!bike.features || bike.features.length === 0) && (
                      <span className="feature-tag">Standard Features</span>
                    )}
                    {bike.features && bike.features.length > 3 && (
                      <span className="feature-more">+{bike.features.length - 3} more</span>
                    )}
                  </div>

                  <div className="bike-requirements">
                    {bike.licenseRequired && (
                      <div className="requirement-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                          <line x1="8" y1="21" x2="16" y2="21"/>
                          <line x1="12" y1="17" x2="12" y2="21"/>
                        </svg>
                        License Required
                      </div>
                    )}
                    <div className="requirement-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      Min Age: {bike.minimumAge}
                    </div>
                  </div>

                  <div className="bike-actions">
                    <button className="btn-edit" onClick={() => handleEditBike(bike)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </button>
                    <button className="btn-delete" onClick={() => setShowDeleteModal({ show: true, bike })}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12V7a1 1 0 0 1 1-1h4l2-3h4a1 1 0 0 1 1 1v7.5"/>
              <circle cx="8" cy="16" r="3"/>
              <circle cx="16" cy="16" r="3"/>
            </svg>
            <h3>No bikes yet</h3>
            <p>Start by adding your first bike to your rental inventory</p>
            <button 
              className="btn-primary"
              onClick={() => { setEditingBike(null); resetForm(); setShowBikeModal(true); }}
            >
              Add Your First Bike
            </button>
          </div>
        )}
      </div>

      {/* Bike Modal - Property Form Style */}
      {showBikeModal && (
        <div className="modal-backdrop" onClick={() => setShowBikeModal(false)}>
          <div className="modal-dialog large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBike ? 'Edit Bike' : 'Add New Bike'}</h2>
              <button className="modal-close" onClick={() => setShowBikeModal(false)}>×</button>
            </div>
            
            <form onSubmit={editingBike ? handleUpdateBike : handleAddBike} className="modal-body">
              {/* Basic Information */}
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-row">
                  <div className="form-field">
                    <label>Bike Name *</label>
                    <input
                      type="text"
                      value={bikeForm.name}
                      onChange={(e) => setBikeForm({ ...bikeForm, name: e.target.value })}
                      placeholder="e.g., Honda CB350 Adventure Bike"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Brand *</label>
                    <select
                      value={bikeForm.brand}
                      onChange={(e) => setBikeForm({ ...bikeForm, brand: e.target.value })}
                      required
                    >
                      <option value="">Select Brand</option>
                      <option value="Honda">Honda</option>
                      <option value="Yamaha">Yamaha</option>
                      <option value="KTM">KTM</option>
                      <option value="Bajaj">Bajaj</option>
                      <option value="TVS">TVS</option>
                      <option value="Hero">Hero</option>
                      <option value="Royal Enfield">Royal Enfield</option>
                      <option value="Suzuki">Suzuki</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Model *</label>
                    <input
                      type="text"
                      value={bikeForm.model}
                      onChange={(e) => setBikeForm({ ...bikeForm, model: e.target.value })}
                      placeholder="e.g., CB350, R15, Duke"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Type *</label>
                    <select
                      value={bikeForm.type}
                      onChange={(e) => setBikeForm({ ...bikeForm, type: e.target.value })}
                      required
                    >
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Scooter">Scooter</option>
                      <option value="Electric Bike">Electric Bike</option>
                      <option value="Bicycle">Bicycle</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Year *</label>
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
                    <label>Engine Capacity (cc)</label>
                    <input
                      type="number"
                      value={bikeForm.engineCapacity}
                      onChange={(e) => setBikeForm({ ...bikeForm, engineCapacity: e.target.value })}
                      placeholder="e.g., 150, 350"
                    />
                  </div>
                  <div className="form-field">
                    <label>Fuel Type</label>
                    <select
                      value={bikeForm.fuelType}
                      onChange={(e) => setBikeForm({ ...bikeForm, fuelType: e.target.value })}
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="None">None (Bicycle)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="form-section">
                <div className="location-section-header">
                  <h3>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Bike Location
                  </h3>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>City/Location *</label>
                    <input
                      type="text"
                      value={bikeForm.location}
                      onChange={(e) => setBikeForm({ ...bikeForm, location: e.target.value })}
                      placeholder="e.g., Kathmandu, Pokhara"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Pickup Address</label>
                    <input
                      type="text"
                      value={bikeForm.pickupLocation}
                      onChange={(e) => setBikeForm({ ...bikeForm, pickupLocation: e.target.value })}
                      placeholder="Specific pickup address"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Details */}
              <div className="form-section">
                <h3>Pricing & Details</h3>
                <div className="form-row">
                  <div className="form-field">
                    <label>Daily Rate (NPR) *</label>
                    <input
                      type="number"
                      value={bikeForm.dailyRate}
                      onChange={(e) => setBikeForm({ ...bikeForm, dailyRate: e.target.value })}
                      placeholder="e.g., 1500"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Weekly Rate (NPR)</label>
                    <input
                      type="number"
                      value={bikeForm.weeklyRate}
                      onChange={(e) => setBikeForm({ ...bikeForm, weeklyRate: e.target.value })}
                      placeholder="e.g., 9000"
                    />
                  </div>
                  <div className="form-field">
                    <label>Monthly Rate (NPR)</label>
                    <input
                      type="number"
                      value={bikeForm.monthlyRate}
                      onChange={(e) => setBikeForm({ ...bikeForm, monthlyRate: e.target.value })}
                      placeholder="e.g., 30000"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Security Deposit (NPR) *</label>
                    <input
                      type="number"
                      value={bikeForm.securityDeposit}
                      onChange={(e) => setBikeForm({ ...bikeForm, securityDeposit: e.target.value })}
                      placeholder="e.g., 5000"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Minimum Age</label>
                    <select
                      value={bikeForm.minimumAge}
                      onChange={(e) => setBikeForm({ ...bikeForm, minimumAge: e.target.value })}
                    >
                      <option value="16">16+ years</option>
                      <option value="18">18+ years</option>
                      <option value="21">21+ years</option>
                      <option value="25">25+ years</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field full-width">
                    <label>Description</label>
                    <textarea
                      rows="4"
                      value={bikeForm.description}
                      onChange={(e) => setBikeForm({ ...bikeForm, description: e.target.value })}
                      placeholder="Describe your bike's condition, features, and any important details..."
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={bikeForm.licenseRequired}
                        onChange={(e) => setBikeForm({ ...bikeForm, licenseRequired: e.target.checked })}
                      />
                      <span className="checkmark"></span>
                      Valid driving license required
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowBikeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <div className="spinner"></div>
                      {uploadProgress > 0 && `${uploadProgress}%`}
                    </>
                  ) : (
                    <>
                      {editingBike ? 'Update Bike' : 'Add Bike'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal.show && showDeleteModal.bike && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal({ show: false, bike: null })}>
          <div className="modal-dialog delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="delete-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h2>Delete Bike</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal({ show: false, bike: null })}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-confirmation">
                <div className="bike-to-delete">
                  <img 
                    src={showDeleteModal.bike.images && showDeleteModal.bike.images.length > 0 
                      ? `http://localhost:3001/uploads/bikes/${showDeleteModal.bike.images[0]}` 
                      : 'https://via.placeholder.com/80x60?text=No+Image'}
                    alt={showDeleteModal.bike.name}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80x60?text=No+Image';
                    }}
                  />
                  <div className="bike-info">
                    <h3>{showDeleteModal.bike.name}</h3>
                    <p>{showDeleteModal.bike.brand} {showDeleteModal.bike.model}</p>
                    <span className="bike-type">{showDeleteModal.bike.type}</span>
                  </div>
                </div>
                
                <div className="warning-text">
                  <p><strong>Are you sure you want to delete this bike?</strong></p>
                  <p>This action cannot be undone. The bike will be permanently removed from your inventory and will no longer be available for rent.</p>
                  
                  <div className="warning-points">
                    <div className="warning-point">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      <span>Bike will be removed from search results</span>
                    </div>
                    <div className="warning-point">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      <span>All associated data will be deleted</span>
                    </div>
                    <div className="warning-point">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      <span>This action cannot be reversed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => setShowDeleteModal({ show: false, bike: null })}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-confirm-delete" 
                onClick={async () => {
                  await handleDeleteBike(showDeleteModal.bike.id, showDeleteModal.bike.name);
                  setShowDeleteModal({ show: false, bike: null });
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Yes, Delete Bike
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BikeInventory;