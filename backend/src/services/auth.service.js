const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { StatusCodes } = require('http-status-codes');
const env = require('../config/env');
const AppError = require('../utils/app-error');
const { sequelize, Tenant, User, Account } = require('../models');
const { seedDefaultAccountsForTenant } = require('./default-coa.service');
const tenantPlans = ['free', 'pro', 'enterprise'];

function sanitizeUser(user) {
  const values = user.get ? user.get({ plain: true }) : user;
  delete values.password_hash;
  return values;
}

function sanitizeTenant(tenant) {
  return tenant.get ? tenant.get({ plain: true }) : tenant;
}

function signAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn
    }
  );
}

async function registerTenantAdmin(payload) {
  const { tenantName, subdomain, plan = 'free', name, email, password } = payload;

  if (!tenantName || !subdomain || !name || !email || !password) {
    throw new AppError('tenantName, subdomain, name, email, and password are required.', StatusCodes.BAD_REQUEST);
  }

  if (!tenantPlans.includes(plan)) {
    throw new AppError('Invalid subscription plan.', StatusCodes.BAD_REQUEST);
  }

  const existingTenant = await Tenant.findOne({
    where: {
      [Op.or]: [{ subdomain }]
    }
  });

  if (existingTenant) {
    throw new AppError('Subdomain is already in use.', StatusCodes.CONFLICT);
  }

  const user = await sequelize.transaction(async (transaction) => {
    const tenant = await Tenant.create(
      {
        name: tenantName,
        subdomain,
        plan,
        is_active: true
      },
      { transaction }
    );

    await seedDefaultAccountsForTenant({
      Account,
      tenantId: tenant.id,
      transaction
    });

    const password_hash = await bcrypt.hash(password, 10);

    return User.create(
      {
        tenant_id: tenant.id,
        name,
        email,
        password_hash,
        role: 'admin',
        is_active: true
      },
      { transaction }
    );
  });

  const accessToken = signAccessToken(user);
  const tenant = await Tenant.findByPk(user.tenant_id);

  return {
    accessToken,
    user: sanitizeUser(user),
    tenant: sanitizeTenant(tenant)
  };
}

async function loginUser(payload) {
  const { email, password } = payload;

  if (!email || !password) {
    throw new AppError('email and password are required.', StatusCodes.BAD_REQUEST);
  }

  const users = await User.findAll({
    where: {
      email,
      is_active: true
    },
    include: [
      {
        model: Tenant,
        as: 'tenant',
        where: {
          is_active: true
        }
      }
    ]
  });

  if (!users.length) {
    throw new AppError('Invalid email or password.', StatusCodes.UNAUTHORIZED);
  }

  if (users.length > 1) {
    throw new AppError(
      'Multiple accounts matched this email. Please use a tenant-specific login flow.',
      StatusCodes.CONFLICT
    );
  }

  const user = users[0];
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new AppError('Invalid email or password.', StatusCodes.UNAUTHORIZED);
  }

  return {
    accessToken: signAccessToken(user),
    user: sanitizeUser(user),
    tenant: sanitizeTenant(user.tenant)
  };
}

module.exports = {
  registerTenantAdmin,
  loginUser,
  signAccessToken,
  sanitizeUser,
  sanitizeTenant
};
