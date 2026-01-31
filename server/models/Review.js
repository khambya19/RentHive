const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); 

const Review = sequelize.define('Review', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reviewerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  propertyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'properties',
      key: 'id'
    }
  },
  bikeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'bikes',
      key: 'id'
    }
  },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'bookings',
      key: 'id'
    }
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['userId', 'propertyId'],
      where: { propertyId: { [sequelize.Sequelize.Op.ne]: null } }
    },
    {
      unique: true,
      fields: ['userId', 'bikeId'],
      where: { bikeId: { [sequelize.Sequelize.Op.ne]: null } }
    }
  ]
});

module.exports = Review;