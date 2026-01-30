const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Bike = sequelize.define('Bike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Display name for the bike listing'
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: false
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('Motorcycle', 'Scooter', 'Electric Bike', 'Bicycle'),
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  engineCapacity: {
    type: DataTypes.INTEGER,
    allowNull: true, // For bicycles/electric bikes
    comment: 'Engine capacity in CC'
  },
  fuelType: {
    type: DataTypes.ENUM('Petrol', 'Electric', 'Hybrid', 'None'),
    allowNull: false,
    defaultValue: 'Petrol'
  },
  dailyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  weeklyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null
  },
  monthlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  securityDeposit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  features: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('Available', 'Rented', 'Maintenance', 'Inactive'),
    defaultValue: 'Available'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pickupLocation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  licenseRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  minimumAge: {
    type: DataTypes.INTEGER,
    defaultValue: 18
  },
  bookingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00
  },
  ratingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'bikes',
  timestamps: true
});

module.exports = Bike;