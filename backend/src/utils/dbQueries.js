const { pool } = require('../config/database');

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
    console.log('Executed query', { 
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''), 
      duration: `${duration}ms`, 
      rows: res.rowCount 
    });
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Query error', { 
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
    console.error('Failed to get database client:', error.message);
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
    console.log('🔄 Transaction started');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    console.log('✅ Transaction committed');
    
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Transaction rolled back:', error.message);
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
    console.log('✅ Database connection test successful');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🗄️  Database version:', result.rows[0].db_version.split(' ')[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
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
    console.error(`Error checking if table ${tableName} exists:`, error.message);
    return false;
  }
};

/**
 * Get table row count
 * @param {string} tableName - Name of the table
 * @returns {Promise<number>} Number of rows in table
 */
const getTableRowCount = async (tableName) => {
  try {
    const result = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error(`Error getting row count for table ${tableName}:`, error.message);
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
    console.log('🔍 Validating database schema...');
    
    for (const table of requiredTables) {
      const exists = await tableExists(table);
      if (!exists) {
        console.error(`❌ Required table '${table}' does not exist`);
        return false;
      }
      
      const rowCount = await getTableRowCount(table);
      console.log(`✅ Table '${table}' exists with ${rowCount} rows`);
    }
    
    console.log('✅ Database schema validation successful');
    return true;
  } catch (error) {
    console.error('❌ Database schema validation failed:', error.message);
    return false;
  }
};

/**
 * Gracefully close database connections
 * @returns {Promise<void>}
 */
const closeConnections = async () => {
  try {
    await pool.end();
    console.log('✅ Database connections closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error.message);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, closing database connections...');
  await closeConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, closing database connections...');
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