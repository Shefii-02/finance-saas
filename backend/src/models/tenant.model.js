const { DataTypes, Model } = require('sequelize');

class Tenant extends Model {}

function initTenant(sequelize) {
  Tenant.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      subdomain: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      plan: {
        type: DataTypes.ENUM('free', 'pro', 'enterprise'),
        allowNull: false,
        defaultValue: 'free'
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'Tenant',
      tableName: 'tenants'
    }
  );

  return Tenant;
}

module.exports = {
  Tenant,
  initTenant
};
