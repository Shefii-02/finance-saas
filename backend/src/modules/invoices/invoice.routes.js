const express = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantMiddleware = require('../../middleware/tenant');
const { createInvoiceEntry } = require('./invoice.controller');

const router = express.Router();

router.use(authenticate, tenantMiddleware);

router.post('/', createInvoiceEntry);

module.exports = router;
