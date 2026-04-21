const axios = require('axios');

// Test configuration
const API_BASE = 'http://localhost:5000/api';
let authToken = '';

// Test user credentials (you should have a test user in your database)
const testCredentials = {
  email: 'nightking2734@gmail.com', // Verified freelancer user
  password: 'your_password_here' // You'll need to replace this with the actual password
};

/**
 * Test authentication and get token
 */
async function testAuth() {
  try {
    console.log('🔐 Testing authentication...');
    
    const response = await axios.post(`${API_BASE}/auth/login`, testCredentials);
    
    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Authentication successful');
      console.log('👤 User:', response.data.user.email, '- Role:', response.data.user.role);
      return true;
    } else {
      console.log('❌ Authentication failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test getting profile
 */
async function testGetProfile() {
  try {
    console.log('\n📋 Testing get profile...');
    
    const response = await axios.get(`${API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Get profile successful');
      console.log('📊 Profile data:', JSON.stringify(response.data.profile, null, 2));
      return response.data.profile;
    } else {
      console.log('❌ Get profile failed:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Get profile error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test updating profile
 */
async function testUpdateProfile(currentProfile) {
  try {
    console.log('\n✏️ Testing update profile...');
    
    const updateData = {
      fullName: 'Updated Test User',
      location: 'Updated Location'
    };
    
    // Add role-specific data
    if (currentProfile.role === 'FREELANCER') {
      updateData.title = 'Updated Developer Title';
      updateData.bio = 'Updated bio for testing';
      updateData.hourlyRate = 75.50;
    } else if (currentProfile.role === 'CLIENT') {
      updateData.companyName = 'Updated Company Name';
      updateData.industry = 'Updated Industry';
    }
    
    const response = await axios.patch(`${API_BASE}/profile`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Update profile successful');
      console.log('📊 Updated profile:', JSON.stringify(response.data.profile, null, 2));
      return true;
    } else {
      console.log('❌ Update profile failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Update profile error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test freelancer skills (only for freelancers)
 */
async function testFreelancerSkills(profile) {
  if (profile.role !== 'FREELANCER') {
    console.log('\n⏭️ Skipping skills test (not a freelancer)');
    return;
  }
  
  try {
    console.log('\n🛠️ Testing freelancer skills...');
    
    // Test adding a skill
    const skillData = {
      skillName: 'Node.js',
      proficiencyLevel: 4,
      yearsExperience: 3,
      isPrimary: true
    };
    
    const addResponse = await axios.post(`${API_BASE}/profile/skills`, skillData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (addResponse.data.success) {
      console.log('✅ Add skill successful');
      console.log('🛠️ Added skill:', addResponse.data.skill);
      
      // Test getting skills
      const getResponse = await axios.get(`${API_BASE}/profile/skills`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (getResponse.data.success) {
        console.log('✅ Get skills successful');
        console.log('📋 Skills:', getResponse.data.skills);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.log('❌ Skills test error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test freelancer search
 */
async function testFreelancerSearch() {
  try {
    console.log('\n🔍 Testing freelancer search...');
    
    const searchParams = {
      skills: 'JavaScript,Node.js',
      location: 'Nepal'
    };
    
    const queryString = new URLSearchParams(searchParams).toString();
    const response = await axios.get(`${API_BASE}/profile/search/freelancers?${queryString}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Freelancer search successful');
      console.log(`📊 Found ${response.data.count} freelancers`);
      console.log('👥 Freelancers:', JSON.stringify(response.data.freelancers, null, 2));
      return true;
    } else {
      console.log('❌ Freelancer search failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Freelancer search error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Profile API Tests\n');
  
  // Test authentication
  const authSuccess = await testAuth();
  if (!authSuccess) {
    console.log('\n❌ Tests failed: Could not authenticate');
    return;
  }
  
  // Test get profile
  const profile = await testGetProfile();
  if (!profile) {
    console.log('\n❌ Tests failed: Could not get profile');
    return;
  }
  
  // Test update profile
  const updateSuccess = await testUpdateProfile(profile);
  if (!updateSuccess) {
    console.log('\n❌ Tests failed: Could not update profile');
    return;
  }
  
  // Test freelancer skills (if applicable)
  await testFreelancerSkills(profile);
  
  // Test freelancer search
  await testFreelancerSearch();
  
  console.log('\n🎉 All tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test runner error:', error);
});