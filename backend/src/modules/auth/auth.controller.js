const { StatusCodes } = require('http-status-codes');
const {
  registerTenantAdmin,
  loginUser,
  sanitizeUser,
  sanitizeTenant
} = require('../../services/auth.service');

async function register(req, res, next) {
  try {
    const result = await registerTenantAdmin(req.body);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await loginUser(req.body);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        user: sanitizeUser(req.user),
        tenant: sanitizeTenant(req.tenant)
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getCurrentUser
};
