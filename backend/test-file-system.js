const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://192.168.100.6:5000/api';

// Test credentials - using admin account
const testUser = {
  email: 'admin@freelancehub.com',
  password: 'Admin@123'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${API_URL}/auth/login`, testUser);
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testStorageUsage() {
  try {
    console.log('\n📊 Testing storage usage endpoint...');
    const response = await axios.get(`${API_URL}/files/storage-usage`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Storage usage retrieved successfully:');
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Storage usage failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetFiles() {
  try {
    console.log('\n📁 Testing get files endpoint...');
    const response = await axios.get(`${API_URL}/files`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Files retrieved successfully:');
    console.log(`Total files: ${response.data.files?.length || 0}`);
    if (response.data.files?.length > 0) {
      console.log('First file:', response.data.files[0]);
    }
    return true;
  } catch (error) {
    console.error('❌ Get files failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting File System Tests\n');
  console.log('API URL:', API_URL);
  console.log('=====================================\n');

  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  // Test storage usage
  await testStorageUsage();

  // Test get files
  await testGetFiles();

  console.log('\n=====================================');
  console.log('✅ File system tests completed!');
}

runTests();
