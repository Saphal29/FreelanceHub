/**
 * Fix script for contract f357ed06-4960-42fb-917d-fb1065fb12da
 */

require('dotenv').config();
const { Pool } = require('pg');

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

async function fixContract() {
  const client = await pool.connect();
  
  try {
    const contractId = 'f357ed06-4960-42fb-917d-fb1065fb12da';
    
    console.log('Starting contract fix...\n');
    
    await client.query('BEGIN');
    
    // Get the completed milestone
    const milestoneResult = await client.query(`
      SELECT pm.id, pm.title, pm.amount, pm.status
      FROM project_milestones pm
      JOIN contracts c ON pm.project_id = c.project_id
      WHERE c.id = $1 AND pm.status = 'completed'
      LIMIT 1
    `, [contractId]);
    
    if (milestoneResult.rows.length === 0) {
      console.log('No completed milestone found');
      await client.query('ROLLBACK');
      return;
    }
    
    const completedMilestone = milestoneResult.rows[0];
    console.log(`Found completed milestone: ${completedMilestone.title}`);
    console.log(`  Amount: Rs. ${completedMilestone.amount}`);
    console.log(`  Status: ${completedMilestone.status}\n`);
    
    // Step 1: Delete the orphaned pending escrow (Rs. 20,000)
    console.log('Step 1: Deleting orphaned pending escrow...');
    const deleteResult = await client.query(`
      DELETE FROM escrow 
      WHERE contract_id = $1 AND status = 'pending'
      RETURNING id, amount
    `, [contractId]);
    
    if (deleteResult.rows.length > 0) {
      console.log(`  ✓ Deleted escrow: ${deleteResult.rows[0].id}`);
      console.log(`    Amount: Rs. ${deleteResult.rows[0].amount}\n`);
    }
    
    // Step 2: Link the Rs. 75,000 escrow to the completed milestone
    console.log('Step 2: Linking Rs. 75,000 escrow to completed milestone...');
    const updateResult = await client.query(`
      UPDATE escrow
      SET milestone_id = $1
      WHERE contract_id = $2 AND status = 'held' AND milestone_id IS NULL
      RETURNING id, amount
    `, [completedMilestone.id, contractId]);
    
    if (updateResult.rows.length > 0) {
      console.log(`  ✓ Updated escrow: ${updateResult.rows[0].id}`);
      console.log(`    Amount: Rs. ${updateResult.rows[0].amount}`);
      console.log(`    Linked to milestone: ${completedMilestone.title}\n`);
    }
    
    // Step 3: Since milestone is completed, release the escrow
    console.log('Step 3: Releasing escrow for completed milestone...');
    const releaseResult = await client.query(`
      UPDATE escrow
      SET status = 'released',
          released_at = CURRENT_TIMESTAMP,
          release_note = $1
      WHERE contract_id = $2 AND milestone_id = $3 AND status = 'held'
      RETURNING id, amount, net_amount
    `, [`Auto-released for completed milestone "${completedMilestone.title}"`, contractId, completedMilestone.id]);
    
    if (releaseResult.rows.length > 0) {
      console.log(`  ✓ Released escrow: ${releaseResult.rows[0].id}`);
      console.log(`    Amount: Rs. ${releaseResult.rows[0].amount}`);
      console.log(`    Freelancer receives: Rs. ${releaseResult.rows[0].net_amount}\n`);
    }
    
    await client.query('COMMIT');
    
    console.log('='.repeat(60));
    console.log('✅ Contract fixed successfully!');
    console.log('='.repeat(60));
    
    // Show final status
    const finalResult = await client.query(`
      SELECT 
        e.id,
        e.amount,
        e.net_amount,
        e.status,
        pm.title as milestone_title
      FROM escrow e
      LEFT JOIN project_milestones pm ON e.milestone_id = pm.id
      WHERE e.contract_id = $1
      ORDER BY e.created_at ASC
    `, [contractId]);
    
    console.log('\n📊 Final Escrow Status:');
    console.log('-'.repeat(60));
    finalResult.rows.forEach((e, index) => {
      console.log(`${index + 1}. Escrow ID: ${e.id}`);
      console.log(`   Amount: Rs. ${e.amount}`);
      console.log(`   Status: ${e.status}`);
      console.log(`   Milestone: ${e.milestone_title || 'N/A'}`);
      if (e.status === 'released') {
        console.log(`   Freelancer received: Rs. ${e.net_amount}`);
      }
      console.log('');
    });
    
    const totals = await client.query(`
      SELECT 
        SUM(CASE WHEN status = 'held' THEN amount ELSE 0 END) as total_held,
        SUM(CASE WHEN status = 'released' THEN net_amount ELSE 0 END) as total_released,
        SUM(amount) as total_escrow
      FROM escrow
      WHERE contract_id = $1
    `, [contractId]);
    
    const t = totals.rows[0];
    console.log('Summary:');
    console.log(`  Total Escrow: Rs. ${t.total_escrow}`);
    console.log(`  Held: Rs. ${t.total_held}`);
    console.log(`  Released to Freelancer: Rs. ${t.total_released}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixContract()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    console.log('\nNow refresh your browser to see the updated payment summary!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
