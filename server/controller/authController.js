const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/mailer');
const { generateOTP, getOtpExpiry } = require('../utils/otp');
require('dotenv').config();

const SALT_ROUNDS = 10;

// Helper function for validation
function validateRegisterBody(body) {
  if (!body) return 'Request body is missing or invalid';
  
  const { type, fullName, email, password, confirmPassword } = body;
  if (!type || !['lessor', 'owner', 'vendor', 'renter'].includes(type)) return 'Invalid type';
  if (!fullName) return 'fullName required';
  if (!email) return 'email required';
  if (!password) return 'password required';
  if (password !== confirmPassword) return 'password and confirmPassword must match';
  return null;
}

exports.register = async (req, res) => {
  try {
    // --- DEBUG LOGS ---
    console.log("--- New Registration Request ---");
    console.log("Received Body:", req.body);
    
    const errMsg = validateRegisterBody(req.body);
    if (errMsg) {
      console.log("❌ Validation Failed:", errMsg);
      return res.status(400).json({ error: errMsg });
    }

    const {
      type, fullName, email, phone, password, address,
      idNumber, businessName, ownershipType
    } = req.body;

    // Handle uploaded profile image from multer
    const profileImage = req.file ? req.file.filename : null;

    let user = await User.findOne({ where: { email } });

    // Prevent duplicate registration for verified users
    if (user && user.isVerified) {
      return res.status(400).json({ 
        error: 'This email is already registered. Please login instead.' 
      });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const otp = generateOTP();
    const otpExpiry = getOtpExpiry();

    // Update existing unverified user or create new user
    if (user && !user.isVerified) {
      await user.update({
        fullName, phone, password: hashed,
        address, idNumber, businessName, ownershipType,
        profileImage, type,
        otp, otpExpiry, isVerified: false
      });
    } else {
      user = await User.create({
        fullName, email, phone, password: hashed,
        address, idNumber, businessName, ownershipType,
        profileImage, type, otp, otpExpiry, isVerified: false
      });
    }

    const html = `
      <div style="font-family: sans-serif; line-height: 1.4;">
        <h3>RentHive - Email Verification</h3>
        <p>Hi ${user.fullName || ''},</p>
        <p>Your verification OTP is:</p>
        <h2 style="letter-spacing: 4px;">${otp}</h2>
        <p>This code will expire in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</p>
        <p>If you did not request this, please ignore.</p>
      </div>
    `;

    try {
      await sendEmail({ to: email, subject: 'RentHive - Verify your email', html });
      console.log('✅ OTP email sent successfully to:', email);
    } catch (emailErr) {
      console.error('❌ Email sending failed:', emailErr.message);
      // Log the OTP for development purposes so you can still test
      console.log('🔑 DEV OTP for', email, ':', otp);
    }

    return res.status(201).json({ 
      message: 'OTP sent to email', 
      email, 
      otp: process.env.NODE_ENV === 'development' ? otp : undefined 
    });

  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'User already verified' });

    const otp = generateOTP();
    const otpExpiry = getOtpExpiry();
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    const html = `<p>Your new RentHive OTP: <b>${otp}</b>. Expires in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</p>`;
    await sendEmail({ to: email, subject: 'RentHive - New OTP', html });

    return res.json({ message: 'OTP resent' });
  } catch (err) {
    console.error('resendOtp error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'User not found' });
    
    if (user.isVerified) return res.status(400).json({ error: 'User already verified' });
    if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (new Date() > user.otpExpiry) return res.status(400).json({ error: 'OTP expired' });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();
    
    return res.json({ message: 'Email verified successfully', success: true });
  } catch (err) {
    console.error('verifyOtp error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    
    if (!user.isVerified) return res.status(403).json({ error: 'Please verify your email first' });

    const payload = { id: user.id, email: user.email, type: user.type };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      message: 'Login successful',
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        type: user.type
      }
    });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const otp = generateOTP();
    const otpExpiry = getOtpExpiry();
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    const html = `<p>Your password reset OTP is: <b>${otp}</b></p>`;
    await sendEmail({ to: email, subject: 'RentHive - Password Reset', html });

    return res.json({ message: 'OTP sent to email' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || user.otp !== otp || new Date() > user.otpExpiry) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};