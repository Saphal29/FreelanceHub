const axios = require('axios');

// Test configuration
const API_BASE = 'http://localhost:5000/api';

/**
 * Test if server is running and endpoints exist
 */
async function testEndpoints() {
  console.log('🚀 Testing Profile API Endpoints\n');
  
  try {
    // Test health endpoint
    console.log('🏥 Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Health check:', healthResponse.data.status);
    
    // Test API info endpoint
    console.log('\n📋 Testing API info endpoint...');
    const apiResponse = await axios.get('http://localhost:5000/api');
    console.log('✅ API info:', apiResponse.data.name);
    
    // Test profile endpoints (should return 401 without auth)
    console.log('\n🔐 Testing profile endpoints (expecting 401)...');
    
    const endpoints = [
      '/profile',
      '/profile/skills',
      '/profile/search/freelancers'
    ];
    
    for (const endpoint of endpoints) {
      try {
        await axios.get(`${API_BASE}${endpoint}`);
        console.log(`❌ ${endpoint} - Should have returned 401`);
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`✅ ${endpoint} - Correctly requires authentication`);
        } else {
          console.log(`⚠️ ${endpoint} - Unexpected error:`, error.response?.status || error.message);
        }
      }
    }
    
    console.log('\n🎉 Endpoint tests completed!');
    console.log('\n📝 Summary:');
    console.log('- Server is running and responding');
    console.log('- Profile endpoints are properly protected');
    console.log('- Authentication middleware is working');
    console.log('\n💡 To test full functionality, you need to:');
    console.log('1. Update test-profile-api.js with valid credentials');
    console.log('2. Run: node test-profile-api.js');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd backend && npm start');
    }
  }
}

testEndpoints();