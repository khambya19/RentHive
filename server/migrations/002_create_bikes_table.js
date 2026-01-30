'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bikes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      vendorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      name: { type: Sequelize.STRING, allowNull: true },
      brand: { type: Sequelize.STRING, allowNull: false },
      model: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.ENUM('Motorcycle', 'Scooter', 'Electric Bike', 'Bicycle'), allowNull: false },
      year: { type: Sequelize.INTEGER, allowNull: false },
      engineCapacity: { type: Sequelize.INTEGER, allowNull: true },
      fuelType: { type: Sequelize.ENUM('Petrol', 'Electric', 'Hybrid', 'None'), allowNull: false, defaultValue: 'Petrol' },
      dailyRate: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      weeklyRate: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      monthlyRate: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      securityDeposit: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      features: { type: Sequelize.JSON, defaultValue: [] },
      description: { type: Sequelize.TEXT, allowNull: true },
      images: { type: Sequelize.JSON, defaultValue: [] },
      status: { type: Sequelize.STRING, defaultValue: 'Available' },
      isApproved: { type: Sequelize.BOOLEAN, defaultValue: false },
      location: { type: Sequelize.STRING, allowNull: false },
      pickupLocation: { type: Sequelize.TEXT, allowNull: true },
      licenseRequired: { type: Sequelize.BOOLEAN, defaultValue: true },
      minimumAge: { type: Sequelize.INTEGER, defaultValue: 18 },
      bookingCount: { type: Sequelize.INTEGER, defaultValue: 0 },
      rating: { type: Sequelize.DECIMAL(3, 2), defaultValue: 0.00 },
      ratingCount: { type: Sequelize.INTEGER, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('bikes');
  }
};
