require('dotenv').config();
const { query } = require('./src/utils/dbQueries');

async function checkProjectStatus() {
  try {
    console.log('Checking project statuses...\n');
    
    const result = await query(
      `SELECT id, title, status, visibility, created_at 
       FROM projects 
       ORDER BY created_at DESC 
       LIMIT 10`
    );
    
    if (result.rows.length === 0) {
      console.log('No projects found.');
      return;
    }
    
    console.log('Recent projects:');
    console.log('================\n');
    
    result.rows.forEach((project, index) => {
      console.log(`${index + 1}. ${project.title}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Status: ${project.status}`);
      console.log(`   Visibility: ${project.visibility}`);
      console.log(`   Created: ${project.created_at}`);
      console.log('');
    });
    
    // Count by status
    const statusCount = await query(
      `SELECT status, COUNT(*) as count 
       FROM projects 
       GROUP BY status`
    );
    
    console.log('Projects by status:');
    console.log('===================');
    statusCount.rows.forEach(row => {
      console.log(`${row.status}: ${row.count}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkProjectStatus();
