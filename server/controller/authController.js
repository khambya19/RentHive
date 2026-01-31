const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/mailer');
const { generateOTP, getOtpExpiry } = require('../utils/otp');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const logOtpToFile = (email, otp, type = 'Verification') => {
  const logPath = path.join(__dirname, '../otp_logs.txt');
  const timestamp = new Date().toLocaleString();
  const entry = `[${timestamp}] ${type} OTP for ${email}: ${otp}\n`;
  fs.appendFileSync(logPath, entry);
};

const SALT_ROUNDS = 10;

// Helper function for validation
function validateRegisterBody(body) {
  if (!body) return 'Request body is missing or invalid';
  
  const { type, fullName, email, phone, password, confirmPassword } = body;
    // Nepali phone validation: must be 10 digits, start with 9
    if (!phone || !/^9\d{9}$/.test(phone)) return 'Phone must be a valid Nepali number (10 digits, starts with 9)';
  if (!type || !['lessor', 'owner', 'vendor', 'renter', 'user'].includes(type)) return 'Invalid type';
  if (!fullName) return 'Name required';
  if (!email) return 'Email required';
  if (!password) return 'Password required';
  if (password !== confirmPassword) return 'Passwords must match';
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

    const trimmedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ where: { email: trimmedEmail } });

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
        name: fullName,  // Use 'name' to match User model
        phone, password: hashed,
        address, idNumber, businessName, ownershipType,
        profileImage, type,
        otp, otpExpiry, isVerified: false
      });
    } else {
      user = await User.create({
        name: fullName,  // Use 'name' to match User model
        email: trimmedEmail, phone, password: hashed,
        address, idNumber, businessName, ownershipType,
        profileImage, type, otp, otpExpiry, isVerified: false
      });
    }

    const html = `
      <div style="font-family: sans-serif; line-height: 1.4;">
        <h3>RentHive - Email Verification</h3>
        <p>Hi ${user.name || ''},</p>
        <p>Your verification OTP is:</p>
        <h2 style="letter-spacing: 4px;">${otp}</h2>
        <p>This code will expire in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</p>
        <p>If you did not request this, please ignore.</p>
      </div>
    `;

    // Always log OTP for development ease
    console.log('---------------------------------');
    console.log('🔑 Verification OTP for', email, ':', otp);
    console.log('---------------------------------');
    logOtpToFile(email, otp, 'Verification');
    
    try {
      await sendEmail({ to: email, subject: 'RentHive - Verify your email', html });
      console.log('✅ OTP email sent successfully to:', email);
      
      // Notify Admin in Real-time
      const { io } = require('../server');
      if (io) {
        io.to('admins').emit('user-registered', {
          email: user.email,
          type: user.type,
          createdAt: new Date()
        });
        // Also notification
        io.to('admins').emit('new-notification', {
           title: 'New User Registration',
           message: `A new ${user.type} has registered: ${user.name}`,
           type: 'info',
           link: `/admin/dashboard?tab=${user.type === 'user' ? 'users' : 'owners'}`
        });
      }

    } catch (emailErr) {
      console.error('❌ Email sending failed:', emailErr.message);
    }

    return res.status(201).json({ 
      message: 'OTP sent to email', 
      email, 
      // Only include OTP in response during development
      ...(process.env.NODE_ENV !== 'production' && { otp })
    });

  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Check if email already exists (for client-side validation)
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ where: { email } });
    
    // Email exists and is verified = not available
    if (user && user.isVerified) {
      return res.json({ exists: true, message: 'This email is already registered' });
    }
    
    // Email doesn't exist or is unverified = available
    return res.json({ exists: false });
  } catch (err) {
    console.error('checkEmail error', err);
    return res.status(500).json({ error: 'Server error' });
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

    // Always log OTP for development ease
    console.log('---------------------------------');
    console.log('🔑 Resent OTP for', email, ':', otp);
    console.log('---------------------------------');
    logOtpToFile(email, otp, 'Resend');

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

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: trimmedEmail } });
    if (!user) {
      console.log(`❌ Login failed: User with email ${email} not found.`);
      return res.status(400).json({ error: 'User not found' });
    }

    console.log(`DEBUG: Comparing password for ${trimmedEmail}`);
    console.log(`DEBUG: Received password length: ${password.length}`);
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log(`❌ Login failed: Password mismatch for ${email}. Received len: ${password.length}`);
      return res.status(400).json({ error: 'Password incorrect' });
    }
    
    // Check for admin blocking
    if (user.isBlocked) {
      console.log(`❌ Login failed: User ${email} is blocked.`);
      return res.status(403).json({ error: 'Your account has been blocked by the admin. Please contact support.' });
    }
    
    // Check if email is verified
    if (!user.isVerified) {
      console.log(`❌ Login failed: User ${email} email not verified.`);
      return res.status(403).json({ error: 'Please verify your email address before logging in.' });
    }

    const payload = { id: user.id, email: user.email, type: user.type };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Log token in terminal for dev/testing
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔒 [DEV] JWT Token for', email, ':', token);
    }
    return res.json({
      message: 'Login successful',
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        fullName: user.name,
        type: user.type,
        role: user.type,
        profilePic: user.profileImage ? `${process.env.BASE_URL}/uploads/profiles/${user.profileImage}` : null,
        profileImage: user.profileImage,
        kycStatus: user.kycStatus || 'not_submitted',
        isVerified: user.isVerified || false,
        kycDocumentImage: user.kycDocumentImage,
        address: user.address,
        phone: user.phone
      }
    });

  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Get current user profile (Fresh data)
exports.getMe = async (req, res) => {
  try {
    // If req.user is super admin with hardcoded token (id 6 now)
    if (req.user.id === 6 && req.user.type === 'super_admin') {
      return res.json({ success: true, user: req.user });
    }

    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Construct full profile url
    const profilePic = user.profileImage 
       ? (user.profileImage.startsWith('http') ? user.profileImage : `${process.env.BASE_URL}/uploads/profiles/${user.profileImage}`)
       : null;

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        fullName: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        type: user.type,
        role: user.type,
        profilePic,
        profileImage: user.profileImage,
        kycStatus: user.kycStatus || 'not_submitted',
        isVerified: user.isVerified || false,
        kycDocumentImage: user.kycDocumentImage,
        kycDocumentType: user.kycDocumentType,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Error in getMe:', err);
    res.status(500).json({ error: 'Server error' });
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

    // Always log OTP for development ease
    console.log('---------------------------------');
    console.log('🔑 Password Reset OTP for', email, ':', otp);
    console.log('---------------------------------');
    logOtpToFile(email, otp, 'Password Reset');

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

// JWT logout is stateless; for visibility, add a logout endpoint that logs the event
exports.logout = (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🚪 [DEV] User logged out:', req.user ? req.user.email : 'Unknown');
  }
  // Invalidate token on client side (remove from storage)
  return res.json({ message: 'Logged out' });
};