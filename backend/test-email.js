#!/usr/bin/env node

/**
 * Email Configuration Test Script
 * Run this script to test your email configuration
 * Usage: node test-email.js your-test-email@gmail.com
 */

const emailService = require('./src/services/emailService');

async function testEmailConfiguration(testEmail) {
  console.log('🧪 Testing Email Configuration...\n');

  try {
    // Test 1: Verify connection
    console.log('1️⃣ Testing email server connection...');
    const connectionTest = await emailService.verifyConnection();
    
    if (!connectionTest) {
      console.log('❌ Connection test failed. Check your email configuration.');
      return;
    }
    console.log('✅ Email server connection successful!\n');

    // Test 2: Send test verification email
    console.log('2️⃣ Sending test verification email...');
    const verificationResult = await emailService.sendVerificationEmail(
      testEmail,
      'Test User',
      'test-verification-token-123'
    );

    if (verificationResult.success) {
      console.log(`✅ Verification email sent successfully to ${testEmail}`);
      console.log(`📧 Message ID: ${verificationResult.messageId}\n`);
    } else {
      console.log(`❌ Failed to send verification email: ${verificationResult.error}\n`);
    }

    // Test 3: Send test password reset email
    console.log('3️⃣ Sending test password reset email...');
    const resetResult = await emailService.sendPasswordResetEmail(
      testEmail,
      'Test User',
      'test-reset-token-456'
    );

    if (resetResult.success) {
      console.log(`✅ Password reset email sent successfully to ${testEmail}`);
      console.log(`📧 Message ID: ${resetResult.messageId}\n`);
    } else {
      console.log(`❌ Failed to send password reset email: ${resetResult.error}\n`);
    }

    // Test 4: Send welcome email
    console.log('4️⃣ Sending test welcome email...');
    const welcomeResult = await emailService.sendWelcomeEmail(
      testEmail,
      'Test User',
      'FREELANCER'
    );

    if (welcomeResult.success) {
      console.log(`✅ Welcome email sent successfully to ${testEmail}`);
      console.log(`📧 Message ID: ${welcomeResult.messageId}\n`);
    } else {
      console.log(`❌ Failed to send welcome email: ${welcomeResult.error}\n`);
    }

    console.log('🎉 Email configuration test completed!');
    console.log('📬 Check your inbox for the test emails.');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

// Get test email from command line argument
const testEmail = process.argv[2];

if (!testEmail) {
  console.log('❌ Please provide a test email address');
  console.log('Usage: node test-email.js your-test-email@gmail.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(testEmail)) {
  console.log('❌ Please provide a valid email address');
  process.exit(1);
}

// Run the test
testEmailConfiguration(testEmail)
  .then(() => {
    console.log('\n✨ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });