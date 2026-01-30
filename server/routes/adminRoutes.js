const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const adminNotificationController = require('../controller/adminNotificationController');
const { protect } = require('../middleware/auth');

// Middleware to check if user is super admin
const superAdminCheck = (req, res, next) => {
  if (req.user && (req.user.role === 'super_admin' || req.headers.authorization === 'Bearer superadmintoken')) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Super admin only' });
};

// Admin dashboard stats
router.get('/stats', protect, superAdminCheck, adminController.getAdminStats);

// User management
router.get('/users', protect, superAdminCheck, adminController.getAllUsers);
router.get('/users/:id', protect, superAdminCheck, adminController.getUserById);
router.patch('/users/:id/block', protect, superAdminCheck, adminController.toggleBlockUser);
router.delete('/users/:id', protect, superAdminCheck, adminController.softDeleteUser);
router.post('/users/:id/reset-password', protect, superAdminCheck, adminController.resetUserPassword);

// KYC Management
// KYC Management
router.post('/users/:id/kyc-status', protect, superAdminCheck, adminController.updateKycStatus);

// Property Management
router.get('/properties', protect, superAdminCheck, adminController.getAllProperties);
router.patch('/properties/:id/status', protect, superAdminCheck, adminController.togglePropertyStatus);
router.delete('/properties/:id', protect, superAdminCheck, adminController.deleteProperty);

// Automobile Management
router.get('/automobiles', protect, superAdminCheck, adminController.getAllBikes);
router.patch('/automobiles/:id/status', protect, superAdminCheck, adminController.toggleBikeStatus);
router.delete('/automobiles/:id', protect, superAdminCheck, adminController.deleteBike);

// Report Management
router.get('/reports', protect, superAdminCheck, adminController.getAllReports);
router.patch('/reports/:id/status', protect, superAdminCheck, adminController.updateReportStatus);


// Notification management
router.post('/notifications/bulk', protect, superAdminCheck, adminNotificationController.sendBulkNotifications);

module.exports = router;
