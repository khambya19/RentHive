// RENTHIVE/client/src/pages/ForgotPassword/ForgotPassword.jsx

import React, { useState } from 'react';
import axios from 'axios';
import './ForgotPassword.css'; 
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:3000/api/auth';

const ForgotPassword = () => {
    const navigate = useNavigate(); 
    const [email, setEmail] = useState(''); 
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        if (!email.trim()) {
            return setError("Please enter your email.");
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/forgot-password`, { email });
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
            return setError("Please enter 6-digit OTP.");
        }

        setStep(3);
        setMessage('OTP verified. Enter your new password.');
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(null);

        if (newPassword !== confirmPassword) {
            return setError("Passwords do not match.");
        }

        if (newPassword.length < 6) {
            return setError("Password must be at least 6 characters.");
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/reset-password`, { 
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
            await axios.post(`${API_BASE_URL}/forgot-password`, { email });
            setMessage("OTP resent to your email.");
        } catch (err) {
            setError("Failed to resend OTP.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-container">
            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Please wait...</p>
                </div>
            )}
            <div className="forgot-card">
                <a 
                    href="#" 
                    className="back-arrow" 
                    onClick={(e) => { 
                        e.preventDefault(); 
                        if (step > 1) setStep(step - 1);
                        else navigate('/login'); 
                    }}
                >
                    <span role="img" aria-label="Back">⬅️</span>
                </a>
                
                <h2 className="forgot-title">
                    {step === 1 && "Find your account"}
                    {step === 2 && "Enter OTP"}
                    {step === 3 && "Reset Password"}
                </h2>
                <p className="forgot-subtitle">
                    {step === 1 && "Enter your email to receive a password reset OTP."}
                    {step === 2 && `OTP sent to ${email}`}
                    {step === 3 && "Create your new password."}
                </p>

                {message && <div className="success-message">{message}</div>}
                {error && <div className="error-message">{error}</div>}

                {step === 1 && (
                    <form onSubmit={handleSendOtp} className="forgot-form">
                        <input 
                            type="email" 
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            required
                        />
                        <button type="submit" className="continue-button" disabled={loading}>
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOtp} className="forgot-form">
                        <input 
                            type="text" 
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d{0,6}$/.test(val)) setOtp(val);
                            }}
                            className="input-field"
                            style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '18px' }}
                            required
                        />
                        <button type="submit" className="continue-button">
                            Verify OTP
                        </button>
                        <button type="button" className="mobile-find-button" onClick={handleResendOtp} disabled={loading}>
                            {loading ? 'Resending...' : 'Resend OTP'}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="forgot-form">
                        <input 
                            type="password" 
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="input-field"
                            required
                        />
                        <input 
                            type="password" 
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="input-field"
                            style={{ marginTop: '10px' }}
                            required
                        />
                        <button type="submit" className="continue-button" disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;