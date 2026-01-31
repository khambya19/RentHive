import React, { useState } from 'react';
import PropertyLocationMap from './PropertyLocationMap';
import API_BASE_URL from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Check,
  Info,
  Upload,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  X,
  Home,
  DollarSign
} from 'lucide-react';

const AddPropertyForm = ({ onSubmit, initialData = null, showError, showSuccess }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showLocationPicker, setShowLocationPicker] = useState(initialData?.latitude && initialData?.longitude ? { lat: Number(initialData.latitude), lng: Number(initialData.longitude) } : null);
  const [selectedLocation, setSelectedLocation] = useState(initialData?.latitude && initialData?.longitude ? { lat: Number(initialData.latitude), lng: Number(initialData.longitude) } : null);
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
    price: initialData?.price || initialData?.rentPrice || '',
    area: initialData?.area || '',
    areaUnit: initialData?.areaUnit || 'sq ft',
    // Location
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    country: initialData?.country || 'Nepal',
    latitude: initialData?.latitude || null,
    longitude: initialData?.longitude || null,

    // Property Details
    bedrooms: initialData?.bedrooms || 1,
    bathrooms: initialData?.bathrooms || 1,
    halfBathrooms: initialData?.halfBathrooms || 0,
    yearBuilt: initialData?.yearBuilt || '',
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
    monthlyRent: initialData?.monthlyRent || initialData?.rentPrice || '',
    securityDeposit: initialData?.securityDeposit || '',
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
    zoningType: initialData?.zoningType || '',
    taxId: initialData?.taxId || '',
    // Media
    images: [],
    virtualTourLink: initialData?.virtualTourLink || '',
    additionalDocuments: [],

    // Contact
    contactName: initialData?.contactName || user?.name || '',
    contactEmail: initialData?.contactEmail || user?.email || '',
    contactPhone: initialData?.contactPhone || user?.phone || '',
  });

  const totalSteps = 6;

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
      longitude: location.lng,
      leaseTerms: undefined // Removed leaseTerms as requested
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
    // Validate current step before moving forward
    if (currentStep === 1) {
      // Step 1: Basic Info validation
      // Removed price and area from step 1 validation as they are in later steps
      if (!formData.title || !formData.propertyType || !formData.listingType || !formData.propertyCondition) {
        alert('Please fill in all required fields in Basic Information: Title, Property Type, Listing Type, and Property Condition');
        return;
      }
    }

    if (currentStep === 2) {
      // Step 2: Location validation
      if (!formData.address || !formData.city || !formData.country) {
        alert('Please fill in all required fields in Location: Address, City, and Country');
        return;
      }
    }

    if (currentStep === 3) {
      // Step 3: Property Details validation
      if (!formData.bedrooms || !formData.bathrooms) {
        alert('Please fill in Bedrooms and Bathrooms');
        return;
      }
    }

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

  const validateForm = () => {
    const requiredFieldsMap = {
      title: 'Property Title',
      propertyType: 'Property Type',
      listingType: 'Listing Type',
      propertyCondition: 'Property Condition',
      address: 'Address',
      city: 'City',
      country: 'Country',
      bedrooms: 'Bedrooms',
      bathrooms: 'Bathrooms'
    };

    // Only require price for sale, monthlyRent for rent
    if (formData.listingType === 'For Rent') {
      requiredFieldsMap.monthlyRent = 'Monthly Rent';
    } else {
      requiredFieldsMap.price = 'Price';
    }

    const missingFields = [];
    for (const [field, label] of Object.entries(requiredFieldsMap)) {
      const val = formData[field];
      // Treat empty strings, null or undefined as missing. Do NOT treat numeric 0 as missing (0 can be a valid selection for some fields).
      const isEmptyString = (typeof val === 'string' && val.trim() === '');
      if (val === undefined || val === null || isEmptyString) {
        missingFields.push(label);
      }
    }

    if (missingFields.length > 0) {
      if (showError) showError('Validation Error', `Please fill in all required fields. Missing: ${missingFields.join(', ')}`);
      else console.error(`Missing fields: ${missingFields.join(', ')}`);
      return false;
    }

    const priceToCheck = formData.listingType === 'For Rent' ? formData.monthlyRent : formData.price;
    if (Number(priceToCheck) < 0) {
      if (showError) showError('Validation Error', 'Price cannot be negative');
      return false;
    }
    if (formData.listingType === 'For Rent' && Number(formData.monthlyRent) <= 0) {
      if (showError) showError('Validation Error', 'Please specify a valid monthly rent');
      return false;
    }
    if (formData.listingType !== 'For Rent' && Number(formData.price) < 0) {
      alert('Price cannot be negative');
      return false;
    }

    if (!formData.images || formData.images.length === 0) {
      if (showError) showError('Validation Error', 'Please upload at least one image of the property');
      else alert('Please upload at least one image of the property');
      return false;
    }
    return true;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // First, upload images if any
    let uploadedImageFilenames = [];
    if (formData.images.length > 0) {
      try {
        const imageFormData = new FormData();
        formData.images.forEach(file => {
          imageFormData.append('images', file);
        });

        const token = localStorage.getItem('token');
        const uploadResponse = await fetch(`${API_BASE_URL}/properties/upload-images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: imageFormData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          uploadedImageFilenames = uploadData.images;
        } else {
          console.error('Failed to upload images');
          if (showError) showError('Upload Error', 'Failed to upload images. Please try again.');
          return;
        }
      } catch (error) {
        console.error('Error uploading images:', error);
        if (showError) showError('Error', 'Error uploading images. Please try again.');
        return;
      }
    }

    // Upload floor plan if any
    let floorPlanFilename = null;
    if (formData.floorPlan) {
      try {
        const fpFormData = new FormData();
        fpFormData.append('images', formData.floorPlan); // Reuse existing endpoint

        const token = localStorage.getItem('token');
        const uploadResponse = await fetch(`${API_BASE_URL}/properties/upload-images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ` + token
          },
          body: fpFormData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          if (uploadData.images && uploadData.images.length > 0) {
            floorPlanFilename = uploadData.images[0];
          }
        }
      } catch (error) {
        console.error('Error uploading floor plan:', error);
        // Continue without floor plan if fail, or alert user
      }
    }

    // Prepare data
    const propertyData = {
      title: formData.title,
      propertyType: formData.propertyType,
      listingType: formData.listingType,
      address: formData.address,
      city: formData.city,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      area: formData.area,
      rentPrice: formData.listingType === 'For Rent' ? formData.monthlyRent : formData.price,
      securityDeposit: formData.securityDeposit,
      amenities: formData.combinedFeatures,
      description: formData.description,
      images: uploadedImageFilenames,
      floorPlan: floorPlanFilename,
      virtualTourLink: formData.virtualTourLink,
      latitude: formData.latitude,
      longitude: formData.longitude,
      // Additional Details
      propertyCondition: formData.propertyCondition,
      yearBuilt: formData.yearBuilt,
      lotSize: formData.lotSize,
      lotSizeUnit: formData.lotSizeUnit,
      garageSpaces: formData.garageSpaces,
      // Financials
      hoaFees: formData.hoaFees,
      hoaFeesFrequency: formData.hoaFeesFrequency,
      // Rental Specifics
      furnished: formData.furnished,
      petPolicy: formData.petPolicy,
      petDetails: formData.petDetails,
      leaseTerms: formData.leaseTerms,
      // JSON Fields
      appliancesIncluded: formData.appliancesIncluded,
      heatingSystem: formData.heatingSystem,
      coolingSystem: formData.coolingSystem,
      exteriorMaterial: formData.exteriorMaterial,
      view: formData.view,
      parkingType: formData.parkingType
    };

    onSubmit(propertyData);
  };
  const getStepLabel = (step) => {
    const labels = ['Basic Info', 'Location', 'Details', 'Media', 'Pricing', 'Additional'];
    return labels[step - 1];
  };

  const renderStepIndicator = () => (
    <div className="flex justify-between items-center mb-10 relative px-4">
      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 rounded"></div>
      <div
        className="absolute top-1/2 left-0 h-1 bg-green-500 -z-10 rounded transition-all duration-500"
        style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
      ></div>

      {[1, 2, 3, 4, 5, 6].map(step => (
        <div key={step} className="flex flex-col items-center group relative z-10">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 border-[3px] 
              ${currentStep === step
                ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-110 ring-4 ring-blue-50'
                : currentStep > step
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'bg-white border-gray-200 text-gray-400 group-hover:border-gray-300'}`}
          >
            {currentStep > step ? <Check size={24} strokeWidth={3} /> : step}
          </div>
          <span className={`text-xs mt-3 font-bold uppercase tracking-wider hidden sm:block transition-colors duration-300 ${currentStep === step ? 'text-blue-700' : 'text-gray-500'}`}>
            {getStepLabel(step)}
          </span>
        </div>
      ))}
    </div>
  );

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
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedValues.map(value => (
              <span key={value} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-100 text-blue-700 rounded-full text-sm font-medium shadow-sm">
                {value}
                <button
                  type="button"
                  onClick={() => onRemove(value)}
                  className="hover:bg-blue-50 rounded-full p-0.5 transition-colors"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a feature and press Enter to add..."
              className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
            />
            {searchValue.trim() && (
              <button
                type="button"
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => {
                  if (!selectedValues.includes(searchValue.trim())) {
                    onAdd(searchValue.trim());
                  }
                  onSearchChange('');
                }}
              >
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const inputClass = "w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-medium shadow-sm hover:border-gray-300";
  const selectClass = "w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-medium shadow-sm hover:border-gray-300 appearance-none cursor-pointer";
  const labelClass = "block text-sm font-bold text-gray-700 mb-2 text-left tracking-wide";
  const sectionTitleClass = "text-2xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-100 flex items-center gap-3";

  return (
    <div className="max-w-4xl mx-auto">
      {renderStepIndicator()}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-8">

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h2 className={sectionTitleClass}>
                <Home className="text-blue-600" size={24} />
                Basic Information
              </h2>

              <div className="mb-6">
                <label className={labelClass}>Property Title / Headline <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Spacious 2 BHK Apartment in Prime Location"
                  required
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className={labelClass}>Property Type <span className="text-red-500">*</span></label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => handleInputChange('propertyType', e.target.value)}
                    required
                    className={selectClass}
                  >
                    {['Apartment', 'Room', 'House', 'Villa', 'Studio', 'Townhouse', 'Land', 'Office', 'Warehouse', 'Other'].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Property Condition <span className="text-red-500">*</span></label>
                  <select
                    value={formData.propertyCondition}
                    onChange={(e) => handleInputChange('propertyCondition', e.target.value)}
                    required
                    className={selectClass}
                  >
                    <option value="New Construction">New Construction</option>
                    <option value="Move-in Ready">Move-in Ready</option>
                    <option value="Renovated">Renovated</option>
                    <option value="Fixer-Upper">Fixer-Upper</option>
                  </select>
                </div>
              </div>




              <div className="mb-6">
                {/* Space holder or remove if not needed. Grid above has 2 columns, now filled by Property Type and Condition */}
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="animate-fade-in">
              <h2 className={sectionTitleClass}>
                <MapPin className="text-blue-600" size={24} />
                Location Details
              </h2>

              <div className="mb-6">
                <label className={labelClass}>Street Address <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="e.g., 123 Main Street"
                  required
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className={labelClass}>City <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="e.g., Kathmandu"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>State / Province</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="e.g., Bagmati"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mb-6">
                <div>
                  <label className={labelClass}>Country <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.country}
                    placeholder="e.g., Nepal"
                    required
                    readOnly
                    disabled
                    className={`${inputClass} bg-gray-100 cursor-not-allowed`}
                  />
                </div>
              </div>

              <div className="mb-6">
                {/* Map Location Picker */}
              </div>

              <div className="mb-6">
                <label className={labelClass}>School District</label>
                <input
                  type="text"
                  value={formData.schoolDistrict}
                  onChange={(e) => handleInputChange('schoolDistrict', e.target.value)}
                  placeholder="e.g., District 5"
                  className={inputClass}
                />
              </div>

              {/* Map Location Picker */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900">Pin Property Location on Map</h3>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${showLocationPicker ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                    onClick={() => setShowLocationPicker(!showLocationPicker)}
                  >
                    {showLocationPicker ? 'Hide Map' : 'Show Map'}
                  </button>
                </div>

                {selectedLocation ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 mb-4">
                    <CheckCircle size={20} className="flex-shrink-0" />
                    <span className="font-medium text-sm">Location selected ({Number(selectedLocation.lat).toFixed(6)}, {Number(selectedLocation.lng).toFixed(6)})</span>
                    <button type="button" onClick={clearLocation} className="ml-auto text-sm underline hover:text-green-800">Clear</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 mb-4">
                    <Info size={20} className="flex-shrink-0" />
                    <span className="font-medium text-sm">Click on the map to set the exact property location</span>
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
            <div className="animate-fade-in">
              <h2 className={sectionTitleClass}>
                <FileText className="text-blue-600" size={24} />
                Property Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className={labelClass}>Bedrooms <span className="text-red-500">*</span></label>
                  <select
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value))}
                    required
                    className={selectClass}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Bathrooms <span className="text-red-500">*</span></label>
                  <select
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value))}
                    required
                    className={selectClass}
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Half Bathrooms</label>
                  <select
                    value={formData.halfBathrooms}
                    onChange={(e) => handleInputChange('halfBathrooms', parseInt(e.target.value))}
                    className={selectClass}
                  >
                    {[0, 1, 2, 3].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className={labelClass}>Year Built</label>
                  <input
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
                    placeholder="e.g., 2015"
                    min="1800"
                    max={new Date().getFullYear()}
                    className={inputClass}
                  />
                </div>

                {/* Area input removed per request */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className={labelClass}>Garage Spaces</label>
                  <select
                    value={formData.garageSpaces}
                    onChange={(e) => handleInputChange('garageSpaces', e.target.value)}
                    className={selectClass}
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5+">5+</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Balcony Count</label>
                  <input
                    type="number"
                    value={formData.fireplaceCount}
                    onChange={(e) => handleInputChange('fireplaceCount', parseInt(e.target.value) || 0)}
                    min="0"
                    max="10"
                    className={inputClass}
                  />
                </div>

                {formData.fireplaceCount > 0 && (
                  <div>
                    <label className={labelClass}>Balcony Type</label>
                    <select
                      value={formData.fireplaceType}
                      onChange={(e) => handleInputChange('fireplaceType', e.target.value)}
                      className={selectClass}
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
            <div className="animate-fade-in">
              <h2 className={sectionTitleClass}>
                <Upload className="text-blue-600" size={24} />
                Property Media
              </h2>

              <div className="mb-6">
                <label className={labelClass}>Property Images <span className="text-red-500">*</span> (Add 30-35 photos for best results)</label>
                <div className="mt-2 text-center">
                  <input
                    type="file"
                    id="property-images"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="property-images"
                    className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 cursor-pointer hover:bg-gray-100 hover:border-blue-400 transition-all group"
                  >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                      <Upload size={32} className="text-blue-600" />
                    </div>
                    <span className="text-lg font-semibold text-gray-700">Click to upload or drag and drop images</span>
                    <span className="text-sm text-gray-500 mt-2">PNG, JPG, JPEG up to 10MB each • Upload 30-35 photos</span>
                  </label>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          onClick={() => removeImage(index)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className={labelClass}>Floor Plan (Optional)</label>
                <div className="mt-2">
                  <input
                    type="file"
                    id="floor-plan"
                    accept="image/*,.pdf"
                    onChange={handleFloorPlanUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="floor-plan"
                    className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 hover:border-blue-400 transition-all"
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <FileText size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <span className="block font-semibold text-gray-700">Upload floor plan</span>
                      <span className="text-xs text-gray-500">Image or PDF format</span>
                    </div>
                  </label>
                </div>
                {floorPlanPreview && (
                  <div className="mt-4 p-2 border border-gray-200 rounded-xl bg-white max-w-xs">
                    <img src={floorPlanPreview} alt="Floor plan preview" className="w-full rounded-lg" />
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className={labelClass}>Virtual Tour / Video Link</label>
                <input
                  type="url"
                  value={formData.virtualTourLink}
                  onChange={(e) => handleInputChange('virtualTourLink', e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or virtual tour URL"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Step 5: Pricing & Financial */}
          {
            currentStep === 5 && (
              <div className="animate-fade-in">
                <h2 className={sectionTitleClass}>
                  <DollarSign className="text-blue-600" size={24} />
                  Pricing & Financial Details
                </h2>


                {/* Pricing Information */}
                {formData.listingType !== 'For Rent' && formData.listingType !== 'Lease' && (
                  <div className="mb-6">
                    <label className={labelClass}>Sale Price (NPR) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="e.g., 5000000"
                      required
                      className={inputClass}
                    />
                  </div>
                )}

                {(formData.listingType === 'For Rent' || formData.listingType === 'Lease') && (
                  <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 mb-6">
                    <h3 className="font-bold text-lg text-blue-800 mb-4">
                      {formData.listingType === 'For Rent' ? 'Rental Information' : 'Lease Information'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className={labelClass}>
                          {formData.listingType === 'For Rent' ? 'Monthly Rent (NPR)' : 'Lease Price (NPR)'} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={formData.listingType === 'For Rent' ? formData.monthlyRent : formData.price}
                          onChange={(e) => handleInputChange(formData.listingType === 'For Rent' ? 'monthlyRent' : 'price', e.target.value)}
                          placeholder={formData.listingType === 'For Rent' ? 'e.g., 25000' : 'e.g., 500000'}
                          required
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Security Deposit (NPR)</label>
                        <input
                          type="number"
                          value={formData.securityDeposit}
                          onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
                          placeholder="e.g., 50000"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className={labelClass}>Furnishing Status</label>
                        <select
                          value={formData.furnished}
                          onChange={(e) => handleInputChange('furnished', e.target.value)}
                          className={selectClass}
                        >
                          <option value="Unfurnished">Unfurnished</option>
                          <option value="Semi-Furnished">Semi-Furnished</option>
                          <option value="Fully Furnished">Fully Furnished</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className={labelClass}>Pet Policy</label>
                        <select
                          value={formData.petPolicy}
                          onChange={(e) => handleInputChange('petPolicy', e.target.value)}
                          className={selectClass}
                        >
                          <option value="No">No Pets Allowed</option>
                          <option value="Yes">Pets Allowed</option>
                          <option value="Negotiable">Negotiable</option>
                        </select>
                      </div>
                    </div>

                    {formData.petPolicy !== 'No' && (
                      <div>
                        <label className={labelClass}>Pet Policy Details</label>
                        <textarea
                          rows="3"
                          value={formData.petDetails}
                          onChange={(e) => handleInputChange('petDetails', e.target.value)}
                          placeholder="e.g., Small pets allowed, additional deposit may apply..."
                          className={inputClass}
                        />
                      </div>
                    )}
                  </div>
                )
                }

                <h3 className="font-bold text-lg text-gray-900 mb-4 pt-4 border-t border-gray-100">Utilities & Energy</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={labelClass}>Solar Panels/Water Heater</label>
                    <select
                      value={formData.solarPanels}
                      onChange={(e) => handleInputChange('solarPanels', e.target.value)}
                      className={selectClass}
                    >
                      <option value="No">No</option>
                      <option value="Solar Panels">Solar Panels</option>
                      <option value="Solar Water Heater">Solar Water Heater</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Backup Power</label>
                    <select
                      value={formData.energyEfficient}
                      onChange={(e) => handleInputChange('energyEfficient', e.target.value)}
                      className={selectClass}
                    >
                      <option value="No">No</option>
                      <option value="Inverter">Inverter</option>
                      <option value="Generator">Generator</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label className={labelClass}>Water Supply</label>
                  <input
                    type="text"
                    value={formData.greenCertification}
                    onChange={(e) => handleInputChange('greenCertification', e.target.value)}
                    placeholder="e.g., 24/7 Municipal, Boring, Water Tank"
                    className={inputClass}
                  />
                </div>
              </div>
            )
          }

          {/* Step 6: Additional Info & Description */}
          {
            currentStep === 6 && (
              <div className="animate-fade-in">
                <h2 className={sectionTitleClass}>
                  <Info className="text-blue-600" size={24} />
                  Description & Additional Information
                </h2>

                <div className="mb-6">
                  <label className={labelClass}>Detailed Description <span className="text-red-500">*</span></label>
                  <textarea
                    rows="8"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Provide a detailed description of your property, highlighting its best features, nearby amenities, neighborhood information, etc."
                    required
                    className={inputClass}
                  />
                  <div className="text-right text-xs text-gray-400 mt-2">{formData.description.length} characters</div>
                </div>

                <div className="mb-6">
                  <label className={labelClass}>Keywords / Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => handleInputChange('keywords', e.target.value)}
                    placeholder="e.g., modern, spacious, pet-friendly, near metro"
                    className={inputClass}
                  />
                </div>

                <h3 className="font-bold text-lg text-gray-900 mb-4 pt-4 border-t border-gray-100">Contact Information</h3>

                <div className="mb-6">
                  <label className={labelClass}>Contact Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => handleInputChange('contactName', e.target.value)}
                    placeholder="Your name or agent name"
                    required
                    readOnly
                    className={`${inputClass} bg-gray-100 cursor-not-allowed`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={labelClass}>Contact Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      placeholder="email@example.com"
                      required
                      readOnly
                      className={`${inputClass} bg-gray-100 cursor-not-allowed`}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Contact Phone <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      placeholder="+977-9801234567"
                      required
                      readOnly
                      className={`${inputClass} bg-gray-100 cursor-not-allowed`}
                    />
                  </div>
                </div>
              </div>
            )
          }
        </div>

        {/* Footer Navigation */}
        < div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center" >
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-200 transition-all"
            >
              <ChevronLeft size={20} />
              Previous
            </button>
          ) : <div></div>}

          {
            currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
              >
                Next
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5"
              >
                <CheckCircle size={20} />
                Submit Property
              </button>
            )
          }
        </div>
      </form>
    </div>
  );
};

export default AddPropertyForm;
