// Notification model using pg pool
const pool = require('../config/database');

const Notification = {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification details
   * @returns {Promise<Object>} Created notification
   */
  async create(notificationData) {
    const { 
      userId, 
      title, 
      message, 
      type = 'info', 
      isBroadcast = false, 
      link = null
    } = notificationData;

    try {
      const result = await pool.query(
        `INSERT INTO notifications 
         (user_id, title, message, type, is_broadcast, link, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
         RETURNING *`,
        [userId, title, message, type, isBroadcast, link]
      );
      
      console.log('✅ Notification created:', result.rows[0].id);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  },

  /**
   * Find all notifications for a specific user (including broadcasts)
   * @param {number} userId - User ID
   * @param {Object} options - Query options (limit, offset, unreadOnly)
   * @returns {Promise<Array>} Array of notifications
   */
  async findByUserId(userId, options = {}) {
    const { limit = 50, offset = 0, unreadOnly = false } = options;
    
    try {
      let query = `
        SELECT * FROM notifications 
        WHERE (user_id = $1 OR is_broadcast = true)
      `;
      
      if (unreadOnly) {
        query += ' AND is_read = false';
      }
      
      query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      
      const result = await pool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching user notifications:', error);
      throw error;
    }
  },

  /**
   * Get unread count for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Count of unread notifications
   */
  async getUnreadCount(userId) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM notifications 
         WHERE (user_id = $1 OR is_broadcast = true) AND is_read = false`,
        [userId]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      throw error;
    }
  },

  /**
   * Find a notification by ID
   * @param {number} id - Notification ID
   * @returns {Promise<Object|null>} Notification or null
   */
  async findById(id) {
    try {
      const result = await pool.query(
        'SELECT * FROM notifications WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error finding notification by ID:', error);
      throw error;
    }
  },

  /**
   * Mark a notification as read
   * @param {number} id - Notification ID
   * @param {number} userId - User ID (for validation)
   * @returns {Promise<Object|null>} Updated notification or null
   */
  async markAsRead(id, userId) {
    try {
      const result = await pool.query(
        `UPDATE notifications 
         SET is_read = true, updated_at = NOW() 
         WHERE id = $1 AND (user_id = $2 OR is_broadcast = true)
         RETURNING *`,
        [id, userId]
      );
      
      if (result.rows[0]) {
        console.log('✅ Notification marked as read:', id);
      }
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of notifications updated
   */
  async markAllAsRead(userId) {
    try {
      const result = await pool.query(
        `UPDATE notifications 
         SET is_read = true, updated_at = NOW() 
         WHERE (user_id = $1 OR is_broadcast = true) AND is_read = false
         RETURNING id`,
        [userId]
      );
      
      console.log(`✅ Marked ${result.rows.length} notifications as read for user ${userId}`);
      return result.rows.length;
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Delete a notification
   * @param {number} id - Notification ID
   * @param {number} userId - User ID (for validation)
   * @returns {Promise<boolean>} Success status
   */
  async delete(id, userId) {
    try {
      const result = await pool.query(
        `DELETE FROM notifications 
         WHERE id = $1 AND (user_id = $2 OR is_broadcast = true)
         RETURNING id`,
        [id, userId]
      );
      
      if (result.rows[0]) {
        console.log('✅ Notification deleted:', id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      throw error;
    }
  },

  /**
   * Delete all read notifications for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of notifications deleted
   */
  async deleteReadNotifications(userId) {
    try {
      const result = await pool.query(
        `DELETE FROM notifications 
         WHERE user_id = $1 AND is_read = true
         RETURNING id`,
        [userId]
      );
      
      console.log(`✅ Deleted ${result.rows.length} read notifications for user ${userId}`);
      return result.rows.length;
    } catch (error) {
      console.error('❌ Error deleting read notifications:', error);
      throw error;
    }
  }
};

module.exports = Notification;
