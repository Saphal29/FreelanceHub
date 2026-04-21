const axios = require('axios');

const API_URL = 'http://192.168.100.6:5000/api';

async function testAdminDashboard() {
  try {
    // First, login as admin to get the token
    console.log('Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@freelancehub.com',
      password: 'Admin@123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Now test the dashboard endpoint
    console.log('\nTesting admin dashboard endpoint...');
    const dashboardResponse = await axios.get(`${API_URL}/admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Dashboard endpoint successful!');
    console.log('\nDashboard Stats:');
    console.log(JSON.stringify(dashboardResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('Status:', error.response.status);
    }
  }
}

testAdminDashboard();
