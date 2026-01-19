const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Booking = sequelize.define('Booking', {
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
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  moveInDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  moveOutDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  monthlyRent: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Active', 'Completed', 'Cancelled'),
    defaultValue: 'Pending'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'bookings',
  timestamps: true
});

// Define associations
Booking.associate = (models) => {
  Booking.belongsTo(models.Property, {
    foreignKey: 'propertyId',
    as: 'property'
  });
  
  Booking.belongsTo(models.User, {
    foreignKey: 'tenantId',
    as: 'tenant'
  });
  
  Booking.belongsTo(models.User, {
    foreignKey: 'vendorId',
    as: 'vendor'
  });
};

module.exports = Booking;
