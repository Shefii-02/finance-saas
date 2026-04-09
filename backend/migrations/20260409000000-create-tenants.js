'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tenants', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('(UUID())')
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      subdomain: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      plan: {
        type: Sequelize.ENUM('free', 'pro', 'enterprise'),
        allowNull: false,
        defaultValue: 'free'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tenants');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_tenants_plan;').catch(() => {});
  }
};
