const { DataTypes, Model } = require('sequelize');

class Journal extends Model {}

function initJournal(sequelize) {
  Journal.init(
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
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('draft', 'posted'),
        allowNull: false,
        defaultValue: 'draft'
      }
    },
    {
      sequelize,
      modelName: 'Journal',
      tableName: 'journals',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['tenant_id']
        }
      ]
    }
  );

  return Journal;
}

module.exports = {
  Journal,
  initJournal
};
