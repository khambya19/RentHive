const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  phone: { type: DataTypes.STRING, allowNull: true },
  password: { type: DataTypes.STRING, allowNull: false },

  address: { type: DataTypes.TEXT, allowNull: true },
  
  // KYC Info
  idNumber: { type: DataTypes.STRING, allowNull: true },
  citizenshipNumber: { type: DataTypes.STRING, allowNull: true },
  businessName: { type: DataTypes.STRING, allowNull: true },
  ownershipType: { type: DataTypes.STRING, allowNull: true },
  
  profileImage: { type: DataTypes.STRING, allowNull: true },
  
  // KYC Documents
  kycDocumentType: { type: DataTypes.STRING, allowNull: true }, // 'citizenship', 'license', 'passport'
  kycDocumentImage: { type: DataTypes.STRING, allowNull: true },
  kycStatus: { 
    type: DataTypes.STRING, 
    defaultValue: 'not_submitted' 
  },

  type: { type: DataTypes.STRING, allowNull: false },

  otp: { type: DataTypes.STRING, allowNull: true },
  otpExpiry: { type: DataTypes.DATE, allowNull: true },

  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  
  savedListings: { 
    type: DataTypes.JSON, 
    defaultValue: [] 
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;
