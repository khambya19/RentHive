const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Property = sequelize.define('Property', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  propertyType: {
    type: DataTypes.ENUM('Apartment', 'Room', 'House', 'Villa', 'Studio'),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  bedrooms: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  bathrooms: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  area: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rentPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  securityDeposit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  amenities: {
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
    type: DataTypes.STRING,
    defaultValue: 'Available'
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  inquiryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  listingType: {
    type: DataTypes.STRING,
    defaultValue: 'For Rent'
  },
  propertyCondition: {
    type: DataTypes.STRING,
    allowNull: true
  },
  yearBuilt: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  lotSize: {
    type: DataTypes.STRING, /* Keeping as string to avoid precision issues if mixed input */
    allowNull: true
  },
  lotSizeUnit: {
    type: DataTypes.STRING,
    allowNull: true
  },
  garageSpaces: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  hoaFees: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  hoaFeesFrequency: {
    type: DataTypes.STRING,
    allowNull: true
  },
  furnished: {
    type: DataTypes.STRING,
    defaultValue: 'No'
  },
  petPolicy: {
    type: DataTypes.STRING,
    defaultValue: 'No'
  },
  petDetails: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  leaseTerms: {
    type: DataTypes.STRING,
    allowNull: true
  },
  virtualTourLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  floorPlan: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'properties',
  timestamps: true
});

module.exports = Property;
