"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Columns already exist in table creation migrations. No-op.
    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    // Columns already exist in table creation migrations. No-op.
    return Promise.resolve();
  },
};
