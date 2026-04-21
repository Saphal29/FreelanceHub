const { query } = require('./src/utils/dbQueries');

async function checkColumns() {
  try {
    console.log('📋 Checking database columns...\n');
    
    // Check freelancer_profiles columns
    console.log('🔍 Freelancer Profiles columns:');
    const fpColumns = await query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'freelancer_profiles' 
       ORDER BY ordinal_position`
    );
    
    fpColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check client_profiles columns
    console.log('\n🔍 Client Profiles columns:');
    const cpColumns = await query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'client_profiles' 
       ORDER BY ordinal_position`
    );
    
    cpColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check if new tables exist
    console.log('\n🔍 Checking new tables:');
    const tables = ['freelancer_skills', 'portfolio_items', 'freelancer_experience', 'freelancer_education', 'payment_methods', 'user_preferences'];
    
    for (const table of tables) {
      const exists = await query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )`,
        [table]
      );
      
      console.log(`   - ${table}: ${exists.rows[0].exists ? '✅ EXISTS' : '❌ MISSING'}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking columns:', error.message);
  }
  
  process.exit(0);
}

checkColumns();