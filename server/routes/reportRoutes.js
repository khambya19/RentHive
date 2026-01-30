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

// Get all reports (admin/vendor - you can add role check middleware later)
router.get('/all', reportController.getAllReports);

// Update report status (admin only - you can add role check middleware later)
router.put('/:id/status', reportController.updateReportStatus);

module.exports = router;
