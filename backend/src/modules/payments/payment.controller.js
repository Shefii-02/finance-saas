const { StatusCodes } = require('http-status-codes');
const { createPayment } = require('../../services/payment.service');

async function createPaymentEntry(req, res, next) {
  try {
    const result = await createPayment(req.tenant_id, req.body);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPaymentEntry
};
