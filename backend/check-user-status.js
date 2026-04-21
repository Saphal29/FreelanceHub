#!/usr/bin/env node

/**
 * Check User Verification Status
 */

const axios = require('axios');

async function checkUserStatus() {
  console.log('🔍 Checking user verification status...\n');

  const testUser = {
    email: 'chudalsapfu@gmail.com',
    password: 'TestPass123!'
  };

  try {
    console.log('🔐 Attempting login for:', testUser.email);
    
    const response = await axios.post('http://localhost:5000/api/auth/login', testUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ User is VERIFIED and can login successfully!');
      console.log('👤 User data:', {
        email: response.data.data.user.email,
        name: response.data.data.user.fullName,
        role: response.data.data.user.role,
        verified: response.data.data.user.verified
      });
      console.log('\n🎉 Your email system is working perfectly!');
    }

  } catch (error) {
    if (error.response) {
      const errorMsg = error.response.data.error;
      console.log('❌ Login failed:', errorMsg);
      
      if (errorMsg.includes('not verified')) {
        console.log('\n📧 User exists but is NOT VERIFIED');
        console.log('🔧 This means:');
        console.log('1. The user was created successfully');
        console.log('2. A verification email was sent');
        console.log('3. The verification link needs to be clicked');
        console.log('\n💡 Solutions:');
        console.log('1. Check your email inbox for verification email');
        console.log('2. Click the verification link in the email');
        console.log('3. If no email, I can send a new verification email');
      } else if (errorMsg.includes('Invalid credentials')) {
        console.log('\n🔑 Wrong password. User might exist with different password.');
      }
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

// Run the check
checkUserStatus();