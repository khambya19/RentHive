const express = require('express');
const router = express.Router();
const { createReport, getVendorReports, updateReportStatus } = require('../controller/reportController');
const { protect } = require('../middleware/auth');

// Create a new report (for users/vendors to report listings)
router.post('/', protect, createReport);

// Get reports for vendor's listings (Owner Dashboard)
router.get('/vendor', protect, getVendorReports);

// Update report status
router.put('/:id', protect, updateReportStatus);

module.exports = router;
