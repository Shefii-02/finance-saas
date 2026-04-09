const sequelize = require('../config/database');
const { Tenant, initTenant } = require('./tenant.model');
const { User, initUser } = require('./user.model');
const { Account, initAccount } = require('./account.model');
const { Journal, initJournal } = require('./journal.model');
const { JournalLine, initJournalLine } = require('./journal-line.model');

initTenant(sequelize);
initUser(sequelize);
initAccount(sequelize);
initJournal(sequelize);
initJournalLine(sequelize);

Tenant.hasMany(User, {
  foreignKey: 'tenant_id',
  as: 'users'
});

User.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

Tenant.hasMany(Account, {
  foreignKey: 'tenant_id',
  as: 'accounts'
});

Account.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

Account.belongsTo(Account, {
  foreignKey: 'parent_id',
  as: 'parent'
});

Account.hasMany(Account, {
  foreignKey: 'parent_id',
  as: 'children'
});

Tenant.hasMany(Journal, {
  foreignKey: 'tenant_id',
  as: 'journals'
});

Journal.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

Journal.hasMany(JournalLine, {
  foreignKey: 'journal_id',
  as: 'lines'
});

JournalLine.belongsTo(Journal, {
  foreignKey: 'journal_id',
  as: 'journal'
});

Account.hasMany(JournalLine, {
  foreignKey: 'account_id',
  as: 'journal_lines'
});

JournalLine.belongsTo(Account, {
  foreignKey: 'account_id',
  as: 'account'
});

module.exports = {
  sequelize,
  Tenant,
  User,
  Account,
  Journal,
  JournalLine
};
