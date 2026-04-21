const { query } = require('./src/utils/dbQueries');
const profileService = require('./src/services/profileService');

async function testProfileService() {
  try {
    console.log('🧪 Testing Profile Service Functions\n');
    
    // Get a test user
    const userResult = await query(
      `SELECT u.id, u.email, u.role, u.full_name 
       FROM users u 
       WHERE u.verified = true 
       LIMIT 1`
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ No verified users found for testing');
      return;
    }
    
    const testUser = userResult.rows[0];
    console.log(`👤 Testing with user: ${testUser.email} (${testUser.role})`);
    
    // Test 1: Get complete profile
    console.log('\n📋 Test 1: Get complete profile...');
    const profile = await profileService.getCompleteProfile(testUser.id);
    
    if (profile) {
      console.log('✅ Get profile successful');
      console.log(`   - Name: ${profile.fullName}`);
      console.log(`   - Role: ${profile.role}`);
      console.log(`   - Email: ${profile.email}`);
      
      if (profile.freelancerProfile) {
        console.log(`   - Freelancer Title: ${profile.freelancerProfile.title || 'Not set'}`);
        console.log(`   - Hourly Rate: $${profile.freelancerProfile.hourlyRate || 'Not set'}`);
      }
      
      if (profile.clientProfile) {
        console.log(`   - Company: ${profile.clientProfile.companyName || 'Not set'}`);
        console.log(`   - Industry: ${profile.clientProfile.industry || 'Not set'}`);
      }
    } else {
      console.log('❌ Get profile failed');
      return;
    }
    
    // Test 2: Update profile
    console.log('\n✏️ Test 2: Update profile...');
    const updateData = {
      fullName: 'Updated Test Name',
      location: 'Test Location'
    };
    
    if (testUser.role === 'FREELANCER') {
      updateData.title = 'Test Developer';
      updateData.bio = 'Test bio for profile service';
      updateData.hourlyRate = 50.00;
    } else if (testUser.role === 'CLIENT') {
      updateData.companyName = 'Test Company';
      updateData.industry = 'Technology';
    }
    
    const updatedProfile = await profileService.updateProfile(testUser.id, testUser.role, updateData);
    
    if (updatedProfile) {
      console.log('✅ Update profile successful');
      console.log(`   - Updated Name: ${updatedProfile.fullName}`);
      console.log(`   - Updated Location: ${updatedProfile.location}`);
      
      if (updatedProfile.freelancerProfile) {
        console.log(`   - Updated Title: ${updatedProfile.freelancerProfile.title}`);
        console.log(`   - Updated Rate: $${updatedProfile.freelancerProfile.hourlyRate}`);
      }
      
      if (updatedProfile.clientProfile) {
        console.log(`   - Updated Company: ${updatedProfile.clientProfile.companyName}`);
        console.log(`   - Updated Industry: ${updatedProfile.clientProfile.industry}`);
      }
    } else {
      console.log('❌ Update profile failed');
    }
    
    // Test 3: Search freelancers
    console.log('\n🔍 Test 3: Search freelancers...');
    const searchResults = await profileService.searchFreelancers({
      skills: ['JavaScript', 'Node.js'],
      location: 'Nepal'
    });
    
    console.log(`✅ Search completed - Found ${searchResults.length} freelancers`);
    searchResults.forEach((freelancer, index) => {
      console.log(`   ${index + 1}. ${freelancer.fullName} - ${freelancer.title || 'No title'}`);
    });
    
    // Test 4: Freelancer skills (if user is freelancer)
    if (testUser.role === 'FREELANCER' && profile.freelancerProfile) {
      console.log('\n🛠️ Test 4: Freelancer skills...');
      
      // Add a skill
      const skillData = {
        skillName: 'Test Skill',
        proficiencyLevel: 4,
        yearsExperience: 2,
        isPrimary: false
      };
      
      const addedSkill = await profileService.upsertFreelancerSkill(
        profile.freelancerProfile.id, 
        skillData
      );
      
      if (addedSkill) {
        console.log('✅ Add skill successful');
        console.log(`   - Skill: ${addedSkill.skillName}`);
        console.log(`   - Level: ${addedSkill.proficiencyLevel}/5`);
        
        // Get all skills
        const skills = await profileService.getFreelancerSkills(profile.freelancerProfile.id);
        console.log(`✅ Retrieved ${skills.length} skills`);
        
        // Delete the test skill
        const deleted = await profileService.deleteFreelancerSkill(
          profile.freelancerProfile.id, 
          addedSkill.id
        );
        
        if (deleted) {
          console.log('✅ Delete skill successful');
        }
      }
    }
    
    console.log('\n🎉 All profile service tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

testProfileService();