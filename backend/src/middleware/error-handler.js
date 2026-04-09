const { StatusCodes } = require('http-status-codes');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message
  });
}

module.exports = errorHandler;
