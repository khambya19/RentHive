const express = require('express');
const router = express.Router();
const bikeController = require('../controller/bikeController');
const { protect } = require('../middleware/auth');
const { bikeUpload } = require('../config/upload');

// All routes require authentication
router.use(protect);

// Routes for lessors (bike renters)
router.get('/available', bikeController.getAvailableBikes); // Get all available bikes
router.post('/book', bikeController.bookBike); // Book a bike (request approval)
router.post('/book-direct', bikeController.bookBikeDirect); // Book a bike directly (auto-approved)

// Routes for vendors (bike rental shops)
router.get('/vendor', bikeController.getVendorBikes); // Get vendor's bikes
router.post('/vendor', bikeUpload.array('images', 10), bikeController.createBike); // Create new bike
router.put('/vendor/:id', bikeUpload.array('images', 10), bikeController.updateBike); // Update bike
router.delete('/vendor/:id', bikeController.deleteBike); // Delete bike

router.get('/vendor/bookings', bikeController.getVendorBookings); // Get vendor's bookings
router.put('/vendor/bookings/:id/status', bikeController.updateBookingStatus); // Update booking status

// Approve/Reject bike bookings
router.patch('/bookings/:bookingId/approve', bikeController.approveBooking);
router.patch('/bookings/:bookingId/reject', bikeController.rejectBooking);

// NEW: Dashboard-specific routes for BikeVendorDashboard
router.get('/stats', bikeController.getVendorStats); // Get vendor stats for dashboard
router.get('/customers', bikeController.getVendorCustomers); // Get vendor customers

// Upload bike images
router.post('/upload-images', bikeUpload.array('images', 10), bikeController.uploadBikeImages);

module.exports = router;