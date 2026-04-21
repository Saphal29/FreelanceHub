/**
 * Helper script to complete a contract for testing purposes
 * Usage: node complete-contract.js <contract-id>
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function completeContract(contractId) {
  const client = await pool.connect();
  
  try {
    console.log(`\n🔄 Completing contract: ${contractId}\n`);
    
    // Check if contract exists
    const checkResult = await client.query(
      'SELECT id, status, client_id, freelancer_id FROM contracts WHERE id = $1',
      [contractId]
    );
    
    if (checkResult.rows.length === 0) {
      console.log('❌ Contract not found');
      return;
    }
    
    const contract = checkResult.rows[0];
    console.log(`📋 Current status: ${contract.status}`);
    
    if (contract.status === 'completed') {
      console.log('✅ Contract is already completed');
      return;
    }
    
    // Update contract status
    const result = await client.query(
      `UPDATE contracts 
       SET status = 'completed', 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [contractId]
    );
    
    console.log('✅ Contract completed successfully!\n');
    console.log('📄 Contract Details:');
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Status: ${result.rows[0].status}`);
    console.log(`   Client ID: ${result.rows[0].client_id}`);
    console.log(`   Freelancer ID: ${result.rows[0].freelancer_id}`);
    console.log(`   Updated: ${result.rows[0].updated_at}`);
    console.log('\n✨ You can now submit reviews for this contract!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Get contract ID from command line
const contractId = process.argv[2];

if (!contractId) {
  console.log('\n❌ Usage: node complete-contract.js <contract-id>\n');
  console.log('Example:');
  console.log('  node complete-contract.js 3af1a518-0035-4bdd-af6d-9c1ce47369e0\n');
  process.exit(1);
}

// Validate UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(contractId)) {
  console.log('\n❌ Invalid contract ID format. Must be a valid UUID.\n');
  process.exit(1);
}

completeContract(contractId);
