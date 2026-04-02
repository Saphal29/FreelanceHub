const { Pool } = require('pg');
require('dotenv').config();

// Support both DATABASE_URL (Render default) and individual env vars
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'freelancehub_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection on startup
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('🔍 Testing database connection...');
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0].now);
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(-1);
  }
};

module.exports = { pool, testConnection };