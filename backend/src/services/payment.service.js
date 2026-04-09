const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');
const AppError = require('../utils/app-error');
const { sequelize, PaymentReceivable, Invoice, Customer, Account, Journal, JournalLine } = require('../models');

const PAYMENT_METHODS = ['cash', 'bank', 'online'];

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

function sanitizePayment(payment) {
  const values = payment.get ? payment.get({ plain: true }) : payment;

  if (values.invoice && values.invoice.get) {
    values.invoice = values.invoice.get({ plain: true });
  }

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

function validatePaymentPayload(payload) {
  if (!payload.invoice_id) {
    throw new AppError('invoice_id is required.', StatusCodes.BAD_REQUEST);
  }

  const amount = toMoneyNumber(payload.amount);

  if (Number.isNaN(amount) || amount <= 0) {
    throw new AppError('amount must be greater than zero.', StatusCodes.BAD_REQUEST);
  }

  if (!PAYMENT_METHODS.includes(payload.method)) {
    throw new AppError('method must be one of: cash, bank, online.', StatusCodes.BAD_REQUEST);
  }
}

function getCashAccountName(method) {
  return method === 'cash' ? 'Petty Cash' : 'Cash in Bank';
}

async function findPaymentRecord(tenantId, paymentId, transaction) {
  const payment = await PaymentReceivable.findOne({
    where: {
      id: paymentId,
      tenant_id: tenantId
    },
    include: [
      {
        model: Invoice,
        as: 'invoice',
        attributes: ['id', 'number', 'status', 'total', 'amount_paid', 'balance_due', 'date', 'due_date']
      },
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'email', 'phone']
      }
    ],
    transaction
  });

  if (!payment) {
    throw new AppError('Payment not found.', StatusCodes.NOT_FOUND);
  }

  return payment;
}

async function findPostedJournalForPayment(tenantId, payment, transaction) {
  return Journal.findOne({
    where: {
      tenant_id: tenantId,
      date: payment.date,
      status: 'posted',
      description: `Payment ${payment.id} for Invoice ${payment.invoice?.number || ''}`.trim()
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
}

async function createPayment(tenantId, payload) {
  validatePaymentPayload(payload);

  return sequelize.transaction(async (transaction) => {
    const invoice = await Invoice.findOne({
      where: {
        id: payload.invoice_id,
        tenant_id: tenantId
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          where: {
            tenant_id: tenantId,
            is_active: true
          }
        }
      ],
      transaction
    });

    if (!invoice) {
      throw new AppError('Invoice not found for this tenant.', StatusCodes.BAD_REQUEST);
    }

    const amount = toMoneyNumber(payload.amount);
    const currentBalance = toMoneyNumber(invoice.balance_due);

    if (amount > currentBalance) {
      throw new AppError('Payment amount cannot exceed invoice balance_due.', StatusCodes.BAD_REQUEST);
    }

    const cashAccountName = getCashAccountName(payload.method);
    const accounts = await Account.findAll({
      where: {
        tenant_id: tenantId,
        is_active: true,
        account_name: {
          [Op.in]: [cashAccountName, 'Accounts Receivable']
        }
      },
      transaction
    });

    const cashAccount = accounts.find((account) => account.account_name === cashAccountName);
    const receivableAccount = accounts.find((account) => account.account_name === 'Accounts Receivable');

    if (!cashAccount || !receivableAccount) {
      throw new AppError(
        `Required COA accounts not found: ${cashAccountName} and Accounts Receivable.`,
        StatusCodes.BAD_REQUEST
      );
    }

    const paymentDate = payload.date || new Date().toISOString().slice(0, 10);
    const nextAmountPaid = Math.round((toMoneyNumber(invoice.amount_paid) + amount) * 100) / 100;
    const nextBalanceDue = Math.round((currentBalance - amount) * 100) / 100;
    const nextStatus = nextBalanceDue === 0 ? 'paid' : 'partial';

    const payment = await PaymentReceivable.create(
      {
        tenant_id: tenantId,
        invoice_id: invoice.id,
        customer_id: invoice.customer_id,
        date: paymentDate,
        amount: toMoneyString(amount),
        method: payload.method,
        reference: payload.reference ? String(payload.reference).trim() : null
      },
      { transaction }
    );

    await invoice.update(
      {
        amount_paid: toMoneyString(nextAmountPaid),
        balance_due: toMoneyString(nextBalanceDue),
        status: nextStatus
      },
      { transaction }
    );

    const journal = await Journal.create(
      {
        tenant_id: tenantId,
        date: paymentDate,
        description: `Payment ${payment.id} for Invoice ${invoice.number}`,
        status: 'draft'
      },
      { transaction }
    );

    await JournalLine.bulkCreate(
      [
        {
          journal_id: journal.id,
          account_id: cashAccount.id,
          debit: toMoneyString(amount),
          credit: toMoneyString(0)
        },
        {
          journal_id: journal.id,
          account_id: receivableAccount.id,
          debit: toMoneyString(0),
          credit: toMoneyString(amount)
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

    const createdPayment = await findPaymentRecord(tenantId, payment.id, transaction);
    const createdJournal = await findPostedJournalForPayment(tenantId, createdPayment, transaction);

    return {
      payment: sanitizePayment(createdPayment),
      invoice: {
        id: invoice.id,
        number: invoice.number,
        status: nextStatus,
        amount_paid: toMoneyString(nextAmountPaid),
        balance_due: toMoneyString(nextBalanceDue)
      },
      journal: createdJournal ? sanitizeJournal(createdJournal) : null
    };
  });
}

module.exports = {
  createPayment
};
