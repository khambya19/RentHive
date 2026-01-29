const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const adminNotificationController = require('../controller/adminNotificationController');
const { protect } = require('../middleware/auth');

// Middleware to check if user is super admin (for frontend hardcoded admin)
const superAdminCheck = (req, res, next) => {
  // Allow if user has super_admin role or if using hardcoded token
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

// Notification management
router.post('/notifications/bulk', protect, superAdminCheck, adminNotificationController.sendBulkNotifications);

module.exports = router;
