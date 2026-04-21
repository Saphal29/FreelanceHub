const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testRouting() {
  console.log('🧪 Testing Project Route Order Fix\n');
  
  // Test 1: Public projects endpoint
  try {
    console.log('1️⃣ Testing GET /api/projects (public)...');
    const response = await axios.get(`${API_URL}/projects`);
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   ✅ Success: ${response.data.success}`);
    console.log(`   ✅ Total projects: ${response.data.pagination.total}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
  }
  
  // Test 2: Categories endpoint
  try {
    console.log('\n2️⃣ Testing GET /api/projects/categories...');
    const response = await axios.get(`${API_URL}/projects/categories`);
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   ✅ Success: ${response.data.success}`);
    console.log(`   ✅ Categories count: ${response.data.categories.length}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
  }
  
  // Test 3: My projects endpoint (should require auth)
  try {
    console.log('\n3️⃣ Testing GET /api/projects/my/projects (no auth)...');
    const response = await axios.get(`${API_URL}/projects/my/projects`);
    console.log(`   ❌ UNEXPECTED: Should have required authentication but got ${response.status}`);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`   ✅ Correctly requires authentication (401)`);
    } else if (error.response?.status === 500) {
      console.log(`   ❌ Server error (500) - This was the original bug!`);
      console.log(`   ❌ Error: ${error.response?.data?.error}`);
    } else {
      console.log(`   ❌ Unexpected error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
    }
  }
  
  // Test 4: My stats endpoint (should require auth)
  try {
    console.log('\n4️⃣ Testing GET /api/projects/my/stats (no auth)...');
    const response = await axios.get(`${API_URL}/projects/my/stats`);
    console.log(`   ❌ UNEXPECTED: Should have required authentication but got ${response.status}`);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`   ✅ Correctly requires authentication (401)`);
    } else if (error.response?.status === 500) {
      console.log(`   ❌ Server error (500) - Routing issue!`);
      console.log(`   ❌ Error: ${error.response?.data?.error}`);
    } else {
      console.log(`   ❌ Unexpected error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
    }
  }
  
  // Test 5: Get project by ID (should work without auth)
  try {
    console.log('\n5️⃣ Testing GET /api/projects/:id (public)...');
    const response = await axios.get(`${API_URL}/projects/6d2616a3-2b55-4018-983b-448352d7321e`);
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   ✅ Success: ${response.data.success}`);
    console.log(`   ✅ Project title: ${response.data.project.title}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
  }
  
  console.log('\n🎉 Routing tests completed!');
  console.log('\n📝 Summary:');
  console.log('   - If /my/projects returns 401: ✅ Routing is fixed!');
  console.log('   - If /my/projects returns 500: ❌ Routing still broken (Express matching /my as /:id)');
}

testRouting();
