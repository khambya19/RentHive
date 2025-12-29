const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PropertyView = sequelize.define('PropertyView', {
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
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  viewedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'property_views',
  timestamps: false
});

module.exports = PropertyView;
