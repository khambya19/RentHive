import React, { useState, useEffect, useCallback } from 'react';
import API_BASE_URL, { SERVER_BASE_URL } from '../../config/api';
import axios from 'axios';
import { Trash2, Bike, ExternalLink, X } from 'lucide-react';

const AutomobilesTable = () => {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBike, setSelectedBike] = useState(null);

  const fetchBikes = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/automobiles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setBikes(response.data.bikes);
      }
    } catch (err) {
      console.error('Error fetching automobiles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBikes();
  }, [fetchBikes]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE_URL}/admin/automobiles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        alert('Vehicle deleted successfully');
        setBikes(prev => prev.filter(b => b.id !== id));
        if (selectedBike && selectedBike.id === id) setSelectedBike(null);
      }
    } catch (err) {
      console.error('Delete vehicle error:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to delete vehicle';
      alert(errorMsg);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Loading vehicles...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-lg font-bold text-slate-700">All Vehicles</h2>
         <div className="text-right text-sm text-slate-500 font-bold">
           Total: {bikes.length}
         </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4">Vehicle</th>
              <th className="px-6 py-4 hide-mobile">Owner</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Daily Rate</th>
              {/* Removed Status Column */}
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bikes.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">No vehicles found.</td></tr>
            ) : (
              bikes.map(bike => (
                <tr key={bike.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                     <p 
                        className="font-bold text-slate-900 cursor-pointer hover:text-indigo-600"
                        onClick={() => setSelectedBike(bike)}
                     >
                        {bike.brand} {bike.model}
                     </p>
                     <p className="text-xs text-slate-500">{bike.year} • {bike.color}</p>
                  </td>
                  <td className="px-6 py-4 hide-mobile">
                     <p className="font-bold text-slate-800">{bike.vendor?.name || 'Unknown'}</p>
                     <p className="text-xs text-slate-500">{bike.vendor?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                     <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-semibold">
                        <Bike size={12} /> {bike.type}
                     </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">
                     NPR {bike.dailyRate?.toLocaleString()}
                  </td>
                  {/* Removed Status Cell */}
                  <td className="px-6 py-4 text-right">
                     <div className="flex justify-end gap-2">
                        <button 
                          className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          onClick={() => setSelectedBike(bike)}
                          title="View Details"
                        >
                           <ExternalLink size={18} />
                        </button>
                        {/* Removed Approval Button */}
                        <button 
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => handleDelete(bike.id)}
                          title="Delete Vehicle"
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

      {/* Bike Details Modal */}
      {selectedBike && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                     <Bike size={20} className="text-indigo-500" /> Vehicle Details
                  </h3>
                  <button onClick={() => setSelectedBike(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                     <X size={20} />
                  </button>
               </div>

               <div className="overflow-y-auto p-6 space-y-6">
                  {/* Images */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                     {selectedBike.images && selectedBike.images.map((img, idx) => (
                        <img 
                           key={idx}
                           src={`${SERVER_BASE_URL}/uploads/bikes/${img}`} 
                           alt={`Bike ${idx}`} 
                           className="w-full h-32 object-cover rounded-lg border border-gray-200 bg-gray-50"
                           onError={(e) => e.target.src = "https://via.placeholder.com/150?text=No+Image"}
                        />
                     ))}
                     {!selectedBike.images?.length && (
                        <div className="col-span-full h-32 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">No Images</div>
                     )}
                  </div>

                  {/* Main Info */}
                  <div>
                     <h2 className="text-2xl font-bold text-slate-900">{selectedBike.brand} {selectedBike.model} <span className='text-gray-400 text-lg font-medium'>({selectedBike.year})</span></h2>
                     <p className="text-slate-500 flex items-center gap-1 mt-1 font-medium bg-slate-100 inline-block px-2 py-0.5 rounded text-xs uppercase tracking-wider">
                        {selectedBike.type}
                     </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-slate-500 font-medium">Color</span>
                           <span className="font-bold text-slate-900">{selectedBike.color}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-slate-500 font-medium">Daily Rate</span>
                           <span className="font-bold text-green-600 text-lg">NPR {selectedBike.dailyRate?.toLocaleString()}</span>
                        </div>
                     </div>
                     <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-slate-500 font-medium">Owner</span>
                           <div className="text-right">
                              <p className="font-bold text-slate-900">{selectedBike.vendor?.name}</p>
                              <p className="text-xs text-slate-500">{selectedBike.vendor?.email}</p>
                           </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-slate-500 font-medium">Posted On</span>
                           <span className="font-bold text-slate-900">{new Date(selectedBike.createdAt).toLocaleDateString()}</span>
                        </div>
                     </div>
                  </div>

                  {/* Description */}
                  <div>
                     <h4 className="font-bold text-slate-900 mb-2">Description</h4>
                     <p className="text-slate-600 text-sm leading-relaxed p-4 bg-gray-50 rounded-xl border border-gray-100">
                        {selectedBike.description || 'No description provided.'}
                     </p>
                  </div>

                  {/* Features */}
                  {selectedBike.features && selectedBike.features.length > 0 && (
                     <div>
                         <h4 className="font-bold text-slate-900 mb-2">Features</h4>
                         <div className="flex flex-wrap gap-2">
                            {selectedBike.features.map(feature => (
                               <span key={feature} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm">
                                  {feature}
                               </span>
                            ))}
                         </div>
                     </div>
                  )}
               </div>
               
               <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                   <button 
                     onClick={() => handleDelete(selectedBike.id)}
                     className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg font-bold text-sm hover:bg-red-50 transition-colors"
                   >
                      Delete Vehicle
                   </button>
                   <button 
                     onClick={() => setSelectedBike(null)}
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

export default AutomobilesTable;
