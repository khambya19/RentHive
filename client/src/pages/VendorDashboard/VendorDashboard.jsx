import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './VendorDashboard.css';

const VendorDashboard = () => {
  console.log('🎨 VendorDashboard component rendering...');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    serviceType: [],
    ownershipType: [],
    location: [],
    experienceLevel: [],
    priceRange: [1000, 50000],
    availability: [],
    rating: []
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [vendors, setVendors] = useState([]);
  const [favoriteVendors, setFavoriteVendors] = useState([]);

  // Fetch vendors from API
  useEffect(() => {
    console.log('VendorDashboard mounted, calling fetchVendors...');
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      console.log('Fetching vendors from /api/vendors...');
      const response = await fetch('/api/vendors');
      console.log('Response received:', response.status, response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Vendors data received:', data);
      console.log('Number of vendors:', data.vendors?.length);
      
      if (data.success) {
        setVendors(data.vendors || []);
        console.log('✅ Successfully set vendors:', data.vendors.length);
      } else {
        console.error('❌ API returned success:false', data);
      }
    } catch (error) {
      console.error('❌ Error fetching vendors:', error);
      console.error('Error details:', error.message);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const getVendorInitials = (businessName) => {
    if (!businessName) return '?';
    return businessName
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getCardColor = (index) => {
    const colors = ['purple-card', 'blue-card', 'green-card', 'pink-card', 'gray-card'];
    return colors[index % colors.length];
  };

  const handleFilterChange = (category, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  const handlePriceChange = (values) => {
    setFilters(prev => ({
      ...prev,
      priceRange: values
    }));
  };

  const toggleFavorite = (vendorId) => {
    setFavoriteVendors(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const resetFilters = () => {
    setFilters({
      serviceType: [],
      ownershipType: [],
      location: [],
      experienceLevel: [],
      priceRange: [1000, 50000],
      availability: [],
      rating: []
    });
  };

  return (
    <div className="vendor-dashboard">
      {/* Navigation Bar */}
      <nav className="dashboard-navbar">
        <div className="navbar-left">
          <div className="logo">
            <span className="logo-icon">🏠</span>
            <span className="logo-text">RentHive</span>
          </div>
          <div className="nav-links">
            <a href="#home" className="nav-link">Home</a>
            <a href="#messages" className="nav-link">
              Messages
              <span className="notification-badge">4</span>
            </a>
            <a href="#about" className="nav-link">About us</a>
            <a href="#vendors" className="nav-link active">Vendors</a>
            <a href="#community" className="nav-link">Community</a>
          </div>
        </div>
        <div className="navbar-right">
          <button className="icon-btn">⚙️</button>
          <button className="icon-btn">🔔</button>
          <div className="user-avatar">
            <img src="https://via.placeholder.com/40" alt="User" />
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
          <div className="filters-header">
            <h2>Filters</h2>
            <button className="reset-btn" onClick={resetFilters}>Reset all</button>
          </div>

          {/* Service Type Filter */}
          <div className="filter-section">
            <h3>Service Type</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.serviceType.includes('Plumbing')}
                onChange={() => handleFilterChange('serviceType', 'Plumbing')}
              />
              <span>Plumbing</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.serviceType.includes('Electrical')}
                onChange={() => handleFilterChange('serviceType', 'Electrical')}
              />
              <span>Electrical</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.serviceType.includes('Cleaning')}
                onChange={() => handleFilterChange('serviceType', 'Cleaning')}
              />
              <span>Cleaning</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.serviceType.includes('Landscaping')}
                onChange={() => handleFilterChange('serviceType', 'Landscaping')}
              />
              <span>Landscaping</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.serviceType.includes('HVAC')}
                onChange={() => handleFilterChange('serviceType', 'HVAC')}
              />
              <span>HVAC</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.serviceType.includes('Painting')}
                onChange={() => handleFilterChange('serviceType', 'Painting')}
              />
              <span>Painting</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.serviceType.includes('Carpentry')}
                onChange={() => handleFilterChange('serviceType', 'Carpentry')}
              />
              <span>Carpentry</span>
            </label>
          </div>

          {/* Price Range Filter */}
          <div className="filter-section">
            <h3>Price Range ($)</h3>
            <div className="salary-chart">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="salary-bar"
                  style={{ height: `${Math.random() * 100}%` }}
                ></div>
              ))}
              <div className="salary-selector"></div>
            </div>
            <div className="salary-inputs">
              <div className="salary-input">
                <input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) => handlePriceChange([parseInt(e.target.value), filters.priceRange[1]])}
                />
                <span>$</span>
              </div>
              <div className="salary-input">
                <input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceChange([filters.priceRange[0], parseInt(e.target.value)])}
                />
                <span>$</span>
              </div>
            </div>
          </div>

          {/* Ownership Type Filter */}
          <div className="filter-section">
            <h3>Ownership Type</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.ownershipType.includes('Individual')}
                onChange={() => handleFilterChange('ownershipType', 'Individual')}
              />
              <span>Individual</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.ownershipType.includes('Company')}
                onChange={() => handleFilterChange('ownershipType', 'Company')}
              />
              <span>Company</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.ownershipType.includes('Partnership')}
                onChange={() => handleFilterChange('ownershipType', 'Partnership')}
              />
              <span>Partnership</span>
            </label>
          </div>

          {/* Experience Level Filter */}
          <div className="filter-section">
            <h3>Experience Level</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.experienceLevel.includes('1-2 years')}
                onChange={() => handleFilterChange('experienceLevel', '1-2 years')}
              />
              <span>1-2 years</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.experienceLevel.includes('3-5 years')}
                onChange={() => handleFilterChange('experienceLevel', '3-5 years')}
              />
              <span>3-5 years</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.experienceLevel.includes('5-10 years')}
                onChange={() => handleFilterChange('experienceLevel', '5-10 years')}
              />
              <span>5-10 years</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.experienceLevel.includes('10+ years')}
                onChange={() => handleFilterChange('experienceLevel', '10+ years')}
              />
              <span>10+ years</span>
            </label>
          </div>

          {/* Availability Filter */}
          <div className="filter-section">
            <h3>Availability</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.availability.includes('Weekdays')}
                onChange={() => handleFilterChange('availability', 'Weekdays')}
              />
              <span>Weekdays</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.availability.includes('Weekends')}
                onChange={() => handleFilterChange('availability', 'Weekends')}
              />
              <span>Weekends</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.availability.includes('24/7')}
                onChange={() => handleFilterChange('availability', '24/7')}
              />
              <span>24/7 Available</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.availability.includes('Emergency')}
                onChange={() => handleFilterChange('availability', 'Emergency')}
              />
              <span>Emergency Service</span>
            </label>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {/* Search Bar */}
          <div className="search-container">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search vendors by business name, service type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="active-filters">
              <button className="filter-pill">
                All Vendors
                <span className="remove-filter">✕</span>
              </button>
              <button className="filter-pill">
                Verified Vendors
                <span className="remove-filter">✕</span>
              </button>
            </div>
          </div>

          {/* Vendor Cards Grid */}
          <div className="vendors-grid">
            {(() => {
              console.log('Rendering vendors grid. Loading:', loading, 'Vendors count:', vendors.length);
              return null;
            })()}
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading vendors...</p>
              </div>
            ) : vendors.length === 0 ? (
              <div className="no-vendors">
                <h3>No vendors found</h3>
                <p>Be the first vendor to register!</p>
                <button className="btn-primary" onClick={() => navigate('/register-vendor')}>
                  Register as Vendor
                </button>
              </div>
            ) : (
              <>
                {vendors.map((vendor, index) => (
                  <div key={vendor.id} className={`vendor-card ${getCardColor(index)}`}>
                    <div className="card-header">
                      <div className="vendor-info">
                        <h3 className="vendor-title">{vendor.businessName}</h3>
                        <p className="vendor-business">Owner: {vendor.ownerName}</p>
                        <p className="vendor-type">{vendor.ownershipType}</p>
                      </div>
                      <div className="vendor-logo">
                        {vendor.profileImage ? (
                          <img src={vendor.profileImage} alt={vendor.businessName} />
                        ) : (
                          <div className="vendor-initials">
                            {getVendorInitials(vendor.businessName)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="card-details">
                      <div className="detail-item">
                        <span className="icon">📍</span>
                        <span>{vendor.address}</span>
                      </div>
                      <div className="detail-item">
                        <span className="icon">📧</span>
                        <span>{vendor.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="icon">📞</span>
                        <span>{vendor.phone}</span>
                      </div>
                      <div className="detail-item">
                        <span className="icon">📅</span>
                        <span>Joined: {vendor.joinDate}</span>
                      </div>
                    </div>
                    <div className="card-tags">
                      <span className="tag">{vendor.ownershipType}</span>
                      <span className="tag">Verified</span>
                    </div>
                    <div className="card-actions">
                      <button className="btn-primary" onClick={() => window.location.href = `tel:${vendor.phone}`}>
                        Contact now
                      </button>
                      <button
                        className={`btn-icon ${favoriteVendors.includes(vendor.id) ? 'active' : ''}`}
                        onClick={() => toggleFavorite(vendor.id)}
                      >
                        ❤️
                      </button>
                    </div>
                  </div>
                ))}

                {/* Premium Card */}
                <div className="vendor-card premium-card">
                  <div className="premium-content">
                    <h2 className="premium-title">
                      Find your<br />
                      perfect <span className="highlight">vendor</span>
                    </h2>
                    <p className="premium-text">
                      Get premium access!<br />
                      Connect with top-rated<br />
                      vendors instantly!
                    </p>
                    <button className="btn-premium">Get PRO for $12 per month</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default VendorDashboard;
