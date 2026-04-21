const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting milestone submission migration...\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '010_add_milestone_submission_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify the new tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('milestone_submissions', 'milestone_revisions')
      ORDER BY table_name
    `);
    
    console.log('📋 New tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Verify new columns in project_milestones
    const columnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'project_milestones'
        AND column_name IN (
          'submitted_at', 'submitted_by', 'submission_notes', 
          'submission_attachments', 'reviewed_at', 'reviewed_by',
          'review_notes', 'revision_count', 'total_time_tracked'
        )
      ORDER BY column_name
    `);
    
    console.log('\n📋 New columns in project_milestones:');
    columnsResult.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n✨ Milestone submission & approval system is ready!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
