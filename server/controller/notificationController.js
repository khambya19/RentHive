const Notification = require('../models/Notification');

// Function to get io and connectedUsers (avoids circular dependency)
const getSocketIO = () => {
  const { io, connectedUsers } = require('../server');
  return { io, connectedUsers };
};

/**
 * Create a broadcast notification for all users
 * @route POST /api/notifications/broadcast
 */
const createBroadcast = async (req, res) => {
  try {
    const { title, message, type = 'info', link } = req.body;

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // Create broadcast notification (userId is null for broadcasts)
    const notification = await Notification.create({
      userId: null,
      title,
      message,
      type,
      isBroadcast: true,
      link
    });

    console.log('📢 Broadcasting notification to all users:', notification.id);

    // Get io instance and emit to all connected users
    const { io } = getSocketIO();
    if (io) {
      io.emit('new-notification', {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isBroadcast: notification.is_broadcast,
        link: notification.link,
        isRead: notification.is_read,
        createdAt: notification.created_at
      });
      console.log('✅ Broadcast notification emitted to all users');
    }

    res.status(201).json({
      success: true,
      message: 'Broadcast notification sent successfully',
      data: notification
    });
  } catch (error) {
    console.error('❌ Error creating broadcast:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create broadcast notification',
      error: error.message
    });
  }
};

/**
 * Create a user-specific notification
 * @route POST /api/notifications/user
 */
const createUserNotification = async (req, res) => {
  try {
    const { userId, title, message, type = 'info', link } = req.body;

    // Validate required fields
    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'userId, title, and message are required'
      });
    }

    // Create user notification
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      isBroadcast: false,
      link
    });

    console.log(`📧 Sending notification to user ${userId}:`, notification.id);

    // Get io and connectedUsers, emit to specific user if they are connected
    const { io, connectedUsers } = getSocketIO();
    if (io && connectedUsers) {
      const socketId = connectedUsers.get(userId.toString());
      if (socketId) {
        io.to(socketId).emit('new-notification', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          isBroadcast: notification.is_broadcast,
          link: notification.link,
          isRead: notification.is_read,
          createdAt: notification.created_at
        });
        console.log(`✅ Notification sent to socket ${socketId}`);
      } else {
        console.log(`⚠️ User ${userId} is not connected (notification saved to DB)`);
      }
    }

    res.status(201).json({
      success: true,
      message: 'User notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('❌ Error creating user notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user notification',
      error: error.message
    });
  }
};

/**
 * Get all notifications for a user (including broadcasts)
 * @route GET /api/notifications/user/:userId
 */
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    // Get notifications
    const notifications = await Notification.findByUserId(parseInt(userId), {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true'
    });

    // Get unread count
    const unreadCount = await Notification.getUnreadCount(parseInt(userId));

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total: notifications.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

/**
 * Mark a notification as read
 * @route PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Validate required fields
    if (!id || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID and userId are required'
      });
    }

    // Mark as read
    const notification = await Notification.markAsRead(parseInt(id), parseInt(userId));

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or already read'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

/**
 * Mark all notifications as read for a user
 * @route PATCH /api/notifications/user/:userId/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    // Mark all as read
    const count = await Notification.markAllAsRead(parseInt(userId));

    res.status(200).json({
      success: true,
      message: `${count} notifications marked as read`,
      data: { count }
    });
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

/**
 * Delete a notification
 * @route DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Validate required fields
    if (!id || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID and userId are required'
      });
    }

    // Delete notification
    const success = await Notification.delete(parseInt(id), parseInt(userId));

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

module.exports = {
  createBroadcast,
  createUserNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
