const {
  verifyDatabaseConnection,
  closePool,
  safeDatabaseError
} = require('./config/db');

async function testConnection() {
  try {
    await verifyDatabaseConnection();
    console.log('Database connection successful.');
  } catch (error) {
    console.error(safeDatabaseError(error));
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

testConnection();
