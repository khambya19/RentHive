const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const { protect, superAdminOnly } = require('../middleware/auth');
const { profileUpload } = require('../config/upload'); // Assuming this exists for general uploads

// Route for User Profile Update
router.put('/profile', protect, userController.updateProfile);

// Route for Saving/Unsaving Listings
router.get('/saved-listings', protect, userController.getSavedListings);
router.post('/save-listing', protect, userController.saveListing);
router.post('/unsave-listing', protect, userController.unsaveListing);

// Route for Password Change
router.put('/change-password', protect, userController.changePassword);

// Route for KYC Document Upload
router.post('/kyc-upload', protect, profileUpload.single('kycDocument'), userController.uploadKyc);

// --- Existing Admin Routes (kept for compatibility if used via /api/users/admin/...) ---
router.get('/admin/users', protect, superAdminOnly, userController.getAllUsers); 
router.get('/admin/users/:id', protect, superAdminOnly, userController.getUserById);
router.patch('/admin/users/:id/block', protect, superAdminOnly, userController.toggleBlockUser); 
router.delete('/admin/users/:id', protect, superAdminOnly, userController.softDeleteUser);

// --- Public/Protected Getters ---
router.get('/stats', userController.getVendorStats);
router.get('/my-applications', protect, userController.getMyApplications);
router.get('/my-rentals', protect, userController.getMyRentals);
router.post('/upload-photo', protect, profileUpload.single('profilePic'), userController.uploadProfilePicture); // Use 'profilePic' to match frontend FormData
router.get('/vendor/:id', userController.getVendorById);

module.exports = router;
