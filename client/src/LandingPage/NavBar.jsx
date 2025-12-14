import React from 'react';
import { Link } from 'react-router-dom'; 
import './NavBar.css'; 
import logoImage from '../assets/rentHivelogo.png'; 


const handleNavClick = (sectionName) => {
  console.log(`Navigating to: ${sectionName}`);
};

const NavBar = () => {
  return (
    <div className="navbar-container">
      
      
      <Link to="/" className="navbar-logo">
        
        <img src={logoImage} alt="RentHive Logo" className="logo-icon" /> 
        <span className="logo-text">RentHive</span>
      </Link>

      
      <nav className="navbar-links">
        
        
        <Link to="/" className="nav-button">
          Home
        </Link>

        
        <button className="nav-button" onClick={() => handleNavClick('Filter')}>
          Filter
        </button>
        <button className="nav-button" onClick={() => handleNavClick('Pricing')}>
          Pricing
        </button>
        <button className="nav-button" onClick={() => handleNavClick('About')}>
          About
        </button>
        <button className="nav-button" onClick={() => handleNavClick('Contact')}>
          Contact
        </button>
      </nav>
      

        
        <div className="auth-section"> 
            
            
            <a href="#signup-section" className="auth-button sign-in-link">
                Sign Up 
            </a>

            
      
            <Link to="/login" className="auth-button log-in-btn">
                Login
            </Link>
        </div>
      </div>
    );
};

export default NavBar;