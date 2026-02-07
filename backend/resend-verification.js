#!/usr/bin/env node

/**
 * Resend Verification Email
 * This will generate a new real verification token and send it
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const emailService = require('./src/services/emailService');
const config = require('./src/config/environment');

// Database connection
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
});

async function resendVerificationEmail() {
  console.log('📧 Resending verification email...\n');

  const userEmail = 'chudalsapfu@gmail.com';

  try {
    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Update user with new verification token
    const updateQuery = `
      UPDATE users 
      SET verification_token = $1 
      WHERE email = $2 AND verified = false
      RETURNING id, full_name, email
    `;
    
    const result = await pool.query(updateQuery, [verificationToken, userEmail]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found or already verified');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ Generated new verification token for:', user.email);
    
    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(
      user.email,
      user.full_name,
      verificationToken
    );
    
    if (emailResult.success) {
      console.log('✅ NEW verification email sent successfully!');
      console.log('📧 Message ID:', emailResult.messageId);
      console.log('\n🎯 Next steps:');
      console.log('1. Check your email inbox');
      console.log('2. Look for the NEW email from: FreelanceHub Pro <noreply@freelancehubpro.com>');
      console.log('3. Click the verification link');
      console.log('4. This time it should work!');
      
      console.log('\n🔗 Verification URL will be:');
      console.log(`http://localhost:3000/verify-email?token=${verificationToken}`);
    } else {
      console.log('❌ Failed to send verification email:', emailResult.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the resend
resendVerificationEmail();