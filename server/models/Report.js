const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reporterType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Type of user who reported (user, vendor)'
  },
  reporterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of the user/vendor who reported'
  },
  reportedType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Type of entity being reported (property, automobile, user, vendor)'
  },
  reportedId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of the entity being reported'
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of the owner of the reported listing (for quick filtering)'
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Category of the report (e.g., Spam, Fraud, Inappropriate)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detailed description of the issue'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
    allowNull: false
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes from admin/owner about the report'
  }
}, {
  tableName: 'reports',
  timestamps: true
});

module.exports = Report;
