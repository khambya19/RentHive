import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import RenthiveLogo from '../../assets/Logo.png';

const Register = () => {
  const navigate = useNavigate();

  return (
    <div className="register-container">
      <div className="register-card">
        <img src={RenthiveLogo} alt="RentHive Logo" className="register-logo" />
        <h1 className="register-title">Join RentHive</h1>
        <p className="register-subtitle">Choose how you want to use RentHive</p>

        <div className="register-options">
          <div className="register-option" onClick={() => navigate('/register-vendor')}>
            <div className="option-icon">🏪</div>
            <h3>Register as Vendor</h3>
            <p>List your properties and vehicles for rent</p>
          </div>

          <div className="register-option" onClick={() => navigate('/register-lessor')}>
            <div className="option-icon">🏠</div>
            <h3>Register as Lessor</h3>
            <p>Find and rent properties or vehicles</p>
          </div>
        </div>

        <p className="login-link">
          Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Login</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
