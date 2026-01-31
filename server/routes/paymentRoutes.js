const express = require('express');
const router = express.Router();
const paymentController = require('../controller/paymentController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Tenant routes
router.get('/tenant', paymentController.getTenantPayments);

// Owner routes
router.get('/owner', paymentController.getOwnerPayments);
router.get('/owner/stats', paymentController.getPaymentStats);
router.post('/', paymentController.createPayment);

router.get('/history', paymentController.getPaymentHistory);
router.get('/admin/all', paymentController.getAllPaymentsForAdmin);
router.patch('/:paymentId/mark-paid', paymentController.markPaymentAsPaid);

module.exports = router;
