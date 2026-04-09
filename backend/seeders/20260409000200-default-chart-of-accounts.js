'use strict';

const { DEFAULT_COA_ACCOUNTS } = require('../src/services/default-coa.service');

module.exports = {
  async up(queryInterface) {
    const [tenants] = await queryInterface.sequelize.query('SELECT id FROM tenants');

    if (!tenants.length) {
      return;
    }

    const now = new Date();

    for (const tenant of tenants) {
      const [existingAccounts] = await queryInterface.sequelize.query(
        'SELECT account_code FROM accounts WHERE tenant_id = :tenantId',
        {
          replacements: {
            tenantId: tenant.id
          }
        }
      );

      const existingCodes = new Set(existingAccounts.map((account) => account.account_code));
      const rowsToInsert = DEFAULT_COA_ACCOUNTS.filter((account) => !existingCodes.has(account.account_code)).map(
        (account) => ({
          id: queryInterface.sequelize.literal('(UUID())'),
          tenant_id: tenant.id,
          account_code: account.account_code,
          account_name: account.account_name,
          account_type: account.account_type,
          sub_type: null,
          parent_id: null,
          description: null,
          is_active: true,
          created_at: now,
          updated_at: now
        })
      );

      if (rowsToInsert.length) {
        await queryInterface.bulkInsert('accounts', rowsToInsert);
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('accounts', {
      account_code: DEFAULT_COA_ACCOUNTS.map((account) => account.account_code)
    });
  }
};
