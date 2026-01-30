import React, { useState, useEffect, useCallback } from 'react';
import API_BASE_URL, { SERVER_BASE_URL } from '../../config/api';
import axios from 'axios';
import { MapPin, Trash2, Home, ExternalLink, X } from 'lucide-react';

const PropertiesTable = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Fetch all properties without explicit filters (backend defaults to all if no query params)
      const response = await axios.get(`${API_BASE_URL}/admin/properties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setProperties(response.data.properties);
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this property details? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/admin/properties/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProperties(prev => prev.filter(p => p.id !== id));
      if (selectedProperty && selectedProperty.id === id) setSelectedProperty(null);
    } catch (err) {
      alert('Failed to delete property');
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Loading properties...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-lg font-bold text-slate-700">All Properties</h2>
         <div className="text-right text-sm text-slate-500 font-bold">
           Total: {properties.length}
         </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4">Property</th>
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Price</th>
              {/* Removed Status Column */}
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {properties.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">No properties found.</td></tr>
            ) : (
              properties.map(property => (
                <tr key={property.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                     <p 
                        className="font-bold text-slate-900 line-clamp-1 cursor-pointer hover:text-indigo-600"
                        onClick={() => setSelectedProperty(property)}
                     >
                         {property.title}
                     </p>
                     <p className="text-xs text-slate-500 uppercase tracking-wide">{property.propertyType}</p>
                  </td>
                  <td className="px-6 py-4">
                     <p className="font-bold text-slate-800">{property.vendor?.name || 'Unknown'}</p>
                     <p className="text-xs text-slate-500">{property.vendor?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-1 text-slate-600">
                        <MapPin size={14} /> {property.city}
                     </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">
                     NPR {property.rentPrice?.toLocaleString()}
                  </td>
                  {/* Removed Status Cell */}
                  <td className="px-6 py-4 text-right">
                     <div className="flex justify-end gap-2">
                        <button 
                          className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          onClick={() => setSelectedProperty(property)}
                          title="View Details"
                        >
                           <ExternalLink size={18} />
                        </button>
                        {/* Removed Approval/Verify Button */}
                        <button 
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => handleDelete(property.id)}
                          title="Delete Property"
                        >
                           <Trash2 size={18} />
                        </button>
                     </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Home size={20} className="text-indigo-500" /> Property Details
                 </h3>
                 <button onClick={() => setSelectedProperty(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                    <X size={20} />
                 </button>
              </div>

              <div className="overflow-y-auto p-6 space-y-6">
                 {/* Images */}
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedProperty.images && selectedProperty.images.map((img, idx) => (
                       <img 
                          key={idx}
                          src={`${SERVER_BASE_URL}/uploads/properties/${img}`} 
                          alt={`Property ${idx}`} 
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 bg-gray-50"
                          onError={(e) => e.target.src = "https://via.placeholder.com/150?text=No+Image"}
                       />
                    ))}
                    {!selectedProperty.images?.length && (
                       <div className="col-span-full h-32 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">No Images</div>
                    )}
                 </div>

                 {/* Main Info */}
                 <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedProperty.title}</h2>
                    <p className="text-slate-500 flex items-center gap-1 mt-1">
                       <MapPin size={16} /> {selectedProperty.address}, {selectedProperty.city}
                    </p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="space-y-3">
                       <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 font-medium">Type</span>
                          <span className="font-bold text-slate-900">{selectedProperty.propertyType}</span>
                       </div>
                       <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 font-medium">Price</span>
                          <span className="font-bold text-green-600 text-lg">NPR {selectedProperty.rentPrice?.toLocaleString()}</span>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 font-medium">Owner</span>
                          <div className="text-right">
                             <p className="font-bold text-slate-900">{selectedProperty.vendor?.name}</p>
                             <p className="text-xs text-slate-500">{selectedProperty.vendor?.email}</p>
                          </div>
                       </div>
                       <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 font-medium">Posted On</span>
                          <span className="font-bold text-slate-900">{new Date(selectedProperty.createdAt).toLocaleDateString()}</span>
                       </div>
                    </div>
                 </div>

                 {/* Description */}
                 <div>
                    <h4 className="font-bold text-slate-900 mb-2">Description</h4>
                    <p className="text-slate-600 text-sm leading-relaxed p-4 bg-gray-50 rounded-xl border border-gray-100">
                       {selectedProperty.description || 'No description provided.'}
                    </p>
                 </div>

                 {/* Features */}
                 {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                    <div>
                        <h4 className="font-bold text-slate-900 mb-2">Amenities</h4>
                        <div className="flex flex-wrap gap-2">
                           {selectedProperty.amenities.map(feature => (
                              <span key={feature} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm">
                                 {feature}
                              </span>
                           ))}
                        </div>
                    </div>
                 )}
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                  {/* Removed Approval Button in Modal too */}
                  <button 
                    onClick={() => handleDelete(selectedProperty.id)}
                    className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg font-bold text-sm hover:bg-red-50 transition-colors"
                  >
                     Delete Property
                  </button>
                  <button 
                     onClick={() => setSelectedProperty(null)}
                     className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors"
                  >
                     Close
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesTable;
