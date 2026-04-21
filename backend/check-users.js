const { query } = require('./src/utils/dbQueries');

async function checkUsers() {
  try {
    console.log('📋 Checking users in database...\n');
    
    const result = await query(
      `SELECT 
        u.id, u.email, u.role, u.full_name, u.verified,
        fp.id as freelancer_profile_id,
        cp.id as client_profile_id
       FROM users u
       LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
       LEFT JOIN client_profiles cp ON u.id = cp.user_id
       ORDER BY u.created_at DESC`
    );
    
    console.log(`Found ${result.rows.length} users:\n`);
    
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Name: ${user.full_name}`);
      console.log(`   - Verified: ${user.verified}`);
      console.log(`   - Freelancer Profile: ${user.freelancer_profile_id ? 'Yes' : 'No'}`);
      console.log(`   - Client Profile: ${user.client_profile_id ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    if (result.rows.length > 0) {
      console.log('💡 You can use any of these emails for testing the API');
      console.log('🔑 Make sure you know the password for the user you want to test with');
    } else {
      console.log('❌ No users found. Please register a user first.');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  }
  
  process.exit(0);
}

checkUsers();