const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://192.168.100.6:5000/api';

// Test credentials
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
    console.log('✅ Login successful\n');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testFileUpload() {
  try {
    console.log('📤 Testing file upload...');
    
    // Create a test text file
    const testFilePath = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for upload testing.');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('category', 'other');
    formData.append('isPublic', 'false');
    
    const response = await axios.post(`${API_URL}/files/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ File uploaded successfully!');
    console.log('File details:', JSON.stringify(response.data, null, 2));
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    return response.data.file.id;
  } catch (error) {
    console.error('❌ File upload failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGetFiles() {
  try {
    console.log('\n📁 Testing get files...');
    const response = await axios.get(`${API_URL}/files`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Files retrieved successfully!');
    console.log(`Total files: ${response.data.files?.length || 0}`);
    console.log(`Total count: ${response.data.pagination?.total || 0}`);
    
    return true;
  } catch (error) {
    console.error('❌ Get files failed:', error.response?.data || error.message);
    return false;
  }
}

async function testStorageUsage() {
  try {
    console.log('\n📊 Testing storage usage...');
    const response = await axios.get(`${API_URL}/files/storage-usage`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Storage usage retrieved successfully!');
    console.log(JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ Storage usage failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting File Upload Tests\n');
  console.log('API URL:', API_URL);
  console.log('=====================================\n');

  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  await testFileUpload();
  await testGetFiles();
  await testStorageUsage();

  console.log('\n=====================================');
  console.log('✅ All tests completed!');
}

runTests();
