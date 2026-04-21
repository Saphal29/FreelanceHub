const { query } = require('./src/utils/dbQueries');
require('dotenv').config();

async function checkFilesTable() {
  try {
    console.log('🔍 Checking files table structure...\n');
    
    // Check if table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'files'
      );
    `);
    
    console.log('Table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Get column information
      const columns = await query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'files'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 Table columns:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
      });
      
      // Check enums
      console.log('\n🔢 Checking enums...');
      const enums = await query(`
        SELECT typname 
        FROM pg_type 
        WHERE typname IN ('file_category', 'file_status');
      `);
      
      console.log('Enums found:', enums.rows.map(r => r.typname));
      
      // Check functions
      console.log('\n⚙️ Checking functions...');
      const functions = await query(`
        SELECT proname 
        FROM pg_proc 
        WHERE proname IN ('soft_delete_file', 'cleanup_expired_files', 'get_user_storage_usage');
      `);
      
      console.log('Functions found:', functions.rows.map(r => r.proname));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

checkFilesTable();
