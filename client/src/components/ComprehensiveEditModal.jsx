import React from 'react';
import { X, Image as ImageIcon, Upload } from 'lucide-react';
import { SERVER_BASE_URL } from '../config/api';
import noImage from '../assets/no-image.png';


const PROPERTY_AMENITIES = ['WiFi', 'Parking', 'AC', 'Heating', 'Furnished', 'Kitchen', 'Laundry', 'Balcony', 'Garden', 'Security', 'Elevator', 'Pet Friendly'];
const VEHICLE_FEATURES = ['ABS', 'Disc Brake', 'Electric Start', 'USB Charging', 'Digital Meter', 'LED Lights', 'Helmet Included', 'Insurance Included'];

const ComprehensiveEditModal = ({ 
  show, 
  onClose, 
  editingType, 
  editForm, 
  setEditForm, 
  onSubmit 
}) => {
  if (!show) return null;

  const toggleAmenity = (amenity) => {
    const current = editForm.amenities || [];
    const updated = current.includes(amenity)
      ? current.filter(a => a !== amenity)
      : [...current, amenity];
    setEditForm({ ...editForm, amenities: updated });
  };

  const toggleFeature = (feature) => {
    const current = editForm.features || [];
    const updated = current.includes(feature)
      ? current.filter(f => f !== feature)
      : [...current, feature];
    setEditForm({ ...editForm, features: updated });
  };

  return (
    <div className="fixed inset-0 z-[50000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose} style={{ zIndex: 50000 }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
          <h2 className="text-xl font-bold">Edit {editingType === 'property' ? 'Property' : 'Automobile'}</h2>
          <button 
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {editingType === 'property' ? (
            <div className="space-y-6">
              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider border-b-2 border-indigo-100 pb-2">📋 Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Property Title *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Property Type *</label>
                    <select
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={editForm.propertyType || ''}
                      onChange={(e) => setEditForm({ ...editForm, propertyType: e.target.value })}
                    >
                      <option value="Apartment">Apartment</option>
                      <option value="House">House</option>
                      <option value="Villa">Villa</option>
                      <option value="Room">Room</option>
                      <option value="Studio">Studio</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={editForm.city || ''}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Address *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
              </div>

              {/* Section 2: Property Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider border-b-2 border-indigo-100 pb-2">🏠 Property Details</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Bedrooms *</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={editForm.bedrooms || ''}
                      onChange={(e) => setEditForm({ ...editForm, bedrooms: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Bathrooms *</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={editForm.bathrooms || ''}
                      onChange={(e) => setEditForm({ ...editForm, bathrooms: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Area (sq ft) *</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={editForm.area || ''}
                      onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Pricing */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider border-b-2 border-indigo-100 pb-2">💰 Pricing</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Monthly Rent (NPR) *</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={editForm.rentPrice || ''}
                      onChange={(e) => setEditForm({ ...editForm, rentPrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Security Deposit *</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={editForm.securityDeposit || ''}
                      onChange={(e) => setEditForm({ ...editForm, securityDeposit: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Amenities */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider border-b-2 border-indigo-100 pb-2">✨ Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PROPERTY_AMENITIES.map(amenity => (
                    <label key={amenity} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-indigo-50 transition-colors border border-gray-200">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        checked={(editForm.amenities || []).includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                      />
                      <span className="text-sm text-gray-700 font-medium">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section 5: Images */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider border-b-2 border-indigo-100 pb-2">📸 Property Images</h3>
                {editForm.images && editForm.images.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {editForm.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img 
                          src={`${SERVER_BASE_URL}/uploads/properties/${img}`}
                          alt={`Property ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                          onError={(e) => { e.target.src = noImage; }}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">Image {idx + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 font-medium">No images uploaded</p>
                    <p className="text-xs text-gray-400 mt-1">Images cannot be edited here</p>
                  </div>
                )}
              </div>

              {/* Section 6: Additional Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider border-b-2 border-indigo-100 pb-2">📝 Additional Details</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    value={editForm.status || 'Available'}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="Available">Available</option>
                    <option value="Rented">Rented</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea
                    rows="4"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Describe your property..."
                  />
                </div>
              </div>
            </div>
          ) : (
            // AUTOMOBILE EDIT FORM
            <div className="space-y-6">
              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b-2 border-blue-100 pb-2">📋 Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Vehicle Name *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Brand *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={editForm.brand || ''}
                      onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Model *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={editForm.model || ''}
                      onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Specifications */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b-2 border-blue-100 pb-2">🔧 Specifications</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Type *</label>
                    <select
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={editForm.type || ''}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    >
                      <option value="Scooter">Scooter</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Sport Bike">Sport Bike</option>
                      <option value="Cruiser">Cruiser</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Year *</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={editForm.year || ''}
                      onChange={(e) => setEditForm({ ...editForm, year: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Color</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={editForm.color || ''}
                      onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Registration Number</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={editForm.registrationNumber || ''}
                      onChange={(e) => setEditForm({ ...editForm, registrationNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Engine Capacity (cc) *</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={editForm.engineCapacity || ''}
                      onChange={(e) => setEditForm({ ...editForm, engineCapacity: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Fuel Type *</label>
                    <select
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={editForm.fuelType || 'Petrol'}
                      onChange={(e) => setEditForm({ ...editForm, fuelType: e.target.value })}
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Pricing */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b-2 border-blue-100 pb-2">💰 Pricing</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Daily Rate (NPR) *</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={editForm.dailyRate || ''}
                      onChange={(e) => setEditForm({ ...editForm, dailyRate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Weekly Rate (NPR)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={editForm.weeklyRate || ''}
                      onChange={(e) => setEditForm({ ...editForm, weeklyRate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Monthly Rate (NPR)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={editForm.monthlyRate || ''}
                      onChange={(e) => setEditForm({ ...editForm, monthlyRate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Security Deposit (NPR) *</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={editForm.securityDeposit || ''}
                      onChange={(e) => setEditForm({ ...editForm, securityDeposit: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Location & Pickup */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b-2 border-blue-100 pb-2">📍 Location & Pickup</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Location/City</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={editForm.location || ''}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pickup Location *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={editForm.pickupLocation || ''}
                      onChange={(e) => setEditForm({ ...editForm, pickupLocation: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Requirements */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b-2 border-blue-100 pb-2">📜 Requirements</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={editForm.licenseRequired || false}
                        onChange={(e) => setEditForm({ ...editForm, licenseRequired: e.target.checked })}
                      />
                      <span className="text-sm font-semibold text-gray-700">License Required</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Minimum Age</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={editForm.minimumAge || 18}
                      onChange={(e) => setEditForm({ ...editForm, minimumAge: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Features */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b-2 border-blue-100 pb-2">✨ Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {VEHICLE_FEATURES.map(feature => (
                    <label key={feature} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-blue-50 transition-colors border border-gray-200">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={(editForm.features || []).includes(feature)}
                        onChange={() => toggleFeature(feature)}
                      />
                      <span className="text-sm text-gray-700 font-medium">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section 7: Images */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b-2 border-blue-100 pb-2">📸 Vehicle Images</h3>
                {editForm.images && editForm.images.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {editForm.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img 
                          src={`${SERVER_BASE_URL}/uploads/bikes/${img}`}
                          alt={`Vehicle ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                          onError={(e) => { e.target.src = noImage; }}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">Image {idx + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 font-medium">No images uploaded</p>
                    <p className="text-xs text-gray-400 mt-1">Images cannot be edited here</p>
                  </div>
                )}
              </div>

              {/* Section 8: Additional Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b-2 border-blue-100 pb-2">📝 Additional Details</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={editForm.status || 'Available'}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="Available">Available</option>
                    <option value="Rented">Rented</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea
                    rows="4"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Describe your vehicle..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button 
            type="button" 
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-all"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="px-6 py-2.5 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg transition-all"
            onClick={onSubmit}
          >
            Update {editingType === 'property' ? 'Property' : 'Automobile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveEditModal;
