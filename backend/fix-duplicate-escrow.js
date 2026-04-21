/**
 * Script to fix duplicate escrow entries
 * Run this once to clean up duplicate escrow records created by webhook retries
 */

require('dotenv').config();
const { Pool } = require('pg');

// Use the same database configuration as the application
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
      ssl: false,
    };

const pool = new Pool(poolConfig);

async function fixDuplicateEscrow() {
  const client = await pool.connect();
  
  try {
    console.log('Starting duplicate escrow cleanup...\n');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Find duplicate escrow entries (same payment_id)
    const duplicatesResult = await client.query(`
      SELECT payment_id, COUNT(*) as count, ARRAY_AGG(id ORDER BY created_at) as escrow_ids
      FROM escrow
      WHERE payment_id IS NOT NULL
      GROUP BY payment_id
      HAVING COUNT(*) > 1
    `);
    
    console.log(`Found ${duplicatesResult.rows.length} payments with duplicate escrow entries\n`);
    
    if (duplicatesResult.rows.length === 0) {
      console.log('No duplicates found. Database is clean!');
      await client.query('ROLLBACK');
      return;
    }
    
    let totalDeleted = 0;
    
    for (const row of duplicatesResult.rows) {
      const { payment_id, count, escrow_ids } = row;
      
      // Keep the first escrow entry, delete the rest
      const keepId = escrow_ids[0];
      const deleteIds = escrow_ids.slice(1);
      
      console.log(`Payment ${payment_id}:`);
      console.log(`  - Found ${count} escrow entries`);
      console.log(`  - Keeping: ${keepId}`);
      console.log(`  - Deleting: ${deleteIds.join(', ')}`);
      
      // Get details of escrow entries being deleted
      const detailsResult = await client.query(
        'SELECT id, amount, status, created_at FROM escrow WHERE id = ANY($1)',
        [deleteIds]
      );
      
      detailsResult.rows.forEach(escrow => {
        console.log(`    - Escrow ${escrow.id}: Rs. ${escrow.amount}, Status: ${escrow.status}, Created: ${escrow.created_at}`);
      });
      
      // Delete duplicate escrow entries
      const deleteResult = await client.query(
        'DELETE FROM escrow WHERE id = ANY($1)',
        [deleteIds]
      );
      
      totalDeleted += deleteResult.rowCount;
      console.log(`  ✓ Deleted ${deleteResult.rowCount} duplicate entries\n`);
    }
    
    // Show summary
    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total payments with duplicates: ${duplicatesResult.rows.length}`);
    console.log(`Total duplicate escrow entries deleted: ${totalDeleted}`);
    console.log('='.repeat(60));
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Cleanup completed successfully!');
    
    // Show remaining escrow entries
    const remainingResult = await client.query(`
      SELECT 
        e.id,
        e.amount,
        e.status,
        e.payment_id,
        p.transaction_id as stripe_session_id,
        e.created_at
      FROM escrow e
      LEFT JOIN payments p ON e.payment_id = p.id
      ORDER BY e.created_at DESC
    `);
    
    console.log('\n📊 Remaining Escrow Entries:');
    console.log('='.repeat(60));
    remainingResult.rows.forEach(escrow => {
      console.log(`ID: ${escrow.id}`);
      console.log(`  Amount: Rs. ${escrow.amount}`);
      console.log(`  Status: ${escrow.status}`);
      console.log(`  Payment ID: ${escrow.payment_id || 'N/A'}`);
      console.log(`  Stripe Session: ${escrow.stripe_session_id || 'N/A'}`);
      console.log(`  Created: ${escrow.created_at}`);
      console.log('-'.repeat(60));
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during cleanup:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
fixDuplicateEscrow()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
