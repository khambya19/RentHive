const Notification = require('../models/Notification');
const User = require('../models/User');
const { Op } = require('sequelize');


/**
 * Send bulk notifications to users by type (renter/owner/lessor/vendor)
 * POST /api/admin/notifications/bulk
 */
const sendBulkNotifications = async (req, res) => {
  try {
    const { recipientType, title, message, type = 'info', link } = req.body;

    if (!recipientType || !title?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'recipientType, title, and message are required',
      });
    }

    // Find all users of the specified type
    const users = await User.findAll({
      where: { type: recipientType },
      attributes: ['id']
    });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No users found with type: ${recipientType}`,
      });
    }

    // Create notifications for each user
    const notifications = await Promise.all(
      users.map(user => 
        Notification.create({
          user_id: user.id,
          title: title.trim(),
          message: message.trim(),
          type,
          is_broadcast: false,
          link: link || null,
        })
      )
    );

    console.log(`📧 Bulk notification sent to ${users.length} ${recipientType}s`);

    // Emit to connected users via socket.io
    const io = req.app.get('io');
    if (io) {
      notifications.forEach(notification => {
          io.to(`user_${notification.user_id}`).emit('new-notification', {
              id: notification.id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              link: notification.link,
              isRead: false,
              createdAt: notification.created_at,
          });
      });
    }

    return res.status(201).json({
      success: true,
      message: `Bulk notification sent to ${users.length} ${recipientType}s`,
      count: users.length,
    });
  } catch (error) {
    console.error('❌ sendBulkNotifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send bulk notifications',
      error: error.message,
    });
  }
};

module.exports = {
  sendBulkNotifications,
};
