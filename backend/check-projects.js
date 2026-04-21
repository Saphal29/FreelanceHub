const { query } = require('./src/utils/dbQueries');

async function checkProjects() {
  try {
    console.log('📋 Checking projects in database...\n');
    
    const result = await query(`
      SELECT 
        p.id, p.title, p.status, p.client_id,
        u.full_name as client_name, u.email as client_email
      FROM projects p
      JOIN users u ON p.client_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No projects found in database');
      console.log('\n💡 You need to create a project first using the frontend or API');
    } else {
      console.log(`✅ Found ${result.rows.length} projects:\n`);
      
      result.rows.forEach((project, index) => {
        console.log(`${index + 1}. ${project.title}`);
        console.log(`   - ID: ${project.id}`);
        console.log(`   - Status: ${project.status}`);
        console.log(`   - Client: ${project.client_name} (${project.client_email})`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkProjects();
