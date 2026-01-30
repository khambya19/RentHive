const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  conversationId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Unique identifier for conversation between two users'
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  propertyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'properties',
      key: 'id'
    },
    comment: 'Optional property reference for context'
  },
  bikeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'bikes',
      key: 'id'
    },
    comment: 'Optional bike reference for context'
  },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Optional booking reference'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'file', 'system'),
    defaultValue: 'text'
  },
  attachment: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'File path for attachments'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'messages',
  timestamps: true,
  indexes: [
    {
      fields: ['conversationId']
    },
    {
      fields: ['senderId', 'receiverId']
    },
    {
      fields: ['isRead']
    }
  ]
});

module.exports = Message;
