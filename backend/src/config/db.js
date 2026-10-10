const path = require('node:path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredConfig = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
let pool;

function getPool() {
  const missing = requiredConfig.filter((key) => !process.env[key]?.trim());
  const port = Number(process.env.DB_PORT);

  if (missing.length > 0 || !Number.isInteger(port) || port < 1 || port > 65535) {
    const error = new Error('Database configuration is incomplete or invalid.');
    error.code = 'MISSING_DB_CONFIG';
    error.missing = missing;
    throw error;
  }

  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  return pool;
}

async function verifyDatabaseConnection() {
  const connection = await getPool().getConnection();
  connection.release();
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

function safeDatabaseError(error) {
  if (error.code === 'MISSING_DB_CONFIG') {
    const missing = error.missing.length > 0 ? ` Set ${error.missing.join(', ')}.` : '';
    return `Database configuration is incomplete or invalid in backend/.env.${missing}`;
  }
  if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    return 'MySQL rejected the configured user. Check DB_USER, DB_PASSWORD, and the database grants.';
  }
  if (error.code === 'ECONNREFUSED') {
    return 'Could not connect to MySQL. Check that the server is running and DB_HOST/DB_PORT are correct.';
  }
  if (error.code === 'ENOTFOUND') {
    return 'The MySQL host could not be resolved. Check DB_HOST in backend/.env.';
  }
  if (error.code === 'ER_BAD_DB_ERROR') {
    return 'The configured database does not exist. Run database/schema.sql with an appropriately privileged account.';
  }
  return 'Could not establish a MySQL connection. Check backend/.env and the MySQL database grants.';
}

module.exports = { getPool, verifyDatabaseConnection, closePool, safeDatabaseError };
