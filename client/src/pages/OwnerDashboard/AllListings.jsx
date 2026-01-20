import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './AllListings.css';
import API_BASE_URL, { SERVER_BASE_URL } from '../../config/api';

const AllListings = ({ showSuccess, showError }) => {
  const { user } = useAuth();
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
  }, []);

  const fetchAllListings = async () => {
    setLoading(true);
    await Promise.all([fetchProperties(), fetchBikes()]);
    setLoading(false);
  };

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
    }
  };

  const fetchBikes = async () => {
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
      console.error('Error fetching bikes:', error);
    }
  };

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
      console.error('Error deleting property:', error);
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
      console.error('Error deleting automobile:', error);
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
      console.error('Error updating property:', error);
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
      console.error('Error updating automobile:', error);
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
    <div key={`property-${property.id}`} className="listing-card property-card">
      <div className="listing-badge property">Property</div>
      <div className="listing-image">
        {property.images && property.images.length > 0 ? (
          <img 
            src={`${SERVER_BASE_URL}/uploads/properties/${property.images[0]}`} 
            alt={property.title}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
            }}
          />
        ) : (
          <div className="placeholder-image">🏠</div>
        )}
      </div>
      <div className="listing-content">
        <h3>{property.title}</h3>
        <p className="listing-type">{property.propertyType}</p>
        <p className="listing-location">📍 {property.address}, {property.city}</p>
        <div className="listing-details">
          <span>🛏️ {property.bedrooms} Beds</span>
          <span>🚿 {property.bathrooms} Baths</span>
          <span>📐 {property.area} sq.ft</span>
        </div>
        <div className="listing-pricing">
          <span className="price">NPR {property.rentPrice ? Number(property.rentPrice).toLocaleString() : '0'}/month</span>
          <span className={`status ${property.status?.toLowerCase()}`}>{property.status}</span>
        </div>
      </div>
      <div className="listing-actions">
        <button className="btn-edit" onClick={() => handleEditProperty(property)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </button>
        <button className="btn-delete" onClick={() => handleDeleteProperty(property.id)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  );

  const renderBikeCard = (bike) => (
    <div key={`bike-${bike.id}`} className="listing-card automobile-card">
      <div className="listing-badge automobile">Automobile</div>
      <div className="listing-image">
        {bike.images && bike.images.length > 0 ? (
          <img 
            src={`${SERVER_BASE_URL}/uploads/bikes/${bike.images[0]}`} 
            alt={`${bike.brand} ${bike.model}`}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
            }}
          />
        ) : (
          <div className="placeholder-image">🚴</div>
        )}
      </div>
      <div className="listing-content">
        <h3>{bike.name || `${bike.brand} ${bike.model}`}</h3>
        <p className="listing-type">{bike.type}</p>
        <p className="listing-location">📍 {bike.location}</p>
        <div className="listing-details">
          <span>📅 {bike.year}</span>
          {bike.color && <span>🎨 {bike.color}</span>}
          {bike.registrationNumber && <span>🔢 {bike.registrationNumber}</span>}
        </div>
        <div className="listing-pricing">
          <span className="price">NPR {bike.dailyRate ? Number(bike.dailyRate).toLocaleString() : '0'}/day</span>
          <span className={`status ${bike.status?.toLowerCase()}`}>{bike.status}</span>
        </div>
      </div>
      <div className="listing-actions">
        <button className="btn-edit" onClick={() => handleEditBike(bike)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </button>
        <button className="btn-delete" onClick={() => handleDeleteBike(bike.id)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your listings...</p>
      </div>
    );
  }

  const filteredListings = getFilteredListings();

  return (
    <div className="all-listings">
      <div className="listings-header">
        <div className="listings-stats">
          <div className="stat">
            <span className="stat-number">{properties.length + bikes.length}</span>
            <span className="stat-label">Total Listings</span>
          </div>
          <div className="stat">
            <span className="stat-number">{properties.length}</span>
            <span className="stat-label">Properties</span>
          </div>
          <div className="stat">
            <span className="stat-number">{bikes.length}</span>
            <span className="stat-label">Automobiles</span>
          </div>
        </div>
        
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All ({properties.length + bikes.length})
          </button>
          <button 
            className={`filter-tab ${filterType === 'properties' ? 'active' : ''}`}
            onClick={() => setFilterType('properties')}
          >
            🏠 Properties ({properties.length})
          </button>
          <button 
            className={`filter-tab ${filterType === 'automobiles' ? 'active' : ''}`}
            onClick={() => setFilterType('automobiles')}
          >
            🚴 Automobiles ({bikes.length})
          </button>
        </div>

        <button className="refresh-btn" onClick={fetchAllListings}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
          Refresh
        </button>
      </div>

      <div className="listings-grid">
        {filteredListings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Listings Found</h3>
            <p>Start by adding properties or automobiles to rent!</p>
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
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit {editingType === 'property' ? 'Property' : 'Automobile'}</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            
            <form onSubmit={editingType === 'property' ? handleUpdateProperty : handleUpdateBike} className="modal-body">
              {editingType === 'property' ? (
                <>
                  <div className="form-group">
                    <label>Property Title</label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Property Type</label>
                      <select
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
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        value={editForm.city || ''}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Bedrooms</label>
                      <input
                        type="number"
                        value={editForm.bedrooms || ''}
                        onChange={(e) => setEditForm({ ...editForm, bedrooms: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Bathrooms</label>
                      <input
                        type="number"
                        value={editForm.bathrooms || ''}
                        onChange={(e) => setEditForm({ ...editForm, bathrooms: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Area (sq ft)</label>
                      <input
                        type="number"
                        value={editForm.area || ''}
                        onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Monthly Rent (NPR)</label>
                      <input
                        type="number"
                        value={editForm.rentPrice || ''}
                        onChange={(e) => setEditForm({ ...editForm, rentPrice: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Security Deposit (NPR)</label>
                      <input
                        type="number"
                        value={editForm.securityDeposit || ''}
                        onChange={(e) => setEditForm({ ...editForm, securityDeposit: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={editForm.status || 'Available'}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    >
                      <option value="Available">Available</option>
                      <option value="Rented">Rented</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      rows="4"
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Vehicle Name</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Brand</label>
                      <input
                        type="text"
                        value={editForm.brand || ''}
                        onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Model</label>
                      <input
                        type="text"
                        value={editForm.model || ''}
                        onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Type</label>
                      <select
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
                    <div className="form-group">
                      <label>Year</label>
                      <input
                        type="number"
                        value={editForm.year || ''}
                        onChange={(e) => setEditForm({ ...editForm, year: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Color</label>
                      <input
                        type="text"
                        value={editForm.color || ''}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Registration Number</label>
                      <input
                        type="text"
                        value={editForm.registrationNumber || ''}
                        onChange={(e) => setEditForm({ ...editForm, registrationNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Daily Rate (NPR)</label>
                      <input
                        type="number"
                        value={editForm.dailyRate || ''}
                        onChange={(e) => setEditForm({ ...editForm, dailyRate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Weekly Rate (NPR)</label>
                      <input
                        type="number"
                        value={editForm.weeklyRate || ''}
                        onChange={(e) => setEditForm({ ...editForm, weeklyRate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Security Deposit (NPR)</label>
                      <input
                        type="number"
                        value={editForm.securityDeposit || ''}
                        onChange={(e) => setEditForm({ ...editForm, securityDeposit: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      value={editForm.location || ''}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={editForm.status || 'Available'}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    >
                      <option value="Available">Available</option>
                      <option value="Rented">Rented</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      rows="4"
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update {editingType === 'property' ? 'Property' : 'Automobile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllListings;
