const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); 

const Review = sequelize.define('Review', {
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
  }
});

module.exports = Review;