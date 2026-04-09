const DEFAULT_COA_ACCOUNTS = [
  { account_code: '1001', account_name: 'Cash in Bank', account_type: 'Asset' },
  { account_code: '1002', account_name: 'Petty Cash', account_type: 'Asset' },
  { account_code: '1003', account_name: 'Accounts Receivable', account_type: 'Asset' },
  { account_code: '2001', account_name: 'Accounts Payable', account_type: 'Liability' },
  { account_code: '3001', account_name: 'Owner Capital', account_type: 'Equity' },
  { account_code: '4001', account_name: 'Sales Revenue', account_type: 'Revenue' },
  { account_code: '5001', account_name: 'Expense', account_type: 'Expense' }
];

async function seedDefaultAccountsForTenant({ Account, tenantId, transaction }) {
  const existingAccounts = await Account.findAll({
    where: {
      tenant_id: tenantId
    },
    attributes: ['account_code'],
    transaction
  });

  const existingCodes = new Set(existingAccounts.map((account) => account.account_code));
  const rowsToInsert = DEFAULT_COA_ACCOUNTS.filter((account) => !existingCodes.has(account.account_code)).map(
    (account) => ({
      tenant_id: tenantId,
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      sub_type: null,
      parent_id: null,
      description: null,
      is_active: true
    })
  );

  if (!rowsToInsert.length) {
    return [];
  }

  return Account.bulkCreate(rowsToInsert, { transaction });
}

module.exports = {
  DEFAULT_COA_ACCOUNTS,
  seedDefaultAccountsForTenant
};
