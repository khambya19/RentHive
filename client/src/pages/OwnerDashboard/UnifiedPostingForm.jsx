import React, { useState } from 'react';
import PropertyManagement from './PropertyManagement';
import PropertyLocationMap from '../../components/PropertyLocationMap';
// import './UnifiedPostingForm.css'; // Deprecated
import API_BASE_URL from '../../config/api';
import { 
  Home, 
  Bike, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Check, 
  Info, 
  Upload, 
  CheckCircle 
} from 'lucide-react';

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
    monthlyRate: '',
    securityDeposit: '',
    location: '',
    description: '',
    features: [],
    images: [],
    latitude: null,
    longitude: null
  });

  const resetBikeForm = () => {
    setBikeForm({
      name: '',
      brand: '',
      model: '',
      type: 'Scooter',
      year: new Date().getFullYear(),
      color: '',
      registrationNumber: '',
      engineCapacity: '',
      fuelType: 'Petrol',
      dailyRate: '',
      weeklyRate: '',
      monthlyRate: '',
      securityDeposit: '',
      location: '',
      pickupLocation: '',
      licenseRequired: true,
      minimumAge: 18,
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

  const validateBikeForm = () => {
    // Basic validation
    if (!bikeForm.name || !bikeForm.brand || !bikeForm.model || !bikeForm.year || !bikeForm.dailyRate || !bikeForm.securityDeposit || !bikeForm.pickupLocation) {
      showError('Validation Error', 'Please fill in all required fields marked with *');
      return false;
    }

    // Number validation
    if (Number(bikeForm.dailyRate) < 0 || Number(bikeForm.securityDeposit) < 0) {
      showError('Validation Error', 'Price and deposit cannot be negative');
      return false;
    }

    if (bikeForm.year < 1990 || bikeForm.year > new Date().getFullYear() + 1) {
      showError('Validation Error', 'Please enter a valid model year (1990-2025)');
      return false;
    }

    // Image validation
    if (bikeForm.images.length === 0) {
      showError('Validation Error', 'Please upload at least one image of your vehicle');
      return false;
    }

    return true;
  };

  const handleBikeSubmit = async (e) => {
    e.preventDefault();
    if (!validateBikeForm()) return;

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
    <div className="flex justify-between items-center mb-8 px-4 relative">
      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded"></div>
      {[1, 2, 3, 4].map(step => (
        <div key={step} className={`flex flex-col items-center bg-white px-2`}>
          <div 
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2
              ${currentStep === step 
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-110' 
                : currentStep > step 
                  ? 'bg-green-500 text-white border-green-500' 
                  : 'bg-white text-gray-400 border-gray-200'}`}
          >
            {currentStep > step ? <Check size={20} /> : step}
          </div>
          <span className={`text-xs mt-2 font-medium ${currentStep === step ? 'text-blue-600' : 'text-gray-500'}`}>
            {getStepLabel(step)}
          </span>
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
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">What would you like to list?</h2>
          <p className="text-gray-600 text-lg mb-12">Choose the type of rental you want to add</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div 
              className="bg-white rounded-2xl p-10 border-2 border-gray-100 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-green-500 group"
              onClick={() => setListingType('property')}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shadow-lg shadow-green-200 group-hover:scale-110 transition-transform duration-300">
                <Home size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Property</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">List apartments, houses, rooms, or commercial spaces for rent.</p>
              <button className="flex items-center justify-center gap-2 w-full py-4 bg-green-50 text-green-700 rounded-xl font-bold group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                Select Property
                <ChevronRight size={20} />
              </button>
            </div>

            <div 
              className="bg-white rounded-2xl p-6 md:p-10 border-2 border-gray-100 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-blue-500 group"
              onClick={() => setListingType('automobile')}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300">
                <Bike size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Automobile</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">List bikes, scooters, motorcycles, or other vehicles for rent.</p>
              <button className="flex items-center justify-center gap-2 w-full py-4 bg-blue-50 text-blue-700 rounded-xl font-bold group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                Select Automobile
                <ChevronRight size={20} />
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
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100">
          <button 
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            onClick={() => setListingType(null)}
          >
            <ChevronLeft size={20} />
            <span className="font-medium">Back</span>
          </button>
          <h2 className="text-2xl font-bold text-gray-900">List a Property</h2>
        </div>
        <PropertyManagement inlineMode={true} />
      </div>
    );
  }

  // If automobile selected, show automobile form
  if (listingType === 'automobile') {
    const totalSteps = 4;
    
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100">
          <button 
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            onClick={() => setListingType(null)}
          >
            <ChevronLeft size={20} />
            <span className="font-medium">Back</span>
          </button>
          <h2 className="text-2xl font-bold text-gray-900">List an Automobile</h2>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-10">
          {renderStepIndicator()}
          
          <form className="mt-8" onSubmit={handleBikeSubmit}>
            <div className="animate-fade-in space-y-8">
              
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <>
                  <div className="border-b border-gray-100 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                    <p className="text-gray-500">Enter the main details of the vehicle.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block font-semibold text-gray-700">Vehicle Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      value={bikeForm.name}
                      onChange={(e) => setBikeForm({ ...bikeForm, name: e.target.value })}
                      placeholder="e.g., Red Honda Activa 2023"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block font-semibold text-gray-700">Brand <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        value={bikeForm.brand}
                        onChange={(e) => setBikeForm({ ...bikeForm, brand: e.target.value })}
                        placeholder="e.g., Honda, Yamaha, Hero"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block font-semibold text-gray-700">Model <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        value={bikeForm.model}
                        onChange={(e) => setBikeForm({ ...bikeForm, model: e.target.value })}
                        placeholder="e.g., Activa, FZ, Splendor"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block font-semibold text-gray-700">Type <span className="text-red-500">*</span></label>
                      <select
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-white"
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

                    <div className="space-y-2">
                      <label className="block font-semibold text-gray-700">Year <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        value={bikeForm.year}
                        onChange={(e) => setBikeForm({ ...bikeForm, year: parseInt(e.target.value) })}
                        min="1990"
                        max={new Date().getFullYear() + 1}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block font-semibold text-gray-700">Color</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        value={bikeForm.color}
                        onChange={(e) => setBikeForm({ ...bikeForm, color: e.target.value })}
                        placeholder="e.g., Black, Red, Blue"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block font-semibold text-gray-700">Registration Number</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
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
                  <div className="border-b border-gray-100 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Pricing & Location</h2>
                    <p className="text-gray-500">Set your rates and pickup location.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block font-semibold text-gray-700">Daily Rate (NPR) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        value={bikeForm.dailyRate}
                        onChange={(e) => setBikeForm({ ...bikeForm, dailyRate: e.target.value })}
                        placeholder="e.g., 500"
                        min="0"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block font-semibold text-gray-700">Weekly Rate (NPR)</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        value={bikeForm.weeklyRate}
                        onChange={(e) => setBikeForm({ ...bikeForm, weeklyRate: e.target.value })}
                        placeholder="e.g., 3000"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block font-semibold text-gray-700">Monthly Rate (NPR)</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        value={bikeForm.monthlyRate}
                        onChange={(e) => setBikeForm({ ...bikeForm, monthlyRate: e.target.value })}
                        placeholder="e.g., 10000"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block font-semibold text-gray-700">Security Deposit (NPR) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        value={bikeForm.securityDeposit}
                        onChange={(e) => setBikeForm({ ...bikeForm, securityDeposit: e.target.value })}
                        placeholder="e.g., 5000"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Location/City <span className="required">*</span></label>
                      <input
                        type="text"
                        value={bikeForm.location}
                        onChange={(e) => setBikeForm({ ...bikeForm, location: e.target.value })}
                        placeholder="e.g., Pokhara, Kathmandu, Chitwan"
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>Pickup Location</label>
                      <input
                        type="text"
                        value={bikeForm.pickupLocation}
                        onChange={(e) => setBikeForm({ ...bikeForm, pickupLocation: e.target.value })}
                        placeholder="e.g., Lake Side, Thamel"
                      />
                      <small style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                        Specific area or landmark for pickup
                      </small>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-semibold text-gray-700">Pickup Location <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      value={bikeForm.pickupLocation}
                      onChange={(e) => setBikeForm({ ...bikeForm, pickupLocation: e.target.value })}
                      placeholder="e.g., Thamel, Kathmandu (Near Garden of Dreams)"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-semibold text-gray-700">Description</label>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none min-h-[120px]"
                      value={bikeForm.description}
                      onChange={(e) => setBikeForm({ ...bikeForm, description: e.target.value })}
                      placeholder="Describe your vehicle, its condition, and any special notes..."
                      rows="4"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors cursor-pointer" onClick={() => setBikeForm({ ...bikeForm, licenseRequired: !bikeForm.licenseRequired })}>
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                        checked={bikeForm.licenseRequired}
                        onChange={(e) => setBikeForm({ ...bikeForm, licenseRequired: e.target.checked })}
                      />
                      <span className="ml-3 font-medium text-gray-700">License Required</span>
                    </div>

                    <div className="space-y-2">
                      <label className="block font-semibold text-gray-700">Minimum Age</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        value={bikeForm.minimumAge}
                        onChange={(e) => setBikeForm({ ...bikeForm, minimumAge: parseInt(e.target.value) })}
                        min="16"
                        max="100"
                      />
                    </div>
                  </div>

                  {/* Map Location Picker */}
                  <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                      <h3 className="flex items-center gap-2 font-bold text-lg text-gray-800">
                        <MapPin size={20} className="text-blue-600" />
                        Pin Vehicle Location on Map
                      </h3>
                      <button
                        type="button"
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                          showLocationPicker 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                        }`}
                        onClick={() => setShowLocationPicker(!showLocationPicker)}
                      >
                        {showLocationPicker ? 'Hide Map' : 'Show Map'}
                      </button>
                    </div>

                    {selectedLocation ? (
                      <div className="flex flex-wrap items-center gap-3 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 mb-4">
                        <CheckCircle size={20} className="flex-shrink-0" />
                        <span className="font-medium">Location selected ({selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)})</span>
                        <button type="button" onClick={clearLocation} className="ml-auto text-sm underline hover:text-green-800 font-bold">Clear</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 mb-4">
                        <Info size={20} className="flex-shrink-0" />
                        <span className="font-medium text-sm">Click "Show Map" and pin the exact location to help renters find you.</span>
                      </div>
                    )}

                    {showLocationPicker && (
                      <div className="rounded-xl overflow-hidden shadow-md border border-gray-200">
                        <PropertyLocationMap
                          selectedLocation={selectedLocation}
                          onLocationSelect={handleLocationSelect}
                          showLocationPicker={true}
                          searchQuery={locationSearchQuery}
                          onSearchLocationChange={setLocationSearchQuery}
                          height="400px"
                          properties={[]}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Step 3: Features */}
              {currentStep === 3 && (
                <>
                  <div className="border-b border-gray-100 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Features & Amenities</h2>
                    <p className="text-gray-500">What's included with your vehicle?</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {['Helmet Included', 'Full Tank', 'Insurance Included', 'Free Delivery', 'GPS Tracker', 'Spare Key'].map(feature => (
                      <label 
                        key={feature} 
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200
                          ${bikeForm.features.includes(feature) 
                            ? 'bg-blue-50 border-blue-500 shadow-sm' 
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                      >
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                          checked={bikeForm.features.includes(feature)}
                          onChange={() => toggleBikeFeature(feature)}
                        />
                        <span className={`font-medium ${bikeForm.features.includes(feature) ? 'text-blue-700' : 'text-gray-700'}`}>{feature}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {/* Step 4: Media */}
              {currentStep === 4 && (
                <>
                  <div className="border-b border-gray-100 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Images</h2>
                    <p className="text-gray-500">Upload high-quality photos potential renters will love.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block font-semibold text-gray-700">Upload Images (Max 5) <span className="text-red-500">*</span></label>
                    
                    <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:bg-gray-50 hover:border-blue-400 transition-all text-center group cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleBikeImageChange}
                        max="5"
                      />
                      <div className="flex flex-col items-center justify-center pointer-events-none">
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 group-hover:scale-110 transition-all">
                          <Upload size={32} />
                        </div>
                        <h4 className="text-lg font-bold text-gray-800 mb-1">Click to upload or drag & drop</h4>
                        <p className="text-gray-500 text-sm">SVG, PNG, JPG or GIF (max. 5MB)</p>
                      </div>
                    </div>

                    {bikeForm.images.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full text-green-600">
                          <Check size={16} />
                        </div>
                        <p className="text-green-700 font-medium">
                          {bikeForm.images.length} file(s) selected
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-between items-center pt-8 border-t border-gray-100 mt-8">
                {currentStep > 1 ? (
                  <button 
                    type="button" 
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all" 
                    onClick={prevStep}
                  >
                    <ChevronLeft size={20} />
                    Previous
                  </button>
                ) : (
                  <div></div>
                )}
                
                {currentStep < totalSteps ? (
                  <button 
                    type="button" 
                    className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:translate-x-1 transition-all" 
                    onClick={nextStep}
                  >
                    Next
                    <ChevronRight size={20} />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-green-600 text-white shadow-lg shadow-green-200 hover:bg-green-700 hover:-translate-y-1 transition-all"
                  >
                    List Automobile
                    <Check size={20} />
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
