const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BookingApplication = sequelize.define('BookingApplication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  listingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of property or bike'
  },
  listingType: {
    type: DataTypes.ENUM('property', 'bike'),
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duration in days'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid', 'cancelled'),
    defaultValue: 'pending'
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  paymentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'payments',
      key: 'id'
    }
  }
}, {
  tableName: 'booking_applications',
  timestamps: true
});

module.exports = BookingApplication;
