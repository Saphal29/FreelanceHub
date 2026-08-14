const { pool } = require('../config/database');
const logger = require('./logger');

/**
 * Execute a parameterized query with logging
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      rows: res.rowCount
    });
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Query error', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get a database client from the pool
 * @returns {Promise<Object>} Database client
 */
const getClient = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    logger.error('Failed to get database client:', { error: error.message });
    throw error;
  }
};

/**
 * Execute multiple queries within a transaction
 * @param {Function} callback - Function that receives client and executes queries
 * @returns {Promise<any>} Result from callback function
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    logger.debug('Transaction started');
    const result = await callback(client);
    await client.query('COMMIT');
    logger.debug('Transaction committed');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back:', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Test database connectivity
 * @returns {Promise<boolean>} Connection status
 */
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as current_time, version() as db_version');
    logger.info('Database connection test successful', {
      currentTime: result.rows[0].current_time,
      dbVersion: result.rows[0].db_version.split(' ')[0]
    });
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', { error: error.message });
    return false;
  }
};

/**
 * Check if a table exists
 * @param {string} tableName - Name of the table to check
 * @returns {Promise<boolean>} Table existence status
 */
const tableExists = async (tableName) => {
  try {
    const result = await query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName]
    );
    return result.rows[0].exists;
  } catch (error) {
    logger.error(`Error checking if table ${tableName} exists:`, { error: error.message });
    return false;
  }
};

/**
 * Get table row count — table name is validated against a whitelist
 * to prevent SQL injection if this utility is ever called dynamically.
 */
const ALLOWED_TABLES = new Set(['users', 'freelancer_profiles', 'client_profiles', 'projects', 'contracts', 'payments']);

const getTableRowCount = async (tableName) => {
  if (!ALLOWED_TABLES.has(tableName)) {
    logger.error(`getTableRowCount called with disallowed table name: ${tableName}`);
    throw new Error(`Invalid table name: ${tableName}`);
  }
  try {
    const result = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result.rows[0].count);
  } catch (error) {
    logger.error(`Error getting row count for table ${tableName}:`, { error: error.message });
    return 0;
  }
};

/**
 * Validate database schema by checking required tables
 * @returns {Promise<boolean>} Schema validation status
 */
const validateSchema = async () => {
  const requiredTables = ['users', 'freelancer_profiles', 'client_profiles'];
  
  try {
    logger.info('Validating database schema...');
    
    for (const table of requiredTables) {
      const exists = await tableExists(table);
      if (!exists) {
        logger.error(`Required table '${table}' does not exist`);
        return false;
      }
      const rowCount = await getTableRowCount(table);
      logger.info(`Table '${table}' exists`, { rows: rowCount });
    }
    
    logger.info('Database schema validation successful');
    return true;
  } catch (error) {
    logger.error('Database schema validation failed:', { error: error.message });
    return false;
  }
};

const closeConnections = async () => {
  try {
    await pool.end();
    logger.info('Database connections closed gracefully');
  } catch (error) {
    logger.error('Error closing database connections:', { error: error.message });
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing database connections...');
  await closeConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing database connections...');
  await closeConnections();
  process.exit(0);
});

module.exports = {
  query,
  getClient,
  transaction,
  testConnection,
  tableExists,
  getTableRowCount,
  validateSchema,
  closeConnections
};