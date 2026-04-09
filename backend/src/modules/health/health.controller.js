const { StatusCodes } = require('http-status-codes');
const { getHealthStatus } = require('../../services/health.service');

async function healthCheck(req, res, next) {
  try {
    const status = await getHealthStatus();
    const code = status.status === 'ok' ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE;

    res.status(code).json({
      success: status.status === 'ok',
      data: status
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  healthCheck
};
