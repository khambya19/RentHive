const express = require('express');
const router = express.Router();
const bookingController = require('../controller/bookingController');
const { protect } = require('../middleware/auth');

// User routes
router.post('/apply', protect, bookingController.applyForBooking);
router.get('/my-applications', protect, bookingController.getMyApplications);
router.delete('/applications/:id', protect, bookingController.cancelApplication);
router.put('/applications/:id', protect, bookingController.updateApplicationDetails);

// Owner routes
router.get('/owner/applications', protect, bookingController.getOwnerApplications);
router.patch('/owner/applications/:id', protect, bookingController.updateApplicationStatus);

// Payment route
router.post('/pay/:id', protect, bookingController.payForApplication);

module.exports = router;
