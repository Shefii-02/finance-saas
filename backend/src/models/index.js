const sequelize = require('../config/database');
const { Tenant, initTenant } = require('./tenant.model');
const { User, initUser } = require('./user.model');

initTenant(sequelize);
initUser(sequelize);

Tenant.hasMany(User, {
  foreignKey: 'tenant_id',
  as: 'users'
});

User.belongsTo(Tenant, {
  foreignKey: 'tenant_id',
  as: 'tenant'
});

module.exports = {
  sequelize,
  Tenant,
  User
};
