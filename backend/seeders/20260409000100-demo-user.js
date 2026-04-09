'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const [tenants] = await queryInterface.sequelize.query(
      "SELECT id FROM tenants WHERE subdomain = 'demo'"
    );

    if (!tenants.length) {
      await queryInterface.bulkInsert('tenants', [
        {
          id: queryInterface.sequelize.literal('(UUID())'),
          name: 'Demo Tenant',
          subdomain: 'demo',
          plan: 'free',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }

    const [rows] = await queryInterface.sequelize.query(
      "SELECT id FROM tenants WHERE subdomain = 'demo' LIMIT 1"
    );

    await queryInterface.bulkInsert('users', [
      {
        id: queryInterface.sequelize.literal('(UUID())'),
        tenant_id: rows[0].id,
        name: 'Demo Admin',
        email: 'demo@financesaas.local',
        password_hash: bcrypt.hashSync('Admin@123', 10),
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'demo@financesaas.local' });
    await queryInterface.bulkDelete('tenants', { subdomain: 'demo' });
  }
};
