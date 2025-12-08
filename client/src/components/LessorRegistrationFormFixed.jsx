import React, { useState } from 'react';

const LessorRegistrationFormFixed = () => {
  const [form, setForm] = useState({
    fullName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    citizenshipNumber: '',
    profilePhoto: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, type, value, files, checked } = e.target;
    if (type === 'file') {
      setForm((s) => ({ ...s, [name]: files[0] }));
    } else if (type === 'checkbox') {
      setForm((s) => ({ ...s, [name]: checked }));
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSuccess('Registration successful! (API not connected)');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f6f8fb 0%, #ffffff 100%)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '1100px', width: '100%', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex' }}>
          {/* Left Panel */}
          <div style={{ flex: '0 0 38%', padding: '40px', background: '#fbfbfb', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', borderRight: '1px solid #eee', gap: 20, borderTopLeftRadius: 12, borderTopRightRadius: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <img src="/assets/renthive-logo.png" alt="RentHive" style={{ height: 60 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>RentHive</span>
            </div>

            <div style={{ width: '100%', height: 280, borderRadius: 8, background: '#e9e9e9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 'auto' }}>
              <img src="/assets/hero.png" alt="hero" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ flex: '1 1 62%', padding: '36px' }}>
            <h2 style={{ fontSize: 28, textAlign: 'center', margin: 0, marginBottom: 24 }}>Sign up as Renter</h2>

            {error && <div style={{ color: '#d32f2f', marginBottom: 15, padding: '12px 15px', background: '#ffebee', borderLeft: '4px solid #d32f2f', borderRadius: 6 }}>{error}</div>}
            {success && <div style={{ color: '#2e7d32', marginBottom: 15, padding: '12px 15px', background: '#e8f5e9', borderLeft: '4px solid #2e7d32', borderRadius: 6 }}>{success}</div>}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>First Name</label>
                  <input type="text" name="fullName" placeholder="Enter your first name" value={form.fullName} onChange={handleChange} required style={formInputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Last Name</label>
                  <input type="text" name="lastName" placeholder="Enter your last name" value={form.lastName} onChange={handleChange} style={formInputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Email</label>
                  <input type="email" name="email" placeholder="your.email@example.com" value={form.email} onChange={handleChange} required style={formInputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Phone Number</label>
                  <input type="tel" name="phone" placeholder="+977 9800000000" value={form.phone} onChange={handleChange} required style={formInputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Password</label>
                  <input type="password" name="password" placeholder="Enter a strong password" value={form.password} onChange={handleChange} required style={formInputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Confirm Password</label>
                  <input type="password" name="confirmPassword" placeholder="Re-enter your password" value={form.confirmPassword} onChange={handleChange} required style={formInputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Address</label>
                <input type="text" name="address" placeholder="Enter your full address" value={form.address} onChange={handleChange} required style={formInputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Citizenship Number</label>
                  <input type="text" name="citizenshipNumber" placeholder="Enter your citizenship number" value={form.citizenshipNumber} onChange={handleChange} required style={formInputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Profile Photo</label>
                  <input type="file" name="profilePhoto" accept="image/*" onChange={handleChange} style={{ padding: 8 }} />
                  {form.profilePhoto && <p style={{ color: '#388e3c', marginTop: 6, fontSize: 13 }}>✓ {form.profilePhoto.name}</p>}
                </div>
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px 16px', background: '#5963d6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Create account</button>

              <div style={{ textAlign: 'center', fontSize: 13, color: '#666', marginTop: 12 }}>
                Already have an account? <a href="/login" style={{ color: '#d9534f', textDecoration: 'none', fontWeight: 600 }}>Login</a>
              </div>
            </form>
          </div>
        </div>
      </div>
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

export default LessorRegistrationFormFixed;
