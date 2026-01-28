import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OtpModal from '../../components/otpModal';

const RegisterLessor = () => {
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

    // Use FormData for file upload support
    const formData = new FormData();
    formData.append('type', 'lessor');
    formData.append('fullName', form.fullName);
    formData.append('email', form.email);
    formData.append('password', form.password);
    formData.append('confirmPassword', form.confirmPassword);
    formData.append('phone', form.phoneNumber);
    formData.append('address', form.address);
    formData.append('businessName', form.businessName);
    formData.append('ownershipType', form.ownershipType);

    if (form.photo) {
      formData.append('profileImage', form.photo);
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        body: formData, // Browser handles Content-Type automatically for FormData
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registration failed');
        return;
      }

      setSuccess('Registration successful! Please verify your email.');
      setRegisteredEmail(form.email);
      setShowOtpModal(true);
    } catch (err) {
      console.error("Connection error:", err);
      setError('Unable to connect to server. Ensure backend is running on port 3001.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f6f8fb 0%, #ffffff 100%)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '1100px', width: '100%', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex' }}>
          {/* Left Panel */}
          <div style={{ flex: '0 0 38%', padding: '40px', background: '#fbfbfb', borderRight: '1px solid #eee' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>RentHive</span>
             </div>
             <p style={{ marginTop: 20, color: '#666' }}>Join our community today.</p>
          </div>

          {/* Right Panel */}
          <div style={{ flex: '1 1 62%', padding: '36px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Sign up as Lessor</h2>

            {error && <div style={{ color: '#d32f2f', background: '#ffebee', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>{error}</div>}
            {success && <div style={{ color: '#2e7d32', background: '#e8f5e9', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>{success}</div>}

            <form onSubmit={handleSubmit}>
              <input type="text" name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} required style={formInputStyle} />
              <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required style={formInputStyle} />
              <input type="tel" name="phoneNumber" placeholder="Phone" value={form.phoneNumber} onChange={handleChange} required style={formInputStyle} />
              
              <div style={{ display: 'flex', gap: 10 }}>
                <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required style={formInputStyle} />
                <input type="password" name="confirmPassword" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} required style={formInputStyle} />
              </div>

              <input type="text" name="address" placeholder="Address" value={form.address} onChange={handleChange} required style={formInputStyle} />
              
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>Profile Photo</label>
                <input type="file" name="photo" accept="image/*" onChange={handleChange} />
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', background: '#5963d6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                Create account
              </button>
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
            navigate('/login');
          }}
        />
      )}
    </div>
  );
};

const formInputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '15px',
  border: '1.5px solid #e6eefc',
  borderRadius: 6,
  background: '#f3f7ff'
};

export default RegisterLessor;