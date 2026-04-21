const axios = require('axios');
require('dotenv').config();

const API_URL = (process.env.API_URL || 'http://192.168.100.6:5000') + '/api';

// Test credentials
const testUser = {
  email: 'admin@freelancehub.com',
  password: 'Admin@123'
};

let authToken = '';
let testFileId = '';

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

async function getFiles() {
  try {
    console.log('📁 Getting files...');
    const response = await axios.get(`${API_URL}/files`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.files && response.data.files.length > 0) {
      testFileId = response.data.files[0].id;
      console.log('✅ Found file:', response.data.files[0].originalName);
      console.log('   File ID:', testFileId);
      return true;
    } else {
      console.log('❌ No files found');
      return false;
    }
  } catch (error) {
    console.error('❌ Get files failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGenerateDownloadLink() {
  try {
    console.log('\n🔗 Generating download link...');
    const response = await axios.post(
      `${API_URL}/files/${testFileId}/link`,
      { expiresIn: 1 },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Download link generated!');
    console.log('   URL:', response.data.downloadUrl);
    console.log('   Expires:', response.data.expiresAt);
    
    return response.data.downloadUrl;
  } catch (error) {
    console.error('❌ Generate link failed:', error.response?.data || error.message);
    return null;
  }
}

async function testDownloadWithToken(downloadUrl) {
  try {
    console.log('\n⬇️  Testing download with token...');
    const response = await axios.get(downloadUrl, {
      responseType: 'arraybuffer'
    });
    
    console.log('✅ Download successful!');
    console.log('   Content-Type:', response.headers['content-type']);
    console.log('   Content-Length:', response.headers['content-length']);
    return true;
  } catch (error) {
    console.error('❌ Download failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Download Tests\n');
  console.log('API URL:', API_URL);
  console.log('=====================================\n');

  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  const filesFound = await getFiles();
  if (!filesFound) {
    console.log('\n❌ Cannot test download without files');
    return;
  }

  const downloadUrl = await testGenerateDownloadLink();
  if (!downloadUrl) {
    console.log('\n❌ Cannot test download without link');
    return;
  }

  await testDownloadWithToken(downloadUrl);

  console.log('\n=====================================');
  console.log('✅ Download tests completed!');
}

runTests();
