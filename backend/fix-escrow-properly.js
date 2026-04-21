/**
 * Properly fix escrow to release only milestone amounts
 * Contract: f357ed06-4960-42fb-917d-fb1065fb12da
 * 
 * Current issue: Rs. 75,000 was released for a Rs. 20,000 milestone
 * Solution: Split the Rs. 75,000 deposit across all 3 milestones
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

async function fixEscrowProperly() {
  const client = await pool.connect();
  
  try {
    const contractId = 'f357ed06-4960-42fb-917d-fb1065fb12da';
    
    console.log('Fixing escrow to release only milestone amounts...\n');
    
    await client.query('BEGIN');
    
    // Get contract details
    const contractResult = await client.query(`
      SELECT c.*, p.id as project_id
      FROM contracts c
      JOIN projects p ON c.project_id = p.id
      WHERE c.id = $1
    `, [contractId]);
    
    const contract = contractResult.rows[0];
    
    // Get all milestones
    const milestonesResult = await client.query(`
      SELECT id, title, amount, status
      FROM project_milestones
      WHERE project_id = $1
      ORDER BY order_index ASC, created_at ASC
    `, [contract.project_id]);
    
    const milestones = milestonesResult.rows;
    
    console.log('Contract Budget: Rs. ' + contract.agreed_budget);
    console.log('Milestones:');
    milestones.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.title} - Rs. ${m.amount} (${m.status})`);
    });
    console.log('');
    
    // Get current escrow
    const currentEscrowResult = await client.query(`
      SELECT id, amount, status, milestone_id
      FROM escrow
      WHERE contract_id = $1
    `, [contractId]);
    
    console.log('Current Escrow:');
    currentEscrowResult.rows.forEach(e => {
      console.log(`  ID: ${e.id}, Amount: Rs. ${e.amount}, Status: ${e.status}`);
    });
    console.log('');
    
    // Step 1: Delete the current escrow (Rs. 75,000 released)
    console.log('Step 1: Removing incorrect escrow entry...');
    await client.query(`
      DELETE FROM escrow WHERE contract_id = $1
    `, [contractId]);
    console.log('  ✓ Removed\n');
    
    // Step 2: Get the payment record (Rs. 75,000 deposit)
    const paymentResult = await client.query(`
      SELECT id, amount, platform_fee, net_amount
      FROM payments
      WHERE contract_id = $1 AND status = 'completed'
      ORDER BY created_at DESC
      LIMIT 1
    `, [contractId]);
    
    if (paymentResult.rows.length === 0) {
      console.log('No payment found. Cannot create escrow.');
      await client.query('ROLLBACK');
      return;
    }
    
    const payment = paymentResult.rows[0];
    console.log(`Step 2: Found payment of Rs. ${payment.amount}\n`);
    
    // Step 3: Create escrow for each milestone based on their amounts
    console.log('Step 3: Creating escrow for each milestone...\n');
    
    for (const milestone of milestones) {
      const milestoneAmount = parseFloat(milestone.amount);
      const platformFee = milestoneAmount * 0.1;
      const netAmount = milestoneAmount * 0.9;
      
      // Determine status: released if completed, held otherwise
      const escrowStatus = milestone.status === 'completed' ? 'released' : 'held';
      
      if (escrowStatus === 'released') {
        // For completed milestones, set released_at
        await client.query(`
          INSERT INTO escrow (
            contract_id, milestone_id, payment_id,
            client_id, freelancer_id,
            amount, platform_fee, net_amount,
            status, held_at, released_at, release_note
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $10)
        `, [
          contractId,
          milestone.id,
          payment.id,
          contract.client_id,
          contract.freelancer_id,
          milestoneAmount,
          platformFee,
          netAmount,
          escrowStatus,
          `Released for completed milestone "${milestone.title}"`
        ]);
      } else {
        // For pending milestones, don't set released_at
        await client.query(`
          INSERT INTO escrow (
            contract_id, milestone_id, payment_id,
            client_id, freelancer_id,
            amount, platform_fee, net_amount,
            status, held_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        `, [
          contractId,
          milestone.id,
          payment.id,
          contract.client_id,
          contract.freelancer_id,
          milestoneAmount,
          platformFee,
          netAmount,
          escrowStatus
        ]);
      }
      
      console.log(`  ✓ Created escrow for: ${milestone.title}`);
      console.log(`    Amount: Rs. ${milestoneAmount}`);
      console.log(`    Status: ${escrowStatus}`);
      console.log(`    Freelancer gets: Rs. ${netAmount} (after 10% fee)`);
      console.log('');
    }
    
    await client.query('COMMIT');
    
    console.log('='.repeat(60));
    console.log('✅ Escrow fixed successfully!');
    console.log('='.repeat(60));
    
    // Show final status
    const finalResult = await client.query(`
      SELECT 
        e.id,
        e.amount,
        e.net_amount,
        e.status,
        pm.title as milestone_title,
        pm.status as milestone_status
      FROM escrow e
      JOIN project_milestones pm ON e.milestone_id = pm.id
      WHERE e.contract_id = $1
      ORDER BY pm.order_index ASC, pm.created_at ASC
    `, [contractId]);
    
    console.log('\n📊 Final Escrow Status:');
    console.log('-'.repeat(60));
    
    let totalHeld = 0;
    let totalReleased = 0;
    
    finalResult.rows.forEach((e, index) => {
      console.log(`${index + 1}. ${e.milestone_title}`);
      console.log(`   Milestone Status: ${e.milestone_status}`);
      console.log(`   Escrow Amount: Rs. ${e.amount}`);
      console.log(`   Escrow Status: ${e.status}`);
      if (e.status === 'released') {
        console.log(`   Freelancer Received: Rs. ${e.net_amount}`);
        totalReleased += parseFloat(e.net_amount);
      } else {
        totalHeld += parseFloat(e.amount);
      }
      console.log('');
    });
    
    console.log('Summary:');
    console.log(`  Total Held in Escrow: Rs. ${totalHeld}`);
    console.log(`  Total Released to Freelancer: Rs. ${totalReleased}`);
    console.log(`  Remaining Milestones: ${finalResult.rows.filter(e => e.status === 'held').length}`);
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

fixEscrowProperly()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    console.log('\nNow refresh your browser to see the corrected payment summary!');
    console.log('\nExpected result:');
    console.log('  - Paid to Freelancer: Rs. 18,000 (1 milestone)');
    console.log('  - Held in Escrow: Rs. 55,000 (2 milestones)');
    console.log('  - Remaining to Pay: Rs. 0');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
