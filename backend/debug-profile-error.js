const axios = require('axios');

// Test configuration
const API_BASE = 'http://localhost:5000/api';

/**
 * Test profile update with detailed error logging
 */
async function debugProfileUpdate() {
  try {
    console.log('🔍 Debugging Profile Update Error...\n');
    
    // First, let's test with a simple login to get a token
    console.log('🔐 Step 1: Testing authentication...');
    
    // You'll need to replace these with valid credentials
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'nightking2734@gmail.com', // Replace with valid email
      password: 'your_password_here' // Replace with valid password
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data);
      console.log('\n💡 Please update the credentials in this file and try again');
      return;
    }
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('✅ Login successful for:', user.email, '- Role:', user.role);
    
    // Test getting profile first
    console.log('\n📋 Step 2: Testing get profile...');
    
    try {
      const getResponse = await axios.get(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Get profile successful');
      console.log('Current profile data:', JSON.stringify(getResponse.data.profile, null, 2));
    } catch (error) {
      console.log('❌ Get profile failed:', error.response?.data || error.message);
      return;
    }
    
    // Now test updating profile with minimal data
    console.log('\n✏️ Step 3: Testing profile update...');
    
    const updateData = {
      fullName: 'Test Update Name'
    };
    
    // Add role-specific data
    if (user.role === 'FREELANCER') {
      updateData.title = 'Test Developer Title';
    } else if (user.role === 'CLIENT') {
      updateData.companyName = 'Test Company Name';
    }
    
    console.log('Sending update data:', JSON.stringify(updateData, null, 2));
    
    try {
      const updateResponse = await axios.put(`${API_BASE}/profile`, updateData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Profile update successful!');
      console.log('Response:', JSON.stringify(updateResponse.data, null, 2));
      
    } catch (error) {
      console.log('❌ Profile update failed!');
      console.log('Status:', error.response?.status);
      console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
      console.log('Full error:', error.message);
      
      // Check if it's a validation error
      if (error.response?.status === 400) {
        console.log('\n🔍 This appears to be a validation error');
      } else if (error.response?.status === 500) {
        console.log('\n🔍 This is a server error - check backend logs');
        console.log('💡 The backend server might have detailed error logs');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug test error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd backend && npm start');
    }
  }
}

debugProfileUpdate();