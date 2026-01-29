const Notification = require('../models/Notification');
const { Sequelize, Op } = require('sequelize');

// Helper to get socket.io instance safely
const getSocketIO = () => {
  try {
    const { io, connectedUsers } = require('../server');
    return { io, connectedUsers };
  } catch (err) {
    console.warn('Socket.IO not available:', err.message);
    return { io: null, connectedUsers: null };
  }
};

/**
 * Create broadcast notification → visible to everyone
 * POST /api/notifications/broadcast
 */
const createBroadcast = async (req, res) => {
  try {
    const { title, message, type = 'info', link } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required',
      });
    }

    const notification = await Notification.create({
      user_id: null,
      title: title.trim(),
      message: message.trim(),
      type,
      is_broadcast: true,
      link: link || null,
    });

    console.log(`📢 Broadcast created → ID ${notification.id}`);

    const { io } = getSocketIO();
    if (io) {
      const payload = {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isBroadcast: notification.is_broadcast,
        link: notification.link,
        isRead: notification.is_read ?? false,
        createdAt: notification.created_at,
      };
      io.emit('new-notification', payload);
      console.log('✅ Broadcast emitted to all connected clients');
    }

    return res.status(201).json({
      success: true,
      message: 'Broadcast notification created and sent',
      data: notification,
    });
  } catch (error) {
    console.error('❌ createBroadcast error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create broadcast notification',
      error: error.message,
    });
  }
};

/**
 * Create personal notification for one user
 * POST /api/notifications/user
 */
const createUserNotification = async (req, res) => {
  try {
    const { userId, title, message, type = 'info', link } = req.body;

    if (!userId || !title?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'userId, title, and message are required',
      });
    }

    const notification = await Notification.create({
      user_id: Number(userId),
      title: title.trim(),
      message: message.trim(),
      type,
      is_broadcast: false,
      link: link || null,
    });

    console.log(`📧 Notification created for user ${userId} → ID ${notification.id}`);

    const { io, connectedUsers } = getSocketIO();
    if (io && connectedUsers) {
      const socketId = connectedUsers.get(String(userId));
      if (socketId) {
        const payload = {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          isBroadcast: notification.is_broadcast,
          link: notification.link,
          isRead: notification.is_read ?? false,
          createdAt: notification.created_at,
        };
        io.to(socketId).emit('new-notification', payload);
        console.log(`✅ Real-time notification sent to socket ${socketId}`);
      } else {
        console.log(`⚠️ User ${userId} offline → saved to DB only`);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification,
    });
  } catch (error) {
    console.error('❌ createUserNotification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create user notification',
      error: error.message,
    });
  }
};

/**
 * Get user's notifications (personal + broadcasts)
 * GET /api/notifications/user/:userId
 */
const getUserNotifications = async (req, res) => {
  console.log('getUserNotifications called for user:', req.params.userId);
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, unreadOnly = 'false' } = req.query;

    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({
        success: false,
        message: 'Valid numeric userId is required',
      });
    }

    const parsedLimit = Math.min(Math.max(1, Number(limit)), 100);
    const parsedOffset = Math.max(0, Number(offset));
    const onlyUnread = unreadOnly === 'true' || unreadOnly === true;

    const notifications = await Notification.findByUserId(Number(userId), {
      limit: parsedLimit,
      offset: parsedOffset,
      unreadOnly: onlyUnread,
    });

    const unreadCount = await Notification.getUnreadCount(Number(userId));

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        returned: notifications.length,
      },
    });
  } catch (error) {
    console.error('❌ getUserNotifications error:', error);
    console.error(error); // Log full error object
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
};

/**
 * Mark one notification as read
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!id || !userId) {
      return res.status(400).json({
        success: false,
        message: 'notification id and userId are required',
      });
    }

    const notification = await Notification.markAsRead(Number(id), Number(userId));

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found, not owned by you, or already read',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    console.error('❌ markAsRead error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message,
    });
  }
};

/**
 * Mark all notifications as read for the user
 * PATCH /api/notifications/user/:userId/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({
        success: false,
        message: 'Valid numeric userId is required',
      });
    }

    const count = await Notification.markAllAsRead(Number(userId));

    return res.status(200).json({
      success: true,
      message: `${count} notification(s) marked as read`,
      data: { count },
    });
  } catch (error) {
    console.error('❌ markAllAsRead error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message,
    });
  }
};

/**
 * Delete a personal notification (broadcasts usually protected)
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // from auth middleware

    if (!id || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID and authenticated user required',
      });
    }

    const deletedCount = await Notification.destroy({
      where: {
        id: Number(id),
        user_id: Number(userId),          // ← snake_case
        is_broadcast: false,
      },
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or you do not have permission to delete it',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('❌ deleteNotification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message,
    });
  }
};

/**
 * Vendor accepts / declines a booking → notifies tenant
 * POST /api/notifications/booking-response
 */
const handleBookingResponse = async (req, res) => {
  try {
    const { bookingId, action, notificationId } = req.body;
    const vendorId = req.user?.id;

    if (!bookingId || !action || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'bookingId and valid action (accept/decline) required',
      });
    }

    const Booking = require('../models/Booking');
    const Property = require('../models/Property');
    const User = require('../models/User');

    const booking = await Booking.findOne({
      where: { id: bookingId, vendorId },
      include: [
        { model: User, as: 'tenant', attributes: ['id', 'fullName', 'email'] },
        { model: Property, as: 'property', attributes: ['id', 'title'] },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not owned by you',
      });
    }

    const newStatus = action === 'accept' ? 'Approved' : 'Rejected';
    await booking.update({ status: newStatus });

    if (action === 'accept') {
      await Property.update(
        { status: 'Rented' },
        { where: { id: booking.propertyId } }
      );
    }

    // Optional: mark vendor's own notification as read
    if (notificationId) {
      await Notification.markAsRead(Number(notificationId), vendorId).catch(() => {});
    }

    // Notify tenant
    const moveInFormatted = new Date(booking.moveInDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const isAccept = action === 'accept';
    const title = isAccept ? '✅ Booking Request Accepted!' : '❌ Booking Request Declined';
    const message = isAccept
      ? `Your booking request for "${booking.property.title}" starting ${moveInFormatted} has been approved. The owner will contact you soon.`
      : `Your booking request for "${booking.property.title}" starting ${moveInFormatted} was declined. Please try other properties.`;

    const tenantNotif = await Notification.create({
      user_id: booking.tenantId,
      title,
      message,
      type: isAccept ? 'success' : 'error',
      is_broadcast: false,
      link: '/user/applications',
    });

    const { io, connectedUsers } = getSocketIO();
    if (io && connectedUsers) {
      const socketId = connectedUsers.get(String(booking.tenantId));
      if (socketId) {
        const payload = {
          id: tenantNotif.id,
          title: tenantNotif.title,
          message: tenantNotif.message,
          type: tenantNotif.type,
          link: tenantNotif.link,
          isRead: tenantNotif.is_read ?? false,
          createdAt: tenantNotif.created_at,
        };
        io.to(socketId).emit('new-notification', payload);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Booking ${action}ed successfully`,
      data: { bookingId: booking.id, status: newStatus },
    });
  } catch (error) {
    console.error('❌ handleBookingResponse error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process booking response',
      error: error.message,
    });
  }
};

module.exports = {
  createBroadcast,
  createUserNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  handleBookingResponse,
};