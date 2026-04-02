/**
 * Email Service Test Script
 * Run this to test your Google Apps Script email configuration
 * 
 * Usage: node test-email.js your-email@example.com
 */

require('dotenv').config();
const emailService = require('./src/services/emailService');

const testEmail = async (recipientEmail) => {
  console.log('🧪 Testing Email Service Configuration...\n');
  
  console.log('Configuration:');
  console.log(`  Service: ${process.env.EMAIL_SERVICE}`);
  console.log(`  From: ${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`);
  console.log(`  To: ${recipientEmail}`);
  
  if (process.env.EMAIL_SERVICE === 'google-script') {
    console.log(`  Google Script URL: ${process.env.GOOGLE_SCRIPT_URL}`);
  }
  
  console.log('\n📧 Sending test verification email...');
  
  try {
    // Test verification email
    const result = await emailService.sendVerificationEmail(
      recipientEmail,
      'Test User',
      'test-token-12345'
    );
    
    if (result.success) {
      console.log('✅ SUCCESS! Verification email sent successfully');
      console.log(`   Message ID: ${result.messageId}`);
      console.log('\n📬 Check your inbox at:', recipientEmail);
      console.log('   (Check spam folder if not in inbox)');
    } else {
      console.error('❌ FAILED! Email sending failed');
      console.error('   Error:', result.error);
    }
    
    // Test password reset email
    console.log('\n📧 Sending test password reset email...');
    const resetResult = await emailService.sendPasswordResetEmail(
      recipientEmail,
      'Test User',
      'reset-token-67890'
    );
    
    if (resetResult.success) {
      console.log('✅ SUCCESS! Password reset email sent successfully');
      console.log(`   Message ID: ${resetResult.messageId}`);
    } else {
      console.error('❌ FAILED! Password reset email failed');
      console.error('   Error:', resetResult.error);
    }
    
    console.log('\n✨ Email test completed!');
    console.log('\nNext steps:');
    console.log('1. Check your email inbox');
    console.log('2. If emails arrived, your setup is working!');
    console.log('3. If not, check the error messages above');
    console.log('4. Verify Google Apps Script deployment and permissions');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your .env file has GOOGLE_SCRIPT_URL set');
    console.error('2. Verify the Google Apps Script is deployed correctly');
    console.error('3. Make sure you authorized the script in Google Apps Script');
    console.error('4. Check Google Apps Script execution logs for errors');
  }
  
  process.exit(0);
};

// Get recipient email from command line argument
const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.error('❌ Error: Please provide a recipient email address');
  console.log('\nUsage: node test-email.js your-email@example.com');
  console.log('Example: node test-email.js saphalchudal29@gmail.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(recipientEmail)) {
  console.error('❌ Error: Invalid email address format');
  process.exit(1);
}

// Run the test
testEmail(recipientEmail);
