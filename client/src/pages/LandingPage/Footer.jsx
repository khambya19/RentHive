import React, { useState } from 'react';
// import './Footer.css'; // Deprecated
import facebookLogo from "../../assets/facebook.jpg"; 
import instagramLogo from "../../assets/instagram.jpg"; 
import twitterLogo from "../../assets/twitter.jpg"; 
import linkedinLogo from "../../assets/linkedin.jpg";
import { MapPin, Phone, Mail } from 'lucide-react';
import AboutUsModal from '../../components/AboutUsModal';
import CancellationModal from '../../components/CancellationModal';
import PrivacyPolicyModal from '../../components/PrivacyPolicyModal';
import TermsConditionsModal from '../../components/TermsConditionsModal';

const Footer = () => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isCancellationOpen, setIsCancellationOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  return (
    <>
      <footer className="main-footer bg-gray-900 text-white pt-12 sm:pt-16 pb-6 sm:pb-8">
        <div className="footer-content-wrapper max-w-7xl mx-auto px-3 sm:px-4 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          
          {/* Brand Column */}
          <div className="footer-column brand-column col-span-2 md:col-span-1"> 
              <div className="footer-logo text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">RentHive</div>
              <p className="brand-description text-gray-400 mb-4 sm:mb-6 leading-relaxed text-xs sm:text-sm">
                Your trusted platform for fast, safe, and affordable bike and flat rentals across Nepal.
              </p>
              
              {/* Social Links */}
              <div className="social-links flex gap-3 sm:gap-4">
                  <a href="#" className="social-icon hover:opacity-80 transition-opacity">
                      <img src={facebookLogo} alt="Facebook" className="social-logo w-6 h-6 sm:w-8 sm:h-8 rounded-full" />
                  </a> 
                  <a href="#" className="social-icon hover:opacity-80 transition-opacity">
                      <img src={instagramLogo} alt="Instagram" className="social-logo w-6 h-6 sm:w-8 sm:h-8 rounded-full" />
                  </a>
                  <a href="#" className="social-icon hover:opacity-80 transition-opacity">
                      <img src={twitterLogo} alt="Twitter" className="social-logo w-6 h-6 sm:w-8 sm:h-8 rounded-full" />
                  </a>
                  <a href="#" className="social-icon hover:opacity-80 transition-opacity">
                      <img src={linkedinLogo} alt="LinkedIn" className="social-logo w-6 h-6 sm:w-8 sm:h-8 rounded-full" />
                  </a>
              </div>
          </div>
          
          {/* Categories */}
          <div className="footer-column link-column">
            <h4 className="column-title text-base sm:text-xl font-semibold mb-4 sm:mb-6">Categories</h4>
            <ul className="footer-links space-y-2 sm:space-y-3 text-gray-400 text-xs sm:text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Property</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Automobiles</a></li>
            </ul>
          </div>

          {/* Service Links */}
          <div className="footer-column link-column">
            <h4 className="column-title text-base sm:text-xl font-semibold mb-4 sm:mb-6">Service</h4>
            <ul className="footer-links space-y-2 sm:space-y-3 text-gray-400 text-xs sm:text-sm">
              <li>
                <button 
                  onClick={() => setIsAboutOpen(true)} 
                  className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-left p-0"
                >
                  About Us
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setIsCancellationOpen(true)} 
                  className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-left p-0"
                >
                  Cancellation Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setIsPrivacyOpen(true)} 
                  className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-left p-0"
                >
                  Privacy & Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setIsTermsOpen(true)} 
                  className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-left p-0"
                >
                  Terms & Conditions
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="footer-column contact-column col-span-2 md:col-span-1">
            <h4 className="column-title text-base sm:text-xl font-semibold mb-4 sm:mb-6">Contact</h4>
            <div className="contact-info space-y-2 sm:space-y-3">
              <p className="contact-item location flex items-start gap-2 text-gray-400 text-xs sm:text-sm">
                <MapPin size={16} className="text-orange-500 mt-0.5 flex-shrink-0" /> 
                <span>Kuleshwor, Kathmandu, Nepal</span>
              </p>
              <p className="contact-item phone flex items-center gap-2 text-gray-400 text-xs sm:text-sm">
                <Phone size={16} className="text-orange-500 flex-shrink-0" /> 
                <span>+976 9876543210</span>
              </p>
              <a 
                href="mailto:support@renthive.com" 
                className="contact-item email flex items-center gap-2 text-gray-400 text-xs sm:text-sm hover:text-white transition-colors"
              >
                <Mail size={16} className="text-orange-500 flex-shrink-0" /> 
                <span>support@renthive.com</span>
              </a>
            </div>
          </div>

        </div> 
        
        {/* Copyright */}
        <div className="footer-copyright border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-gray-500 text-xs sm:text-sm">
          <p>© 2025 | All Rights Reserved By RentHive.</p>
        </div>
      </footer>

      {/* Modals */}
      <AboutUsModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <CancellationModal isOpen={isCancellationOpen} onClose={() => setIsCancellationOpen(false)} />
      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <TermsConditionsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </>
  );
};

export default Footer;