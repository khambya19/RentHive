const express = require('express');
const router = express.Router();
const { createMonthlyPayments, sendUpcomingPaymentReminders, checkOverduePayments } = require('../services/paymentScheduler');

// Manual trigger endpoints for testing (should be protected with admin auth in production)
router.post('/test/create-monthly', async (req, res) => {
  try {
    await createMonthlyPayments();
    res.json({ success: true, message: 'Monthly payment creation triggered' });
  } catch (error) {
    console.error('Test create monthly payments error:', error);
    res.status(500).json({ error: 'Failed to create monthly payments' });
  }
});

router.post('/test/send-reminders', async (req, res) => {
  try {
    await sendUpcomingPaymentReminders();
    res.json({ success: true, message: 'Payment reminders sent' });
  } catch (error) {
    console.error('Test send reminders error:', error);
    res.status(500).json({ error: 'Failed to send reminders' });
  }
});

router.post('/test/check-overdue', async (req, res) => {
  try {
    await checkOverduePayments();
    res.json({ success: true, message: 'Overdue check completed' });
  } catch (error) {
    console.error('Test check overdue error:', error);
    res.status(500).json({ error: 'Failed to check overdue payments' });
  }
});

module.exports = router;
