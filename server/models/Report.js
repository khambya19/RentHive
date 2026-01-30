const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reporterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'reporter_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  reporterType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user',
    comment: 'Type of user who reported (user, vendor)'
  },
  listingType: {
    type: DataTypes.ENUM('property', 'bike', 'automobile'),
    allowNull: false,
    field: 'listing_type'
  },
  listingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'listing_id'
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of the owner of the reported listing (for quick filtering)'
  },
  reason: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'reviewed', 'resolved', 'dismissed'),
    defaultValue: 'pending'
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes from admin/owner about the report'
  }
}, {
  tableName: 'reports',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Report;
