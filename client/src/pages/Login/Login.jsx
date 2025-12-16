import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';
import { useNavigate } from 'react-router-dom'; 

import RenthiveLogo from '../../assets/Logo.png'; 
import LoginIllustration from '../../assets/Login_page.png'; 

const API_BASE_URL = 'http://localhost:5000/api/auth';

const Login = () => {
  const navigate = useNavigate(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null); 
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(prevShowPassword => !prevShowPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
        const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
        localStorage.setItem('token', response.data.token);
        
        // Redirect to home page after successful login
        navigate('/');
    } catch (err) {
        setError(err.response?.data?.msg || 'Login failed. Please check your credentials.');
    }
  };
  
  const handleForgotPasswordClick = (e) => {
      e.preventDefault();
      navigate('/forgot-password');
  };


  return (
    
    <div className="login-container">
      
      
      <div className="main-login-card"> 
        
        
        <div className="login-form-content">
            <img src={RenthiveLogo} alt="RentHive Logo" className="logo" />
            <h1 className="title">Login</h1>
            <p className="subtitle">Login to access your travelwise account</p>
            
            {error && <div style={{ color: 'red', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                placeholder="john.doe@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  id="password" 
                  placeholder="............"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span 
                  className="password-toggle-icon"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? '🙈' : '👁️'}
                </span> 
              </div>

              <div className="remember-forgot-row">
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <a 
                  href="#" 
                  onClick={handleForgotPasswordClick} 
                  className="forgot-password"
                >
                  Forgot Password
                </a>
              </div>

              <button type="submit" className="login-button">Login</button>
            </form>

            <p className="signup-link">
              Don't have an account? <a href="#" onClick={() => navigate('/register')}>Sign up</a>
            </p>
        </div>
        
        
        <div className="login-illustration-side">
            <img src={LoginIllustration} alt="House and Keys" />
        </div>
      </div>
    </div>
  );
};

export default Login;