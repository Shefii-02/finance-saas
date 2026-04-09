const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/app-error');
const { Tenant } = require('../models');

async function tenantMiddleware(req, res, next) {
  try {
    const tenantId = req.tenantId || req.auth?.tenantId;

    if (!tenantId) {
      throw new AppError('Tenant context is missing.', StatusCodes.UNAUTHORIZED);
    }

    const tenant = await Tenant.findOne({
      where: {
        id: tenantId,
        is_active: true
      }
    });

    if (!tenant) {
      throw new AppError('Tenant not found or inactive.', StatusCodes.UNAUTHORIZED);
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = tenantMiddleware;
