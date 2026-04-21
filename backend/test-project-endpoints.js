const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test credentials (use existing user from your database)
const CLIENT_CREDENTIALS = {
  email: 'np05cp4a230205@iic.edu.np',
  password: 'password123' // Update this if needed
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in as client...');
    const response = await axios.post(`${API_URL}/auth/login`, CLIENT_CREDENTIALS);
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      console.log(`   User: ${response.data.user.fullName} (${response.data.user.role})`);
      return true;
    } else {
      console.log('❌ Login failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testGetMyProjects() {
  try {
    console.log('\n📋 Testing GET /api/projects/my/projects...');
    const response = await axios.get(`${API_URL}/projects/my/projects`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ My projects retrieved successfully');
      console.log(`   Total projects: ${response.data.pagination.total}`);
      console.log(`   Projects on this page: ${response.data.projects.length}`);
      
      if (response.data.projects.length > 0) {
        console.log('\n   Sample project:');
        const project = response.data.projects[0];
        console.log(`   - ID: ${project.id}`);
        console.log(`   - Title: ${project.title}`);
        console.log(`   - Status: ${project.status}`);
        console.log(`   - Budget: $${project.budget.min} - $${project.budget.max}`);
      }
    } else {
      console.log('❌ Failed:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.error || error.message);
    if (error.response?.status === 500) {
      console.log('   Server error details:', error.response.data);
    }
  }
}

async function testGetMyStats() {
  try {
    console.log('\n📊 Testing GET /api/projects/my/stats...');
    const response = await axios.get(`${API_URL}/projects/my/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Project stats retrieved successfully');
      console.log('   Stats:', response.data.stats);
    } else {
      console.log('❌ Failed:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.error || error.message);
  }
}

async function testGetProjects() {
  try {
    console.log('\n🔍 Testing GET /api/projects (public)...');
    const response = await axios.get(`${API_URL}/projects?status=active&limit=5`);
    
    if (response.data.success) {
      console.log('✅ Public projects retrieved successfully');
      console.log(`   Total active projects: ${response.data.pagination.total}`);
      console.log(`   Projects on this page: ${response.data.projects.length}`);
    } else {
      console.log('❌ Failed:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.error || error.message);
  }
}

async function runTests() {
  console.log('🚀 Testing Project API Endpoints\n');
  
  // Test public endpoint first
  await testGetProjects();
  
  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot continue tests without authentication');
    return;
  }
  
  // Test protected endpoints
  await testGetMyProjects();
  await testGetMyStats();
  
  console.log('\n🎉 All tests completed!');
}

runTests();
