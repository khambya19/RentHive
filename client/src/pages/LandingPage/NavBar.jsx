import React, { useState } from 'react';
import { Link } from 'react-router-dom'; 
import logoImage from '../../assets/rentHivelogo.png'; 
import { Info, Phone, UserPlus, LogIn, Menu, X } from 'lucide-react'; 
import AboutUsModal from '../../components/AboutUsModal';

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const handleNavClick = (sectionName) => {
    if (sectionName === 'About') {
      setIsAboutOpen(true);
    }
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      <div className="relative bg-white shadow-md z-50 font-sans">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group">
              <img src={logoImage} alt="RentHive Logo" className="h-8 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105" /> 
              <span className="text-xl sm:text-2xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">RentHive</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <button className="flex items-center gap-1.5 text-gray-700 font-medium hover:text-blue-600 transition-colors bg-transparent border-none cursor-pointer" onClick={() => handleNavClick('About')}>
                <Info size={18} /> About Us
              </button>
              <a 
                href="mailto:support@renthive.com" 
                className="flex items-center gap-1.5 text-gray-700 font-medium hover:text-blue-600 transition-colors"
              >
                <Phone size={18} /> Contact
              </a>
            </nav>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3"> 
              <Link to="/register" className="flex items-center gap-2 px-5 py-2.5 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition-all">
                  <UserPlus size={18} /> Sign Up 
              </Link>
              <Link to="/login" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">
                  <LogIn size={18} /> Login
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={toggleMenu}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-16 sm:top-20 left-0 w-full bg-white shadow-xl border-t border-gray-100 flex flex-col p-4 animate-in slide-in-from-top-5 duration-200">
            <div className="flex flex-col gap-2">
              <button className="flex items-center gap-3 p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl font-medium transition-colors w-full text-left bg-transparent border-none" onClick={() => handleNavClick('About')}>
                <Info size={20} /> About Us
              </button>
              <a 
                href="mailto:support@renthive.com" 
                className="flex items-center gap-3 p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Phone size={20} /> Contact
              </a>
            </div>
            
            <hr className="my-4 border-gray-100" />
            
            <div className="flex flex-col gap-3">
              <Link to="/register" className="flex items-center justify-center gap-2 p-3 text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-xl font-semibold transition-all" onClick={() => setIsMenuOpen(false)}>
                  <UserPlus size={20} /> Create Account
              </Link>
              <Link to="/login" className="flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 transition-all" onClick={() => setIsMenuOpen(false)}>
                  <LogIn size={20} /> Login
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* About Us Modal */}
      <AboutUsModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
};

export default NavBar;