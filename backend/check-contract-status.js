/**
 * Diagnostic script to check contract, milestones, and escrow status
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

async function checkContractStatus() {
  const client = await pool.connect();
  
  try {
    const contractId = 'f357ed06-4960-42fb-917d-fb1065fb12da';
    
    console.log('='.repeat(70));
    console.log('CONTRACT STATUS DIAGNOSTIC');
    console.log('='.repeat(70));
    console.log(`Contract ID: ${contractId}\n`);
    
    // Get contract details
    const contractResult = await client.query(`
      SELECT c.*, p.title as project_title
      FROM contracts c
      JOIN projects p ON c.project_id = p.id
      WHERE c.id = $1
    `, [contractId]);
    
    if (contractResult.rows.length === 0) {
      console.log('❌ Contract not found!');
      return;
    }
    
    const contract = contractResult.rows[0];
    console.log('📄 CONTRACT DETAILS:');
    console.log(`   Project: ${contract.project_title}`);
    console.log(`   Agreed Budget: Rs. ${contract.agreed_budget}`);
    console.log(`   Status: ${contract.status}`);
    console.log(`   Signed by Client: ${contract.signed_by_client}`);
    console.log(`   Signed by Freelancer: ${contract.signed_by_freelancer}\n`);
    
    // Get milestones
    const milestonesResult = await client.query(`
      SELECT id, title, amount, status, due_date, completed_at
      FROM project_milestones
      WHERE project_id = $1
      ORDER BY order_index ASC, created_at ASC
    `, [contract.project_id]);
    
    console.log('🎯 MILESTONES:');
    console.log('-'.repeat(70));
    let totalMilestoneAmount = 0;
    milestonesResult.rows.forEach((m, index) => {
      console.log(`   ${index + 1}. ${m.title}`);
      console.log(`      Amount: Rs. ${m.amount}`);
      console.log(`      Status: ${m.status}`);
      console.log(`      Due: ${m.due_date ? new Date(m.due_date).toLocaleDateString() : 'N/A'}`);
      if (m.completed_at) {
        console.log(`      Completed: ${new Date(m.completed_at).toLocaleDateString()}`);
      }
      console.log('');
      totalMilestoneAmount += parseFloat(m.amount);
    });
    console.log(`   Total Milestone Amount: Rs. ${totalMilestoneAmount}`);
    console.log(`   Contract Budget: Rs. ${contract.agreed_budget}`);
    console.log(`   Difference: Rs. ${totalMilestoneAmount - parseFloat(contract.agreed_budget)}\n`);
    
    // Get escrow
    const escrowResult = await client.query(`
      SELECT 
        e.id,
        e.amount,
        e.net_amount,
        e.platform_fee,
        e.status,
        e.milestone_id,
        e.held_at,
        e.released_at,
        e.refunded_at,
        pm.title as milestone_title
      FROM escrow e
      LEFT JOIN project_milestones pm ON e.milestone_id = pm.id
      WHERE e.contract_id = $1
      ORDER BY e.created_at ASC
    `, [contractId]);
    
    console.log('💰 ESCROW ENTRIES:');
    console.log('-'.repeat(70));
    let totalEscrow = 0;
    let totalHeld = 0;
    let totalReleased = 0;
    let totalRefunded = 0;
    
    escrowResult.rows.forEach((e, index) => {
      console.log(`   ${index + 1}. Escrow ID: ${e.id}`);
      console.log(`      Amount: Rs. ${e.amount}`);
      console.log(`      Net Amount (to freelancer): Rs. ${e.net_amount}`);
      console.log(`      Platform Fee: Rs. ${e.platform_fee}`);
      console.log(`      Status: ${e.status}`);
      console.log(`      Milestone: ${e.milestone_title || 'N/A'}`);
      console.log(`      Held At: ${e.held_at ? new Date(e.held_at).toLocaleString() : 'N/A'}`);
      if (e.released_at) {
        console.log(`      Released At: ${new Date(e.released_at).toLocaleString()}`);
      }
      if (e.refunded_at) {
        console.log(`      Refunded At: ${new Date(e.refunded_at).toLocaleString()}`);
      }
      console.log('');
      
      totalEscrow += parseFloat(e.amount);
      if (e.status === 'held') totalHeld += parseFloat(e.amount);
      if (e.status === 'released') totalReleased += parseFloat(e.net_amount);
      if (e.status === 'refunded') totalRefunded += parseFloat(e.amount);
    });
    
    console.log('📊 ESCROW SUMMARY:');
    console.log(`   Total Escrow Created: Rs. ${totalEscrow}`);
    console.log(`   Currently Held: Rs. ${totalHeld}`);
    console.log(`   Released to Freelancer: Rs. ${totalReleased}`);
    console.log(`   Refunded to Client: Rs. ${totalRefunded}\n`);
    
    // Calculate what should be shown
    console.log('='.repeat(70));
    console.log('PAYMENT SUMMARY (What should be displayed):');
    console.log('='.repeat(70));
    console.log(`   Total Contract: Rs. ${contract.agreed_budget}`);
    console.log(`   Paid to Freelancer: Rs. ${totalReleased} (${escrowResult.rows.filter(e => e.status === 'released').length} milestone(s))`);
    console.log(`   Held in Escrow: Rs. ${totalHeld} (${escrowResult.rows.filter(e => e.status === 'held').length} milestone(s))`);
    console.log(`   Remaining to Pay: Rs. ${parseFloat(contract.agreed_budget) - totalEscrow}`);
    console.log(`   Funded Percentage: ${Math.round((totalEscrow / parseFloat(contract.agreed_budget)) * 100)}%\n`);
    
    // Check for issues
    console.log('='.repeat(70));
    console.log('ISSUES DETECTED:');
    console.log('='.repeat(70));
    
    let issuesFound = false;
    
    if (totalMilestoneAmount !== parseFloat(contract.agreed_budget)) {
      console.log(`   ⚠️  Milestone total (Rs. ${totalMilestoneAmount}) doesn't match contract budget (Rs. ${contract.agreed_budget})`);
      issuesFound = true;
    }
    
    const completedMilestones = milestonesResult.rows.filter(m => m.status === 'completed');
    const completedWithHeldEscrow = completedMilestones.filter(m => 
      escrowResult.rows.some(e => e.milestone_id === m.id && e.status === 'held')
    );
    
    if (completedWithHeldEscrow.length > 0) {
      console.log(`   ⚠️  ${completedWithHeldEscrow.length} completed milestone(s) still have held escrow (should be released):`);
      completedWithHeldEscrow.forEach(m => {
        console.log(`      - ${m.title}`);
      });
      issuesFound = true;
    }
    
    if (!issuesFound) {
      console.log('   ✅ No issues detected!');
    }
    
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkContractStatus()
  .then(() => {
    console.log('\n✅ Diagnostic complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnostic failed:', error);
    process.exit(1);
  });
