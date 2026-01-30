import React, { useState } from 'react';
import PropertyManagement from './PropertyManagement';
import PropertyLocationMap from '../../components/PropertyLocationMap';
// import './UnifiedPostingForm.css'; // Deprecated
import API_BASE_URL from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  CheckCircle,
  ShieldAlert,
  Settings,
  Image as ImageIcon
} from 'lucide-react';

const UnifiedPostingForm = ({ showSuccess, showError, editData, editType, onEditComplete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listingType, setListingType] = useState(editType || null); // Pre-set if editing
  const [currentStep, setCurrentStep] = useState(1);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  
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
    longitude: null,
    contactName: user?.name || '',
    contactEmail: user?.email || '',
    contactPhone: user?.phone || '',
  });

  // Initialize edit mode when editData is provided
  React.useEffect(() => {
    if (editData && editType) {
      setIsEditMode(true);
      setEditId(editData.id);
      setListingType(editType);
      
      if (editType === 'automobile') {
        // Pre-fill automobile form
        setBikeForm({
          name: editData.name || '',
          brand: editData.brand || '',
          model: editData.model || '',
          type: editData.type || 'Scooter',
          year: editData.year || new Date().getFullYear(),
          color: editData.color || '',
          registrationNumber: editData.registrationNumber || '',
          engineCapacity: editData.engineCapacity || '',
          fuelType: editData.fuelType || 'Petrol',
          dailyRate: editData.dailyRate || '',
          weeklyRate: editData.weeklyRate || '',
          monthlyRate: editData.monthlyRate || '',
          securityDeposit: editData.securityDeposit || '',
          location: editData.location || '',
          pickupLocation: editData.pickupLocation || '',
          licenseRequired: editData.licenseRequired !== undefined ? editData.licenseRequired : true,
          minimumAge: editData.minimumAge || 18,
          description: editData.description || '',
          features: editData.features || [],
          images: editData.images || [],
          latitude: editData.latitude || null,
          longitude: editData.longitude || null,
          contactName: editData.contactName || user?.name || '',
          contactEmail: editData.contactEmail || user?.email || '',
          contactPhone: editData.contactPhone || user?.phone || '',
        });
        
        if (editData.latitude && editData.longitude) {
          setSelectedLocation({
            lat: editData.latitude,
            lng: editData.longitude,
            display_name: editData.location
          });
        }
      }
      // Property edit will be handled by PropertyManagement component
    }
  }, [editData, editType]);

  // -- GATE CHECK: If user is not verified, block access --
  if (user?.kycStatus !== 'approved') {
    return (
       <div className="flex flex-col items-center justify-center p-8 md:p-16 text-center w-full max-w-4xl mx-auto align-middle h-full">
         <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert size={48} className="text-amber-500" />
         </div>
         <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification Required</h2>
         <p className="text-slate-500 mb-8 leading-relaxed">
           To ensure safety and trust on RentHive, all owners must complete KYC verification before posting listings.
           <br/>Your current status is: <strong className="uppercase text-amber-600">{user?.kycStatus?.replace('_', ' ') || 'NOT SUBMITTED'}</strong>
         </p>
         
         <button 
           onClick={() => {
              // Assuming this component is used inside OwnerDashboard which handles tabs via state or URL
              // We'll try to find the button to switch tabs or navigate if it's a route
              // Since OwnerDashboard passes activeTab, we might need a way to tell the parent to switch.
              // But standard navigation is safer if we are not sure about parent props.
              // For now, let's look at the parent Structure. It seems OwnerDashboard uses state 'activeTab'.
              // We can't change parent state easily unless a prop was passed.
              // However, the USER asked for "Settings" tab to upload KYC.
              // We can hint the user to go to Settings.
              const settingsTab = document.querySelector('button[title="Settings"]'); // Try finding via DOM as fallback? No, fragile.
              // Best is to just show instructions or if 'navigate' works for a specific route.
              // But OwnerDashboard is single page tabs.
              // Let's just use a window alert or rely on the user clicking the sidebar.
              // Actually, I can simply render a visually guiding button.
              navigate('/owner/dashboard?tab=settings'); // This might trigger the useEffect in OwnerDashboard to switch tabs
              window.location.reload(); // Force reload to pick up the query param
           }}
           className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
         >
           <Settings size={20} />
           Go to Settings to Verify
         </button>
       </div>
    );
  }

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
      longitude: null,
      contactName: user?.name || '',
      contactEmail: user?.email || '',
      contactPhone: user?.phone || '',
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
    // Basic validation - check all required fields
    const requiredFields = {
      name: 'Vehicle Name',
      brand: 'Brand',
      model: 'Model',
      year: 'Year',
      dailyRate: 'Daily Rate',
      weeklyRate: 'Weekly Rate',
      securityDeposit: 'Security Deposit',
      location: 'Location/City',
      pickupLocation: 'Pickup Location'
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!bikeForm[field]) {
        showError('Validation Error', `${label} is required. Please fill in all fields marked with *.`);
        return false;
      }
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

    // Image validation - Optional now
    // if (bikeForm.images.length === 0) {
    //   showError('Validation Error', 'Please upload at least one image of your vehicle');
    //   return false;
    // }

    return true;
  };

  const handleBikeSubmit = async (e) => {
    e.preventDefault();
    
    // Ensure we are on the final step (Review) before submitting
    if (currentStep !== 5) {
      return; 
    }

    if (!validateBikeForm()) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Append all bike form fields
      Object.keys(bikeForm).forEach(key => {
        if (key === 'images' && bikeForm.images.length > 0) {
          bikeForm.images.forEach(image => {
            // Only append if it's a File object (new image), not existing URLs
            if (image instanceof File) {
              formData.append('images', image);
            }
          });
        } else if (key === 'features') {
          formData.append('features', JSON.stringify(bikeForm.features));
        } else {
          formData.append(key, bikeForm[key]);
        }
      });
      
      // Keep existing images if in edit mode
      if (isEditMode) {
        const existingImages = bikeForm.images.filter(img => typeof img === 'string');
        if (existingImages.length > 0) {
          formData.append('existingImages', JSON.stringify(existingImages));
        }
      }

      // Choose endpoint based on edit mode
      const url = isEditMode 
        ? `${API_BASE_URL}/bikes/vendor/${editId}` 
        : `${API_BASE_URL}/bikes/vendor`;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        showSuccess('Success', isEditMode ? 'Automobile updated successfully!' : 'Automobile listed successfully!');
        if (isEditMode && onEditComplete) {
          onEditComplete(); // Navigate back to listings
        } else {
          resetBikeForm();
          setListingType(null);
        }
      } else {
        const errorData = await response.json();
        showError('Error', `Failed to ${isEditMode ? 'update' : 'add'} automobile: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} automobile:`, error);
      showError('Error', `Failed to ${isEditMode ? 'update' : 'add'} automobile`);
    }
  };

  const nextStep = () => {
    const totalSteps = 5;
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

  // Common classes for consistent UI
  const inputClass = "w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-medium shadow-sm hover:border-gray-300";
  const selectClass = "w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-medium shadow-sm hover:border-gray-300 appearance-none cursor-pointer";
  const labelClass = "block text-sm font-bold text-gray-700 mb-2 text-left tracking-wide";
  const sectionTitleClass = "text-2xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-100 flex items-center gap-3";

  const renderStepIndicator = () => (
    <div className="flex justify-between items-center mb-10 px-4 relative">
      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 rounded"></div>
      <div 
        className="absolute top-1/2 left-0 h-1 bg-green-500 -z-10 rounded transition-all duration-500"
        style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
      ></div>
      {[1, 2, 3, 4, 5].map(step => (
        <div key={step} className={`flex flex-col items-center group relative z-10`}>
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

  const getStepLabel = (step) => {
    const labels = ['Basic Info', 'Pricing & Location', 'Features', 'Media', 'Review'];
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
      <div className="p-4 md:p-8 w-full">
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">What would you like to list?</h2>
          <p className="text-gray-600 text-lg mb-12">Choose the type of rental you want to add</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full mx-auto">
            <div 
              className="bg-white rounded-2xl p-10 border-2 border-gray-100 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-green-500 group"
              onClick={() => setListingType('property')}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-linear-to-br from-green-400 to-green-600 flex items-center justify-center text-white shadow-lg shadow-green-200 group-hover:scale-110 transition-transform duration-300">
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
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300">
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
      <div className="p-4 md:p-8 w-full">
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
        <PropertyManagement 
          inlineMode={true} 
          editData={isEditMode && editType === 'property' ? editData : null}
          isEditMode={isEditMode && editType === 'property'}
          onEditComplete={onEditComplete}
          showSuccess={showSuccess}
          showError={showError}
        />
      </div>
    );
  }

  // If automobile selected, show automobile form
  if (listingType === 'automobile') {
    const totalSteps = 5;
    
    return (
      <div className="p-4 md:p-8 w-full">
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

        <div className="w-full mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8">
          {renderStepIndicator()}
          
          <form className="mt-8" onSubmit={(e) => e.preventDefault()}>
            <div className="animate-fade-in space-y-8">
              
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <>
                  <div className="border-b border-gray-100 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                    <p className="text-gray-500">Enter the main details of the vehicle.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={labelClass}>Vehicle Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className={inputClass}
                      value={bikeForm.name}
                      onChange={(e) => setBikeForm({ ...bikeForm, name: e.target.value })}
                      placeholder="e.g., Red Honda Activa 2023"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className={labelClass}>Brand <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className={inputClass}
                        value={bikeForm.brand}
                        onChange={(e) => setBikeForm({ ...bikeForm, brand: e.target.value })}
                        placeholder="e.g., Honda, Yamaha, Hero"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={labelClass}>Model <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className={inputClass}
                        value={bikeForm.model}
                        onChange={(e) => setBikeForm({ ...bikeForm, model: e.target.value })}
                        placeholder="e.g., Activa, FZ, Splendor"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className={labelClass}>Type <span className="text-red-500">*</span></label>
                      <select
                        className={selectClass}
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
                      <label className={labelClass}>Year <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        className={inputClass}
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
                      <label className={labelClass}>Color</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={bikeForm.color}
                        onChange={(e) => setBikeForm({ ...bikeForm, color: e.target.value })}
                        placeholder="e.g., Black, Red, Blue"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={labelClass}>Registration Number</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={bikeForm.registrationNumber}
                        onChange={(e) => setBikeForm({ ...bikeForm, registrationNumber: e.target.value })}
                        placeholder="e.g., BA-01-PA-1234"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className={labelClass}>Engine Capacity (CC)</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={bikeForm.engineCapacity}
                        onChange={(e) => setBikeForm({ ...bikeForm, engineCapacity: e.target.value })}
                        placeholder="e.g., 150"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={labelClass}>Fuel Type <span className="text-red-500">*</span></label>
                      <select
                        className={selectClass}
                        value={bikeForm.fuelType}
                        onChange={(e) => setBikeForm({ ...bikeForm, fuelType: e.target.value })}
                        required
                      >
                        <option value="Petrol">Petrol</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="None">None (Bicycle)</option>
                      </select>
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
                      <label className={labelClass}>Daily Rate (NPR) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        className={inputClass}
                        value={bikeForm.dailyRate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBikeForm(prev => ({ 
                            ...prev, 
                            dailyRate: val,
                            // Auto-set weekly/monthly if not set by user to help with dynamic pricing
                            weeklyRate: !prev.weeklyRate ? (val * 7).toFixed(0) : prev.weeklyRate,
                            monthlyRate: !prev.monthlyRate ? (val * 30).toFixed(0) : prev.monthlyRate
                          }));
                        }}
                        placeholder="e.g., 500"
                        min="0"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={labelClass}>Weekly Rate (NPR)</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={bikeForm.weeklyRate}
                        onChange={(e) => setBikeForm({ ...bikeForm, weeklyRate: e.target.value })}
                        placeholder="e.g., 3000"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={labelClass}>Monthly Rate (NPR)</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={bikeForm.monthlyRate}
                        onChange={(e) => setBikeForm({ ...bikeForm, monthlyRate: e.target.value })}
                        placeholder="e.g., 10000"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className={labelClass}>Security Deposit (NPR) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        className={inputClass}
                        value={bikeForm.securityDeposit}
                        onChange={(e) => setBikeForm({ ...bikeForm, securityDeposit: e.target.value })}
                        placeholder="e.g., 5000"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className={labelClass}>Location/City <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className={inputClass}
                        value={bikeForm.location}
                        onChange={(e) => setBikeForm({ ...bikeForm, location: e.target.value })}
                        placeholder="e.g., Pokhara, Kathmandu, Chitwan"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={labelClass}>Pickup Location <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className={inputClass}
                        value={bikeForm.pickupLocation}
                        onChange={(e) => setBikeForm({ ...bikeForm, pickupLocation: e.target.value })}
                        placeholder="e.g., Thamel, Kathmandu (Near Garden of Dreams)"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-semibold text-gray-700">Description</label>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none min-h-30"
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
                      <label className={labelClass}>Minimum Age</label>
                      <input
                        type="number"
                        className={inputClass}
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
                        <CheckCircle size={20} className="shrink-0" />
                        <a
                          href={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium underline hover:text-green-900"
                        >
                          Location selected ({selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)})
                        </a>
                        <button type="button" onClick={clearLocation} className="ml-auto text-sm underline hover:text-green-800 font-bold">Clear</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 mb-4">
                        <Info size={20} className="shrink-0" />
                        <span className="font-medium text-sm">Click "Show Map" and pin the exact location to help renters find you.</span>
                      </div>
                    )}

                    {showLocationPicker && (
                      <div className="rounded-xl overflow-hidden shadow-md border border-gray-200">
                        <PropertyLocationMap
                          selectedLocation={selectedLocation}
                          onLocationSelect={handleLocationSelect}
                          showLocationPicker={true}
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
                    <label className="block font-semibold text-gray-700">Upload Images (Max 5) <span className="text-gray-400 font-normal">(Optional)</span></label>
                    
                    <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:bg-gray-50 hover:border-blue-400 transition-all text-center group cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
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

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <>
                  <div className="border-b border-gray-100 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Review & Confirm</h2>
                    <p className="text-gray-500">Please review all details before publishing your automobile listing.</p>
                  </div>

                  <div className="space-y-6">
                    {/* Vehicle Header with Image */}
                    <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center text-blue-600 overflow-hidden shadow-md shrink-0">
                          {bikeForm.images.length > 0 ? (
                            <img 
                              src={bikeForm.images[0] instanceof File ? URL.createObjectURL(bikeForm.images[0]) : bikeForm.images[0]} 
                              className="w-full h-full object-cover" 
                              alt="Preview" 
                            />
                          ) : (
                            <Bike size={40} />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">{bikeForm.name || 'Untitled Vehicle'}</h3>
                          <p className="text-gray-600 text-lg">{bikeForm.brand} {bikeForm.model}</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">{bikeForm.type}</span>
                            <span className="px-3 py-1 bg-white text-blue-600 text-xs font-bold rounded-full border border-blue-200">{bikeForm.year}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Info size={16} /> Basic Information
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <span className="block text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Color</span>
                          <span className="text-gray-900 font-medium">{bikeForm.color || 'Not specified'}</span>
                        </div>
                        <div>
                          <span className="block text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Registration</span>
                          <span className="text-gray-900 font-medium">{bikeForm.registrationNumber || 'Not specified'}</span>
                        </div>
                        <div>
                          <span className="block text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Engine Capacity</span>
                          <span className="text-gray-900 font-medium">{bikeForm.engineCapacity ? `${bikeForm.engineCapacity}cc` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h4 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                        💰 Pricing
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                          <span className="block text-green-600 text-xs uppercase tracking-wider font-bold mb-1">Daily Rate</span>
                          <span className="text-lg font-bold text-green-700">NPR {bikeForm.dailyRate || 0}</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <span className="block text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Weekly Rate</span>
                          <span className="text-lg font-bold text-gray-900">NPR {bikeForm.weeklyRate || 0}</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <span className="block text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Monthly Rate</span>
                          <span className="text-lg font-bold text-gray-900">NPR {bikeForm.monthlyRate || 0}</span>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                          <span className="block text-orange-600 text-xs uppercase tracking-wider font-bold mb-1">Security Deposit</span>
                          <span className="text-lg font-bold text-orange-700">NPR {bikeForm.securityDeposit || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h4 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <MapPin size={16} /> Location
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="block text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">City/Location</span>
                          <span className="text-gray-900 font-medium">{bikeForm.location || 'Not specified'}</span>
                        </div>
                        <div>
                          <span className="block text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Pickup Location</span>
                          <span className="text-gray-900 font-medium">{bikeForm.pickupLocation || 'Not specified'}</span>
                        </div>
                        {bikeForm.latitude && bikeForm.longitude && (
                          <div className="md:col-span-2 mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                            <div>
                               <span className="block text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Coordinates</span>
                               <span className="text-xs font-mono text-gray-600">Lat: {bikeForm.latitude.toFixed(6)}, Lng: {bikeForm.longitude.toFixed(6)}</span>
                            </div>
                            <a 
                               href={`https://www.google.com/maps?q=${bikeForm.latitude},${bikeForm.longitude}`} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                            >
                               <MapPin size={12} /> View on Map
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h4 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                        📋 Requirements
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bikeForm.licenseRequired ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                            {bikeForm.licenseRequired ? <Check size={20} /> : <X size={20} />}
                          </div>
                          <div>
                            <span className="block text-gray-400 text-xs uppercase tracking-wider font-bold">License Required</span>
                            <span className="text-gray-900 font-medium">{bikeForm.licenseRequired ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                        <div>
                          <span className="block text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Minimum Age</span>
                          <span className="text-gray-900 font-medium">{bikeForm.minimumAge || 18} years</span>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    {bikeForm.features && bikeForm.features.length > 0 && (
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                          ✨ Features
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {bikeForm.features.map((feature, index) => (
                            <span key={index} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg border border-indigo-100">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {bikeForm.description && (
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                          📝 Description
                        </h4>
                        <p className="text-gray-700 leading-relaxed">{bikeForm.description}</p>
                      </div>
                    )}

                    {/* Images */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <ImageIcon size={16} /> Images ({bikeForm.images.length})
                      </h4>
                      {bikeForm.images.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {bikeForm.images.map((image, index) => (
                            <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border-2 border-gray-200">
                              <img 
                                src={image instanceof File ? URL.createObjectURL(image) : image} 
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-sm font-bold">Image {index + 1}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 font-medium">No images uploaded</p>
                        </div>
                      )}
                    </div>

                    {/* Confirmation Checkbox */}
                    <div className="bg-blue-50 border-2 border-blue-200 p-5 rounded-xl flex gap-3 items-start cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setTermsAccepted(!termsAccepted)}>
                      <div className="pt-0.5">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-blue-900 font-bold text-base mb-1">
                          ✓ Ready to publish?
                        </p>
                        <p className="text-blue-800 text-sm leading-relaxed">
                          I confirm that all details above are accurate and complete. I agree to the terms of service for vehicle rentals.
                        </p>
                      </div>
                    </div>
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
                    type="button" 
                    onClick={handleBikeSubmit}
                    disabled={!termsAccepted}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                      ${termsAccepted 
                        ? 'bg-green-600 shadow-green-200 hover:bg-green-700 hover:-translate-y-1' 
                        : 'bg-gray-300 shadow-gray-100 cursor-not-allowed'}`}
                  >
                    {isEditMode ? 'Update Automobile' : 'List Automobile'}
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
