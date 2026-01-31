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

// Update report status (Admin)
router.put('/:id', reportController.updateReportStatus);
router.patch('/:id/status', reportController.updateReportStatus);

// Cancel report (Reporter)
router.delete('/:id', reportController.cancelReport);

module.exports = router;
