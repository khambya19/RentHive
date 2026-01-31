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
    type: DataTypes.STRING,
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
  garageSpaces: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  halfBathrooms: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  parkingType: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  flooring: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  heatingSystem: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  coolingSystem: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  appliancesIncluded: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  basementType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  basementArea: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fireplaceCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  fireplaceType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  exteriorMaterial: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  roofType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  roofAge: {
    type: DataTypes.STRING,
    allowNull: true
  },
  poolSpa: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  fenceType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  view: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  propertyTaxes: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hoaFees: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  hoaFeesFrequency: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hoaName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  maintenanceFees: {
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
  solarPanels: {
    type: DataTypes.STRING,
    defaultValue: 'No'
  },
  energyEfficient: {
    type: DataTypes.STRING,
    defaultValue: 'No'
  },
  greenCertification: {
    type: DataTypes.STRING,
    allowNull: true
  },
  zoningType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  area: {
    type: DataTypes.STRING,
    allowNull: true
  },
  floorPlan: {
    type: DataTypes.STRING,
    allowNull: true
  },
  virtualTourLink: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'properties',
  timestamps: true
});

module.exports = Property;
