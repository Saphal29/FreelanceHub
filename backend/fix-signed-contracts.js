/**
 * Fix Script: Update fully signed contracts to active status
 * 
 * This script finds all contracts where both parties have signed
 * but the status is still 'draft' or 'pending', and updates them to 'active'
 */

const { pool } = require('./src/config/database');

async function fixSignedContracts() {
  try {
    console.log('🔍 Checking for fully signed contracts with incorrect status...\n');

    // Find contracts where both parties signed but status is not active
    const findQuery = `
      SELECT 
        id, 
        project_id,
        status,
        signed_by_client,
        signed_by_freelancer,
        client_signed_at,
        freelancer_signed_at
      FROM contracts
      WHERE signed_by_client = true 
        AND signed_by_freelancer = true 
        AND status != 'active'
        AND status != 'completed'
        AND status != 'cancelled'
      ORDER BY created_at DESC
    `;

    const result = await pool.query(findQuery);
    
    if (result.rows.length === 0) {
      console.log('✅ No contracts need fixing. All fully signed contracts are already active!\n');
      process.exit(0);
    }

    console.log(`📋 Found ${result.rows.length} contract(s) that need to be activated:\n`);
    
    result.rows.forEach((contract, index) => {
      console.log(`${index + 1}. Contract ID: ${contract.id.substring(0, 8)}...`);
      console.log(`   Current Status: ${contract.status}`);
      console.log(`   Client Signed: ${contract.client_signed_at ? new Date(contract.client_signed_at).toLocaleString() : 'No'}`);
      console.log(`   Freelancer Signed: ${contract.freelancer_signed_at ? new Date(contract.freelancer_signed_at).toLocaleString() : 'No'}`);
      console.log('');
    });

    // Ask for confirmation
    console.log(`\n⚠️  About to update ${result.rows.length} contract(s) to 'active' status.\n`);
    
    // Update all contracts
    const updateQuery = `
      UPDATE contracts 
      SET 
        status = 'active',
        started_at = COALESCE(started_at, GREATEST(client_signed_at, freelancer_signed_at)),
        updated_at = CURRENT_TIMESTAMP
      WHERE signed_by_client = true 
        AND signed_by_freelancer = true 
        AND status != 'active'
        AND status != 'completed'
        AND status != 'cancelled'
      RETURNING id, status, started_at
    `;

    const updateResult = await pool.query(updateQuery);
    
    console.log(`\n✅ Successfully updated ${updateResult.rows.length} contract(s) to active status!\n`);
    
    updateResult.rows.forEach((contract, index) => {
      console.log(`${index + 1}. Contract ID: ${contract.id.substring(0, 8)}...`);
      console.log(`   New Status: ${contract.status}`);
      console.log(`   Started At: ${new Date(contract.started_at).toLocaleString()}`);
      console.log('');
    });

    console.log('✨ All done! Contracts have been fixed.\n');
    
  } catch (error) {
    console.error('❌ Error fixing contracts:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixSignedContracts();
