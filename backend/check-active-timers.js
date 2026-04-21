const { query } = require('./src/utils/dbQueries');

async function checkActiveTimers() {
  try {
    console.log('Checking for active timers...\n');
    
    const result = await query(`
      SELECT 
        te.id,
        te.freelancer_id,
        te.contract_id,
        te.description,
        te.start_time,
        te.is_manual,
        u.full_name,
        u.email,
        p.title as project_title
      FROM time_entries te
      JOIN users u ON te.freelancer_id = u.id
      JOIN projects p ON te.project_id = p.id
      WHERE te.end_time IS NULL AND te.is_manual = FALSE
      ORDER BY te.start_time DESC
    `);

    if (result.rows.length === 0) {
      console.log('✅ No active timers found.');
    } else {
      console.log(`⚠️  Found ${result.rows.length} active timer(s):\n`);
      result.rows.forEach((timer, index) => {
        console.log(`Timer ${index + 1}:`);
        console.log(`  ID: ${timer.id}`);
        console.log(`  User: ${timer.full_name} (${timer.email})`);
        console.log(`  Project: ${timer.project_title}`);
        console.log(`  Description: ${timer.description || 'No description'}`);
        console.log(`  Started: ${timer.start_time}`);
        console.log(`  Duration: ${Math.floor((Date.now() - new Date(timer.start_time).getTime()) / 1000 / 60)} minutes`);
        console.log('');
      });

      console.log('\nTo stop all active timers, run:');
      console.log('node backend/stop-all-timers.js\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkActiveTimers();
