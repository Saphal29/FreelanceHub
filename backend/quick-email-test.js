#!/usr/bin/env node

/**
 * Quick Email Test - Test your noreply email setup
 * Usage: node quick-email-test.js
 */

const emailService = require('./src/services/emailService');

async function quickEmailTest() {
  console.log('🧪 Testing FreelanceHub Pro Email Setup...\n');

  // Get email from user input
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter your email address to test: ', async (testEmail) => {
    try {
      console.log(`\n📧 Sending test email to: ${testEmail}`);
      console.log('📤 From: FreelanceHub Pro <noreply@freelancehubpro.com>\n');

      // Test verification email
      const result = await emailService.sendVerificationEmail(
        testEmail,
        'Test User',
        'test-token-123'
      );

      if (result.success) {
        console.log('✅ SUCCESS! Email sent successfully!');
        console.log(`📧 Message ID: ${result.messageId}`);
        console.log('\n🎉 Check your inbox for the verification email!');
        console.log('📬 Look for email from: FreelanceHub Pro <noreply@freelancehubpro.com>');
      } else {
        console.log('❌ FAILED to send email');
        console.log(`Error: ${result.error}`);
      }

    } catch (error) {
      console.error('💥 Test failed:', error.message);
    }

    rl.close();
  });
}

// Run the test
quickEmailTest();