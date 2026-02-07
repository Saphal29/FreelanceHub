const { query, transaction } = require('../utils/dbQueries');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const emailService = require('./emailService');

/**
 * Create a new user with role-specific profile
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Created user and verification token
 */
const createUser = async (userData) => {
  const { email, password, fullName, role, phone } = userData;
  
  try {
    logger.auth('User registration started', { email, role });
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate verification token
    const verificationToken = uuidv4();
    
    // Use transaction to create user and profile atomically
    const result = await transaction(async (client) => {
      // Insert user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, role, full_name, phone, verification_token)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, full_name, role, verified, created_at`,
        [email, passwordHash, role, fullName, phone || null, verificationToken]
      );
      
      const user = userResult.rows[0];
      
      // Create role-specific profile
      if (role === 'FREELANCER') {
        await client.query(
          `INSERT INTO freelancer_profiles (user_id) VALUES ($1)`,
          [user.id]
        );
        logger.database('Freelancer profile created', { userId: user.id });
      } else if (role === 'CLIENT') {
        await client.query(
          `INSERT INTO client_profiles (user_id) VALUES ($1)`,
          [user.id]
        );
        logger.database('Client profile created', { userId: user.id });
      }
      
      return { user, verificationToken };
    });
    
    logger.auth('User registration completed', { 
      userId: result.user.id, 
      email: result.user.email,
      role: result.user.role 
    });

    // Send verification email
    try {
      const emailResult = await emailService.sendVerificationEmail(
        result.user.email,
        result.user.full_name,
        result.verificationToken
      );
      
      if (emailResult.success) {
        logger.auth('Verification email sent', { email: result.user.email });
      } else {
        logger.error('Failed to send verification email', { 
          email: result.user.email, 
          error: emailResult.error 
        });
      }
    } catch (error) {
      logger.error('Email service error', { 
        email: result.user.email, 
        error: error.message 
      });
    }
    
    return result;
  } catch (error) {
    logger.error('User registration failed', { 
      email, 
      role, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Find user by email with profile information
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User with profile data or null
 */
const findUserByEmail = async (email) => {
  try {
    logger.database('Finding user by email', { email });
    
    const result = await query(
      `SELECT 
        u.id, u.email, u.password_hash, u.role, u.full_name,
        u.phone, u.avatar_url, u.verified, u.last_login,
        fp.id as freelancer_profile_id, fp.bio, fp.skills,
        fp.hourly_rate, fp.experience_years, fp.availability_status,
        cp.id as client_profile_id, cp.company_name, cp.industry, cp.website
       FROM users u
       LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
       LEFT JOIN client_profiles cp ON u.id = cp.user_id
       WHERE u.email = $1`,
      [email]
    );
    
    const user = result.rows[0] || null;
    
    if (user) {
      logger.database('User found by email', { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      });
    } else {
      logger.database('User not found by email', { email });
    }
    
    return user;
  } catch (error) {
    logger.error('Error finding user by email', { 
      email, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Find user by ID with profile information
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User with profile data or null
 */
const findUserById = async (userId) => {
  try {
    logger.database('Finding user by ID', { userId });
    
    const result = await query(
      `SELECT 
        u.id, u.email, u.role, u.full_name, u.phone,
        u.avatar_url, u.verified, u.created_at,
        fp.id as freelancer_profile_id, fp.bio, fp.skills,
        fp.hourly_rate, fp.experience_years, fp.availability_status,
        cp.id as client_profile_id, cp.company_name, cp.industry, cp.website
       FROM users u
       LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
       LEFT JOIN client_profiles cp ON u.id = cp.user_id
       WHERE u.id = $1`,
      [userId]
    );
    
    const user = result.rows[0] || null;
    
    if (user) {
      logger.database('User found by ID', { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      });
    } else {
      logger.database('User not found by ID', { userId });
    }
    
    return user;
  } catch (error) {
    logger.error('Error finding user by ID', { 
      userId, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Verify user email using verification token
 * @param {string} token - Verification token
 * @returns {Promise<Object|null>} Verified user or null
 */
const verifyEmail = async (token) => {
  try {
    logger.auth('Email verification started', { token: token.substring(0, 8) + '...' });
    
    const result = await query(
      `UPDATE users 
       SET verified = true, verification_token = NULL
       WHERE verification_token = $1 AND verified = false
       RETURNING id, email, full_name, role, verified`,
      [token]
    );
    
    const user = result.rows[0] || null;
    
    if (user) {
      logger.auth('Email verification successful', { 
        userId: user.id, 
        email: user.email 
      });
    } else {
      logger.auth('Email verification failed - invalid or expired token', { 
        token: token.substring(0, 8) + '...' 
      });
    }
    
    return user;
  } catch (error) {
    logger.error('Email verification error', { 
      token: token.substring(0, 8) + '...', 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Update user's last login timestamp
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const updateLastLogin = async (userId) => {
  try {
    logger.database('Updating last login', { userId });
    
    await query(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`,
      [userId]
    );
    
    logger.database('Last login updated', { userId });
  } catch (error) {
    logger.error('Error updating last login', { 
      userId, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Set password reset token for user
 * @param {string} userId - User ID
 * @param {string} token - Reset token
 * @param {Date} expires - Token expiration date
 * @returns {Promise<void>}
 */
const setPasswordResetToken = async (userId, token, expires) => {
  try {
    logger.auth('Setting password reset token', { userId });
    
    await query(
      `UPDATE users 
       SET password_reset_token = $1, password_reset_expires = $2
       WHERE id = $3`,
      [token, expires, userId]
    );
    
    logger.auth('Password reset token set', { userId });
  } catch (error) {
    logger.error('Error setting password reset token', { 
      userId, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Find user by password reset token
 * @param {string} token - Reset token
 * @returns {Promise<Object|null>} User with reset token info or null
 */
const findUserByResetToken = async (token) => {
  try {
    logger.database('Finding user by reset token', { 
      token: token.substring(0, 8) + '...' 
    });
    
    const result = await query(
      `SELECT id, email, password_reset_expires
       FROM users
       WHERE password_reset_token = $1`,
      [token]
    );
    
    const user = result.rows[0] || null;
    
    if (user) {
      logger.database('User found by reset token', { 
        userId: user.id, 
        email: user.email 
      });
    } else {
      logger.database('User not found by reset token', { 
        token: token.substring(0, 8) + '...' 
      });
    }
    
    return user;
  } catch (error) {
    logger.error('Error finding user by reset token', { 
      token: token.substring(0, 8) + '...', 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Reset user password
 * @param {string} userId - User ID
 * @param {string} newPasswordHash - New password hash
 * @returns {Promise<void>}
 */
const resetPassword = async (userId, newPasswordHash) => {
  try {
    logger.auth('Password reset started', { userId });
    
    await query(
      `UPDATE users 
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL
       WHERE id = $2`,
      [newPasswordHash, userId]
    );
    
    logger.auth('Password reset completed', { userId });
  } catch (error) {
    logger.error('Password reset failed', { 
      userId, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Update user profile with role-specific data
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @param {Object} data - Profile data to update
 * @returns {Promise<Object>} Updated user data
 */
const updateUserProfile = async (userId, role, data) => {
  try {
    logger.auth('Profile update started', { userId, role });
    
    const result = await transaction(async (client) => {
      // Update common fields if provided
      if (data.fullName || data.phone || data.avatarUrl) {
        await client.query(
          `UPDATE users 
           SET full_name = COALESCE($1, full_name),
               phone = COALESCE($2, phone),
               avatar_url = COALESCE($3, avatar_url)
           WHERE id = $4`,
          [data.fullName, data.phone, data.avatarUrl, userId]
        );
        
        logger.database('User common fields updated', { userId });
      }
      
      // Update role-specific profile
      if (role === 'FREELANCER') {
        await client.query(
          `UPDATE freelancer_profiles 
           SET bio = COALESCE($1, bio),
               skills = COALESCE($2, skills),
               hourly_rate = COALESCE($3, hourly_rate),
               experience_years = COALESCE($4, experience_years),
               availability_status = COALESCE($5, availability_status)
           WHERE user_id = $6`,
          [data.bio, data.skills, data.hourlyRate, data.experienceYears, data.availabilityStatus, userId]
        );
        
        logger.database('Freelancer profile updated', { userId });
      } else if (role === 'CLIENT') {
        await client.query(
          `UPDATE client_profiles 
           SET company_name = COALESCE($1, company_name),
               industry = COALESCE($2, industry),
               website = COALESCE($3, website)
           WHERE user_id = $4`,
          [data.companyName, data.industry, data.website, userId]
        );
        
        logger.database('Client profile updated', { userId });
      }
      
      // Fetch and return updated user
      const result = await client.query(
        `SELECT 
          u.id, u.email, u.role, u.full_name, u.phone,
          u.avatar_url, u.verified, u.created_at,
          fp.id as freelancer_profile_id, fp.bio, fp.skills,
          fp.hourly_rate, fp.experience_years, fp.availability_status,
          cp.id as client_profile_id, cp.company_name, cp.industry, cp.website
         FROM users u
         LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
         LEFT JOIN client_profiles cp ON u.id = cp.user_id
         WHERE u.id = $1`,
        [userId]
      );
      
      return result.rows[0];
    });
    
    logger.auth('Profile update completed', { userId, role });
    
    return result;
  } catch (error) {
    logger.error('Profile update failed', { 
      userId, 
      role, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Check if email already exists
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} True if email exists
 */
const emailExists = async (email) => {
  try {
    logger.database('Checking email existence', { email });
    
    const result = await query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );
    
    const exists = result.rows.length > 0;
    
    logger.database('Email existence check completed', { email, exists });
    
    return exists;
  } catch (error) {
    logger.error('Error checking email existence', { 
      email, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Get user statistics
 * @returns {Promise<Object>} User statistics
 */
const getUserStats = async () => {
  try {
    logger.database('Getting user statistics');
    
    const result = await query(
      `SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN role = 'FREELANCER' THEN 1 END) as freelancers,
        COUNT(CASE WHEN role = 'CLIENT' THEN 1 END) as clients,
        COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admins
       FROM users`
    );
    
    const stats = result.rows[0];
    
    logger.database('User statistics retrieved', stats);
    
    return {
      totalUsers: parseInt(stats.total_users),
      verifiedUsers: parseInt(stats.verified_users),
      freelancers: parseInt(stats.freelancers),
      clients: parseInt(stats.clients),
      admins: parseInt(stats.admins)
    };
  } catch (error) {
    logger.error('Error getting user statistics', { error: error.message });
    throw error;
  }
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  verifyEmail,
  updateLastLogin,
  setPasswordResetToken,
  findUserByResetToken,
  resetPassword,
  updateUserProfile,
  emailExists,
  getUserStats
};