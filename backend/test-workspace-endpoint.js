const axios = require('axios');

// Test the workspace endpoint
async function testWorkspaceEndpoint() {
  try {
    const projectId = 'ad1514ac-c073-4ba2-bc44-a0db8af64715';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4N2M0OGRlMS05YjhiLTQxY2QtYTM3OC0xOTc5ZDAyM2U1NmIiLCJlbWFpbCI6ImZyZWVsYW5jZXIxQGdtYWlsLmNvbSIsInJvbGUiOiJGUkVFTEFOQ0VSIiwiaWF0IjoxNzQzMDA1MzI5LCJleHAiOjE3NDMwOTE3Mjl9.Ql_example'; // Replace with actual token
    
    console.log(`Testing GET /api/contracts/workspace/${projectId}`);
    
    const response = await axios.get(
      `http://192.168.100.6:5000/api/contracts/workspace/${projectId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Success!', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testWorkspaceEndpoint();
