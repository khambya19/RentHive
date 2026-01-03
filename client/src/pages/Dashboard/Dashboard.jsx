import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Decode JWT token to get user info (simple decode without verification for frontend)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    } catch (error) {
      console.error('Invalid token:', error);
      localStorage.removeItem('token');
      navigate('/login');
      return;
    }

    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Welcome to RentHive Dashboard</h1>
          <div className="user-info">
            <span>Hello, {user.email}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">👤</div>
            <h3>Profile</h3>
            <p>Manage your account information</p>
            <button className="card-button">View Profile</button>
          </div>

          {user.type === 'vendor' && (
            <>
              <div className="dashboard-card">
                <div className="card-icon">🏠</div>
                <h3>My Properties</h3>
                <p>Manage your rental properties</p>
                <button className="card-button">Manage Properties</button>
              </div>
              <div className="dashboard-card">
                <div className="card-icon">🚗</div>
                <h3>My Vehicles</h3>
                <p>Manage your rental vehicles</p>
                <button className="card-button">Manage Vehicles</button>
              </div>
              <div className="dashboard-card">
                <div className="card-icon">📊</div>
                <h3>Analytics</h3>
                <p>View your rental statistics</p>
                <button className="card-button">View Analytics</button>
              </div>
            </>
          )}

          {(user.type === 'lessor' || user.type === 'renter') && (
            <>
              <div className="dashboard-card">
                <div className="card-icon">🔍</div>
                <h3>Search Rentals</h3>
                <p>Find properties and vehicles to rent</p>
                <button className="card-button">Start Searching</button>
              </div>
              <div className="dashboard-card">
                <div className="card-icon">❤️</div>
                <h3>My Favorites</h3>
                <p>View your saved listings</p>
                <button className="card-button">View Favorites</button>
              </div>
              <div className="dashboard-card">
                <div className="card-icon">📋</div>
                <h3>My Bookings</h3>
                <p>Manage your rental bookings</p>
                <button className="card-button">View Bookings</button>
              </div>
            </>
          )}

          <div className="dashboard-card">
            <div className="card-icon">💬</div>
            <h3>Messages</h3>
            <p>Chat with other users</p>
            <button className="card-button">View Messages</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">⚙️</div>
            <h3>Settings</h3>
            <p>Manage your preferences</p>
            <button className="card-button">Open Settings</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;