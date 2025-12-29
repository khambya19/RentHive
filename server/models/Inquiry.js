const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Inquiry = sequelize.define('Inquiry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  propertyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'properties',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('New', 'Read', 'Replied'),
    defaultValue: 'New'
  }
}, {
  tableName: 'inquiries',
  timestamps: true
});

module.exports = Inquiry;
