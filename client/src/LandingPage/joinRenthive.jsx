import React from 'react';
import { useNavigate } from 'react-router-dom';
import './joinRenthive.css'; 

const JoinRenthive = () => {
  const navigate = useNavigate();
  
  const handleRegister = (userType) => {
    console.log(`Navigating to ${userType} registration page.`);
    navigate('/register');
  };
  return (
    <section className="registration-cta-section">
      <h2 className="cta-headline">Join RentHive Today</h2>
      <p className="cta-subtitle">
        Choose your account type and start your rental journey
      </p>

      <div className="card-container">
        
        {/* === Tenant Card === */}
        <div className="reg-card tenant-card">
          <div className="icon-box tenant-icon-boxs">
            <span className="tenant-icon">👥</span> 
          </div>
          
          <h3 className="card-title-lg">I'm a Lessor</h3>
          <p className="card-description">
            Looking for properties or vehicles to rent. Browse thousands of listings and book instantly.
          </p>

          <ul className="feature-list tenant-features">
            <li>• Search and filter listings</li>
            <li>• Chat with property owners</li>
            <li>• Secure online payments</li>
            <li>• Track your bookings</li>
          </ul>

          <button 
            className="reg-button tenant-button"
            onClick={() => handleRegister('Tenant')}
          >
            Register as Lessor
          </button>
        </div>

        

        
        <div className="reg-card vendor-card">
          <div className="icon-box vendor-icon-box">
            <span className="vendor-icon">💼</span>
          </div>

          <h3 className="card-title-lg">I'm a Vendor</h3>
          <p className="card-description">
            Have properties or vehicles to rent out. List your assets and reach thousands of potential renters.
          </p>
          
          <ul className="feature-list vendor-features">
            <li>• List unlimited properties</li>
            <li>• Manage bookings easily</li>
            <li>• Receive secure payments</li>
            <li>• Analytics dashboard</li>
          </ul>

          <button 
            className="reg-button vendor-button"
            onClick={() => handleRegister('Vendor')}
          >
            Register as Vendor
          </button>
        </div>

      </div>
    </section>
  );
};
export default JoinRenthive;