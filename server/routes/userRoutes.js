const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const { protect } = require('../middleware/auth');
const { profileUpload } = require('../config/upload');

// Get all users with optional filters
router.get('/', userController.getAllVendors);

// Get user statistics
router.get('/stats', userController.getVendorStats);

// Get user's booking applications (protected route)
router.get('/my-applications', protect, userController.getMyApplications);

// Upload profile picture (protected route)
router.post('/upload-profile', protect, profileUpload.single('profilePicture'), userController.uploadProfilePicture);

// Get single user by ID
router.get('/:id', userController.getVendorById);

module.exports = router;
