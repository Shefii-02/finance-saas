const { DataTypes, Model } = require('sequelize');

class Invoice extends Model {}

function initInvoice(sequelize) {
  Invoice.init(
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
      customer_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      number: {
        type: DataTypes.STRING,
        allowNull: false
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('draft', 'sent', 'paid', 'partial', 'overdue'),
        allowNull: false,
        defaultValue: 'draft'
      },
      subtotal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      },
      tax_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      },
      total: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      },
      amount_paid: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      },
      balance_due: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      sequelize,
      modelName: 'Invoice',
      tableName: 'invoices',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['tenant_id']
        }
      ]
    }
  );

  return Invoice;
}

module.exports = {
  Invoice,
  initInvoice
};
