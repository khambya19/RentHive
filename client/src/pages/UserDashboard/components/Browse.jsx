import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ListingCard from './ListingCard';
import ReportModal from './ReportModal';
import { useAuth } from '../../../context/AuthContext';

const Browse = ({ onViewProperty }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'property', 'bike'
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedItemToReport, setSelectedItemToReport] = useState(null);
  const [notification, setNotification] = useState(null);
  const { logout } = useAuth();

  const fetchItems = useCallback(async () => {
    console.log('Browse component loaded v2.2'); // Debug version
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No auth token found');
        logout(); // Use context logout
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      // Fetch properties and bikes in parallel
      const [propertiesRes, bikesRes] = await Promise.all([
        axios.get(`${apiUrl}/properties/available`, config),
        axios.get(`${apiUrl}/bikes/available`, config)
      ]);

      // Format and combine data
      const properties = (Array.isArray(propertiesRes.data) ? propertiesRes.data : []).map(p => ({ ...p, type: 'property' }));
      const bikes = (Array.isArray(bikesRes.data) ? bikesRes.data : []).map(b => ({ ...b, type: 'bike' }));

      setItems([...properties, ...bikes]);
    } catch (error) {
      console.error('Error fetching items:', error);
      if (error.response && error.response.status === 401) {
        // Token expired or invalid
        logout(); // Use context logout
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleReport = (item) => {
    setSelectedItemToReport(item);
    setReportModalOpen(true);
  };

  const handleReportSuccess = (message) => {
    setNotification({ type: 'success', message });
    setTimeout(() => setNotification(null), 5000);
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-start py-4 px-4 sm:px-6 lg:px-8">
      {/* Success Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg backdrop-blur-md ${
          notification.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
        }`}>
          <p className="font-semibold">{notification.message}</p>
        </div>
      )}

      <div className="flex flex-col items-center w-full max-w-7xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-4 sm:mb-6">Browse Listings</h2>
        <div className="flex gap-2 sm:gap-3 flex-wrap justify-center mb-6 sm:mb-8">
          <button 
            className={`px-4 sm:px-5 py-2 rounded-xl font-semibold shadow-sm border transition-all duration-200 text-sm sm:text-base ${filter === 'all' ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white border-blue-400 shadow-md' : 'bg-white/80 text-gray-700 border-gray-200 hover:bg-blue-50'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`px-4 sm:px-5 py-2 rounded-xl font-semibold shadow-sm border transition-all duration-200 text-sm sm:text-base ${filter === 'property' ? 'bg-gradient-to-r from-green-400 to-blue-400 text-white border-green-300 shadow-md' : 'bg-white/80 text-gray-700 border-gray-200 hover:bg-green-50'}`}
            onClick={() => setFilter('property')}
          >
            Properties
          </button>
          <button 
            className={`px-4 sm:px-5 py-2 rounded-xl font-semibold shadow-sm border transition-all duration-200 text-sm sm:text-base ${filter === 'bike' ? 'bg-gradient-to-r from-purple-400 to-blue-400 text-white border-purple-300 shadow-md' : 'bg-white/80 text-gray-700 border-gray-200 hover:bg-purple-50'}`}
            onClick={() => setFilter('bike')}
          >
            Bikes
          </button>
        </div>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
            <ListingCard 
              key={`${item.type}-${item.id}`} 
              item={item} 
              onClick={onViewProperty}
              onReport={handleReport}
              beautified
            />
          ))}
        </div>
        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No listings found. Check back later!
          </div>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        item={selectedItemToReport}
        onReportSuccess={handleReportSuccess}
      />
    </div>
  );
};

export default Browse;
