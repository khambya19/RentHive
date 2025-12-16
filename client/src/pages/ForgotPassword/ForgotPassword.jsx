// RENTHIVE/client/src/pages/ForgotPassword/ForgotPassword.jsx

import React, { useState } from 'react';
import axios from 'axios';
import './ForgotPassword.css'; 
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api/auth';

const ForgotPassword = () => {
    const navigate = useNavigate(); 
    const [identifier, setIdentifier] = useState(''); 
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        if (!identifier.trim()) {
            return setError("Please enter your email or phone number.");
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/forgot-password`, { 
                identifier 
            });

            setMessage(response.data.msg || "Instructions sent. Check your inbox.");
            setIdentifier(''); 

        } catch (err) {
            // Updated to handle 404 if you chose the less-secure backend option
            if (err.response && err.response.status === 404) {
                 setError(err.response.data.msg); 
            } else {
                 setError('Could not process the request. Please try again later.');
            }
            console.error(err);
        }
    };

    return (
        <div className="forgot-container">
            <div className="forgot-card">
                {/* Back button logic */}
                <a 
                    href="#" 
                    className="back-arrow" 
                    onClick={(e) => { e.preventDefault(); navigate('/login'); }}
                >
                    <span role="img" aria-label="Back">⬅️</span>
                </a>
                
                <h2 className="forgot-title">Find your account</h2>
                <p className="forgot-subtitle">
                    Enter your email or phone number. <a href="#">Can't reset your password?</a>
                </p>

                {message && <div className="success-message">{message}</div>}
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="forgot-form">
                    <input 
                        type="text" 
                        placeholder="Email or phone number (+977...)"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="input-field"
                        required
                    />

                    <button type="submit" className="continue-button">Continue</button>
                </form>

                <button 
                    className="mobile-find-button"
                    onClick={() => document.querySelector('.input-field').focus()}
                >
                    Find by mobile number
                </button>
            </div>
        </div>
    );
};

export default ForgotPassword;