const { initializeDatabase } = require('../services/database.service');

const runInit = async () => {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully.');
    process.exit(0);
  } catch (objError) {
    console.error('Database initialization failed:', objError);
    process.exit(1);
  }
};

runInit();
