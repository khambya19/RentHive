const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  deleteMessage
} = require('../controller/messageController');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/messages/conversations
 * @desc    Get all conversations for logged-in user
 * @access  Private
 */
router.get('/conversations', getConversations);

/**
 * @route   GET /api/messages/conversation/:otherUserId
 * @desc    Get all messages in a conversation
 * @access  Private
 */
router.get('/conversation/:otherUserId', getMessages);

/**
 * @route   POST /api/messages/send
 * @desc    Send a new message
 * @access  Private
 */
router.post('/send', sendMessage);

/**
 * @route   PUT /api/messages/read/:otherUserId
 * @desc    Mark all messages in conversation as read
 * @access  Private
 */
router.put('/read/:otherUserId', markAsRead);

/**
 * @route   GET /api/messages/unread-count
 * @desc    Get unread message count
 * @access  Private
 */
router.get('/unread-count', getUnreadCount);

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/:messageId', deleteMessage);

module.exports = router;
