const express = require('express');
const router = express.Router();
const reportController = require('../controller/reportController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Submit a report (any authenticated user)
router.post('/', reportController.submitReport);

// Get user's submitted reports
router.get('/my-reports', reportController.getUserReports);

// Get reports for vendor's listings (Owner Dashboard)
router.get('/vendor', reportController.getVendorReports);

// Get all reports (admin/vendor)
router.get('/all', reportController.getAllReports);

// Update report status
router.put('/:id', reportController.updateReportStatus);
router.put('/:id/status', reportController.updateReportStatus); // Support both styles

module.exports = router;
