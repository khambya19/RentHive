const { Model, DataTypes, Op } = require('sequelize');
const sequelize = require('../config/db');

class Notification extends Model {}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {                  // ← snake_case to match DB
      type: DataTypes.INTEGER,
      allowNull: true,          // null = broadcast
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'info',
    },
    is_broadcast: {             // ← snake_case
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_read: {                  // ← snake_case
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
  }
);

// Custom static methods — using snake_case column names
Notification.findByUserId = async function (userId, options = {}) {
  const { limit = 50, offset = 0, unreadOnly = false } = options;

  const where = {
    [Op.or]: [
      { user_id: Number(userId) },
      { is_broadcast: true },
    ],
  };

  if (unreadOnly) {
    where.is_read = false;
  }

  return this.findAll({
    where,
    order: [['created_at', 'DESC']],
    limit: Number(limit),
    offset: Number(offset),
    raw: true,
  });
};

Notification.getUnreadCount = async function (userId) {
  return this.count({
    where: {
      is_read: false,
      [Op.or]: [
        { user_id: Number(userId) },
        { is_broadcast: true },
      ],
    },
  });
};

Notification.markAsRead = async function (notificationId, userId) {
  const [affected] = await this.update(
    { is_read: true },
    {
      where: {
        id: Number(notificationId),
        [Op.or]: [
          { user_id: Number(userId) },
          { is_broadcast: true },
        ],
      },
    }
  );

  if (affected === 0) return null;

  return this.findByPk(Number(notificationId), { raw: true });
};

Notification.markAllAsRead = async function (userId) {
  const [count] = await this.update(
    { is_read: true },
    {
      where: {
        is_read: false,
        [Op.or]: [
          { user_id: Number(userId) },
          { is_broadcast: true },
        ],
      },
    }
  );
  return count;
};

module.exports = Notification;