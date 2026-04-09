const dotenv = require('dotenv');

dotenv.config({ path: process.env.ENV_FILE || '../.env' });

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.BACKEND_PORT || 5001),
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || 'finance_saas',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  }
};
