const express = require('express');
const { register, login, getCurrentUser } = require('./auth.controller');
const authenticate = require('../../middleware/authenticate');
const tenantMiddleware = require('../../middleware/tenant');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, tenantMiddleware, getCurrentUser);

module.exports = router;
