const { DataTypes, Model } = require('sequelize');

class PaymentReceivable extends Model {}

function initPaymentReceivable(sequelize) {
  PaymentReceivable.init(
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
      invoice_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      customer_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      },
      method: {
        type: DataTypes.ENUM('cash', 'bank', 'online'),
        allowNull: false
      },
      reference: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'PaymentReceivable',
      tableName: 'payments_receivable',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['tenant_id']
        }
      ]
    }
  );

  return PaymentReceivable;
}

module.exports = {
  PaymentReceivable,
  initPaymentReceivable
};
