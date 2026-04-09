const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');
const AppError = require('../utils/app-error');
const { Account } = require('../models');

const ACCOUNT_TYPES = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

function sanitizeAccount(account) {
  return account.get ? account.get({ plain: true }) : account;
}

function buildAccountTree(accounts) {
  const nodesById = new Map();
  const roots = [];

  accounts.forEach((account) => {
    nodesById.set(account.id, {
      ...account,
      children: []
    });
  });

  nodesById.forEach((account) => {
    if (account.parent_id && nodesById.has(account.parent_id)) {
      nodesById.get(account.parent_id).children.push(account);
      return;
    }

    roots.push(account);
  });

  return roots;
}

function validateAccountPayload(payload, isUpdate = false) {
  const { account_name: accountName, account_type: accountType } = payload;

  if (!isUpdate || Object.prototype.hasOwnProperty.call(payload, 'account_name')) {
    if (!accountName || !String(accountName).trim()) {
      throw new AppError('account_name is required.', StatusCodes.BAD_REQUEST);
    }
  }

  if (!isUpdate || Object.prototype.hasOwnProperty.call(payload, 'account_type')) {
    if (!ACCOUNT_TYPES.includes(accountType)) {
      throw new AppError(
        'account_type must be one of: Asset, Liability, Equity, Revenue, Expense.',
        StatusCodes.BAD_REQUEST
      );
    }
  }
}

async function ensureUniqueAccountCode(tenantId, accountCode, excludeId) {
  if (!accountCode) {
    return;
  }

  const where = {
    tenant_id: tenantId,
    account_code: accountCode
  };

  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }

  const existingAccount = await Account.findOne({ where });

  if (existingAccount) {
    throw new AppError('account_code must be unique per tenant.', StatusCodes.CONFLICT);
  }
}

async function ensureParentAccount(tenantId, parentId, currentAccountId) {
  if (!parentId) {
    return null;
  }

  if (parentId === currentAccountId) {
    throw new AppError('An account cannot be its own parent.', StatusCodes.BAD_REQUEST);
  }

  const parentAccount = await Account.findOne({
    where: {
      id: parentId,
      tenant_id: tenantId,
      is_active: true
    }
  });

  if (!parentAccount) {
    throw new AppError('Parent account not found for this tenant.', StatusCodes.BAD_REQUEST);
  }

  return parentAccount;
}

async function listAccountsByTenant(tenantId) {
  const accounts = await Account.findAll({
    where: {
      tenant_id: tenantId,
      is_active: true
    },
    order: [
      ['account_code', 'ASC'],
      ['created_at', 'ASC']
    ]
  });

  return buildAccountTree(accounts.map(sanitizeAccount));
}

async function listFlatAccountsByTenant(tenantId) {
  const accounts = await Account.findAll({
    where: {
      tenant_id: tenantId,
      is_active: true
    },
    order: [
      ['account_code', 'ASC'],
      ['created_at', 'ASC']
    ]
  });

  return accounts.map(sanitizeAccount);
}

async function createAccount(tenantId, payload) {
  validateAccountPayload(payload);

  const accountCode = payload.account_code ? String(payload.account_code).trim() : null;

  if (!accountCode) {
    throw new AppError('account_code is required.', StatusCodes.BAD_REQUEST);
  }

  await ensureUniqueAccountCode(tenantId, accountCode);
  await ensureParentAccount(tenantId, payload.parent_id);

  const account = await Account.create({
    tenant_id: tenantId,
    account_code: accountCode,
    account_name: String(payload.account_name).trim(),
    account_type: payload.account_type,
    sub_type: payload.sub_type ? String(payload.sub_type).trim() : null,
    parent_id: payload.parent_id || null,
    description: payload.description ? String(payload.description).trim() : null,
    is_active: payload.is_active ?? true
  });

  return sanitizeAccount(account);
}

async function updateAccount(tenantId, accountId, payload) {
  const account = await Account.findOne({
    where: {
      id: accountId,
      tenant_id: tenantId,
      is_active: true
    }
  });

  if (!account) {
    throw new AppError('Account not found.', StatusCodes.NOT_FOUND);
  }

  validateAccountPayload(payload, true);

  const nextAccountCode = Object.prototype.hasOwnProperty.call(payload, 'account_code')
    ? String(payload.account_code || '').trim()
    : account.account_code;

  if (!nextAccountCode) {
    throw new AppError('account_code is required.', StatusCodes.BAD_REQUEST);
  }

  await ensureUniqueAccountCode(tenantId, nextAccountCode, account.id);

  if (Object.prototype.hasOwnProperty.call(payload, 'parent_id')) {
    await ensureParentAccount(tenantId, payload.parent_id, account.id);
  }

  await account.update({
    account_code: nextAccountCode,
    account_name: Object.prototype.hasOwnProperty.call(payload, 'account_name')
      ? String(payload.account_name).trim()
      : account.account_name,
    account_type: payload.account_type || account.account_type,
    sub_type: Object.prototype.hasOwnProperty.call(payload, 'sub_type')
      ? payload.sub_type
        ? String(payload.sub_type).trim()
        : null
      : account.sub_type,
    parent_id: Object.prototype.hasOwnProperty.call(payload, 'parent_id')
      ? payload.parent_id || null
      : account.parent_id,
    description: Object.prototype.hasOwnProperty.call(payload, 'description')
      ? payload.description
        ? String(payload.description).trim()
        : null
      : account.description,
    is_active: Object.prototype.hasOwnProperty.call(payload, 'is_active')
      ? Boolean(payload.is_active)
      : account.is_active
  });

  return sanitizeAccount(account);
}

async function softDeleteAccount(tenantId, accountId) {
  const account = await Account.findOne({
    where: {
      id: accountId,
      tenant_id: tenantId,
      is_active: true
    }
  });

  if (!account) {
    throw new AppError('Account not found.', StatusCodes.NOT_FOUND);
  }

  await account.update({
    is_active: false
  });

  return sanitizeAccount(account);
}

module.exports = {
  ACCOUNT_TYPES,
  listAccountsByTenant,
  listFlatAccountsByTenant,
  createAccount,
  updateAccount,
  softDeleteAccount
};
