const express = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantMiddleware = require('../../middleware/tenant');
const { createPaymentEntry } = require('./payment.controller');

const router = express.Router();

router.use(authenticate, tenantMiddleware);

router.post('/', createPaymentEntry);

module.exports = router;
