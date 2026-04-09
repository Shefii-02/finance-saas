const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/app-error');
const { sequelize, Journal, JournalLine, Account } = require('../models');

function sanitizeJournalLine(line) {
  const values = line.get ? line.get({ plain: true }) : line;

  if (values.account && values.account.get) {
    values.account = values.account.get({ plain: true });
  }

  return values;
}

function sanitizeJournal(journal) {
  const values = journal.get ? journal.get({ plain: true }) : journal;

  if (Array.isArray(values.lines)) {
    values.lines = values.lines.map(sanitizeJournalLine);
  }

  return values;
}

function toMoneyNumber(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return NaN;
  }

  return Math.round(parsed * 100) / 100;
}

function validateJournalPayload(payload) {
  if (!payload.date) {
    throw new AppError('date is required.', StatusCodes.BAD_REQUEST);
  }

  if (!Array.isArray(payload.lines) || payload.lines.length < 2) {
    throw new AppError('At least two journal lines are required.', StatusCodes.BAD_REQUEST);
  }

  payload.lines.forEach((line, index) => {
    const debit = toMoneyNumber(line.debit ?? 0);
    const credit = toMoneyNumber(line.credit ?? 0);

    if (!line.account_id) {
      throw new AppError(`lines[${index}].account_id is required.`, StatusCodes.BAD_REQUEST);
    }

    if (Number.isNaN(debit) || Number.isNaN(credit)) {
      throw new AppError(`lines[${index}] debit and credit must be valid numbers.`, StatusCodes.BAD_REQUEST);
    }

    if (debit < 0 || credit < 0) {
      throw new AppError(`lines[${index}] debit and credit cannot be negative.`, StatusCodes.BAD_REQUEST);
    }

    if ((debit === 0 && credit === 0) || (debit > 0 && credit > 0)) {
      throw new AppError(
        `lines[${index}] must have either a debit or a credit amount.`,
        StatusCodes.BAD_REQUEST
      );
    }
  });
}

async function findTenantAccounts(tenantId, accountIds, transaction) {
  const accounts = await Account.findAll({
    where: {
      tenant_id: tenantId,
      is_active: true,
      id: accountIds
    },
    transaction
  });

  if (accounts.length !== new Set(accountIds).size) {
    throw new AppError('One or more accounts do not belong to this tenant.', StatusCodes.BAD_REQUEST);
  }

  return accounts;
}

function computeTotals(lines) {
  return lines.reduce(
    (totals, line) => ({
      debit: Math.round((totals.debit + toMoneyNumber(line.debit ?? 0)) * 100) / 100,
      credit: Math.round((totals.credit + toMoneyNumber(line.credit ?? 0)) * 100) / 100
    }),
    { debit: 0, credit: 0 }
  );
}

async function getJournalRecord(tenantId, journalId, transaction) {
  const journal = await Journal.findOne({
    where: {
      id: journalId,
      tenant_id: tenantId
    },
    include: [
      {
        model: JournalLine,
        as: 'lines',
        include: [
          {
            model: Account,
            as: 'account',
            attributes: ['id', 'tenant_id', 'account_code', 'account_name', 'account_type', 'is_active']
          }
        ]
      }
    ],
    order: [[{ model: JournalLine, as: 'lines' }, 'created_at', 'ASC']],
    transaction
  });

  if (!journal) {
    throw new AppError('Journal not found.', StatusCodes.NOT_FOUND);
  }

  return journal;
}

async function listJournalsByTenant(tenantId) {
  const journals = await Journal.findAll({
    where: {
      tenant_id: tenantId
    },
    include: [
      {
        model: JournalLine,
        as: 'lines',
        include: [
          {
            model: Account,
            as: 'account',
            attributes: ['id', 'account_code', 'account_name', 'account_type']
          }
        ]
      }
    ],
    order: [
      ['date', 'DESC'],
      ['created_at', 'DESC'],
      [{ model: JournalLine, as: 'lines' }, 'created_at', 'ASC']
    ]
  });

  return journals.map(sanitizeJournal);
}

async function getJournalById(tenantId, journalId) {
  const journal = await getJournalRecord(tenantId, journalId);
  return sanitizeJournal(journal);
}

async function createJournal(tenantId, payload) {
  validateJournalPayload(payload);

  return sequelize.transaction(async (transaction) => {
    const accountIds = payload.lines.map((line) => line.account_id);
    await findTenantAccounts(tenantId, accountIds, transaction);

    const journal = await Journal.create(
      {
        tenant_id: tenantId,
        date: payload.date,
        description: payload.description ? String(payload.description).trim() : null,
        status: 'draft'
      },
      { transaction }
    );

    const lineRows = payload.lines.map((line) => ({
      journal_id: journal.id,
      account_id: line.account_id,
      debit: toMoneyNumber(line.debit ?? 0).toFixed(2),
      credit: toMoneyNumber(line.credit ?? 0).toFixed(2)
    }));

    await JournalLine.bulkCreate(lineRows, { transaction });

    const createdJournal = await getJournalRecord(tenantId, journal.id, transaction);
    return sanitizeJournal(createdJournal);
  });
}

async function postJournal(tenantId, journalId) {
  return sequelize.transaction(async (transaction) => {
    const journal = await getJournalRecord(tenantId, journalId, transaction);

    if (journal.status === 'posted') {
      throw new AppError('Journal is already posted.', StatusCodes.BAD_REQUEST);
    }

    if (!journal.lines.length) {
      throw new AppError('Journal must have at least one line.', StatusCodes.BAD_REQUEST);
    }

    journal.lines.forEach((line, index) => {
      if (!line.account || line.account.tenant_id !== tenantId || !line.account.is_active) {
        throw new AppError(`lines[${index}] account does not belong to this tenant.`, StatusCodes.BAD_REQUEST);
      }
    });

    const totals = computeTotals(journal.lines);

    if (totals.debit !== totals.credit) {
      throw new AppError('Journal not balanced', StatusCodes.UNPROCESSABLE_ENTITY);
    }

    await journal.update(
      {
        status: 'posted'
      },
      { transaction }
    );

    const postedJournal = await getJournalRecord(tenantId, journalId, transaction);
    return sanitizeJournal(postedJournal);
  });
}

module.exports = {
  listJournalsByTenant,
  createJournal,
  getJournalById,
  postJournal
};
