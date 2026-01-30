'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('properties', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      vendorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      title: { type: Sequelize.STRING, allowNull: false },
      propertyType: { type: Sequelize.ENUM('Apartment', 'Room', 'House', 'Villa', 'Studio'), allowNull: false },
      address: { type: Sequelize.TEXT, allowNull: false },
      city: { type: Sequelize.STRING, allowNull: false },
      bedrooms: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      bathrooms: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      area: { type: Sequelize.STRING, allowNull: false },
      rentPrice: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      securityDeposit: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      amenities: { type: Sequelize.JSON, defaultValue: [] },
      description: { type: Sequelize.TEXT, allowNull: true },
      images: { type: Sequelize.JSON, defaultValue: [] },
      status: { type: Sequelize.STRING, defaultValue: 'Available' },
      isApproved: { type: Sequelize.BOOLEAN, defaultValue: false },
      viewCount: { type: Sequelize.INTEGER, defaultValue: 0 },
      inquiryCount: { type: Sequelize.INTEGER, defaultValue: 0 },
      latitude: { type: Sequelize.DECIMAL(10, 8), allowNull: true },
      longitude: { type: Sequelize.DECIMAL(11, 8), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('properties');
  }
};
