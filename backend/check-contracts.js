const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkContracts() {
  try {
    // Check contracts
    const contractsResult = await pool.query('SELECT * FROM contracts ORDER BY created_at DESC LIMIT 5');
    console.log('\n=== CONTRACTS ===');
    console.log('Total contracts:', contractsResult.rows.length);
    contractsResult.rows.forEach(contract => {
      console.log(`\nContract ID: ${contract.id}`);
      console.log(`Project ID: ${contract.project_id}`);
      console.log(`Proposal ID: ${contract.proposal_id}`);
      console.log(`Status: ${contract.status}`);
      console.log(`Budget: $${contract.agreed_budget}`);
      console.log(`Created: ${contract.created_at}`);
    });
    
    // Check notifications
    const notificationsResult = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10');
    console.log('\n\n=== NOTIFICATIONS ===');
    console.log('Total notifications:', notificationsResult.rows.length);
    notificationsResult.rows.forEach(notif => {
      console.log(`\nNotification ID: ${notif.id}`);
      console.log(`User ID: ${notif.user_id}`);
      console.log(`Type: ${notif.type}`);
      console.log(`Title: ${notif.title}`);
      console.log(`Message: ${notif.message}`);
      console.log(`Read: ${notif.is_read}`);
      console.log(`Created: ${notif.created_at}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkContracts();
