const { StatusCodes } = require('http-status-codes');
const { createInvoice } = require('../../services/invoice.service');

async function createInvoiceEntry(req, res, next) {
  try {
    const result = await createInvoice(req.tenant_id, req.body);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createInvoiceEntry
};
