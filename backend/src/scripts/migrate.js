const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'freelancehub_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);

const migrationsDir = path.join(__dirname, '../../migrations');

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Get all migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Run in alphabetical order

    console.log(`📁 Found ${files.length} migration files`);

    // Run each migration
    for (const file of files) {
      console.log(`\n📝 Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await pool.query(sql);
        console.log(`✅ Migration completed: ${file}`);
      } catch (error) {
        console.error(`❌ Migration failed: ${file}`);
        console.error(`Error: ${error.message}`);
        // Continue with other migrations instead of stopping
      }
    }

    console.log('\n🎉 All migrations completed!');
  } catch (error) {
    console.error('❌ Migration process failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
