import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OtpModal from '../../components/otpModal';
import API_BASE_URL from '../../config/api';
import { UserCircle, User, Mail, Phone, Lock, MapPin, Upload, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, Check, X } from 'lucide-react';
import RenthiveLogo from '../../assets/Logo.png';
import { z } from 'zod';

// Zod validation schema
const registerUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  phoneNumber: z.string().min(1, 'Phone is required').regex(/^9\d{9}$/, 'Enter a valid Nepali number (10 digits, starts with 9)'),
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Need uppercase')
    .regex(/[a-z]/, 'Need lowercase')
    .regex(/[0-9]/, 'Need number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Need special char'),
  confirmPassword: z.string().min(1, 'Confirm password'),
  address: z.string().min(1, 'Address is required').min(5, 'Min 5 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const checkPasswordRequirements = (password) => ({
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /[0-9]/.test(password),
  special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
});

const RegisterUser = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '', address: '', photo: null,
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [valid, setValid] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordReqs, setPasswordReqs] = useState(checkPasswordRequirements(''));

  useEffect(() => {
    if (form.password) setPasswordReqs(checkPasswordRequirements(form.password));
  }, [form.password]);

  const validateField = (name, value) => {
    try {
      if (name === 'fullName') z.string().min(2).parse(value);
      else if (name === 'email') z.string().email().parse(value);
      else if (name === 'phoneNumber') {
        // Custom error for Nepali phone
        if (!/^9\d{9}$/.test(value)) {
          setValid(prev => ({ ...prev, [name]: false }));
          setErrors(prev => ({ ...prev, [name]: 'Enter a valid Nepali number (10 digits, starts with 9, e.g. 98XXXXXXXX)' }));
          return;
        }
      }
      else if (name === 'password') z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[!@#$%^&*(),.?":{}|<>]/).parse(value);
      else if (name === 'confirmPassword') { if (value !== form.password) throw new Error("Passwords don't match"); }
      else if (name === 'address') z.string().min(5).parse(value);
      setValid(prev => ({ ...prev, [name]: true }));
      setErrors(prev => ({ ...prev, [name]: null }));
    } catch (err) {
      setValid(prev => ({ ...prev, [name]: false }));
      const errorMsg = err instanceof z.ZodError && err.errors && err.errors.length > 0 
        ? err.errors[0].message 
        : (err.message || 'Invalid input');
      setErrors(prev => ({ ...prev, [name]: errorMsg }));
    }
  };

  const handleChange = (e) => {
    const { name, type, value, files } = e.target;
    if (type === 'file') setForm(s => ({ ...s, [name]: files[0] }));
    else setForm(s => ({ ...s, [name]: value }));
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, form[name]);
  };

  const getBorderClass = (name) => {
    if (!touched[name]) return 'border-gray-200';
    if (errors[name]) return 'border-red-400';
    if (valid[name]) return 'border-green-500';
    return 'border-gray-200';
  };

  const validateForm = () => {
    try {
      registerUserSchema.parse(form);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError && err.errors && Array.isArray(err.errors)) {
        const newErrors = {};
        err.errors.forEach((e) => { 
          if (e.path && e.path[0]) newErrors[e.path[0]] = e.message; 
        });
        setErrors(newErrors);
        setTouched({ fullName: true, email: true, phoneNumber: true, password: true, confirmPassword: true, address: true });
      }
      return false;
    }
  };

  // Check if email already exists
  const checkEmailAvailability = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.exists) {
        setErrors(prev => ({ ...prev, email: 'This email is already registered' }));
        setValid(prev => ({ ...prev, email: false }));
        return false;
      }
      return true;
    } catch (err) {
      return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validateForm()) return;

    setIsLoading(true);
    
    // Check if email already exists
    const emailAvailable = await checkEmailAvailability(form.email);
    if (!emailAvailable) {
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user', fullName: form.fullName, email: form.email, phone: form.phoneNumber,
          password: form.password, confirmPassword: form.confirmPassword, address: form.address,
        }),
      });
      const data = await response.json();
      if (!response.ok) { setServerError(data.error || data.message || 'Registration failed'); return; }
      setSuccess('Registration successful! Verify your email.');
      setRegisteredEmail(form.email);
      setShowOtpModal(true);
    } catch (err) {
      setServerError('Unable to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-blue-200 via-cyan-100 to-purple-200 flex items-center justify-center px-3 py-6 sm:p-4">
        <div className="w-full max-w-100 sm:max-w-md lg:max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row border border-gray-100">
          
          {/* Left Panel */}
          <div className="hidden lg:flex lg:w-2/5 p-8 bg-linear-to-br from-blue-600 to-indigo-700 flex-col justify-center text-white">
            <div className="flex items-center gap-2 mb-6">
              <UserCircle size={28} />
              <span className="text-xl font-bold">RentHive</span>
            </div>
            <h3 className="text-2xl font-bold mb-3">Join as a User</h3>
            <p className="text-blue-100 text-sm">Find your perfect home or ride.</p>
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-blue-100 text-sm"><CheckCircle size={14} /> Browse listings</div>
              <div className="flex items-center gap-2 text-blue-100 text-sm"><CheckCircle size={14} /> Book easily</div>
              <div className="flex items-center gap-2 text-blue-100 text-sm"><CheckCircle size={14} /> Secure payments</div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-full lg:w-3/5 p-5 sm:p-6 overflow-y-auto max-h-[90vh]">
            <div className="lg:hidden text-center mb-4">
              <img src={RenthiveLogo} alt="RentHive" className="h-10 mx-auto mb-2" />
            </div>
            
            <h2 className="text-xl font-bold text-center mb-4 text-gray-900">Sign up as User</h2>
            
            {serverError && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-3 text-sm flex items-center gap-2"><AlertCircle size={14} /> {serverError}</div>}
            {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-3 text-sm flex items-center gap-2"><CheckCircle size={14} /> {success}</div>}
            
            <form onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="mb-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><User size={16} /></span>
                  <input name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} onBlur={() => handleBlur('fullName')}
                    style={{ paddingLeft: '42px', paddingRight: '36px' }}
                    className={`w-full py-2.5 text-sm border-2 ${getBorderClass('fullName')} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50`}
                  />
                  {touched.fullName && (valid.fullName ? <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" /> : errors.fullName && <X size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />)}
                </div>
                {touched.fullName && errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>

              {/* Email & Phone row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Mail size={16} /></span>
                    <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} onBlur={() => handleBlur('email')}
                      style={{ paddingLeft: '42px', paddingRight: '36px' }}
                      className={`w-full py-2.5 text-sm border-2 ${getBorderClass('email')} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50`}
                    />
                    {touched.email && (valid.email ? <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" /> : errors.email && <X size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />)}
                  </div>
                  {touched.email && errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Phone size={16} /></span>
                    <input type="tel" name="phoneNumber" placeholder="Phone" value={form.phoneNumber} onChange={handleChange} onBlur={() => handleBlur('phoneNumber')}
                      style={{ paddingLeft: '42px', paddingRight: '36px' }}
                      className={`w-full py-2.5 text-sm border-2 ${getBorderClass('phoneNumber')} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50`}
                    />
                    {touched.phoneNumber && (valid.phoneNumber ? <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" /> : errors.phoneNumber && <X size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />)}
                  </div>
                  {touched.phoneNumber && errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
                </div>
              </div>

              {/* Password */}
              <div className="mb-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Lock size={16} /></span>
                  <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password (8+ chars)" value={form.password} onChange={handleChange} onBlur={() => handleBlur('password')}
                    style={{ paddingLeft: '42px', paddingRight: '70px' }}
                    className={`w-full py-2.5 text-sm border-2 ${getBorderClass('password')} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50`}
                  />
                  {touched.password && (valid.password ? <Check size={14} className="absolute right-10 top-1/2 -translate-y-1/2 text-green-500" /> : errors.password && <X size={14} className="absolute right-10 top-1/2 -translate-y-1/2 text-red-500" />)}
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              {form.password && (
                <div className="bg-gray-50 rounded-lg p-2.5 mb-3 text-xs grid grid-cols-2 gap-1">
                  <span className={passwordReqs.length ? 'text-green-600' : 'text-gray-400'}>{passwordReqs.length ? <Check size={10} className="inline" /> : <X size={10} className="inline" />} 8+ chars</span>
                  <span className={passwordReqs.uppercase ? 'text-green-600' : 'text-gray-400'}>{passwordReqs.uppercase ? <Check size={10} className="inline" /> : <X size={10} className="inline" />} Uppercase</span>
                  <span className={passwordReqs.lowercase ? 'text-green-600' : 'text-gray-400'}>{passwordReqs.lowercase ? <Check size={10} className="inline" /> : <X size={10} className="inline" />} Lowercase</span>
                  <span className={passwordReqs.number ? 'text-green-600' : 'text-gray-400'}>{passwordReqs.number ? <Check size={10} className="inline" /> : <X size={10} className="inline" />} Number</span>
                  <span className={passwordReqs.special ? 'text-green-600' : 'text-gray-400'}>{passwordReqs.special ? <Check size={10} className="inline" /> : <X size={10} className="inline" />} Special (!@#$)</span>
                </div>
              )}

              {/* Confirm Password */}
              <div className="mb-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Lock size={16} /></span>
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} onBlur={() => handleBlur('confirmPassword')}
                    style={{ paddingLeft: '42px', paddingRight: '70px' }}
                    className={`w-full py-2.5 text-sm border-2 ${getBorderClass('confirmPassword')} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50`}
                  />
                  {touched.confirmPassword && (valid.confirmPassword ? <Check size={14} className="absolute right-10 top-1/2 -translate-y-1/2 text-green-500" /> : errors.confirmPassword && <X size={14} className="absolute right-10 top-1/2 -translate-y-1/2 text-red-500" />)}
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Address */}
              <div className="mb-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><MapPin size={16} /></span>
                  <input name="address" placeholder="Address" value={form.address} onChange={handleChange} onBlur={() => handleBlur('address')}
                    style={{ paddingLeft: '42px', paddingRight: '36px' }}
                    className={`w-full py-2.5 text-sm border-2 ${getBorderClass('address')} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50`}
                  />
                  {touched.address && (valid.address ? <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" /> : errors.address && <X size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />)}
                </div>
                {touched.address && errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>

              {/* Photo */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-1">Profile Photo (Optional)</label>
                <div className="flex items-center gap-2 p-2 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <Upload size={14} className="text-gray-400" />
                  <input type="file" name="photo" accept="image/*" onChange={handleChange} className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-blue-50 file:text-blue-600 cursor-pointer" />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2">
                {isLoading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> : <><ArrowRight size={16} /> Create Account</>}
              </button>
              
              <p className="text-center text-sm text-gray-500 mt-4">
                Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }} className="text-blue-600 font-medium">Login</a>
              </p>
            </form>
          </div>
        </div>
      </div>
      
      {showOtpModal && <OtpModal email={registeredEmail} onClose={() => setShowOtpModal(false)} onVerify={() => { setShowOtpModal(false); setSuccess('Verified!'); setTimeout(() => navigate('/login'), 1500); }} />}
    </>
  );
};

export default RegisterUser;
