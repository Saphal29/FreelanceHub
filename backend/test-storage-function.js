const { query } = require('./src/utils/dbQueries');
require('dotenv').config();

async function testStorageFunction() {
  try {
    console.log('🔍 Testing get_user_storage_usage function...\n');
    
    // Test with admin user ID
    const userId = 'c365207e-6ebe-470b-80dd-7a778fb06011';
    
    console.log('User ID:', userId);
    console.log('Executing query: SELECT * FROM get_user_storage_usage($1)\n');
    
    const result = await query(
      'SELECT * FROM get_user_storage_usage($1)',
      [userId]
    );
    
    console.log('✅ Query successful!');
    console.log('Rows returned:', result.rows.length);
    console.log('Result:', JSON.stringify(result.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Query failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Full error:', error);
  }
  
  process.exit(0);
}

testStorageFunction();
