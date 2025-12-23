import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./OtpModal.css";

const OtpModal = ({ email, onClose, onVerify }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    
    const newOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }
    if (timeLeft <= 0) {
      setError("OTP has expired. Please request a new one.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("http://localhost:3000/api/auth/verify-otp", { 
        email, 
        otp: otpString 
      });
      if (res.data.message) {
        onVerify();
        onClose();
      } else {
        setError(res.data.message || "Invalid OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await axios.post("http://localhost:3000/api/auth/resend-otp", { email });
      setOtp(["", "", "", "", "", ""]);
      setTimeLeft(600);
      setCanResend(false);
      setError("");
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-modal-backdrop">
      <div className="otp-modal">
        <button className="otp-close-btn" onClick={onClose}>
          &times;
        </button>
        
        <div className="otp-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        
        <h2>Verify Your Email</h2>
        <p className="otp-subtitle">
          We've sent a 6-digit code to<br/>
          <strong>{email}</strong>
        </p>

        <div className="otp-timer" style={{ color: timeLeft <= 60 ? '#e74c3c' : '#7966f3' }}>
          {timeLeft > 0 ? (
            <>
              <span className="timer-icon">⏱</span>
              Code expires in <strong>{formatTime(timeLeft)}</strong>
            </>
          ) : (
            <span className="expired">Code has expired</span>
          )}
        </div>

        <div className="otp-inputs" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={error ? "otp-input error" : "otp-input"}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {error && <p className="otp-error">{error}</p>}

        <button 
          className="otp-verify-btn" 
          onClick={handleVerify} 
          disabled={loading || otp.join("").length !== 6}
        >
          {loading ? (
            <span className="btn-loading">
              <span className="spinner"></span>
              Verifying...
            </span>
          ) : (
            "Verify & Continue"
          )}
        </button>

        <p className="otp-resend">
          Didn't receive the code?{" "}
          {canResend || timeLeft <= 0 ? (
            <button className="resend-link" onClick={handleResend} disabled={loading}>
              Resend Code
            </button>
          ) : (
            <span className="resend-wait">Resend in {formatTime(timeLeft)}</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default OtpModal;
