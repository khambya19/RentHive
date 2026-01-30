'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('booking_applications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      listingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ID of property or bike'
      },
      listingType: {
        type: Sequelize.ENUM('property', 'bike'),
        allowNull: false
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Duration in days'
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'paid', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      paymentId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add index for faster queries
    await queryInterface.addIndex('booking_applications', ['userId']);
    await queryInterface.addIndex('booking_applications', ['listingId', 'listingType']);
    await queryInterface.addIndex('booking_applications', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('booking_applications');
  }
};
