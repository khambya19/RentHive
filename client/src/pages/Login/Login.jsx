import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../config/api';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, UserPlus } from 'lucide-react';
import { z } from 'zod';

import RenthiveLogo from '../../assets/Logo.png'; 
import LoginIllustration from '../../assets/Login_page.png'; 

// Zod validation schema
const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const navigate = useNavigate(); 
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null); 
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const validateForm = () => {
    try {
      loginSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors = {};
        err.errors.forEach((e) => {
          newErrors[e.path[0]] = e.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    // Hardcoded super admin login
    if (email === 'renthiveadmin@gmail.com' && password === 'Renthive@11') {
      const user = {
        id: 6, // Match database ID
        name: 'Super Admin',
        email: 'renthiveadmin@gmail.com',
        role: 'super_admin',
        type: 'super_admin',
        active: true
      };
      const token = 'superadmintoken';
      login(user, token);
      navigate('/admin/dashboard');
      setIsLoading(false);
      return;
    }
    
    try {
      // console.log('Attempting login with:', { email, API_BASE_URL });
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { 
        email: email.trim().toLowerCase(), 
        password 
      });
      // console.log('Login response:', response.data);
      const { token, user } = response.data;
      login(user, token);
      
      // Route based on user type
      // owner -> Owner Dashboard
      // user -> User Dashboard
      if (user.type === 'owner') {
        navigate('/owner/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response);
      setServerError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    navigate('/forgot-password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-200 via-purple-100 to-blue-200 px-3 py-6 sm:p-4">
      
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row w-full max-w-100 sm:max-w-md lg:max-w-4xl border border-gray-100"> 
        
        {/* Form Section */}
        <div className="w-full lg:w-1/2 p-6 sm:p-8 flex flex-col justify-center">
          <div className="text-center lg:text-left mb-6">
            <img src={RenthiveLogo} alt="RentHive Logo" className="h-10 sm:h-12 mb-4 mx-auto lg:mx-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Welcome Back</h1>
            <p className="text-gray-400 text-sm">Login to access your account</p>
          </div>
          
          {serverError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-center gap-2 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" /> 
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Mail size={18} />
                </span>
                <input 
                  type="email" 
                  id="email" 
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '42px' }}
                  className={`w-full pr-4 py-2.5 text-sm border ${errors.email ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'} rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all bg-gray-50`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Lock size={18} />
                </span>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  id="password" 
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '42px', paddingRight: '42px' }}
                  className={`w-full py-2.5 text-sm border ${errors.password ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'} rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all bg-gray-50`}
                />
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button> 
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600 select-none">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                Remember me
              </label>
              <a 
                href="#" 
                onClick={handleForgotPasswordClick} 
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                Forgot?
              </a>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <>
                  <LogIn size={18} /> Login
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-gray-400 text-xs">or</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <button 
            onClick={() => navigate('/register')}
            className="w-full border border-gray-200 hover:border-orange-300 text-gray-700 hover:text-orange-600 font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm hover:bg-orange-50"
          >
            <UserPlus size={16} /> Create Account
          </button>
        </div>
        
        {/* Illustration Section */}
        <div className="hidden lg:block w-1/2 bg-orange-50 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <img src={LoginIllustration} alt="House and Keys" className="max-w-full h-auto object-contain drop-shadow-lg transform hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;