
const express = require('express');
const router = express.Router();
const auth = require('../controller/authController');


router.post('/register', auth.register);
router.post('/resend-otp', auth.resendOtp);
router.post('/verify-otp', auth.verifyOtp);
router.post('/login', auth.login);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);

module.exports = router;
