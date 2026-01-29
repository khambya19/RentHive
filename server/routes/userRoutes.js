const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const { protect } = require('../middleware/auth');
const { profileUpload } = require('../config/upload');

// SUPER ADMIN: User management
const { superAdminOnly } = require('../middleware/auth');
router.get('/admin/users', protect, superAdminOnly, userController.getAllUsers); // List users
router.get('/admin/users/:id', protect, superAdminOnly, userController.getUserById); // View user
router.patch('/admin/users/:id/block', protect, superAdminOnly, userController.toggleBlockUser); // Block/unblock
router.delete('/admin/users/:id', protect, superAdminOnly, userController.softDeleteUser); // Soft delete
router.post('/admin/users/:id/reset-password', protect, superAdminOnly, userController.resetUserPassword); // Reset password

// Get user statistics
router.get('/stats', userController.getVendorStats);

// Get user's booking applications (protected route)
router.get('/my-applications', protect, userController.getMyApplications);

// Upload profile picture (protected route)
router.post('/upload-profile', protect, profileUpload.single('profilePicture'), userController.uploadProfilePicture);

// Get single user by ID
router.get('/:id', userController.getVendorById);

module.exports = router;
