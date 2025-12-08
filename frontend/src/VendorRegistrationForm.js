import React, { useState } from 'react';
import axios from 'axios'; 

const VendorRegistrationForm = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        address: '',
        businessName: '',
        ownershipType: 'Individual',
    });
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setPhoto(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError('Error: Passwords do not match!');
            return;
        }

        setLoading(true);

        const dataToSend = new FormData();

        Object.keys(formData).forEach(key => {
            dataToSend.append(key, formData[key]);
        });
        
        if (photo) {
            dataToSend.append('photo', photo);
        }

        try {
            const response = await axios.post('/api/register-vendor', dataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setSuccess(`✅ Success! Vendor ID ${response.data.vendor.id} registered.`);
            setFormData({
                fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '',
                businessName: '', address: '', ownershipType: 'Individual',
            });
            setPhoto(null);

        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed due to a server error. Check your backend console.';
            setError(`❌ Error: ${msg}`);
            console.error('API Error:', err.response || err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ maxWidth: '1400px', width: '100%', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', height: '100vh' }}>
                    
                    {/* Left Panel (Styling) */}
                    <div style={{ flex: 0.35, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRight: '1px solid #eee' }}>
                        
                        <div style={logoContainerStyle}> 
                            <img 
                                src="/RentHive_Logo.png" 
                                alt="RentHive Logo" 
                                style={logoStyle} 
                            />
                            <h1 style={headerStyle}>RentHive</h1>
                        </div>
                        
                        <div style={{ width: '100%', height: '280px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                            <img 
                                src="/renthive-banner.png" 
                                alt="RentHive Property Rental Banner" 
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '10px' }}
                            />
                        </div>
                    </div>

                    {/* Right Panel (Form) */}
                    <div style={{ flex: 0.65, padding: '30px 40px', overflowY: 'auto', background: '#fafafa' }}>
                        <h2 style={{ fontSize: '28px', color: '#333', marginBottom: '8px', textAlign: 'center', fontWeight: '700' }}>Sign up as Vendor</h2>
                        <p style={{ textAlign: 'center', color: '#999', marginBottom: '25px', fontSize: '13px' }}>Register your business and start listing your properties on RentHive</p>

                        {error && <div style={{ color: '#d32f2f', marginBottom: '15px', padding: '12px 15px', background: '#ffebee', borderLeft: '4px solid #d32f2f', borderRadius: '6px', fontSize: '13px', fontWeight: '500' }}>{error}</div>}
                        {success && <div style={{ color: '#388e3c', marginBottom: '15px', padding: '12px 15px', background: '#e8f5e9', borderLeft: '4px solid #388e3c', borderRadius: '6px', fontSize: '13px', fontWeight: '500' }}>{success}</div>}

                        <form onSubmit={handleSubmit}>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                {/* Full Name */}
                                <div>
                                    <label style={labelStyle}>Full Name</label>
                                    <input type="text" name="fullName" placeholder="Enter your full name" value={formData.fullName} onChange={handleChange} required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                                </div>
                                {/* Phone Number */}
                                <div>
                                    <label style={labelStyle}>Phone Number</label>
                                    <input type="tel" name="phoneNumber" placeholder="+977 9800000000" value={formData.phoneNumber} onChange={handleChange} required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                {/* Email */}
                                <div>
                                    <label style={labelStyle}>Email</label>
                                    <input type="email" name="email" placeholder="your.email@example.com" value={formData.email} onChange={handleChange} required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                                </div>
                                {/* Business/Company Name */}
                                <div>
                                    <label style={labelStyle}>Business/Company Name (Optional)</label>
                                    <input type="text" name="businessName" placeholder="e.g., ABC Property Holdings" value={formData.businessName} onChange={handleChange} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                {/* Password */}
                                <div>
                                    <label style={labelStyle}>Password</label>
                                    <input type="password" name="password" placeholder="Enter a strong password" value={formData.password} onChange={handleChange} required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                                </div>
                                {/* Confirm Password */}
                                <div>
                                    <label style={labelStyle}>Confirm Password</label>
                                    <input type="password" name="confirmPassword" placeholder="Re-enter your password" value={formData.confirmPassword} onChange={handleChange} required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                                </div>
                            </div>

                            {/* Address */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={labelStyle}>Address</label>
                                <input type="text" name="address" placeholder="Enter your full business address" value={formData.address} onChange={handleChange} required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                {/* Ownership Type */}
                                <div>
                                    <label style={labelStyle}>Ownership Type</label>
                                    <select name="ownershipType" value={formData.ownershipType} onChange={handleChange} required style={{ ...inputStyle, padding: '10px 12px' }} onFocus={handleFocus} onBlur={handleBlur}>
                                        <option value="Individual">Individual</option>
                                        <option value="Company">Company</option>
                                    </select>
                                </div>
                                {/* Profile Photo */}
                                <div>
                                    <label style={labelStyle}>Profile Photo</label>
                                    <input type="file" name="photo" accept="image/*" onChange={handleFileChange} required style={{ ...inputStyle, padding: '8px 12px' }} onFocus={handleFocus} onBlur={handleBlur} />
                                    {photo && <p style={{ color: '#388e3c', marginTop: '4px', fontSize: '12px', fontWeight: '500' }}>✓ {photo.name}</p>}
                                </div>
                            </div>

                            <button type="submit" disabled={loading} style={loading ? { ...buttonStyle, opacity: 0.6 } : buttonStyle} onMouseEnter={(e) => e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)'} onMouseLeave={(e) => e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'}>
                                {loading ? 'Registering...' : 'Create account'}
                            </button>

                            <div style={{ textAlign: 'center', fontSize: '13px', color: '#666' }}>
                                Already have an account? <a href="/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600', transition: 'color 0.3s ease' }} onMouseEnter={(e) => e.target.style.color = '#764ba2'} onMouseLeave={(e) => e.target.style.color = '#667eea'}>Login</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};


const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '13px' };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: '8px', boxSizing: 'border-box', fontSize: '13px', transition: 'all 0.3s ease', outline: 'none', background: '#fff' };
const buttonStyle = { width: '100%', padding: '12px 16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '12px', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' };


const logoContainerStyle = {
    marginBottom: '30px',
    display: 'flex',          
    alignItems: 'center',     
    justifyContent: 'center', 
};

const logoStyle = { 
    maxWidth: '50px',
    height: 'auto', 
    marginBottom: '0', 
};

const headerStyle = {
    fontSize: '36px', 
    color: '#fff', 
    margin: '0 0 0 10px', 
    fontWeight: '700' 
};


const handleFocus = (e) => e.target.style.borderColor = '#667eea';
const handleBlur = (e) => e.target.style.borderColor = '#e0e0e0';

export default VendorRegistrationForm;