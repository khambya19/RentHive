import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OtpModal from '../../components/otpModal';

const RegisterUser = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    address: '',
    businessName: '',
    ownershipType: 'Individual',
    photo: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleChange = (e) => {
    const { name, type, value, files } = e.target;
    if (type === 'file') {
      setForm((s) => ({ ...s, [name]: files[0] }));
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      console.log('Form data before processing:', form);
      
      let body;
      let headers = {
        'Accept': 'application/json',
      };

      // Always use JSON for now to debug the issue
      const requestBody = {
        type: 'lessor',
        fullName: form.fullName,
        email: form.email,
        phone: form.phoneNumber,
        password: form.password,
        confirmPassword: form.confirmPassword,
        address: form.address,
        businessName: form.businessName,
        ownershipType: form.ownershipType,
      };
      
      console.log('Request body being sent:', requestBody);
      
      body = JSON.stringify(requestBody);
      headers['Content-Type'] = 'application/json';
      
      console.log('Headers:', headers);
      console.log('Body string:', body);

      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers,
        mode: 'cors',
        body,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Read the response text only once
      const responseText = await response.text();
      console.log('Raw response text:', responseText);

      if (!response.ok) {
        console.error('Response not ok:', response.status, response.statusText);
        try {
          const errorData = JSON.parse(responseText);
          setError(errorData.error || errorData.message || `Server error: ${response.status}`);
        } catch {
          setError(`Server error: ${response.status} - ${responseText}`);
        }
        return;
      }

      // Parse the response text as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        setError('Server returned invalid response format');
        return;
      }

      setSuccess('Registration successful! Please verify your email.');
      setRegisteredEmail(form.email);
      setShowOtpModal(true);
      
    } catch (error) {
      console.error('Registration error details:', error);
      
      if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
        setError('Server returned invalid response. Please try again.');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your connection.');
      } else {
        setError(`Registration failed: ${error.message}`);
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f6f8fb 0%, #ffffff 100%)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '1100px', width: '100%', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex' }}>
          {/* Left Panel */}
          <div style={{ flex: '0 0 38%', padding: '40px', background: '#fbfbfb', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', borderRight: '1px solid #eee', gap: 20, borderTopLeftRadius: 12, borderTopRightRadius: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <img src="/src/assets/rentHivelogo.png" alt="RentHive" style={{ height: 60 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>RentHive</span>
            </div>

            <div style={{ width: '100%', height: 280, borderRadius: 8, background: '#e9e9e9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 'auto' }}>
              <img src="/src/assets/Login_page.png" alt="hero" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ flex: '1 1 62%', padding: '36px' }}>
            <h2 style={{ fontSize: 28, textAlign: 'center', margin: 0, marginBottom: 24 }}>Sign up as User</h2>

            {error && <div style={{ color: '#d32f2f', marginBottom: 15, padding: '12px 15px', background: '#ffebee', borderLeft: '4px solid #d32f2f', borderRadius: 6 }}>{error}</div>}
            {success && <div style={{ color: '#2e7d32', marginBottom: 15, padding: '12px 15px', background: '#e8f5e9', borderLeft: '4px solid #2e7d32', borderRadius: 6 }}>{success}</div>}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Full Name</label>
                <input type="text" name="fullName" placeholder="Enter your full name" value={form.fullName} onChange={handleChange} required style={formInputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Email</label>
                  <input type="email" name="email" placeholder="your.email@example.com" value={form.email} onChange={handleChange} required style={formInputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Phone Number</label>
                  <input type="tel" name="phoneNumber" placeholder="+977 9800000000" value={form.phoneNumber} onChange={handleChange} required style={formInputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      name="password" 
                      placeholder="Enter a strong password" 
                      value={form.password} 
                      onChange={handleChange} 
                      required 
                      style={formInputStyle} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        color: '#666'
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      name="confirmPassword" 
                      placeholder="Re-enter your password" 
                      value={form.confirmPassword} 
                      onChange={handleChange} 
                      required 
                      style={formInputStyle} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        color: '#666'
                      }}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Address</label>
                <input type="text" name="address" placeholder="Enter your full address" value={form.address} onChange={handleChange} required style={formInputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Business Name</label>
                  <input type="text" name="businessName" placeholder="Enter your business name" value={form.businessName} onChange={handleChange} style={formInputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Ownership Type</label>
                  <select name="ownershipType" value={form.ownershipType} onChange={handleChange} style={formInputStyle}>
                    <option value="Individual">Individual</option>
                    <option value="Company">Company</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Profile Photo</label>
                <input type="file" name="photo" accept="image/*" onChange={handleChange} style={{ padding: 8 }} />
                {form.photo && <p style={{ color: '#388e3c', marginTop: 6, fontSize: 13 }}>✓ {form.photo.name}</p>}
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px 16px', background: '#5963d6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Create account</button>

              <div style={{ textAlign: 'center', fontSize: 13, color: '#666', marginTop: 12 }}>
                Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }} style={{ color: '#d9534f', textDecoration: 'none', fontWeight: 600 }}>Login</a>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showOtpModal && (
        <OtpModal
          email={registeredEmail}
          onClose={() => setShowOtpModal(false)}
          onVerify={() => {
            setShowOtpModal(false);
            setSuccess('Email verified successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
          }}
        />
      )}
    </div>
  );
};

const formInputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #e6eefc',
  borderRadius: 6,
  boxSizing: 'border-box',
  fontSize: 13,
  background: '#f3f7ff'
};

export default RegisterUser;
