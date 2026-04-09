const crypto = require('crypto');
const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');
const AppError = require('../utils/app-error');
const { sequelize, Invoice, Customer, Account, Journal, JournalLine } = require('../models');

function toMoneyNumber(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return NaN;
  }

  return Math.round(parsed * 100) / 100;
}

function toMoneyString(value) {
  return toMoneyNumber(value).toFixed(2);
}

function sanitizeInvoice(invoice) {
  const values = invoice.get ? invoice.get({ plain: true }) : invoice;

  if (values.customer && values.customer.get) {
    values.customer = values.customer.get({ plain: true });
  }

  return values;
}

function sanitizeJournal(journal) {
  const values = journal.get ? journal.get({ plain: true }) : journal;

  if (Array.isArray(values.lines)) {
    values.lines = values.lines.map((line) => {
      const lineValues = line.get ? line.get({ plain: true }) : line;

      if (lineValues.account && lineValues.account.get) {
        lineValues.account = lineValues.account.get({ plain: true });
      }

      return lineValues;
    });
  }

  return values;
}

function validateInvoicePayload(payload) {
  if (!payload.customer_id) {
    throw new AppError('customer_id is required.', StatusCodes.BAD_REQUEST);
  }

  if (!Array.isArray(payload.items) || !payload.items.length) {
    throw new AppError('At least one invoice item is required.', StatusCodes.BAD_REQUEST);
  }

  payload.items.forEach((item, index) => {
    const amount = toMoneyNumber(item.amount);

    if (!item.description || !String(item.description).trim()) {
      throw new AppError(`items[${index}].description is required.`, StatusCodes.BAD_REQUEST);
    }

    if (Number.isNaN(amount) || amount <= 0) {
      throw new AppError(`items[${index}].amount must be greater than zero.`, StatusCodes.BAD_REQUEST);
    }
  });
}

function buildInvoiceNumber() {
  return `INV-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

async function findInvoiceRecord(tenantId, invoiceId, transaction) {
  const invoice = await Invoice.findOne({
    where: {
      id: invoiceId,
      tenant_id: tenantId
    },
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'email', 'phone']
      }
    ],
    transaction
  });

  if (!invoice) {
    throw new AppError('Invoice not found.', StatusCodes.NOT_FOUND);
  }

  return invoice;
}

async function findPostedJournalForInvoice(tenantId, invoice, transaction) {
  const journal = await Journal.findOne({
    where: {
      tenant_id: tenantId,
      date: invoice.date,
      status: 'posted',
      description: `Invoice ${invoice.number}`
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
    order: [[{ model: JournalLine, as: 'lines' }, 'created_at', 'ASC']],
    transaction
  });

  return journal;
}

async function createInvoice(tenantId, payload) {
  validateInvoicePayload(payload);

  return sequelize.transaction(async (transaction) => {
    const customer = await Customer.findOne({
      where: {
        id: payload.customer_id,
        tenant_id: tenantId,
        is_active: true
      },
      transaction
    });

    if (!customer) {
      throw new AppError('Customer not found for this tenant.', StatusCodes.BAD_REQUEST);
    }

    const accounts = await Account.findAll({
      where: {
        tenant_id: tenantId,
        is_active: true,
        account_name: {
          [Op.in]: ['Accounts Receivable', 'Sales Revenue']
        }
      },
      transaction
    });

    const receivableAccount = accounts.find((account) => account.account_name === 'Accounts Receivable');
    const revenueAccount = accounts.find((account) => account.account_name === 'Sales Revenue');

    if (!receivableAccount || !revenueAccount) {
      throw new AppError(
        'Required COA accounts not found: Accounts Receivable and Sales Revenue.',
        StatusCodes.BAD_REQUEST
      );
    }

    const subtotal = payload.items.reduce((sum, item) => sum + toMoneyNumber(item.amount), 0);
    const total = Math.round(subtotal * 100) / 100;
    const invoiceDate = payload.date || new Date().toISOString().slice(0, 10);
    const dueDate = payload.due_date || invoiceDate;

    const invoice = await Invoice.create(
      {
        tenant_id: tenantId,
        customer_id: customer.id,
        number: buildInvoiceNumber(),
        date: invoiceDate,
        due_date: dueDate,
        status: 'sent',
        subtotal: toMoneyString(total),
        tax_amount: toMoneyString(0),
        total: toMoneyString(total),
        amount_paid: toMoneyString(0),
        balance_due: toMoneyString(total)
      },
      { transaction }
    );

    const journal = await Journal.create(
      {
        tenant_id: tenantId,
        date: invoiceDate,
        description: `Invoice ${invoice.number}`,
        status: 'draft'
      },
      { transaction }
    );

    await JournalLine.bulkCreate(
      [
        {
          journal_id: journal.id,
          account_id: receivableAccount.id,
          debit: toMoneyString(total),
          credit: toMoneyString(0)
        },
        {
          journal_id: journal.id,
          account_id: revenueAccount.id,
          debit: toMoneyString(0),
          credit: toMoneyString(total)
        }
      ],
      { transaction }
    );

    await journal.update(
      {
        status: 'posted'
      },
      { transaction }
    );

    const createdInvoice = await findInvoiceRecord(tenantId, invoice.id, transaction);
    const postedJournal = await findPostedJournalForInvoice(tenantId, invoice, transaction);

    return {
      invoice: sanitizeInvoice(createdInvoice),
      journal: postedJournal ? sanitizeJournal(postedJournal) : null,
      items: payload.items.map((item) => ({
        description: String(item.description).trim(),
        amount: toMoneyNumber(item.amount)
      }))
    };
  });
}

module.exports = {
  createInvoice
};
