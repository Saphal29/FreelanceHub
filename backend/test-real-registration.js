#!/usr/bin/env node

/**
 * Test Real User Registration Flow
 * This creates a real user and generates a real verification token
 */

const axios = require('axios');

async function testRealRegistration() {
  console.log('🧪 Testing Real User Registration Flow...\n');

  const testUser = {
    email: 'chudalsapfu@gmail.com',
    password: 'TestPass123!',
    confirmPassword: 'TestPass123!',
    fullName: 'Test User',
    role: 'FREELANCER'
  };

  try {
    console.log('📝 Registering user:', testUser.email);
    
    const response = await axios.post('http://localhost:5000/api/auth/register', testUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Registration successful!');
      console.log('📧 Verification email should be sent to:', testUser.email);
      console.log('📬 Check your inbox for the verification email with a REAL token');
      console.log('\n🎯 Next steps:');
      console.log('1. Check your email inbox');
      console.log('2. Click the verification link');
      console.log('3. The verification should work now!');
    } else {
      console.log('❌ Registration failed:', response.data.error);
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ Registration failed:', error.response.data.error);
      if (error.response.data.error.includes('already exists')) {
        console.log('\n💡 User already exists. Let me check if they need verification...');
        
        // Try to login to see if user is verified
        try {
          const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: testUser.email,
            password: testUser.password
          });
          
          if (loginResponse.data.success) {
            console.log('✅ User is already verified and can login!');
          }
        } catch (loginError) {
          if (loginError.response && loginError.response.data.error.includes('not verified')) {
            console.log('⚠️ User exists but is not verified.');
            console.log('📧 Check your email for the original verification email.');
          }
        }
      }
    } else {
      console.log('❌ Network error:', error.message);
      console.log('🔧 Make sure your backend server is running on http://localhost:5000');
    }
  }
}

// Run the test
testRealRegistration();