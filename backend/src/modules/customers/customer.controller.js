const { StatusCodes } = require('http-status-codes');
const {
  listCustomersByTenant,
  createCustomer,
  getCustomerById,
  updateCustomer,
  softDeleteCustomer
} = require('../../services/customer.service');

async function getCustomers(req, res, next) {
  try {
    const customers = await listCustomersByTenant(req.tenant_id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: customers
    });
  } catch (error) {
    next(error);
  }
}

async function createCustomerEntry(req, res, next) {
  try {
    const customer = await createCustomer(req.tenant_id, req.body);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
}

async function getCustomer(req, res, next) {
  try {
    const customer = await getCustomerById(req.tenant_id, req.params.id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
}

async function updateCustomerEntry(req, res, next) {
  try {
    const customer = await updateCustomer(req.tenant_id, req.params.id, req.body);

    res.status(StatusCodes.OK).json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCustomerEntry(req, res, next) {
  try {
    const customer = await softDeleteCustomer(req.tenant_id, req.params.id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCustomers,
  createCustomerEntry,
  getCustomer,
  updateCustomerEntry,
  deleteCustomerEntry
};
