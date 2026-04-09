const { DataTypes, Model } = require('sequelize');

class User extends Model {}

function initUser(sequelize) {
  User.init(
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
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM('superadmin', 'admin', 'accountant', 'viewer'),
        allowNull: false,
        defaultValue: 'viewer'
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      indexes: [
        {
          unique: true,
          fields: ['tenant_id', 'email']
        }
      ]
    }
  );

  return User;
}

module.exports = {
  User,
  initUser
};
