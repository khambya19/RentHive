const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Vendor = sequelize.define('Vendor', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  business_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ownership_type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Individual',
  },
  photo_url: {
    type: DataTypes.STRING, 
    allowNull: true,
  },
}, {
  tableName: 'vendors',
  timestamps: false,
});

module.exports = Vendor;
