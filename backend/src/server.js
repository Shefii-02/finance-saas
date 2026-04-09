const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
  }

  app.listen(env.port, () => {
    console.log(`Backend server listening on port ${env.port}`);
  });
}

startServer();
