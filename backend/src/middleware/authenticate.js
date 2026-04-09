const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const env = require('../config/env');
const AppError = require('../utils/app-error');
const { User, Tenant } = require('../models');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token is missing.', StatusCodes.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, env.jwtSecret);

    const user = await User.findOne({
      where: {
        id: payload.userId,
        tenant_id: payload.tenantId,
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

    if (!user) {
      throw new AppError('Authenticated user was not found.', StatusCodes.UNAUTHORIZED);
    }

    req.user = user;
    req.tenantId = payload.tenantId;
    req.tenant_id = payload.tenantId;
    req.auth = payload;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token.', StatusCodes.UNAUTHORIZED));
    }

    return next(error);
  }
}

module.exports = authenticate;
