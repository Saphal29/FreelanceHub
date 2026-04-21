require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./src/utils/dbQueries');

/**
 * Create initial admin user
 * This script creates the first admin account for the platform
 */

const ADMIN_DATA = {
  email: 'admin@freelancehub.com',
  password: 'Admin@123', // Change this after first login!
  fullName: 'System Administrator',
  role: 'ADMIN'
};

async function createAdmin() {
  try {
    console.log('🔧 Creating Admin User...\n');
    
    // Check if admin already exists
    console.log('1. Checking if admin already exists...');
    const existingAdmin = await query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [ADMIN_DATA.email]
    );
    
    if (existingAdmin.rows.length > 0) {
      const admin = existingAdmin.rows[0];
      console.log('⚠️  Admin user already exists!');
      console.log('   Email:', admin.email);
      console.log('   Role:', admin.role);
      console.log('   ID:', admin.id);
      console.log('\n✅ No action needed.');
      process.exit(0);
    }
    
    console.log('✅ No existing admin found. Creating new admin...\n');
    
    // Hash password
    console.log('2. Hashing password...');
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(ADMIN_DATA.password, saltRounds);
    console.log('✅ Password hashed successfully\n');
    
    // Create admin user
    console.log('3. Inserting admin user into database...');
    const result = await query(
      `INSERT INTO users (
        email, 
        password_hash, 
        role, 
        full_name, 
        verified,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, email, role, full_name, verified, created_at`,
      [
        ADMIN_DATA.email,
        passwordHash,
        ADMIN_DATA.role,
        ADMIN_DATA.fullName,
        true // Admin is pre-verified
      ]
    );
    
    const admin = result.rows[0];
    
    console.log('✅ Admin user created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 ADMIN CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    ', admin.email);
    console.log('Password: ', ADMIN_DATA.password);
    console.log('Role:     ', admin.role);
    console.log('Name:     ', admin.full_name);
    console.log('Verified: ', admin.verified);
    console.log('ID:       ', admin.id);
    console.log('Created:  ', admin.created_at);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('   1. Change the password after first login!');
    console.log('   2. Use a strong, unique password');
    console.log('   3. Enable 2FA if available');
    console.log('   4. Keep credentials secure\n');
    
    console.log('🚀 You can now login at:');
    console.log('   https://192.168.46.49:3000/login\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the script
createAdmin();
