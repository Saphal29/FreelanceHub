const { query } = require('./src/utils/dbQueries');
require('dotenv').config();

async function checkFunctionDefinition() {
  try {
    console.log('🔍 Checking get_user_storage_usage function definition...\n');
    
    const result = await query(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'get_user_storage_usage';
    `);
    
    if (result.rows.length > 0) {
      console.log('Function definition:');
      console.log('=====================================');
      console.log(result.rows[0].definition);
      console.log('=====================================');
    } else {
      console.log('❌ Function not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

checkFunctionDefinition();
