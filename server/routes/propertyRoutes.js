const express = require('express');
const router = express.Router();
const propertyController = require('../controller/propertyController');
const { protect } = require('../middleware/auth');
const { propertyUpload } = require('../config/upload');

// All routes require authentication
router.use(protect);

// Browse available properties (for all authenticated users)
router.get('/available', propertyController.getAvailableProperties);

// Book a property (for tenants/lessors)
router.post('/book', propertyController.bookProperty);

// Get single property by ID
router.get('/:id', propertyController.getPropertyById);

// Get vendor's properties
router.get('/', propertyController.getVendorProperties);

// Get vendor dashboard stats
router.get('/stats', propertyController.getVendorStats);

// Create new property
router.post('/', (req, res, next) => {
  propertyUpload.array('images', 50)(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    next();
  });
}, propertyController.createProperty);

// Update property
router.put('/:id', (req, res, next) => {
  propertyUpload.array('images', 50)(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    next();
  });
}, propertyController.updateProperty);

// Delete property
router.delete('/:id', propertyController.deleteProperty);

// Upload property images
router.post('/upload-images', (req, res, next) => {
  propertyUpload.array('images', 50)(req, res, (err) => {
    if (err) {
      console.error('Multer Error during property image upload:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
}, propertyController.uploadPropertyImages);

// Update booking status (support both PUT and PATCH)
router.patch('/bookings/:id/status', propertyController.updateBookingStatus);
router.put('/bookings/:id/status', propertyController.updateBookingStatus);

module.exports = router;
