import noImage from '../../assets/no-image.png';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
// import './AllListings.css'; // Commented out to use Tailwind
import API_BASE_URL, { SERVER_BASE_URL } from '../../config/api';
import { RefreshCw, Edit, Trash2, MapPin, ClipboardList, Home, Bike, BedDouble, Bath, Ruler, Calendar, Palette, Hash, X, Check, Upload, Image as ImageIcon } from 'lucide-react';
import ComprehensiveEditModal from '../../components/ComprehensiveEditModal';


const PROPERTY_AMENITIES = ['WiFi', 'Parking', 'AC', 'Heating', 'Furnished', 'Kitchen', 'Laundry', 'Balcony', 'Garden', 'Security', 'Elevator', 'Pet Friendly'];
const VEHICLE_FEATURES = ['ABS', 'Disc Brake', 'Electric Start', 'USB Charging', 'Digital Meter', 'LED Lights', 'Helmet Included', 'Insurance Included'];


const AllListings = ({ showSuccess, showError, onEdit }) => {
  const { user: _user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'properties', 'automobiles'
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingType, setEditingType] = useState(null); // 'property' or 'automobile'
  const [editForm, setEditForm] = useState({});

  const fetchProperties = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/properties`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProperties(Array.isArray(data) ? data.filter(Boolean) : []); // Filter nulls
      } else {
        setProperties([]);
      }
    } catch (error) {
      // console.error('Error fetching properties:', error);
      setProperties([]);
    }
  }, []);

  const fetchBikes = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/bikes/vendor`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBikes(Array.isArray(data) ? data.filter(Boolean) : []); // Filter nulls
      } else {
        setBikes([]);
      }
    } catch (error) {
      // console.error('Error fetching bikes:', error);
      setBikes([]);
    }
  }, []);

  const fetchAllListings = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchProperties(), fetchBikes()]);
    setLoading(false);
  }, [fetchProperties, fetchBikes]);

  useEffect(() => {
    fetchAllListings();
  }, [fetchAllListings]);

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setProperties(properties.filter(p => p.id !== propertyId));
        showSuccess('Success', 'Property deleted successfully');
      } else {
        showError('Error', 'Failed to delete property');
      }
    } catch (error) {
      // console.error('Error deleting property:', error);
      showError('Error', 'Failed to delete property');
    }
  };

  const handleDeleteBike = async (bikeId) => {
    if (!window.confirm('Are you sure you want to delete this automobile?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/bikes/vendor/${bikeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setBikes(bikes.filter(b => b.id !== bikeId));
        showSuccess('Success', 'Automobile deleted successfully');
      } else {
        showError('Error', 'Failed to delete automobile');
      }
    } catch (error) {
      // console.error('Error deleting automobile:', error);
      showError('Error', 'Failed to delete automobile');
    }
  };

  const handleEditProperty = (property) => {
    if (!property || !onEdit) return;
    // Pass the property and type to parent for editing in UnifiedPostingForm
    onEdit(property, 'property');
  };

  const handleEditBike = (bike) => {
    if (!bike || !onEdit) return;
    // Pass the bike and type to parent for editing in UnifiedPostingForm  
    onEdit(bike, 'automobile');
  };

  const handleUpdateProperty = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // Always send all fields from editForm (no fallback to old values)
      const payload = { ...editForm };
      const response = await fetch(`${API_BASE_URL}/properties/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowEditModal(false);
        showSuccess('Success', 'Property updated successfully');
        // Always fetch latest data after update
        await fetchProperties();
      } else {
        showError('Error', 'Failed to update property');
      }
    } catch (error) {
      showError('Error', 'Failed to update property');
    }
  };

  const handleUpdateBike = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // Always send all fields from editForm (no fallback to old values)
      const payload = { ...editForm };
      const response = await fetch(`${API_BASE_URL}/bikes/vendor/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowEditModal(false);
        showSuccess('Success', 'Automobile updated successfully');
        // Always fetch latest data after update
        await fetchBikes();
      } else {
        const errorData = await response.json();
        showError('Error', errorData.error || 'Failed to update automobile');
      }
    } catch (error) {
      showError('Error', 'Failed to update automobile');
    }
  };

  const getFilteredListings = () => {
    const allListings = [];
    
    if (filterType === 'all' || filterType === 'properties') {
      (properties || []).forEach(property => {
        if (property) {
          allListings.push({ ...property, type: 'property' });
        }
      });
    }
    
    if (filterType === 'all' || filterType === 'automobiles') {
      (bikes || []).forEach(bike => {
        if (bike) {
          allListings.push({ ...bike, type: 'automobile' });
        }
      });
    }
    
    return allListings.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });
  };

  const renderPropertyCard = (property) => (
    <div key={`property-${property.id}`} className="bg-white rounded-2xl overflow-hidden shadow border border-gray-100/50 hover:shadow-2xl hover:border-indigo-100 transition-all duration-300 relative group flex flex-col h-full">
      <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-white/90 backdrop-blur-md text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1">
        <Home size={12} />
        Property
      </div>
      <div className="h-48 overflow-hidden bg-gray-100 relative">
        {property.images && property.images.length > 0 ? (
          <img 
            src={`${SERVER_BASE_URL}/uploads/properties/${property.images[0]}`} 
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = noImage;
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-slate-50 text-slate-300">
            <Home size={48} className="opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h3 className="text-lg font-bold leading-tight truncate drop-shadow-md">{property.title}</h3>
          <p className="text-xs font-medium text-white/90 drop-shadow-md truncate">{property.city}, {property.address}</p>
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            property.status === 'Available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            property.status === 'Rented' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}>
            {property.status}
          </span>
          <p className="text-xl font-bold text-slate-800">
            <span className="text-sm text-slate-500 font-medium mr-1">NPR</span>
            {property.rentPrice ? Number(property.rentPrice).toLocaleString() : '0'}
            <span className="text-xs text-slate-400 font-normal ml-0.5">/mo</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-100">
            <BedDouble size={16} className="text-indigo-500 mb-1" />
            <span className="text-xs font-semibold text-slate-700">{property.bedrooms} Beds</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-100">
            <Bath size={16} className="text-indigo-500 mb-1" />
            <span className="text-xs font-semibold text-slate-700">{property.bathrooms} Baths</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-100">
            <Ruler size={16} className="text-indigo-500 mb-1" />
            <span className="text-xs font-semibold text-slate-700">{property.area} sqft</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
          <button 
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all group/btn"
            onClick={() => handleEditProperty(property)}
          >
            <Edit size={14} className="group-hover/btn:scale-110 transition-transform" /> Edit
          </button>
          <button 
            className="flex items-center justify-center p-2 bg-white border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all group/delete"
            onClick={() => handleDeleteProperty(property.id)}
            title="Delete Property"
          >
            <Trash2 size={18} className="group-hover/delete:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderBikeCard = (bike) => (
    <div key={`bike-${bike.id}`} className="bg-white rounded-2xl overflow-hidden shadow border border-gray-100/50 hover:shadow-2xl hover:border-blue-100 transition-all duration-300 relative group flex flex-col h-full">
      <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-white/90 backdrop-blur-md text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1">
        <Bike size={12} />
        Automobile
      </div>
      <div className="h-48 overflow-hidden bg-gray-100 relative">
        {bike.images && bike.images.length > 0 ? (
          <img 
            src={bike.images[0].startsWith('/uploads') ? `${SERVER_BASE_URL}${bike.images[0]}` : `${SERVER_BASE_URL}/uploads/bikes/${bike.images[0]}`}
            alt={`${bike.brand} ${bike.model}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = noImage;
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-slate-50 text-slate-300">
            <Bike size={48} className="opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h3 className="text-lg font-bold leading-tight truncate drop-shadow-md">{bike.name || `${bike.brand} ${bike.model}`}</h3>
          <p className="text-xs font-medium text-white/90 drop-shadow-md truncate flex items-center gap-1">
            <MapPin size={10} className="text-blue-300" />
            {bike.location}
          </p>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            bike.status === 'Available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            bike.status === 'Rented' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}>
            {bike.status}
          </span>
          <p className="text-xl font-bold text-slate-800">
            <span className="text-sm text-slate-500 font-medium mr-1">NPR</span>
            {bike.dailyRate ? Number(bike.dailyRate).toLocaleString() : '0'}
            <span className="text-xs text-slate-400 font-normal ml-0.5">/day</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-100">
            <Calendar size={16} className="text-blue-500 mb-1" />
            <span className="text-xs font-semibold text-slate-700">{bike.year}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-100">
            <Palette size={16} className="text-blue-500 mb-1" />
            <span className="text-xs font-semibold text-slate-700 truncate max-w-full">{bike.fuelType || 'Petrol'}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-100">
            <Hash size={16} className="text-blue-500 mb-1" />
            <span className="text-xs font-semibold text-slate-700 truncate max-w-full">{bike.engineCapacity ? `${bike.engineCapacity}cc` : 'N/A'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
          <button 
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all group/btn"
            onClick={() => handleEditBike(bike)}
          >
            <Edit size={14} className="group-hover/btn:scale-110 transition-transform" /> Edit
          </button>
          <button 
            className="flex items-center justify-center p-2 bg-white border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all group/delete"
            onClick={() => handleDeleteBike(bike.id)}
            title="Delete Automobile"
          >
            <Trash2 size={18} className="group-hover/delete:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading your listings...</p>
      </div>
    );
  }

  const filteredListings = getFilteredListings();

  return (
    <div className="w-full h-full">
      {/* Compact Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Total Listings - Gradient Card */}
        <div onClick={() => setFilterType('all')} className={`relative bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-xl p-5 overflow-hidden group cursor-pointer transform hover:scale-[1.02] transition-all duration-300 shadow-xl hover:shadow-2xl ${filterType === 'all' ? 'ring-4 ring-purple-300' : ''}`}>
          <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-white text-[10px] font-bold">ACTIVE</span>
              </div>
            </div>
            <h3 className="text-4xl font-black text-white mb-1 tracking-tight">{properties.length + bikes.length}</h3>
            <p className="text-white/90 font-medium text-xs">Total Listings</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full w-3/4 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Card */}
        <div onClick={() => setFilterType('properties')} className={`relative bg-white rounded-xl p-5 border-2 overflow-hidden group cursor-pointer transition-all duration-300 shadow-md hover:shadow-xl ${filterType === 'properties' ? 'border-indigo-500 ring-4 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300'}`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-indigo-50 to-transparent rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-500"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg shadow-indigo-200/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Properties</div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-0.5 group-hover:text-indigo-600 transition-colors">{properties.length}</h3>
            <p className="text-slate-500 font-medium text-xs mb-2">Listed Properties</p>
            <div className="flex items-center gap-2 text-[10px]">
              <div className="flex items-center gap-1 text-emerald-600">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span className="font-semibold">{properties.filter(p => p.status === 'Available').length} Available</span>
              </div>
              <div className="text-slate-300">•</div>
              <div className="flex items-center gap-1 text-rose-600">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                <span className="font-semibold">{properties.filter(p => p.status === 'Rented').length} Rented</span>
              </div>
            </div>
          </div>
        </div>

        {/* Automobiles Card */}
        <div onClick={() => setFilterType('automobiles')} className={`relative bg-white rounded-xl p-5 border-2 overflow-hidden group cursor-pointer transition-all duration-300 shadow-md hover:shadow-xl ${filterType === 'automobiles' ? 'border-blue-500 ring-4 ring-blue-200' : 'border-slate-200 hover:border-blue-300'}`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-blue-50 to-transparent rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-500"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg shadow-blue-200/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Bike className="w-5 h-5 text-white" />
              </div>
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Automobiles</div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-0.5 group-hover:text-blue-600 transition-colors">{bikes.length}</h3>
            <p className="text-slate-500 font-medium text-xs mb-2">Listed Vehicles</p>
            <div className="flex items-center gap-2 text-[10px]">
              <div className="flex items-center gap-1 text-emerald-600">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span className="font-semibold">{bikes.filter(b => b.status === 'Available').length} Available</span>
              </div>
              <div className="text-slate-300">•</div>
              <div className="flex items-center gap-1 text-rose-600">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                <span className="font-semibold">{bikes.filter(b => b.status === 'Rented').length} Rented</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header with Title and Refresh */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="w-1 h-5 bg-linear-to-b from-indigo-600 to-purple-600 rounded-full"></span>
          {filterType === 'all' ? 'All Listings' : filterType === 'properties' ? 'Properties' : 'Automobiles'}
        </h2>
        <button 
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center gap-1.5 shadow-sm"
          onClick={fetchAllListings}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Listings Grid - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(filteredListings || []).length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-20 text-center bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm mt-8">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
              <ClipboardList size={48} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Listings Found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">You haven't posted any properties or automobiles yet. Start by adding a new listing to reach more customers!</p>
          </div>
        ) : (
          filteredListings.map(listing => 
            listing.type === 'property' 
              ? renderPropertyCard(listing) 
              : renderBikeCard(listing)
          )
        )}
      </div>

      {/* Comprehensive Edit Modal with ALL Fields */}
      <ComprehensiveEditModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        editingType={editingType}
        editForm={editForm}
        setEditForm={setEditForm}
        onSubmit={editingType === 'property' ? handleUpdateProperty : handleUpdateBike}
      />
    </div>
  );
};

export default AllListings;
