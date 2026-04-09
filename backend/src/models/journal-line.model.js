const { DataTypes, Model } = require('sequelize');

class JournalLine extends Model {}

function initJournalLine(sequelize) {
  JournalLine.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      journal_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      account_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      debit: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      },
      credit: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      sequelize,
      modelName: 'JournalLine',
      tableName: 'journal_lines',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return JournalLine;
}

module.exports = {
  JournalLine,
  initJournalLine
};
