# Admin User Setup Guide

This guide explains how to create and manage admin users for the FreelanceHub platform.

---

## Quick Start: Create First Admin

### Option 1: Automated Script (Recommended)

Run the automated admin creation script:

```bash
cd backend
node create-admin.js
```

This will create an admin with:
- **Email:** `admin@freelancehub.com`
- **Password:** `Admin@123`
- **Role:** ADMIN
- **Status:** Verified

**⚠️ IMPORTANT:** Change the password after first login!

---

### Option 2: Interactive Management Tool

For more control, use the interactive admin management tool:

```bash
cd backend
node manage-admin.js
```

This tool allows you to:
1. List all admins
2. Create new admin
3. Promote existing user to admin
4. Change admin password
5. Demote admin to user

---

## Admin Management Commands

### Create Admin (Automated)

```bash
node create-admin.js
```

Creates admin with default credentials. Safe to run multiple times (won't create duplicates).

### Manage Admins (Interactive)

```bash
node manage-admin.js
```

Interactive menu for all admin operations.

---

## Manual Database Method

If you prefer to create admin directly in the database:

### Step 1: Hash Password

First, hash your password using Node.js:

```javascript
// In Node.js console or create a temp script
const bcrypt = require('bcryptjs');
const password = 'YourSecurePassword123!';
const hash = bcrypt.hashSync(password, 12);
console.log(hash);
```

### Step 2: Insert Admin User

Run this SQL in pgAdmin:

```sql
INSERT INTO users (
    email,
    password_hash,
    role,
    full_name,
    verified,
    created_at,
    updated_at
) VALUES (
    'admin@yourdomain.com',
    'YOUR_HASHED_PASSWORD_HERE',
    'ADMIN',
    'System Administrator',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
```

---

## Common Operations

### List All Admins

```bash
node manage-admin.js
# Choose option 1
```

Or via SQL:
```sql
SELECT id, email, full_name, role, verified, created_at, last_login
FROM users
WHERE role = 'ADMIN'
ORDER BY created_at DESC;
```

### Promote Existing User to Admin

```bash
node manage-admin.js
# Choose option 3
# Enter user's email
```

Or via SQL:
```sql
UPDATE users
SET role = 'ADMIN', updated_at = CURRENT_TIMESTAMP
WHERE email = 'user@example.com';
```

### Change Admin Password

```bash
node manage-admin.js
# Choose option 4
# Enter admin email and new password
```

### Demote Admin to Regular User

```bash
node manage-admin.js
# Choose option 5
# Enter admin email and new role (FREELANCER or CLIENT)
```

Or via SQL:
```sql
UPDATE users
SET role = 'FREELANCER', updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@example.com';
```

---

## Security Best Practices

### 1. Strong Passwords
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Don't use common words or patterns

### 2. Change Default Password
```bash
node manage-admin.js
# Choose option 4 to change password
```

### 3. Limit Admin Accounts
- Only create admins when necessary
- Review admin list regularly
- Remove unused admin accounts

### 4. Monitor Admin Activity
```sql
-- Check admin login activity
SELECT email, full_name, last_login, created_at
FROM users
WHERE role = 'ADMIN'
ORDER BY last_login DESC;
```

### 5. Use Different Emails
- Don't use the default `admin@freelancehub.com` in production
- Use your actual domain email

---

## Troubleshooting

### "Admin already exists"

If you see this message, an admin is already created. To reset:

```bash
node manage-admin.js
# Choose option 4 to change password
```

### "Cannot connect to database"

Check your `.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=freelancehub_db
DB_USER=postgres
DB_PASSWORD=your_password
```

### "bcrypt error"

Make sure bcryptjs is installed:
```bash
npm install bcryptjs
```

### Forgot Admin Password

Reset it using the management tool:
```bash
node manage-admin.js
# Choose option 4
# Enter admin email and new password
```

---

## Production Deployment

### Before Deploying:

1. **Create production admin:**
   ```bash
   node manage-admin.js
   # Create admin with your production email
   ```

2. **Use strong password:**
   - Generate random password
   - Store in password manager
   - Don't use default password

3. **Remove default admin:**
   ```sql
   DELETE FROM users WHERE email = 'admin@freelancehub.com';
   ```

4. **Verify admin access:**
   - Login to production site
   - Test admin panel access
   - Verify all admin features work

### After Deployment:

1. **Monitor admin logins:**
   ```sql
   SELECT email, last_login, created_at
   FROM users
   WHERE role = 'ADMIN';
   ```

2. **Regular security audits:**
   - Review admin accounts monthly
   - Check for suspicious activity
   - Update passwords quarterly

3. **Backup admin credentials:**
   - Store securely (password manager)
   - Document recovery process
   - Have backup admin account

---

## Admin Panel Access

Once admin is created, login at:

**Development:**
```
https://192.168.46.49:3000/login
```

**Production:**
```
https://yourdomain.com/login
```

After login, access admin panel at:
```
/admin/dashboard
```

---

## Next Steps

After creating admin:

1. ✅ Login with admin credentials
2. ✅ Change default password
3. ✅ Test admin panel features
4. ✅ Create additional admins if needed
5. ✅ Set up admin roles/permissions (if implemented)

---

## Support

If you encounter issues:

1. Check database connection
2. Verify user role enum exists
3. Check bcrypt installation
4. Review error logs
5. Run `node manage-admin.js` for interactive help

---

**Last Updated:** 2024
**Version:** 1.0
