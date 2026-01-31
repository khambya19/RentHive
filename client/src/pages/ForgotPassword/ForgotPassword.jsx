import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';
import { ArrowLeft, Mail, Lock, Key, CheckCircle, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react';
import RenthiveLogo from '../../assets/Logo.png';
import { z } from 'zod';

const API_AUTH_URL = `${API_BASE_URL}/auth`;

// Validation schemas
const emailSchema = z.string().min(1, 'Email is required').email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

// Reusable Input Component with proper styling
const InputField = ({ icon: _IconComponent, type = 'text', placeholder, value, onChange, showToggle, isPassword, showPasswordState, togglePassword, error: fieldError }) => (
  <div className="mb-3">
    <div className="relative">
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10">
        <_IconComponent size={18} />
      </span>
      <input 
        type={isPassword ? (showPasswordState ? 'text' : 'password') : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ paddingLeft: '42px', paddingRight: showToggle ? '42px' : '16px' }}
        className={`w-full py-3 text-sm border ${fieldError ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'} rounded-lg focus:ring-2 focus:border-transparent outline-none bg-gray-50 transition-all`}
      />
      {showToggle && (
        <button 
          type="button" 
          onClick={togglePassword}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
        >
          {showPasswordState ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
    {fieldError && <p className="text-red-500 text-xs mt-1">{fieldError}</p>}
  </div>
);

const ForgotPassword = () => {
  const navigate = useNavigate(); 
  const [email, setEmail] = useState(''); 
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setError(null);
    setFieldErrors({});

    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setFieldErrors({ email: err.errors[0].message });
        return;
      }
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_AUTH_URL}/forgot-password`, { email });
      setMessage(response.data.message || "OTP sent to your email.");
      setStep(2);
    } catch (err) {
      const errorMsg = err.response?.data?.error;
      if (errorMsg === 'User not found') {
        setError('No account found with this email address.');
      } else {
        setError(errorMsg || 'Could not process the request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setError(null);

    if (otp.length !== 6) {
      setFieldErrors({ otp: "Please enter 6-digit OTP." });
      return;
    }

    setStep(3);
    setMessage('OTP verified. Enter your new password.');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError(null);
    setFieldErrors({});

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords don't match" });
      return;
    }

    try {
      passwordSchema.parse(newPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setFieldErrors({ newPassword: err.errors[0].message });
        return;
      }
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_AUTH_URL}/reset-password`, { 
        email, 
        otp, 
        newPassword 
      });
      setMessage(response.data.message || "Password reset successfully!");
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_AUTH_URL}/forgot-password`, { email });
      setMessage("OTP resent to your email.");
    } catch (err) {
      setError("Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-linear-to-br from-purple-200 via-blue-100 to-indigo-200 flex items-center justify-center px-4 py-8">
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl flex flex-col items-center">
            <Loader className="animate-spin text-purple-600 mb-2" size={40} />
            <p className="text-gray-600">Please wait...</p>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 relative">
        {/* Back Button */}
        <button 
          onClick={() => step > 1 ? setStep(step - 1) : navigate('/login')}
          className="flex items-center gap-1 text-gray-500 hover:text-purple-600 transition-colors mb-6"
        >
          <ArrowLeft size={18} /> <span className="text-sm font-medium">Back</span>
        </button>
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-purple-100 rounded-full mb-4 text-purple-600">
            {step === 1 && <Mail size={28} />}
            {step === 2 && <Key size={28} />}
            {step === 3 && <Lock size={28} />}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {step === 1 && "Find your account"}
            {step === 2 && "Enter OTP"}
            {step === 3 && "Reset Password"}
          </h2>
          <p className="text-gray-500 text-sm">
            {step === 1 && "Enter your email to receive a password reset OTP."}
            {step === 2 && `OTP sent to ${email}`}
            {step === 3 && "Create your new password."}
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 flex items-center gap-2 text-sm">
            <CheckCircle size={16} /> {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-center gap-2 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <InputField 
              icon={Mail} 
              type="email" 
              placeholder="Enter your email address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
            />
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold py-3 rounded-lg transition-colors mt-2"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="mb-3">
              <input 
                type="text" 
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d{0,6}$/.test(val)) setOtp(val);
                }}
                style={{ letterSpacing: '8px', textAlign: 'center' }}
                className={`w-full py-3 text-lg font-semibold border ${fieldErrors.otp ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50`}
              />
              {fieldErrors.otp && <p className="text-red-500 text-xs mt-1 text-center">{fieldErrors.otp}</p>}
            </div>
            <button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Verify OTP
            </button>
            <button 
              type="button" 
              onClick={handleResendOtp} 
              disabled={loading}
              className="w-full mt-3 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Resending...' : 'Resend OTP'}
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <InputField 
              icon={Lock} 
              placeholder="New Password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)}
              isPassword
              showToggle
              showPasswordState={showPassword}
              togglePassword={() => setShowPassword(!showPassword)}
              error={fieldErrors.newPassword}
            />
            <InputField 
              icon={Lock} 
              placeholder="Confirm New Password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
              isPassword
              showToggle
              showPasswordState={showConfirmPassword}
              togglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
              error={fieldErrors.confirmPassword}
            />
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Remember your password? <a href="#" onClick={() => navigate('/login')} className="text-purple-600 font-medium hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;