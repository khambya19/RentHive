import noImage from '../../assets/no-image.png';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
// import './AllListings.css'; // Commented out to use Tailwind
import API_BASE_URL, { SERVER_BASE_URL } from '../../config/api';
import { RefreshCw, Edit, Trash2, MapPin, ClipboardList, Home, Bike, BedDouble, Bath, Ruler, Calendar, Palette, Hash, X } from 'lucide-react';

const AllListings = ({ showSuccess, showError }) => {
  const { user: _user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'properties', 'automobiles'
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingType, setEditingType] = useState(null); // 'property' or 'automobile'
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchAllListings();
  }, [fetchAllListings]);

  const fetchProperties = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/properties`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (error) {
      // console.error('Error fetching properties:', error);
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
        setBikes(data);
      }
    } catch (error) {
      // console.error('Error fetching bikes:', error);
    }
  }, []);

  const fetchAllListings = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchProperties(), fetchBikes()]);
    setLoading(false);
  }, [fetchProperties, fetchBikes]);

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
    setEditingItem(property);
    setEditingType('property');
    setEditForm({
      title: property.title,
      propertyType: property.propertyType,
      address: property.address,
      city: property.city,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      rentPrice: property.rentPrice,
      securityDeposit: property.securityDeposit,
      description: property.description,
      status: property.status
    });
    setShowEditModal(true);
  };

  const handleEditBike = (bike) => {
    setEditingItem(bike);
    setEditingType('automobile');
    setEditForm({
      name: bike.name,
      brand: bike.brand,
      model: bike.model,
      type: bike.type,
      year: bike.year,
      color: bike.color,
      registrationNumber: bike.registrationNumber,
      dailyRate: bike.dailyRate,
      weeklyRate: bike.weeklyRate,
      securityDeposit: bike.securityDeposit,
      location: bike.location,
      description: bike.description,
      status: bike.status
    });
    setShowEditModal(true);
  };

  const handleUpdateProperty = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/properties/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedProperty = await response.json();
        setProperties(properties.map(p => p.id === editingItem.id ? updatedProperty : p));
        setShowEditModal(false);
        showSuccess('Success', 'Property updated successfully');
      } else {
        showError('Error', 'Failed to update property');
      }
    } catch (error) {
      // console.error('Error updating property:', error);
      showError('Error', 'Failed to update property');
    }
  };

  const handleUpdateBike = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/bikes/vendor/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedBike = await response.json();
        setBikes(bikes.map(b => b.id === editingItem.id ? updatedBike : b));
        setShowEditModal(false);
        showSuccess('Success', 'Automobile updated successfully');
      } else {
        showError('Error', 'Failed to update automobile');
      }
    } catch (error) {
      // console.error('Error updating automobile:', error);
      showError('Error', 'Failed to update automobile');
    }
  };

  const getFilteredListings = () => {
    const allListings = [];
    
    if (filterType === 'all' || filterType === 'properties') {
      properties.forEach(property => {
        allListings.push({ ...property, type: 'property' });
      });
    }
    
    if (filterType === 'all' || filterType === 'automobiles') {
      bikes.forEach(bike => {
        allListings.push({ ...bike, type: 'automobile' });
      });
    }
    
    return allListings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const renderPropertyCard = (property) => (
    <div key={`property-${property.id}`} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative group">
      <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
        Property
      </div>
      <div className="h-48 overflow-hidden bg-gray-100 relative">
        {property.images && property.images.length > 0 ? (
          <img 
            src={`${SERVER_BASE_URL}/uploads/properties/${property.images[0]}`} 
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.src = noImage;
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-gray-50 text-gray-300">
            <Home size={48} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{property.title}</h3>
        <p className="text-sm text-gray-500 font-medium mb-3">{property.propertyType}</p>
        <p className="flex items-center gap-1.5 text-sm text-gray-600 mb-4">
          <MapPin size={16} className="text-indigo-500" /> 
          <span className="truncate">{property.address}, {property.city}</span>
        </p>
        <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          <span className="flex items-center gap-1"><BedDouble size={14} className="text-gray-400" /> {property.bedrooms} Beds</span>
          <span className="flex items-center gap-1"><Bath size={14} className="text-gray-400" /> {property.bathrooms} Baths</span>
          <span className="flex items-center gap-1"><Ruler size={14} className="text-gray-400" /> {property.area} sq.ft</span>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <p className="text-lg font-bold text-indigo-600">NPR {property.rentPrice ? Number(property.rentPrice).toLocaleString() : '0'}<span className="text-xs text-gray-400 font-normal">/mo</span></p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
            property.status === 'Available' ? 'bg-green-100 text-green-700' :
            property.status === 'Rented' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {property.status}
          </span>
        </div>
      </div>
      <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
        <button 
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
          onClick={() => handleEditProperty(property)}
        >
          <Edit size={16} /> Edit
        </button>
        <button 
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-all"
          onClick={() => handleDeleteProperty(property.id)}
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>
    </div>
  );

  const renderBikeCard = (bike) => (
    <div key={`bike-${bike.id}`} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative group">
      <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
        Automobile
      </div>
      <div className="h-48 overflow-hidden bg-gray-100 relative">
        {bike.images && bike.images.length > 0 ? (
          <img 
            src={`${SERVER_BASE_URL}/uploads/bikes/${bike.images[0]}`} 
            alt={`${bike.brand} ${bike.model}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.src = noImage;
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-gray-50 text-gray-300">
            <Bike size={48} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{bike.name || `${bike.brand} ${bike.model}`}</h3>
        <p className="text-sm text-gray-500 font-medium mb-3">{bike.type}</p>
        <p className="flex items-center gap-1.5 text-sm text-gray-600 mb-4">
          <MapPin size={16} className="text-indigo-500" /> 
          <span className="truncate">{bike.location}</span>
        </p>
        <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          <span className="flex items-center gap-1"><Calendar size={14} className="text-gray-400" /> {bike.year}</span>
          {bike.color && <span className="flex items-center gap-1"><Palette size={14} className="text-gray-400" /> {bike.color}</span>}
          {bike.registrationNumber && <span className="flex items-center gap-1"><Hash size={14} className="text-gray-400" /> {bike.registrationNumber}</span>}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <p className="text-lg font-bold text-indigo-600">NPR {bike.dailyRate ? Number(bike.dailyRate).toLocaleString() : '0'}<span className="text-xs text-gray-400 font-normal">/day</span></p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
            bike.status === 'Available' ? 'bg-green-100 text-green-700' :
            bike.status === 'Rented' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {bike.status}
          </span>
        </div>
      </div>
      <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
        <button 
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
          onClick={() => handleEditBike(bike)}
        >
          <Edit size={16} /> Edit
        </button>
        <button 
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-all"
          onClick={() => handleDeleteBike(bike.id)}
        >
          <Trash2 size={16} /> Delete
        </button>
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4 sm:gap-8 w-full md:w-auto justify-between sm:justify-start">
          <div className="text-center">
            <span className="block text-2xl font-bold text-gray-900 leading-none">{properties.length + bikes.length}</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1 block">Total Listings</span>
          </div>
          <div className="text-center border-l border-gray-100 pl-4 sm:pl-8">
            <span className="block text-2xl font-bold text-gray-900 leading-none">{properties.length}</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1 block">Properties</span>
          </div>
          <div className="text-center border-l border-gray-100 pl-4 sm:pl-8">
            <span className="block text-2xl font-bold text-gray-900 leading-none">{bikes.length}</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1 block">Automobiles</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterType === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setFilterType('all')}
          >
            All
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${filterType === 'properties' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setFilterType('properties')}
          >
            <Home size={16} /> Properties
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${filterType === 'automobiles' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setFilterType('automobiles')}
          >
            <Bike size={16} /> Automobiles
          </button>
          
          <button 
            className="ml-auto md:ml-2 px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-all flex items-center gap-2"
            onClick={fetchAllListings}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {filteredListings.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-16 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
              <ClipboardList size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Listings Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">You haven't posted any properties or automobiles yet. Start by adding a new listing!</p>
          </div>
        ) : (
          filteredListings.map(listing => 
            listing.type === 'property' 
              ? renderPropertyCard(listing) 
              : renderBikeCard(listing)
          )
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
              <h2 className="text-xl font-bold">Edit {editingType === 'property' ? 'Property' : 'Automobile'}</h2>
              <button 
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                onClick={() => setShowEditModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={editingType === 'property' ? handleUpdateProperty : handleUpdateBike} className="flex-1 overflow-y-auto p-6">
              {editingType === 'property' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Property Title</label>
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
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Property Type</label>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Bedrooms</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={editForm.bedrooms || ''}
                        onChange={(e) => setEditForm({ ...editForm, bedrooms: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Bathrooms</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={editForm.bathrooms || ''}
                        onChange={(e) => setEditForm({ ...editForm, bathrooms: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Area (sq ft)</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={editForm.area || ''}
                        onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Monthly Rent (NPR)</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={editForm.rentPrice || ''}
                        onChange={(e) => setEditForm({ ...editForm, rentPrice: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Security Deposit</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={editForm.securityDeposit || ''}
                        onChange={(e) => setEditForm({ ...editForm, securityDeposit: e.target.value })}
                      />
                    </div>
                  </div>

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
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Vehicle Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Brand</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={editForm.brand || ''}
                        onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Model</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={editForm.model || ''}
                        onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                      <select
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
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
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Year</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
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
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={editForm.color || ''}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Registration Number</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={editForm.registrationNumber || ''}
                        onChange={(e) => setEditForm({ ...editForm, registrationNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Daily Rate (NPR)</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={editForm.dailyRate || ''}
                        onChange={(e) => setEditForm({ ...editForm, dailyRate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Weekly Rate (NPR)</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={editForm.weeklyRate || ''}
                        onChange={(e) => setEditForm({ ...editForm, weeklyRate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Security Deposit (NPR)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={editForm.securityDeposit || ''}
                      onChange={(e) => setEditForm({ ...editForm, securityDeposit: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={editForm.location || ''}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    />
                  </div>

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
                    />
                  </div>
                </div>
              )}
            </form>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                type="button" 
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-all"
                onClick={editingType === 'property' ? handleUpdateProperty : handleUpdateBike}
              >
                Update {editingType === 'property' ? 'Property' : 'Automobile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllListings;
