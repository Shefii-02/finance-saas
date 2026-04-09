const sequelize = require('../config/database');

async function getHealthStatus() {
  try {
    await sequelize.authenticate();

    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'degraded',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

module.exports = {
  getHealthStatus
};
