/**
 * Script to release escrow for completed milestones
 * This fixes milestones that were completed before the auto-release feature was implemented
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

async function fixCompletedMilestonesEscrow() {
  const client = await pool.connect();
  
  try {
    console.log('Starting completed milestones escrow fix...\n');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Find completed milestones with held escrow
    const result = await client.query(`
      SELECT 
        pm.id as milestone_id,
        pm.title as milestone_title,
        pm.status as milestone_status,
        pm.completed_at,
        e.id as escrow_id,
        e.amount as escrow_amount,
        e.status as escrow_status,
        p.title as project_title
      FROM project_milestones pm
      JOIN escrow e ON e.milestone_id = pm.id
      JOIN contracts c ON e.contract_id = c.id
      JOIN projects p ON c.project_id = p.id
      WHERE pm.status = 'completed'
        AND e.status = 'held'
      ORDER BY pm.completed_at DESC
    `);
    
    console.log(`Found ${result.rows.length} completed milestone(s) with held escrow\n`);
    
    if (result.rows.length === 0) {
      console.log('✅ No escrow needs to be released. All completed milestones are already paid!');
      await client.query('ROLLBACK');
      return;
    }
    
    let totalReleased = 0;
    let totalAmount = 0;
    
    for (const row of result.rows) {
      console.log(`Milestone: ${row.milestone_title}`);
      console.log(`  Project: ${row.project_title}`);
      console.log(`  Status: ${row.milestone_status}`);
      console.log(`  Completed: ${row.completed_at}`);
      console.log(`  Escrow ID: ${row.escrow_id}`);
      console.log(`  Escrow Amount: Rs. ${row.escrow_amount}`);
      console.log(`  Escrow Status: ${row.escrow_status}`);
      
      // Release the escrow
      await client.query(
        `UPDATE escrow 
         SET status = 'released', 
             released_at = CURRENT_TIMESTAMP,
             release_note = $1
         WHERE id = $2`,
        [`Auto-released for completed milestone "${row.milestone_title}"`, row.escrow_id]
      );
      
      totalReleased++;
      totalAmount += parseFloat(row.escrow_amount);
      
      console.log(`  ✓ Escrow released!\n`);
    }
    
    // Show summary
    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total milestones processed: ${result.rows.length}`);
    console.log(`Total escrow released: ${totalReleased}`);
    console.log(`Total amount released: Rs. ${totalAmount.toFixed(2)}`);
    console.log('='.repeat(60));
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ All escrow released successfully!');
    
    // Show updated escrow status
    const updatedResult = await client.query(`
      SELECT 
        e.id,
        e.amount,
        e.status,
        e.released_at,
        pm.title as milestone_title,
        p.title as project_title
      FROM escrow e
      LEFT JOIN project_milestones pm ON e.milestone_id = pm.id
      LEFT JOIN contracts c ON e.contract_id = c.id
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE e.status = 'released'
      ORDER BY e.released_at DESC
      LIMIT 10
    `);
    
    console.log('\n📊 Recently Released Escrow:');
    console.log('='.repeat(60));
    updatedResult.rows.forEach(escrow => {
      console.log(`Project: ${escrow.project_title || 'N/A'}`);
      console.log(`Milestone: ${escrow.milestone_title || 'N/A'}`);
      console.log(`Amount: Rs. ${escrow.amount}`);
      console.log(`Released: ${escrow.released_at}`);
      console.log('-'.repeat(60));
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during fix:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
fixCompletedMilestonesEscrow()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
