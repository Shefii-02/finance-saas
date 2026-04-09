const sequelize = require('../config/database');
const { Tenant, initTenant } = require('./tenant.model');
const { User, initUser } = require('./user.model');
const { Account, initAccount } = require('./account.model');

initTenant(sequelize);
initUser(sequelize);
initAccount(sequelize);

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

module.exports = {
  sequelize,
  Tenant,
  User,
  Account
};
