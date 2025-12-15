import React, { useState } from "react";
import axios from "axios";
import "./OtpModal.css";

const OtpModal = ({ email, onClose, onVerify }) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,6}$/.test(value)) setOtp(value);
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter 6-digit OTP");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/api/verify-otp", { email, otp });
      if (res.data.success) {
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
    try {
      await axios.post("/api/send-otp", { email });
      alert("OTP sent again to your email");
    } catch (err) {
      alert("Failed to resend OTP");
    }
  };

  return (
    <div className="otp-modal-backdrop">
      <div className="otp-modal">
        <h2>Enter OTP</h2>
        <input
          type="text"
          value={otp}
          onChange={handleChange}
          placeholder="Enter 6-digit OTP"
        />
        {error && <p className="otp-error">{error}</p>}
        <button onClick={handleVerify} disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
        <button onClick={handleResend}>Resend OTP</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default OtpModal;
