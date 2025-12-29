import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './PropertyManagementDashboard.css';
import L from 'leaflet';

// Fix Leaflet default marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom marker icon
const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="marker-pin-wrapper">
        <div class="marker-pin">
          <div class="marker-pin-inner"></div>
        </div>
        <div class="marker-pulse"></div>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50]
  });
};

const PropertyManagementDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 0,
    availableProperties: 0,
    activeTenants: 0,
    monthlyRevenue: 0,
    totalViews: 0,
    totalInquiries: 0,
  });
  
  // Properties view state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [propertySearch, setPropertySearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('all'); // 'all', 'available', 'rented', 'pending'
  const [propertySortBy, setPropertySortBy] = useState('newest'); // 'newest', 'price-high', 'price-low', 'views'
  
  const [propertyForm, setPropertyForm] = useState({
    title: '',
    propertyType: 'Apartment',
    address: '',
    city: '',
    bedrooms: 1,
    bathrooms: 1,
    area: '',
    rentPrice: '',
    securityDeposit: '',
    amenities: [],
    description: '',
    availability: 'Available'
  });

  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState({ lat: 27.7172, lng: 85.3240 }); // Default to Kathmandu
  const [fetchingAddress, setFetchingAddress] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef(null);
  const mapRef = useRef(null);

  const amenitiesList = [
    'WiFi', 'Parking', 'Elevator', 'Garden', 'Security', 'Gym',
    'Swimming Pool', 'Balcony', 'Air Conditioning', 'Furnished'
  ];

  useEffect(() => {
    fetchData();
    // Set profile picture if user has one
    if (user?.profileImage) {
      setProfilePicture(user.profileImage);
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        navigate('/login');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      // Fetch stats and properties
      const [statsResponse, propertiesResponse] = await Promise.all([
        fetch('/api/properties/stats', { headers }),
        fetch('/api/properties', { headers }),
      ]);

      if (!statsResponse.ok || !propertiesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const statsData = await statsResponse.json();
      const propertiesData = await propertiesResponse.json();

      setStats({
        totalProperties: statsData.totalProperties || 0,
        availableProperties: statsData.availableProperties || 0,
        activeTenants: statsData.activeTenants || 0,
        monthlyRevenue: statsData.monthlyRevenue || 0,
        totalViews: statsData.totalViews || 0,
        totalInquiries: statsData.totalInquiries || 0,
      });
      setProperties(propertiesData);
      setBookings(statsData.bookings || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploadingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch('/api/vendors/upload-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      const data = await response.json();
      setProfilePicture(data.profilePicture);
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture');
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 10) {
      alert('You can only upload up to 10 images');
      return;
    }

    setSelectedImages([...selectedImages, ...files]);

    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview([...imagePreview, ...previews]);
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreview(newPreviews);
  };

  const uploadImages = async () => {
    if (selectedImages.length === 0) return [];

    setUploadingImages(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      selectedImages.forEach(image => {
        formData.append('images', image);
      });

      console.log('Uploading', selectedImages.length, 'images...');

      const response = await fetch('/api/properties/upload-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload images');
      }

      const data = await response.json();
      console.log('Upload response:', data);
      // data.images now contains just filenames (e.g., 'property-1234567890.jpg')
      console.log('Uploaded filenames:', data.images);
      return data.images || [];
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images');
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  const handleAddProperty = async (e) => {
    e.preventDefault();
    try {
      // Upload images first
      const uploadedImageNames = await uploadImages();
      console.log('Images uploaded, filenames:', uploadedImageNames);

      const token = localStorage.getItem('token');
      const propertyData = {
        ...propertyForm,
        images: uploadedImageNames,
        latitude: mapCoordinates.lat,
        longitude: mapCoordinates.lng
      };

      console.log('Creating property with data:', propertyData);

      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(propertyData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add property');
      }

      const newProperty = await response.json();
      console.log('Property created:', newProperty);
      setProperties([...properties, newProperty]);
      setShowPropertyModal(false);
      resetForm();
      fetchData(); // Refresh stats
      alert('Property added successfully!');
    } catch (error) {
      console.error('Error adding property:', error);
      alert(error.message);
    }
  };

  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setPropertyForm({
      title: property.title || '',
      propertyType: property.propertyType || 'Apartment',
      address: property.address || '',
      city: property.city || '',
      bedrooms: property.bedrooms || 1,
      bathrooms: property.bathrooms || 1,
      area: property.area || '',
      rentPrice: property.rentPrice || '',
      securityDeposit: property.securityDeposit || '',
      amenities: property.amenities || [],
      description: property.description || '',
      availability: property.status || 'Available'
    });
    
    // Clear previous images
    setSelectedImages([]);
    setImagePreview([]);
    
    // Set existing images as preview
    if (property.images && property.images.length > 0) {
      setImagePreview(property.images.map(img => `http://localhost:5000/uploads/properties/${img}`));
    }
    
    // Set map coordinates if available
    if (property.latitude && property.longitude) {
      setMapCoordinates({ lat: parseFloat(property.latitude), lng: parseFloat(property.longitude) });
    }
    
    setShowPropertyModal(true);
  };

  const handleUpdateProperty = async (e) => {
    e.preventDefault();
    try {
      // Upload new images if any
      let newImageNames = [];
      if (selectedImages.length > 0) {
        newImageNames = await uploadImages();
      }

      const token = localStorage.getItem('token');
      
      // Keep existing images and add new ones
      const existingImages = editingProperty.images || [];
      const allImages = [...existingImages, ...newImageNames];

      const propertyData = {
        ...propertyForm,
        images: allImages,
        latitude: mapCoordinates.lat,
        longitude: mapCoordinates.lng
      };

      const response = await fetch(`/api/properties/${editingProperty.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(propertyData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update property');
      }

      const updatedProperty = await response.json();
      setProperties(properties.map(p => p.id === editingProperty.id ? updatedProperty : p));
      setShowPropertyModal(false);
      setEditingProperty(null);
      resetForm();
      fetchData(); // Refresh stats
      alert('Property updated successfully!');
    } catch (error) {
      console.error('Error updating property:', error);
      alert(error.message);
    }
  };

  const handleDeleteProperty = async (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/properties/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete property');
        }

        setProperties(properties.filter(p => p.id !== id));
        alert('Property deleted successfully!');
      } catch (error) {
        console.error('Error deleting property:', error);
        alert(error.message);
      }
    }
  };

  const handleBookingAction = async (bookingId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/properties/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update booking');
      }

      // Refresh data to get updated stats
      fetchData();
      alert(`Booking ${status.toLowerCase()} successfully!`);
    } catch (error) {
      console.error('Error updating booking:', error);
      alert(error.message);
    setSelectedImages([]);
    setImagePreview([]);
    }
  };

  const resetForm = () => {
    setPropertyForm({
      title: '',
      propertyType: 'Apartment',
      address: '',
      city: '',
      bedrooms: 1,
      bathrooms: 1,
      area: '',
      rentPrice: '',
      securityDeposit: '',
      amenities: [],
      description: '',
      availability: 'Available'
    });
    setSelectedImages([]);
    setImagePreview([]);
    setMapCoordinates({ lat: 27.7172, lng: 85.3240 }); // Reset to default
  };

  const toggleAmenity = (amenity) => {
    setPropertyForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  // Reverse geocode coordinates to get address with debouncing
  const reverseGeocode = async (lat, lng, immediate = false) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If immediate, fetch right away, otherwise debounce
    const fetchAddress = async () => {
      setFetchingAddress(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en'
            }
          }
        );
        const data = await response.json();
        
        if (data && data.address) {
          const address = data.address;
          // Extract meaningful address components
          const street = address.road || address.neighbourhood || address.suburb || address.hamlet || '';
          const city = address.city || address.town || address.village || address.county || address.state || '';
          const displayAddress = address.display_name || '';
          
          // Update form with fetched address smoothly
          setPropertyForm(prev => ({
            ...prev,
            address: street || displayAddress.split(',')[0] || 'Selected Location',
            city: city || 'Kathmandu'
          }));
          
          setFetchingAddress(false);
          return { street, city, fullAddress: displayAddress };
        }
      } catch (error) {
        console.error('Error reverse geocoding:', error);
        setFetchingAddress(false);
      }
      setFetchingAddress(false);
      return null;
    };

    if (immediate) {
      return fetchAddress();
    } else {
      // Debounce for smoother experience during dragging
      debounceTimerRef.current = setTimeout(fetchAddress, 800);
    }
  };

  // Geocode address to get coordinates (optional - for manual search)
  const geocodeAddress = async () => {
    const fullAddress = `${propertyForm.address}, ${propertyForm.city}, Nepal`;
    if (!propertyForm.address || !propertyForm.city) {
      alert('Please enter both address and city first');
      return;
    }

    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setMapCoordinates({ lat: parseFloat(lat), lng: parseFloat(lon) });
        setShowLocationMap(true);
      } else {
        alert('Location not found. Please check the address.');
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      alert('Failed to find location. Please try again.');
    }
  };

  // Search location on map
  const searchLocationOnMap = async () => {
    if (!mapSearchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery + ', Nepal')}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newCoords = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setMapCoordinates(newCoords);
        await reverseGeocode(parseFloat(lat), parseFloat(lon), true);
      } else {
        alert('Location not found. Try a different search term.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Failed to search location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Open map for location picking (map-first approach)
  const openMapPicker = () => {
    setShowLocationMap(true);
    setMapSearchQuery(propertyForm.address || '');
  };

  // Map update component to center map when coordinates change
  const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(center, 13);
      // Invalidate size to fix rendering issues
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }, [center, map]);
    return null;
  };

  // Component to force map resize on mount
  const MapInitializer = () => {
    const map = useMap();
    useEffect(() => {
      // Force map to recalculate size after mounting
      const timer = setTimeout(() => {
        map.invalidateSize(true);
      }, 250);
      return () => clearTimeout(timer);
    }, [map]);
    return null;
  };

  // Component to handle map clicks
  const MapClickHandler = () => {
    const map = useMap();
    useEffect(() => {
      const handleClick = async (e) => {
        const { lat, lng } = e.latlng;
        setMapCoordinates({ lat, lng });
        // Reverse geocode to get address (immediate for clicks)
        await reverseGeocode(lat, lng, true);
      };
      map.on('click', handleClick);
      return () => {
        map.off('click', handleClick);
      };
    }, [map]);
    return null;
  };

  // Render professional interactive Leaflet map
  const renderLocationMap = () => {
    if (!showLocationMap) return null;

    return (
      <div className="map-modal-overlay" onClick={() => setShowLocationMap(false)}>
        <div className="map-modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="map-modal-header">
            <div className="map-header-content">
              <h3>📍 Select Property Location</h3>
              <p className="map-subtitle">Search or click on the map to pin your property</p>
            </div>
            <button 
              type="button" 
              className="map-modal-close"
              onClick={() => setShowLocationMap(false)}
              title="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Search Bar on Map */}
          <div className="map-search-container">
            <div className="map-search-box">
              <input
                type="text"
                placeholder="Search for a location (e.g., Thamel, Kathmandu)"
                value={mapSearchQuery}
                onChange={(e) => setMapSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchLocationOnMap()}
                className="map-search-input"
              />
              {mapSearchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setMapSearchQuery('')}
                >
                  ×
                </button>
              )}
              <button
                type="button"
                className="search-submit-btn"
                onClick={searchLocationOnMap}
                disabled={isSearching || !mapSearchQuery.trim()}
              >
                {isSearching ? (
                  <div className="spinner-tiny"></div>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>

          <div className="map-view-wrapper">
            <MapContainer
              center={[mapCoordinates.lat, mapCoordinates.lng]}
              zoom={13}
              zoomControl={true}
              scrollWheelZoom={true}
              doubleClickZoom={true}
              dragging={true}
              touchZoom={true}
              zoomAnimation={true}
              fadeAnimation={true}
              markerZoomAnimation={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapInitializer />
              <MapUpdater center={[mapCoordinates.lat, mapCoordinates.lng]} />
              <MapClickHandler />
              <Marker 
                position={[mapCoordinates.lat, mapCoordinates.lng]}
                draggable={true}
                icon={createCustomIcon()}
                eventHandlers={{
                  dragend: async (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    setMapCoordinates({ lat: position.lat, lng: position.lng });
                    await reverseGeocode(position.lat, position.lng, true);
                  },
                }}
              >
                <Popup>
                  <div className="custom-popup">
                    <strong>{propertyForm.title || 'Selected Location'}</strong>
                    {propertyForm.address && propertyForm.city && (
                      <p>{propertyForm.address}, {propertyForm.city}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          <div className="map-modal-footer">
            <div className="location-info">
              {fetchingAddress ? (
                <div className="location-status fetching">
                  <div className="spinner-small"></div>
                  <span>Finding address...</span>
                </div>
              ) : propertyForm.address ? (
                <div className="location-status success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <div>
                    <strong>{propertyForm.address}</strong>
                    <span>{propertyForm.city}</span>
                  </div>
                </div>
              ) : (
                <div className="location-status info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <span>Click on map or search to select location</span>
                </div>
              )}
            </div>
            <div className="map-action-buttons">
              <a 
                href={`https://www.google.com/maps?q=${mapCoordinates.lat},${mapCoordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-map-secondary"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                View in Google Maps
              </a>
              <button
                type="button"
                className="btn-map-primary"
                onClick={() => setShowLocationMap(false)}
                disabled={!propertyForm.address}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const openGallery = (images, startIndex = 0) => {
    const imageUrls = images.map(img => `http://localhost:5000/uploads/properties/${img}`);
    setGalleryImages(imageUrls);
    setCurrentImageIndex(startIndex);
    setShowGallery(true);
  };

  const closeGallery = () => {
    setShowGallery(false);
    setGalleryImages([]);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleKeyPress = (e) => {
    if (!showGallery) return;
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') closeGallery();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showGallery, galleryImages]);

  const renderOverview = () => (
    <div className="overview-container">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.totalProperties}</h3>
            <p className="stat-label">Total Properties</p>
            <p className="stat-description">{stats.availableProperties} currently available</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
          </div>
          <div className="stat-content">
            <h3 className="stat-number">NPR {stats.monthlyRevenue.toLocaleString()}</h3>
            <p className="stat-label">Monthly Revenue</p>
            <p className="stat-description">From active leases</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.activeTenants}</h3>
            <p className="stat-label">Active Tenants</p>
            <p className="stat-description">{bookings.length} total bookings</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.totalViews}</h3>
            <p className="stat-label">Total Views</p>
            <p className="stat-description">{stats.totalInquiries} inquiries received</p>
          </div>
        </div>
      </div>

      {/* Bookings Section */}
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Recent Booking Requests</h2>
            <p className="section-subtitle">Manage your property booking requests</p>
          </div>
          <button className="btn-outline" onClick={() => setActiveTab('bookings')}>View All</button>
        </div>
        
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Property</th>
                <th>Move-in Date</th>
                <th>Monthly Rent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length > 0 ? bookings.slice(0, 5).map(booking => (
                <tr key={booking.id}>
                  <td>
                    <div className="tenant-info">
                      <div className="tenant-avatar">
                        {booking.tenant?.fullName?.[0] || 'T'}
                      </div>
                      <div>
                        <div className="tenant-name">{booking.tenant?.fullName || 'N/A'}</div>
                        <div className="tenant-email">{booking.tenant?.email || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="property-cell">{booking.property?.title || 'N/A'}</td>
                  <td>{new Date(booking.moveInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="price-cell">NPR {parseInt(booking.monthlyRent).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {booking.status === 'Pending' && (
                        <>
                          <button className="btn-sm btn-success" onClick={() => handleBookingAction(booking.id, 'Approved')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Approve
                          </button>
                          <button className="btn-sm btn-danger" onClick={() => handleBookingAction(booking.id, 'Rejected')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            Reject
                          </button>
                        </>
                      )}
                      {booking.status !== 'Pending' && <span className="text-muted">No actions</span>}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <p>No booking requests yet</p>
                      <span>Booking requests will appear here when tenants show interest in your properties</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Filter and sort properties
  const getFilteredAndSortedProperties = () => {
    let filtered = [...properties];
    
    // Apply search filter
    if (propertySearch) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(propertySearch.toLowerCase()) ||
        p.address.toLowerCase().includes(propertySearch.toLowerCase()) ||
        p.city.toLowerCase().includes(propertySearch.toLowerCase())
      );
    }
    
    // Apply status filter
    if (propertyFilter !== 'all') {
      filtered = filtered.filter(p => {
        if (propertyFilter === 'available') return p.status === 'Available';
        if (propertyFilter === 'rented') return p.status === 'Rented';
        if (propertyFilter === 'pending') return p.status === 'Pending';
        return true;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (propertySortBy === 'newest') return b.id - a.id;
      if (propertySortBy === 'price-high') return parseInt(b.rentPrice) - parseInt(a.rentPrice);
      if (propertySortBy === 'price-low') return parseInt(a.rentPrice) - parseInt(b.rentPrice);
      if (propertySortBy === 'views') return (b.viewCount || 0) - (a.viewCount || 0);
      return 0;
    });
    
    return filtered;
  };

  const renderProperties = () => {
    const filteredProperties = getFilteredAndSortedProperties();
    
    return (
    <div className="properties-container">
      <div className="properties-toolbar">
        <div className="toolbar-left">
          <div className="search-box-properties">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search properties by title, location..."
              value={propertySearch}
              onChange={(e) => setPropertySearch(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <select 
              className="filter-select"
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="pending">Pending</option>
            </select>
            
            <select 
              className="filter-select"
              value={propertySortBy}
              onChange={(e) => setPropertySortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
              <option value="views">Most Viewed</option>
            </select>
          </div>
        </div>
        
        <div className="toolbar-right">
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
          
          <button className="btn-primary" onClick={() => { setEditingProperty(null); resetForm(); setImagePreview([]); setSelectedImages([]); setShowPropertyModal(true); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Property
          </button>
        </div>
      </div>

      {filteredProperties.length > 0 && (
        <div className="properties-stats-bar">
          <span className="stats-text">
            Showing <strong>{filteredProperties.length}</strong> of <strong>{properties.length}</strong> properties
          </span>
          <div className="stats-chips">
            <span className="chip chip-success">{properties.filter(p => p.status === 'Available').length} Available</span>
            <span className="chip chip-danger">{properties.filter(p => p.status === 'Rented').length} Rented</span>
            <span className="chip chip-warning">{properties.filter(p => p.status === 'Pending').length} Pending</span>
          </div>
        </div>
      )}

      <div className={`properties-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
        {filteredProperties.length > 0 ? filteredProperties.map(property => {
          const imageUrl = property.images && property.images.length > 0 
            ? `http://localhost:5000/uploads/properties/${property.images[0]}` 
            : 'https://via.placeholder.com/400x300?text=No+Image';
          
          return (
          <div key={property.id} className={`property-card-modern ${viewMode === 'list' ? 'list-card' : ''}`}>
            <div 
              className="property-image-wrapper"
              onClick={() => {
                if (property.images && property.images.length > 0) {
                  openGallery(property.images, 0);
                }
              }}
              style={{ cursor: property.images && property.images.length > 0 ? 'pointer' : 'default' }}
            >
              <img 
                src={imageUrl}
                alt={property.title}
                className="property-image-modern"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                }}
              />
              <div className="property-overlay">
                <span className={`property-status-badge status-${property.status.toLowerCase().replace(' ', '-')}`}>
                  {property.status}
                </span>
                {property.images && property.images.length > 1 && (
                  <span className="image-count-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    {property.images.length}
                  </span>
                )}
              </div>
              {viewMode === 'list' && (
                <div className="property-quick-stats">
                  <div className="quick-stat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    {property.viewCount || 0}
                  </div>
                  <div className="quick-stat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    {property.inquiryCount || 0}
                  </div>
                </div>
              )}
            </div>
            
            <div className="property-card-content">
              <div className="property-header">
                <h3 className="property-title">{property.title}</h3>
                <div className="property-type-badge">{property.propertyType}</div>
              </div>
              
              <p className="property-location">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {property.address}, {property.city}
              </p>
              
              <div className="property-features">
                <div className="feature-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  {property.bedrooms} Bed
                </div>
                <div className="feature-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  {property.bathrooms} Bath
                </div>
                <div className="feature-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                  {property.area} sq ft
                </div>
              </div>

              <div className="property-price-section">
                <div>
                  <span className="price-label">Monthly Rent</span>
                  <span className="price-value">NPR {parseInt(property.rentPrice).toLocaleString()}</span>
                </div>
                {viewMode === 'list' && property.securityDeposit && (
                  <div>
                    <span className="price-label">Security Deposit</span>
                    <span className="price-value-small">NPR {parseInt(property.securityDeposit).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {viewMode === 'grid' && (
                <div className="property-metrics">
                  <div className="metric-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span>{property.viewCount || 0} views</span>
                  </div>
                  <div className="metric-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>{property.inquiryCount || 0} inquiries</span>
                  </div>
                </div>
              )}

              <div className="property-actions-modern">
                <button className="btn-action edit" onClick={() => handleEditProperty(property)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  {viewMode === 'list' ? 'Edit' : 'Edit'}
                </button>
                <button className="btn-action view" onClick={() => {
                  if (property.images && property.images.length > 0) {
                    openGallery(property.images, 0);
                  }
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  {viewMode === 'list' ? 'View' : 'View'}
                </button>
                <button className="btn-action delete" onClick={() => handleDeleteProperty(property.id)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  {viewMode === 'list' ? 'Delete' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
          );
        }) : (
          <div className="empty-state-large">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <h3>{propertySearch || propertyFilter !== 'all' ? 'No properties found' : 'No properties yet'}</h3>
            <p>
              {propertySearch || propertyFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Start by adding your first property to manage and track rentals'}
            </p>
            {!propertySearch && propertyFilter === 'all' && (
              <button className="btn-primary" onClick={() => { setEditingProperty(null); resetForm(); setImagePreview([]); setSelectedImages([]); setShowPropertyModal(true); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Your First Property
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
  };

  const renderPropertyModal = () => (
    <div className="modal-backdrop-modern" onClick={() => { setShowPropertyModal(false); setEditingProperty(null); resetForm(); setImagePreview([]); setSelectedImages([]); }}>
      <div className="modal-dialog-modern" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-modern">
          <h2 className="modal-title-modern">{editingProperty ? 'Edit Property' : 'Add New Property'}</h2>
          <button className="modal-close-btn-modern" onClick={() => { setShowPropertyModal(false); setEditingProperty(null); resetForm(); setImagePreview([]); setSelectedImages([]); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <form onSubmit={editingProperty ? handleUpdateProperty : handleAddProperty} className="modal-body-modern">
          <div className="form-section">
            <h3 className="form-section-title">Basic Information</h3>
            
            <div className="form-row">
              <div className="form-field full-width">
                <label className="form-label">
                  Property Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={propertyForm.title}
                  onChange={(e) => setPropertyForm({ ...propertyForm, title: e.target.value })}
                  placeholder="e.g., Spacious 2 BHK Apartment in Kathmandu"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">
                  Property Type <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={propertyForm.propertyType}
                  onChange={(e) => setPropertyForm({ ...propertyForm, propertyType: e.target.value })}
                  required
                >
                  <option value="Apartment">Apartment</option>
                  <option value="Room">Room</option>
                  <option value="House">House</option>
                  <option value="Villa">Villa</option>
                  <option value="Studio">Studio</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">
                  City <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={propertyForm.city}
                  onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })}
                  placeholder="e.g., Kathmandu"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field full-width">
                <label className="form-label">
                  Full Address <span className="required">*</span>
                </label>
                <div className="address-input-group">
                  <input
                    type="text"
                    className="form-input"
                    value={propertyForm.address}
                    onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                    placeholder="Click 'Pick from Map' to auto-fill address"
                    required
                  />
                  <button
                    type="button"
                    className="btn-pick-map"
                    onClick={openMapPicker}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Pick from Map
                  </button>
                </div>
                <p className="field-hint">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '14px', height: '14px', display: 'inline-block', marginRight: '4px'}}>
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  Click the button to open an interactive map and select your property location. Address will be filled automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Property Details</h3>
            
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">
                  Bedrooms <span className="required">*</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  value={propertyForm.bedrooms}
                  onChange={(e) => setPropertyForm({ ...propertyForm, bedrooms: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label">
                  Bathrooms <span className="required">*</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  value={propertyForm.bathrooms}
                  onChange={(e) => setPropertyForm({ ...propertyForm, bathrooms: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label">
                  Area (sq ft) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={propertyForm.area}
                  onChange={(e) => setPropertyForm({ ...propertyForm, area: e.target.value })}
                  placeholder="e.g., 1200"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Pricing</h3>
            
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">
                  Monthly Rent (NPR) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={propertyForm.rentPrice}
                  onChange={(e) => setPropertyForm({ ...propertyForm, rentPrice: e.target.value })}
                  placeholder="e.g., 25000"
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label">
                  Security Deposit (NPR) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={propertyForm.securityDeposit}
                  onChange={(e) => setPropertyForm({ ...propertyForm, securityDeposit: e.target.value })}
                  placeholder="e.g., 50000"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Amenities</h3>
            <div className="amenities-grid-modern">
              {amenitiesList.map(amenity => (
                <label key={amenity} className="amenity-checkbox-modern">
                  <input
                    type="checkbox"
                    checked={propertyForm.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="amenity-label">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Description</h3>
            <div className="form-row">
              <div className="form-field full-width">
                <label className="form-label">Property Description</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  value={propertyForm.description}
                  onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                  placeholder="Describe your property, its unique features, nearby facilities, etc."
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Property Images</h3>
            <div className="form-row">
              <div className="form-field full-width">
                <label className="form-label">Upload Images (Up to 10)</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="file-input-hidden"
                    id="property-images"
                  />
                  <label htmlFor="property-images" className="file-upload-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>Click to upload or drag and drop</span>
                    <span className="file-upload-hint">PNG, JPG up to 5MB each</span>
                  </label>
                </div>
                {imagePreview.length > 0 && (
                  <div className="image-preview-grid-modern">
                    {imagePreview.map((preview, index) => (
                      <div key={index} className="image-preview-item-modern">
                        <img src={preview} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-image-btn-modern"
                          onClick={() => removeImage(index)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {uploadingImages && (
                  <div className="uploading-indicator">
                    <div className="spinner-small"></div>
                    <span>Uploading images...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer-modern">
            <button type="button" className="btn-secondary" onClick={() => { setShowPropertyModal(false); setEditingProperty(null); resetForm(); setImagePreview([]); setSelectedImages([]); }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {editingProperty ? 'Update Property' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderGallery = () => {
    if (!showGallery || galleryImages.length === 0) return null;

    return (
      <div className="gallery-modal" onClick={closeGallery}>
        <div className="gallery-content" onClick={(e) => e.stopPropagation()}>
          <button className="gallery-close" onClick={closeGallery}>×</button>
          
          <div className="gallery-main">
            <img 
              src={galleryImages[currentImageIndex]} 
              alt={`Image ${currentImageIndex + 1}`}
              className="gallery-image"
            />
          </div>

          {galleryImages.length > 1 && (
            <>
              <button className="gallery-nav gallery-prev" onClick={prevImage}>‹</button>
              <button className="gallery-nav gallery-next" onClick={nextImage}>›</button>
              
              <div className="gallery-counter">
                {currentImageIndex + 1} / {galleryImages.length}
              </div>

              <div className="gallery-thumbnails">
                {galleryImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    className={`gallery-thumb ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="property-dashboard">
      {showGallery && renderGallery()}
      
      {/* Modern Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon-wrapper">
              <svg className="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            {!sidebarCollapsed && <span className="brand-name">RentHive</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarCollapsed ? (
                <path d="M9 18l6-6-6-6"/>
              ) : (
                <path d="M15 18l-6-6 6-6"/>
              )}
            </svg>
          </button>
        </div>

        <div className="user-profile">
          <div className="user-avatar-container">
            {profilePicture ? (
              <img src={`http://localhost:5000/uploads/profiles/${profilePicture}`} alt="Profile" className="user-avatar-img" />
            ) : (
              <div className="user-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            )}
            <label className="avatar-upload-btn" title="Upload profile picture">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleProfilePictureUpload}
                style={{ display: 'none' }}
                disabled={uploadingProfile}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </label>
          </div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <p className="user-name">{user?.businessName || user?.fullName || 'Vendor'}</p>
              <p className="user-role">Property Owner</p>
            </div>
          )}
        </div>

        <nav className="sidebar-menu">
          <div className="menu-section">
            <button 
              className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`} 
              onClick={() => setActiveTab('overview')}
              title="Overview"
            >
              <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              {!sidebarCollapsed && <span>Overview</span>}
            </button>
            <button 
              className={`menu-item ${activeTab === 'properties' ? 'active' : ''}`} 
              onClick={() => setActiveTab('properties')}
              title="My Properties"
            >
              <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              {!sidebarCollapsed && <span>My Properties</span>}
            </button>
            <button 
              className={`menu-item ${activeTab === 'bookings' ? 'active' : ''}`} 
              onClick={() => setActiveTab('bookings')}
              title="Bookings"
            >
              <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {!sidebarCollapsed && <span>Bookings</span>}
              {bookings.length > 0 && <span className="badge">{bookings.length}</span>}
            </button>
            <button 
              className={`menu-item ${activeTab === 'tenants' ? 'active' : ''}`} 
              onClick={() => setActiveTab('tenants')}
              title="Tenants"
            >
              <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              {!sidebarCollapsed && <span>Tenants</span>}
            </button>
            <button 
              className={`menu-item ${activeTab === 'payments' ? 'active' : ''}`} 
              onClick={() => setActiveTab('payments')}
              title="Payments"
            >
              <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              {!sidebarCollapsed && <span>Payments</span>}
            </button>
            <button 
              className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`} 
              onClick={() => setActiveTab('settings')}
              title="Settings"
            >
              <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m5.66-14.66l-4.24 4.24m0 8.48l4.24 4.24M23 12h-6m-6 0H1m14.66 5.66l-4.24-4.24m0-8.48l4.24-4.24"/>
              </svg>
              {!sidebarCollapsed && <span>Settings</span>}
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button" onClick={() => { logout(); navigate('/login'); }} title="Logout">
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Modern Main Content */}
      <main className="main-content">
        <div className="content-header">
          <div className="header-left">
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <p className="header-subtitle">
              {activeTab === 'overview' && 'Welcome back! Here\'s your dashboard overview'}
              {activeTab === 'properties' && 'Manage all your properties in one place'}
              {activeTab === 'bookings' && 'View and manage booking requests'}
              {activeTab === 'tenants' && 'Manage your tenant relationships'}
              {activeTab === 'payments' && 'Track all your payments and transactions'}
              {activeTab === 'settings' && 'Customize your account preferences'}
            </p>
          </div>
          <div className="header-actions">
            <button className="icon-btn" title="Search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            <button className="icon-btn notification-btn" title="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {bookings.length > 0 && <span className="notification-dot"></span>}
            </button>
            <div className="user-menu">
              {profilePicture ? (
                <img 
                  src={`http://localhost:5000/uploads/profiles/${profilePicture}`} 
                  alt={user?.fullName || 'User'} 
                  className="header-user-avatar"
                />
              ) : (
                <div className="header-user-avatar-placeholder">
                  {user?.fullName?.[0] || user?.businessName?.[0] || 'U'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="content-area">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'properties' && renderProperties()}
          {activeTab === 'bookings' && renderOverview()}
          {activeTab === 'tenants' && (
            <div className="placeholder-content">
              <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <h2>Tenants Management</h2>
              <p>This feature is coming soon. You'll be able to manage all your tenant relationships here.</p>
            </div>
          )}
          {activeTab === 'payments' && (
            <div className="placeholder-content">
              <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <h2>Payment History</h2>
              <p>Track all your payments and transactions in one place. Coming soon.</p>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="placeholder-content">
              <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m5.66-14.66l-4.24 4.24m0 8.48l4.24 4.24M23 12h-6m-6 0H1m14.66 5.66l-4.24-4.24m0-8.48l4.24-4.24"/>
              </svg>
              <h2>Account Settings</h2>
              <p>Customize your account preferences and manage your profile. Coming soon.</p>
            </div>
          )}
        </div>
      </main>

      {showPropertyModal && renderPropertyModal()}
      {renderLocationMap()}
    </div>
  );
};

export default PropertyManagementDashboard;
