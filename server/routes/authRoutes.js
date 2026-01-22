const express = require('express');
const router = express.Router();
const auth = require('../controller/authController');
const { profileUpload } = require('../config/upload');

// Updated register route to handle both JSON and multipart data
router.post('/register', (req, res, next) => {
  // Check if the request is multipart/form-data
  const contentType = req.headers['content-type'];
  if (contentType && contentType.includes('multipart/form-data')) {
    // Use multer middleware for multipart data
    profileUpload.single('profileImage')(req, res, next);
  } else {
    // Skip multer for JSON requests
    next();
  }
}, auth.register);

router.post('/resend-otp', auth.resendOtp);
router.post('/verify-otp', auth.verifyOtp);
router.post('/login', auth.login);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);

module.exports = router;
