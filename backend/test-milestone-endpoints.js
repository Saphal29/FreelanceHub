const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test credentials - replace with actual test user
const TEST_CLIENT = {
  email: 'client@test.com',
  password: 'password123'
};

let authToken = '';
let testProjectId = '';
let testMilestoneId = '';

async function login() {
  try {
    console.log('🔐 Logging in as client...');
    const response = await axios.post(`${API_URL}/auth/login`, TEST_CLIENT);
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.error('❌ Login failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return false;
  }
}

async function getFirstProject() {
  try {
    console.log('\n📋 Getting first project...');
    const response = await axios.get(`${API_URL}/projects/my/projects`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success && response.data.projects.length > 0) {
      testProjectId = response.data.projects[0].id;
      console.log('✅ Found project:', testProjectId);
      return true;
    } else {
      console.error('❌ No projects found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error getting projects:', error.response?.data || error.message);
    return false;
  }
}

async function testCreateMilestone() {
  try {
    console.log('\n➕ Creating milestone...');
    const milestoneData = {
      title: 'Test Milestone - Initial Design',
      description: 'Complete the initial design mockups and wireframes',
      amount: 1500.00,
      dueDate: '2026-04-15',
      status: 'pending'
    };
    
    const response = await axios.post(
      `${API_URL}/projects/${testProjectId}/milestones`,
      milestoneData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success) {
      testMilestoneId = response.data.milestone.id;
      console.log('✅ Milestone created:', testMilestoneId);
      console.log('   Title:', response.data.milestone.title);
      console.log('   Amount: $', response.data.milestone.amount);
      console.log('   Status:', response.data.milestone.status);
      return true;
    } else {
      console.error('❌ Failed to create milestone:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error creating milestone:', error.response?.data || error.message);
    return false;
  }
}

async function testGetMilestones() {
  try {
    console.log('\n📋 Getting milestones...');
    const response = await axios.get(
      `${API_URL}/projects/${testProjectId}/milestones`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success) {
      console.log('✅ Retrieved', response.data.milestones.length, 'milestone(s)');
      response.data.milestones.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.title} - $${m.amount} (${m.status})`);
      });
      return true;
    } else {
      console.error('❌ Failed to get milestones:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error getting milestones:', error.response?.data || error.message);
    return false;
  }
}

async function testUpdateMilestone() {
  try {
    console.log('\n✏️  Updating milestone...');
    const updateData = {
      status: 'in_progress',
      amount: 1750.00
    };
    
    const response = await axios.put(
      `${API_URL}/projects/milestones/${testMilestoneId}`,
      updateData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success) {
      console.log('✅ Milestone updated');
      console.log('   New status:', response.data.milestone.status);
      console.log('   New amount: $', response.data.milestone.amount);
      return true;
    } else {
      console.error('❌ Failed to update milestone:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating milestone:', error.response?.data || error.message);
    return false;
  }
}

async function testDeleteMilestone() {
  try {
    console.log('\n🗑️  Deleting milestone...');
    const response = await axios.delete(
      `${API_URL}/projects/milestones/${testMilestoneId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success) {
      console.log('✅ Milestone deleted successfully');
      return true;
    } else {
      console.error('❌ Failed to delete milestone:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting milestone:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Milestone API Tests\n');
  console.log('='.repeat(50));
  
  // Login
  if (!await login()) {
    console.log('\n❌ Tests aborted - login failed');
    return;
  }
  
  // Get a project to test with
  if (!await getFirstProject()) {
    console.log('\n❌ Tests aborted - no projects found');
    console.log('💡 Create a project first using the post-project page');
    return;
  }
  
  // Run milestone tests
  await testCreateMilestone();
  await testGetMilestones();
  await testUpdateMilestone();
  await testGetMilestones(); // Check updated values
  await testDeleteMilestone();
  await testGetMilestones(); // Verify deletion
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ All milestone tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
