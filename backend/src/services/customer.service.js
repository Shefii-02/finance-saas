const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');
const AppError = require('../utils/app-error');
const { Customer } = require('../models');

function sanitizeCustomer(customer) {
  return customer.get ? customer.get({ plain: true }) : customer;
}

function toMoneyNumber(value, defaultValue = 0) {
  const parsed = value === undefined || value === null || value === '' ? defaultValue : Number(value);

  if (!Number.isFinite(parsed)) {
    return NaN;
  }

  return Math.round(parsed * 100) / 100;
}

function validateCustomerPayload(payload, isUpdate = false) {
  if (!isUpdate || Object.prototype.hasOwnProperty.call(payload, 'name')) {
    if (!payload.name || !String(payload.name).trim()) {
      throw new AppError('name is required.', StatusCodes.BAD_REQUEST);
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'credit_limit')) {
    const creditLimit = toMoneyNumber(payload.credit_limit);

    if (Number.isNaN(creditLimit)) {
      throw new AppError('credit_limit must be a valid number.', StatusCodes.BAD_REQUEST);
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'credit_balance')) {
    const creditBalance = toMoneyNumber(payload.credit_balance);

    if (Number.isNaN(creditBalance)) {
      throw new AppError('credit_balance must be a valid number.', StatusCodes.BAD_REQUEST);
    }
  }
}

function normalizeEmail(email) {
  if (!email || !String(email).trim()) {
    return null;
  }

  return String(email).trim().toLowerCase();
}

async function ensureUniqueEmail(tenantId, email, excludeId) {
  if (!email) {
    return;
  }

  const where = {
    tenant_id: tenantId,
    email
  };

  if (excludeId) {
    where.id = {
      [Op.ne]: excludeId
    };
  }

  const existingCustomer = await Customer.findOne({ where });

  if (existingCustomer) {
    throw new AppError('email must be unique per tenant.', StatusCodes.CONFLICT);
  }
}

async function listCustomersByTenant(tenantId) {
  const customers = await Customer.findAll({
    where: {
      tenant_id: tenantId,
      is_active: true
    },
    order: [
      ['name', 'ASC'],
      ['created_at', 'DESC']
    ]
  });

  return customers.map(sanitizeCustomer);
}

async function getCustomerById(tenantId, customerId) {
  const customer = await Customer.findOne({
    where: {
      id: customerId,
      tenant_id: tenantId,
      is_active: true
    }
  });

  if (!customer) {
    throw new AppError('Customer not found.', StatusCodes.NOT_FOUND);
  }

  return sanitizeCustomer(customer);
}

async function createCustomer(tenantId, payload) {
  validateCustomerPayload(payload);

  const email = normalizeEmail(payload.email);
  await ensureUniqueEmail(tenantId, email);

  const customer = await Customer.create({
    tenant_id: tenantId,
    name: String(payload.name).trim(),
    email,
    phone: payload.phone ? String(payload.phone).trim() : null,
    address: payload.address ? String(payload.address).trim() : null,
    credit_limit: toMoneyNumber(payload.credit_limit, 0).toFixed(2),
    credit_balance: toMoneyNumber(payload.credit_balance, 0).toFixed(2),
    is_active: payload.is_active ?? true
  });

  return sanitizeCustomer(customer);
}

async function updateCustomer(tenantId, customerId, payload) {
  const customer = await Customer.findOne({
    where: {
      id: customerId,
      tenant_id: tenantId,
      is_active: true
    }
  });

  if (!customer) {
    throw new AppError('Customer not found.', StatusCodes.NOT_FOUND);
  }

  validateCustomerPayload(payload, true);

  const nextEmail = Object.prototype.hasOwnProperty.call(payload, 'email')
    ? normalizeEmail(payload.email)
    : customer.email;

  await ensureUniqueEmail(tenantId, nextEmail, customer.id);

  await customer.update({
    name: Object.prototype.hasOwnProperty.call(payload, 'name') ? String(payload.name).trim() : customer.name,
    email: nextEmail,
    phone: Object.prototype.hasOwnProperty.call(payload, 'phone')
      ? payload.phone
        ? String(payload.phone).trim()
        : null
      : customer.phone,
    address: Object.prototype.hasOwnProperty.call(payload, 'address')
      ? payload.address
        ? String(payload.address).trim()
        : null
      : customer.address,
    credit_limit: Object.prototype.hasOwnProperty.call(payload, 'credit_limit')
      ? toMoneyNumber(payload.credit_limit, 0).toFixed(2)
      : customer.credit_limit,
    credit_balance: Object.prototype.hasOwnProperty.call(payload, 'credit_balance')
      ? toMoneyNumber(payload.credit_balance, 0).toFixed(2)
      : customer.credit_balance,
    is_active: Object.prototype.hasOwnProperty.call(payload, 'is_active')
      ? Boolean(payload.is_active)
      : customer.is_active
  });

  return sanitizeCustomer(customer);
}

async function softDeleteCustomer(tenantId, customerId) {
  const customer = await Customer.findOne({
    where: {
      id: customerId,
      tenant_id: tenantId,
      is_active: true
    }
  });

  if (!customer) {
    throw new AppError('Customer not found.', StatusCodes.NOT_FOUND);
  }

  await customer.update({
    is_active: false
  });

  return sanitizeCustomer(customer);
}

module.exports = {
  listCustomersByTenant,
  createCustomer,
  getCustomerById,
  updateCustomer,
  softDeleteCustomer
};
