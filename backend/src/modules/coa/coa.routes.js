const express = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantMiddleware = require('../../middleware/tenant');
const {
  getAccounts,
  getFlatAccounts,
  createCoaAccount,
  updateCoaAccount,
  deleteCoaAccount
} = require('./coa.controller');

const router = express.Router();

router.use(authenticate, tenantMiddleware);

router.get('/', getAccounts);
router.get('/flat', getFlatAccounts);
router.post('/', createCoaAccount);
router.put('/:id', updateCoaAccount);
router.delete('/:id', deleteCoaAccount);

module.exports = router;
