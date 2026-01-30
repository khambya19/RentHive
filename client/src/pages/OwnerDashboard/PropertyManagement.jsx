import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PropertyLocationMap from '../../components/PropertyLocationMap';
import AddPropertyForm from '../../components/AddPropertyForm';
import '../../components/PropertyLocationMap.css';
import API_BASE_URL, { SERVER_BASE_URL } from '../../config/api';
import noImage from '../../assets/no-image.png';
import { Plus, MapPin, Home, Bed, Bath, Ruler, Trash2, Edit } from 'lucide-react';

const PropertyManagement = ({ inlineMode = false, showSuccess, showError }) => {
  const { user: _user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);


  // Location-related states
  const [selectedLocation, setSelectedLocation] = useState(null);

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
      const response = await fetch(`${API_BASE_URL}/properties`, {
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

  const resetForm = () => {
    setSelectedLocation(null);
  };

  const handleAddProperty = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      
      // Use location data from formData directly
      const propertyData = {
        ...formData
      };

      const response = await fetch(`${API_BASE_URL}/properties`, {
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



  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // In inline mode, just render the form without the list
  if (inlineMode) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100">
        {showPropertyModal && (
          <div className="animate-fade-in">
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Properties</h2>
          <p className="text-gray-500">Manage your rental properties</p>
        </div>
        <button 
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          onClick={() => { setEditingProperty(null); resetForm(); setShowPropertyModal(true); }}
        >
          <Plus size={20} />
          Add Property
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.length > 0 ? properties.map(property => (
          <div key={property.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="relative h-48 overflow-hidden">
              <img 
                src={property.images?.[0] ? `${SERVER_BASE_URL}/uploads/properties/${property.images[0]}` : noImage}
                alt={property.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.target.src = noImage;
                }}
              />
              <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md
                ${property.status === 'Available' ? 'bg-green-500/90 text-white' : 'bg-gray-800/80 text-white'}`}>
                {property.status || 'Available'}
              </span>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{property.title}</h3>
              <p className="text-sm text-blue-600 font-medium mb-3">{property.propertyType}</p>
              <p className="flex items-center gap-1 text-gray-500 text-sm mb-4">
                <MapPin size={16} className="flex-shrink-0" />
                <span className="truncate">{property.address}, {property.city}</span>
              </p>
              
              <div className="flex items-center gap-4 py-3 border-t border-b border-gray-50 mb-4">
                <span className="flex items-center gap-1.5 text-gray-600 text-sm font-medium">
                  <Bed size={18} className="text-gray-400" /> {property.bedrooms} <span className="hidden sm:inline">Bed</span>
                </span>
                <span className="flex items-center gap-1.5 text-gray-600 text-sm font-medium">
                  <Bath size={18} className="text-gray-400" /> {property.bathrooms} <span className="hidden sm:inline">Bath</span>
                </span>
                <span className="flex items-center gap-1.5 text-gray-600 text-sm font-medium">
                  <Ruler size={18} className="text-gray-400" /> {property.area} <span className="hidden sm:inline">sq.ft</span>
                </span>
              </div>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="text-xl font-bold text-gray-900">
                  NPR {property.rentPrice ? Number(property.rentPrice).toLocaleString() : '0'}<span className="text-sm text-gray-400 font-normal">/mo</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={() => {
                      setEditingProperty(property);
                      setShowPropertyModal(true);
                    }}
                    title="Edit Property"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => {/* Delete logic */}}
                    title="Delete Property"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Home size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No properties yet</h3>
            <p className="text-gray-500 mb-8 max-w-sm">Start by adding your first property to rent out. It only takes a few minutes.</p>
            <button 
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              onClick={() => { setEditingProperty(null); resetForm(); setShowPropertyModal(true); }}
            >
              <Plus size={20} />
              Add Your First Property
            </button>
          </div>
        )}
      </div>

      {/* Property Modal */}
      {showPropertyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowPropertyModal(false)}>
          <div 
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">{editingProperty ? 'Edit Property' : 'Add New Property'}</h2>
              <button 
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setShowPropertyModal(false)}
              >
                <div className="text-2xl leading-none">&times;</div>
              </button>
            </div>
            
            <div className="p-6 md:p-8">
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