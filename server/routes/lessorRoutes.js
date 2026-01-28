const express = require('express');
const router = express.Router();
const lessorController = require('../controller/lessorController');
const { protect } = require('../middleware/auth');
const { profileUpload } = require('../config/upload');

// Get all lessors with optional filters
router.get('/', lessorController.getAllVendors);

// Get lessor statistics
router.get('/stats', lessorController.getVendorStats);

// Upload profile picture (protected route)
router.post('/upload-profile', protect, profileUpload.single('profilePicture'), lessorController.uploadProfilePicture);

// Get single lessor by ID
router.get('/:id', lessorController.getVendorById);

module.exports = router;
