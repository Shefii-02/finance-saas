const { StatusCodes } = require('http-status-codes');
const {
  listAccountsByTenant,
  listFlatAccountsByTenant,
  createAccount,
  updateAccount,
  softDeleteAccount
} = require('../../services/coa.service');

async function getAccounts(req, res, next) {
  try {
    const accounts = await listAccountsByTenant(req.tenant_id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: accounts
    });
  } catch (error) {
    next(error);
  }
}

async function getFlatAccounts(req, res, next) {
  try {
    const accounts = await listFlatAccountsByTenant(req.tenant_id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: accounts
    });
  } catch (error) {
    next(error);
  }
}

async function createCoaAccount(req, res, next) {
  try {
    const account = await createAccount(req.tenant_id, req.body);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
}

async function updateCoaAccount(req, res, next) {
  try {
    const account = await updateAccount(req.tenant_id, req.params.id, req.body);

    res.status(StatusCodes.OK).json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCoaAccount(req, res, next) {
  try {
    const account = await softDeleteAccount(req.tenant_id, req.params.id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAccounts,
  getFlatAccounts,
  createCoaAccount,
  updateCoaAccount,
  deleteCoaAccount
};
