require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./src/utils/dbQueries');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Admin Management Script
 * Allows you to:
 * 1. Create new admin
 * 2. Promote user to admin
 * 3. Change admin password
 * 4. List all admins
 */

async function listAdmins() {
  console.log('\n📋 Listing all admin users...\n');
  
  const result = await query(
    `SELECT id, email, full_name, verified, created_at, last_login
     FROM users
     WHERE role = 'ADMIN'
     ORDER BY created_at DESC`
  );
  
  if (result.rows.length === 0) {
    console.log('⚠️  No admin users found!\n');
    return;
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  result.rows.forEach((admin, index) => {
    console.log(`${index + 1}. ${admin.full_name} (${admin.email})`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Verified: ${admin.verified}`);
    console.log(`   Created: ${admin.created_at}`);
    console.log(`   Last Login: ${admin.last_login || 'Never'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });
  console.log(`\nTotal Admins: ${result.rows.length}\n`);
}

async function createAdmin() {
  console.log('\n🔧 Create New Admin User\n');
  
  const email = await askQuestion('Enter email: ');
  const password = await askQuestion('Enter password: ');
  const fullName = await askQuestion('Enter full name: ');
  
  // Check if user exists
  const existing = await query('SELECT id, email, role FROM users WHERE email = $1', [email]);
  
  if (existing.rows.length > 0) {
    console.log(`\n⚠️  User with email ${email} already exists!`);
    console.log(`   Current role: ${existing.rows[0].role}`);
    
    if (existing.rows[0].role === 'ADMIN') {
      console.log('   This user is already an admin.\n');
      return;
    }
    
    const promote = await askQuestion('\nPromote this user to admin? (yes/no): ');
    if (promote.toLowerCase() === 'yes' || promote.toLowerCase() === 'y') {
      await promoteToAdmin(email);
    }
    return;
  }
  
  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  // Create admin
  const result = await query(
    `INSERT INTO users (email, password_hash, role, full_name, verified)
     VALUES ($1, $2, 'ADMIN', $3, true)
     RETURNING id, email, role, full_name`,
    [email, passwordHash, fullName]
  );
  
  const admin = result.rows[0];
  
  console.log('\n✅ Admin created successfully!');
  console.log('   Email:', admin.email);
  console.log('   Name:', admin.full_name);
  console.log('   ID:', admin.id);
  console.log('   Password:', password);
  console.log('\n⚠️  Save these credentials securely!\n');
}

async function promoteToAdmin(emailParam) {
  console.log('\n⬆️  Promote User to Admin\n');
  
  const email = emailParam || await askQuestion('Enter user email: ');
  
  // Check if user exists
  const existing = await query(
    'SELECT id, email, role, full_name FROM users WHERE email = $1',
    [email]
  );
  
  if (existing.rows.length === 0) {
    console.log(`\n❌ User with email ${email} not found!\n`);
    return;
  }
  
  const user = existing.rows[0];
  
  if (user.role === 'ADMIN') {
    console.log(`\n⚠️  ${user.full_name} is already an admin!\n`);
    return;
  }
  
  console.log(`Found user: ${user.full_name} (${user.email})`);
  console.log(`Current role: ${user.role}`);
  
  if (!emailParam) {
    const confirm = await askQuestion('\nConfirm promotion to ADMIN? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('\n❌ Promotion cancelled.\n');
      return;
    }
  }
  
  // Promote to admin
  await query(
    `UPDATE users SET role = 'ADMIN', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [user.id]
  );
  
  console.log(`\n✅ ${user.full_name} has been promoted to ADMIN!\n`);
}

async function changePassword() {
  console.log('\n🔑 Change Admin Password\n');
  
  const email = await askQuestion('Enter admin email: ');
  const newPassword = await askQuestion('Enter new password: ');
  
  // Check if admin exists
  const existing = await query(
    'SELECT id, email, role, full_name FROM users WHERE email = $1',
    [email]
  );
  
  if (existing.rows.length === 0) {
    console.log(`\n❌ User with email ${email} not found!\n`);
    return;
  }
  
  const user = existing.rows[0];
  
  if (user.role !== 'ADMIN') {
    console.log(`\n⚠️  ${user.full_name} is not an admin (current role: ${user.role})\n`);
    return;
  }
  
  // Hash new password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);
  
  // Update password
  await query(
    `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [passwordHash, user.id]
  );
  
  console.log(`\n✅ Password changed successfully for ${user.full_name}!`);
  console.log('   New password:', newPassword);
  console.log('\n⚠️  Save this password securely!\n');
}

async function demoteAdmin() {
  console.log('\n⬇️  Demote Admin to User\n');
  
  const email = await askQuestion('Enter admin email: ');
  const newRole = await askQuestion('New role (FREELANCER/CLIENT): ');
  
  if (newRole !== 'FREELANCER' && newRole !== 'CLIENT') {
    console.log('\n❌ Invalid role! Must be FREELANCER or CLIENT.\n');
    return;
  }
  
  // Check if admin exists
  const existing = await query(
    'SELECT id, email, role, full_name FROM users WHERE email = $1',
    [email]
  );
  
  if (existing.rows.length === 0) {
    console.log(`\n❌ User with email ${email} not found!\n`);
    return;
  }
  
  const user = existing.rows[0];
  
  if (user.role !== 'ADMIN') {
    console.log(`\n⚠️  ${user.full_name} is not an admin (current role: ${user.role})\n`);
    return;
  }
  
  const confirm = await askQuestion(`\nConfirm demotion to ${newRole}? (yes/no): `);
  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    console.log('\n❌ Demotion cancelled.\n');
    return;
  }
  
  // Demote admin
  await query(
    `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [newRole, user.id]
  );
  
  console.log(`\n✅ ${user.full_name} has been demoted to ${newRole}!\n`);
}

async function main() {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('       ADMIN MANAGEMENT TOOL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('What would you like to do?\n');
    console.log('1. List all admins');
    console.log('2. Create new admin');
    console.log('3. Promote user to admin');
    console.log('4. Change admin password');
    console.log('5. Demote admin to user');
    console.log('6. Exit\n');
    
    const choice = await askQuestion('Enter your choice (1-6): ');
    
    switch (choice) {
      case '1':
        await listAdmins();
        break;
      case '2':
        await createAdmin();
        break;
      case '3':
        await promoteToAdmin();
        break;
      case '4':
        await changePassword();
        break;
      case '5':
        await demoteAdmin();
        break;
      case '6':
        console.log('\n👋 Goodbye!\n');
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('\n❌ Invalid choice!\n');
    }
    
    // Ask if user wants to do something else
    const again = await askQuestion('\nDo something else? (yes/no): ');
    if (again.toLowerCase() === 'yes' || again.toLowerCase() === 'y') {
      rl.close();
      // Restart the script
      require('child_process').spawn(process.argv[0], process.argv.slice(1), {
        stdio: 'inherit'
      });
    } else {
      console.log('\n👋 Goodbye!\n');
      rl.close();
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    rl.close();
    process.exit(1);
  }
}

// Run the script
main();
