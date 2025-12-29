const express = require('express');
const router = express.Router();
const vendorController = require('../controller/vendorController');
const { protect } = require('../middleware/auth');
const { profileUpload } = require('../config/upload');

// Get all vendors with optional filters
router.get('/', vendorController.getAllVendors);

// Get vendor statistics
router.get('/stats', vendorController.getVendorStats);

// Upload profile picture (protected route)
router.post('/upload-profile', protect, profileUpload.single('profilePicture'), vendorController.uploadProfilePicture);

// Get single vendor by ID
router.get('/:id', vendorController.getVendorById);

module.exports = router;
