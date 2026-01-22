const express = require('express');
const router = express.Router();
const {
  createBroadcast,
  createUserNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  handleBookingResponse
} = require('../controller/notificationController');
const { protect } = require('../middleware/auth');

/**
 * @route   POST /api/notifications/broadcast
 * @desc    Create a broadcast notification for all users
 * @access  Private (Admin only - add auth middleware as needed)
 */
router.post('/broadcast', createBroadcast);

/**
 * @route   POST /api/notifications/user
 * @desc    Create a user-specific notification
 * @access  Private
 */
router.post('/user', createUserNotification);

/**
 * @route   GET /api/notifications/user/:userId
 * @desc    Get all notifications for a user (including broadcasts)
 * @access  Private
 * @query   limit, offset, unreadOnly
 */
router.get('/user/:userId', getUserNotifications);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.patch('/:id/read', markAsRead);

/**
 * @route   PATCH /api/notifications/user/:userId/read-all
 * @desc    Mark all notifications as read for a user
 * @access  Private
 */
router.patch('/user/:userId/read-all', markAllAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', deleteNotification);

/**
 * @route   POST /api/notifications/booking-response
 * @desc    Handle booking request response (Accept/Decline)
 * @access  Private (Owner only)
 */
router.post('/booking-response', protect, handleBookingResponse);

module.exports = router;
