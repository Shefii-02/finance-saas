const express = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantMiddleware = require('../../middleware/tenant');
const {
  getCustomers,
  createCustomerEntry,
  getCustomer,
  updateCustomerEntry,
  deleteCustomerEntry
} = require('./customer.controller');

const router = express.Router();

router.use(authenticate, tenantMiddleware);

router.get('/', getCustomers);
router.post('/', createCustomerEntry);
router.get('/:id', getCustomer);
router.put('/:id', updateCustomerEntry);
router.delete('/:id', deleteCustomerEntry);

module.exports = router;
