require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function fixCompletedProject() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const projectId = 'ad1514ac-c073-4ba2-bc44-a0db8af64715';
    const contractId = 'a736e296-43f0-4ede-b612-cca63167068d';
    
    console.log('\n=== Checking if all milestones are completed ===');
    
    const milestonesCheck = await client.query(
      `SELECT COUNT(*) as total,
              COUNT(*) FILTER (WHERE status = 'completed') as completed
       FROM project_milestones
       WHERE project_id = $1`,
      [projectId]
    );
    
    const { total, completed } = milestonesCheck.rows[0];
    console.log(`Total milestones: ${total}`);
    console.log(`Completed milestones: ${completed}`);
    
    if (parseInt(total) === parseInt(completed) && parseInt(total) > 0) {
      console.log('\n✅ All milestones are completed! Updating statuses...');
      
      // Update contract status
      await client.query(
        `UPDATE contracts
         SET status = 'completed', completed_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [contractId]
      );
      console.log('✅ Contract status updated to completed');
      
      // Update project status
      await client.query(
        `UPDATE projects
         SET status = 'completed', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [projectId]
      );
      console.log('✅ Project status updated to completed');
      
      await client.query('COMMIT');
      console.log('\n✅ All updates committed successfully!');
      
      // Verify the changes
      console.log('\n=== Verifying changes ===');
      const projectResult = await client.query(
        'SELECT id, title, status FROM projects WHERE id = $1',
        [projectId]
      );
      console.log('Project:', projectResult.rows[0]);
      
      const contractResult = await client.query(
        'SELECT id, status, completed_at FROM contracts WHERE id = $1',
        [contractId]
      );
      console.log('Contract:', contractResult.rows[0]);
      
    } else {
      console.log('\n❌ Not all milestones are completed yet');
      await client.query('ROLLBACK');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixCompletedProject();
