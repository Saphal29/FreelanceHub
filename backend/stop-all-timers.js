const { query } = require('./src/utils/dbQueries');

async function stopAllTimers() {
  try {
    console.log('Stopping all active timers...\n');
    
    const result = await query(`
      UPDATE time_entries
      SET end_time = CURRENT_TIMESTAMP
      WHERE end_time IS NULL AND is_manual = FALSE
      RETURNING id, freelancer_id, description, start_time
    `);

    if (result.rows.length === 0) {
      console.log('✅ No active timers to stop.');
    } else {
      console.log(`✅ Stopped ${result.rows.length} timer(s):\n`);
      result.rows.forEach((timer, index) => {
        const duration = Math.floor((Date.now() - new Date(timer.start_time).getTime()) / 1000 / 60);
        console.log(`${index + 1}. Timer ID: ${timer.id}`);
        console.log(`   Description: ${timer.description || 'No description'}`);
        console.log(`   Duration: ${duration} minutes\n`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

stopAllTimers();
