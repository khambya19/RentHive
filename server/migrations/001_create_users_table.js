'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      phone: { type: Sequelize.STRING, allowNull: true },
      password: { type: Sequelize.STRING, allowNull: false },
      address: { type: Sequelize.TEXT, allowNull: true },
      idNumber: { type: Sequelize.STRING, allowNull: true },
      citizenshipNumber: { type: Sequelize.STRING, allowNull: true },
      businessName: { type: Sequelize.STRING, allowNull: true },
      ownershipType: { type: Sequelize.STRING, allowNull: true },
      profileImage: { type: Sequelize.STRING, allowNull: true },
      kycDocumentType: { type: Sequelize.STRING, allowNull: true },
      kycDocumentImage: { type: Sequelize.STRING, allowNull: true },
      kycStatus: { type: Sequelize.STRING, defaultValue: 'not_submitted' },
      type: { type: Sequelize.STRING, allowNull: false },
      otp: { type: Sequelize.STRING, allowNull: true },
      otpExpiry: { type: Sequelize.DATE, allowNull: true },
      isVerified: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
