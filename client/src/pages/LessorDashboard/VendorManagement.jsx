import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './VendorManagement.css';

const VendorManagement = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    ownershipType: 'all',
    location: '',
    serviceType: 'all'
  });
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    byOwnership: []
  });

  useEffect(() => {
    fetchVendors();
    fetchVendorStats();
  }, []);

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      if (filters.ownershipType !== 'all') queryParams.append('ownershipType', filters.ownershipType);
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.serviceType !== 'all') queryParams.append('serviceType', filters.serviceType);
      if (searchQuery) queryParams.append('search', searchQuery);

      const response = await fetch(`http://localhost:3001/api/vendors?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      } else {
        console.error('Failed to fetch vendors');
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/vendors/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
    }
  };

  const fetchVendorDetails = async (vendorId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/vendors/${vendorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedVendor(data.vendor);
        setShowVendorModal(true);
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vendor.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  useEffect(() => {
    fetchVendors();
  }, [filters, searchQuery]);

  const renderOverview = () => (
    <div className="vendor-overview">
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.total || 0}</h3>
            <p>Total Vendors</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.verified || 0}</h3>
            <p>Verified Vendors</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4"/>
              <path d="M12 16h.01"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.pending || 0}</h3>
            <p>Pending Verification</p>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.byOwnership?.reduce((acc, item) => acc + (item.count || 0), 0) || 0}</h3>
            <p>Active Listings</p>
          </div>
        </div>
      </div>

      <div className="overview-charts">
        <div className="chart-container">
          <h3>Vendor Distribution by Ownership Type</h3>
          <div className="ownership-breakdown">
            {stats.byOwnership?.map((item, index) => (
              <div key={index} className="ownership-item">
                <div className="ownership-bar">
                  <div 
                    className="ownership-fill" 
                    style={{ 
                      width: `${(item.count / stats.total) * 100}%`,
                      backgroundColor: index === 0 ? '#007bff' : index === 1 ? '#28a745' : '#ffc107'
                    }}
                  />
                </div>
                <div className="ownership-label">
                  <span>{item.ownershipType || 'Individual'}</span>
                  <span>{item.count} ({((item.count / stats.total) * 100).toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="recent-vendors">
          <h3>Recent Vendor Registrations</h3>
          <div className="recent-list">
            {vendors.slice(0, 5).map(vendor => (
              <div key={vendor.id} className="recent-item">
                <div className="vendor-avatar">
                  {vendor.profileImage ? (
                    <img 
                      src={`http://localhost:3001/uploads/profiles/${vendor.profileImage}`} 
                      alt={vendor.ownerName}
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {vendor.ownerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="vendor-info">
                  <h4>{vendor.businessName}</h4>
                  <p>{vendor.ownerName}</p>
                  <span className="join-date">{vendor.joinDate}</span>
                </div>
                <button 
                  className="btn-view-vendor"
                  onClick={() => fetchVendorDetails(vendor.id)}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderVendorList = () => (
    <div className="vendor-list-section">
      <div className="list-header">
        <div className="search-filters">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search vendors by name, business, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <select 
              value={filters.ownershipType}
              onChange={(e) => setFilters({...filters, ownershipType: e.target.value})}
            >
              <option value="all">All Ownership Types</option>
              <option value="Individual">Individual</option>
              <option value="Business">Business</option>
              <option value="Corporation">Corporation</option>
            </select>

            <input
              type="text"
              placeholder="Location..."
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
            />
          </div>
        </div>

        <div className="list-stats">
          <span>Showing {filteredVendors.length} of {vendors.length} vendors</span>
        </div>
      </div>

      <div className="vendors-grid">
        {filteredVendors.map(vendor => (
          <div key={vendor.id} className="vendor-card">
            <div className="vendor-header">
              <div className="vendor-avatar">
                {vendor.profileImage ? (
                  <img 
                    src={`http://localhost:3001/uploads/profiles/${vendor.profileImage}`} 
                    alt={vendor.ownerName}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {vendor.ownerName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="vendor-basic-info">
                <h3>{vendor.businessName}</h3>
                <p className="owner-name">Owner: {vendor.ownerName}</p>
                <span className="ownership-badge">{vendor.ownershipType}</span>
              </div>
            </div>

            <div className="vendor-details">
              <div className="detail-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span>{vendor.email}</span>
              </div>
              
              <div className="detail-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span>{vendor.phone}</span>
              </div>

              <div className="detail-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>{vendor.address}</span>
              </div>

              <div className="detail-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Joined: {vendor.joinDate}</span>
              </div>
            </div>

            <div className="vendor-actions">
              <button 
                className="btn-view-details"
                onClick={() => fetchVendorDetails(vendor.id)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                View Details
              </button>
              
              <button className="btn-contact">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Contact
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '64px', height: '64px'}}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <h3>No vendors found</h3>
          <p>Try adjusting your search criteria or filters</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading vendor management...</p>
      </div>
    );
  }

  return (
    <div className="vendor-management">
      <div className="section-header">
        <div>
          <h2>🏪 Vendor Management</h2>
          <p>Manage and monitor all vendors on the RentHive platform</p>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            </svg>
            Overview
          </button>
          
          <button 
            className={`tab ${activeTab === 'vendors' ? 'active' : ''}`}
            onClick={() => setActiveTab('vendors')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            All Vendors
          </button>
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'vendors' && renderVendorList()}
      </div>

      {/* Vendor Detail Modal */}
      {showVendorModal && selectedVendor && (
        <div className="modal-backdrop" onClick={() => setShowVendorModal(false)}>
          <div className="modal-dialog vendor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏪 Vendor Details</h2>
              <button className="modal-close" onClick={() => setShowVendorModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="vendor-profile">
                <div className="profile-header">
                  <div className="profile-avatar">
                    {selectedVendor.profileImage ? (
                      <img 
                        src={`http://localhost:3001/uploads/profiles/${selectedVendor.profileImage}`} 
                        alt={selectedVendor.ownerName}
                      />
                    ) : (
                      <div className="avatar-placeholder large">
                        {selectedVendor.ownerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="profile-info">
                    <h3>{selectedVendor.businessName}</h3>
                    <p className="owner-name">Owner: {selectedVendor.ownerName}</p>
                    <span className="ownership-badge">{selectedVendor.ownershipType}</span>
                    <p className="join-date">Member since: {selectedVendor.joinDate}</p>
                  </div>
                </div>

                <div className="contact-details">
                  <h4>Contact Information</h4>
                  <div className="contact-grid">
                    <div className="contact-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <div>
                        <label>Email</label>
                        <span>{selectedVendor.email}</span>
                      </div>
                    </div>

                    <div className="contact-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <div>
                        <label>Phone</label>
                        <span>{selectedVendor.phone}</span>
                      </div>
                    </div>

                    <div className="contact-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <div>
                        <label>Address</label>
                        <span>{selectedVendor.address}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowVendorModal(false)}>
                Close
              </button>
              <button className="btn-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Contact Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;