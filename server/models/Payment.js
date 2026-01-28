const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'booking_id',
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'tenant_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'owner_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'due_date'
  },
  paidDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'paid_date'
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Paid', 'Overdue', 'Cancelled'),
    defaultValue: 'Pending'
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'payment_method'
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'transaction_id'
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'reminder_sent'
  },
  reminderCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'reminder_count'
  },
  lastReminderDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_reminder_date'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'payments',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Payment;
