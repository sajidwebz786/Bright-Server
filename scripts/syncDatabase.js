require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { sequelize } = require('../config/database');

require('../models');
require('../models/associations')();

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('Database schema synchronized successfully.');
  } catch (error) {
    console.error(`Database schema synchronization failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
