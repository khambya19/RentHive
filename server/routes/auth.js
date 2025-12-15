// RENTHIVE/server/routes/auth.js

const express = require('express');
// CRITICAL FIX: Destructure the exported functions correctly.
const { loginUser, forgotPassword, registerUser } = require('../controller/authController'); 
const router = express.Router();

// Define Routes - Handlers MUST be functions
router.post('/login', loginUser); 
router.post('/forgot-password', forgotPassword);
router.post('/register', registerUser); // Placeholder for Registration

module.exports = router;