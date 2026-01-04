

import React, { useState } from 'react';
import axios from 'axios';

function VendorLoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); 
        setIsSuccess(false);
        
        try {
            const response = await axios.post('http://localhost:3000/api/auth/login', { 
                email, 
                password 
            });

            
            localStorage.setItem('vendorToken', response.data.token);
            localStorage.setItem('vendorEmail', response.data.vendor.email);
            
            setMessage('✅ Success! Logged in.');
            setIsSuccess(true);
            
            console.log('Login successful. Token:', response.data.token);

        } catch (error) {
            const errorMessage = error.response?.data?.message || '❌ Login failed. Server error or invalid credentials.';
            setMessage(errorMessage);
            setIsSuccess(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Vendor Login</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Log in</button>
            </form>
            {message && (
                <div style={{ color: isSuccess ? 'green' : 'red', marginTop: '10px' }}>
                    {message}
                </div>
            )}
        </div>
    );
}

export default VendorLoginForm;