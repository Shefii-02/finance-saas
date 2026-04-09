const { DataTypes, Model } = require('sequelize');

class Account extends Model {}

function initAccount(sequelize) {
  Account.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      tenant_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      account_code: {
        type: DataTypes.STRING,
        allowNull: false
      },
      account_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      account_type: {
        type: DataTypes.ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense'),
        allowNull: false
      },
      sub_type: {
        type: DataTypes.STRING,
        allowNull: true
      },
      parent_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'Account',
      tableName: 'accounts',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['tenant_id']
        },
        {
          unique: true,
          fields: ['tenant_id', 'account_code']
        }
      ]
    }
  );

  return Account;
}

module.exports = {
  Account,
  initAccount
};
