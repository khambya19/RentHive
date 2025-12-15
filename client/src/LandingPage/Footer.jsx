import React from 'react';
import './Footer.css'; 


import facebookLogo from "../assets/facebook.jpg"; 
import instagramLogo from "../assets/instagram.jpg"; 
import twitterLogo from "../assets/twitter.jpg"; 
import linkedinLogo from "../assets/linkedin.jpg";

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="footer-content-wrapper">
        
        
        <div className="footer-column brand-column"> 
            <div className="footer-logo">RentHive</div>
            <p className="brand-description">
              Your trusted platform for fast, safe, and affordable bike and flat rentals across Nepal. Simple process, reliable service, and complete comfort — all in one place.
            </p>
            
            
            <div className="social-links">
                <a href="#" className="social-icon">
                    <img src={facebookLogo} alt="Facebook" className="social-logo" />
                </a> 
                <a href="#" className="social-icon">
                    <img src={instagramLogo} alt="Instagram" className="social-logo" />
                </a>
                <a href="#" className="social-icon">
                    <img src={twitterLogo} alt="Twitter" className="social-logo" />
                </a>
                <a href="#" className="social-icon">
                    <img src={linkedinLogo} alt="LinkedIn" className="social-logo" />
                </a>
            </div>
        </div>
        


        
        <div className="footer-column link-column">
          <h4 className="column-title">Property</h4>
          <ul className="footer-links">
            <li><a href="#">Room</a></li>
            <li><a href="#">Flat</a></li>
            <li><a href="#">House</a></li>
          </ul>
        </div>

        
        <div className="footer-column link-column">
          <h4 className="column-title">Service</h4>
          <ul className="footer-links">
            <li><a href="#">About Us</a></li>
            <li><a href="#">Cancellation option</a></li>
            <li><a href="#">Privacy & Policy</a></li>
            <li><a href="#">Terms & Conditions</a></li>
          </ul>
        </div>

        
        <div className="footer-column contact-column">
          <h4 className="column-title">Contact</h4>
          <div className="contact-info">
            <p className="contact-item location">Kuleshwor, Kathmandu, Nepal</p>
            <p className="contact-item phone">Phone: +976 9876543210</p>
          </div>
          
          <h4 className="newsletter-title">Newsletter</h4>
          <div className="newsletter-form">
            <input type="email" placeholder="input your email" className="newsletter-input" />
            <button className="newsletter-button">Send</button>
          </div>
        </div>

      </div> 
      
      
      <div className="footer-copyright">
        <p>© 2025 | All Rights Reserved By RentHive.</p>
      </div>
    </footer>
  );
};

export default Footer;