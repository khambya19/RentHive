const express = require('express');
const router = express.Router();
const auth = require('../controller/authController');
const { profileUpload } = require('../config/upload');

// Updated register route with explicit error handling
router.post('/register', (req, res, next) => {
  const contentType = req.headers['content-type'];
  
  if (contentType && contentType.includes('multipart/form-data')) {
    // We wrap multer in a function to catch errors (like wrong field names)
    profileUpload.single('profileImage')(req, res, (err) => {
      if (err) {
        console.error("Multer Upload Error:", err);
        return res.status(400).json({ error: "Image upload failed: " + err.message });
      }
      next();
    });
  } else {
    next();
  }
}, auth.register);

router.post('/resend-otp', auth.resendOtp);
router.post('/verify-otp', auth.verifyOtp);
router.post('/login', auth.login);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);

module.exports = router;