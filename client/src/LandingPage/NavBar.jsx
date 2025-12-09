import React from 'react';
import './NavBar.css'; 
import logoImage from '../assets/rentHivelogo.png'; 


const handleNavClick = (sectionName) => {
  console.log(`Navigating to: ${sectionName}`);
  
};

const NavBar = () => {
  return (
    <div className="navbar-container">
      
      <div className="navbar-logo" onClick={() => handleNavClick('Home')}>
        
        <img src={logoImage} alt="RentHive Logo" className="logo-icon" /> 
        <span className="logo-text">RentHive</span>
      </div>

      
      <nav className="navbar-links">
        
        <button className="nav-button" onClick={() => handleNavClick('Home')}>
          Home
        </button>
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
      

<nav className="nav-links">
  
</nav>



        
        <div className="auth-section"> 
            
            
            <a href="#signup-section" className="auth-button sign-in-link">
                Sign Up 
            </a>

            
            <button className="auth-button log-in-btn" onClick={() => handleClick('Login')}>
                Login
            </button>
        </div>
      </div>
    );
};

export default NavBar;
