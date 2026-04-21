const authService = require('../services/authService');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwtUtils');
const { v4: uuidv4 } = require('uuid');
const { validateRegistrationData, validateLoginData } = require('../utils/validation');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

/**
 * Helper function to format user response
 * @param {Object} user - User object from database
 * @returns {Object} Formatted user response
 */
const formatUserResponse = (user) => {
  const response = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    verified: user.verified,
    createdAt: user.created_at
  };

  if (user.role === 'FREELANCER' && user.freelancer_profile_id) {
    response.freelancerProfile = {
      id: user.freelancer_profile_id,
      bio: user.bio,
      skills: user.skills || [],
      hourlyRate: user.hourly_rate,
      experienceYears: user.experience_years,
      availabilityStatus: user.availability_status
    };
  } else if (user.role === 'CLIENT' && user.client_profile_id) {
    response.clientProfile = {
      id: user.client_profile_id,
      companyName: user.company_name,
      industry: user.industry,
      website: user.website
    };
  }

  return response;
};

/**
 * Verify email with OTP controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyEmailWithOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required',
        code: 'MISSING_FIELDS'
      });
    }

    logger.auth('OTP verification attempt', { email });

    const result = await authService.verifyEmailWithOTP(email, otp);

    if (result.success) {
      logger.auth('OTP verification successful', { email });
      
      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(
          result.user.email,
          result.user.full_name,
          result.user.role
        );
      } catch (error) {
        logger.error('Failed to send welcome email', { error: error.message });
      }

      return res.json({
        success: true,
        message: 'Email verified successfully! You can now login.',
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.full_name,
          role: result.user.role,
          verified: result.user.verified
        }
      });
    } else {
      logger.auth('OTP verification failed', { email, error: result.error });
      return res.status(400).json({
        success: false,
        error: result.error,
        code: 'INVALID_OTP',
        attemptsRemaining: result.attemptsRemaining
      });
    }
  } catch (error) {
    logger.error('OTP verification error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Server error during verification',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Resend OTP controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }

    logger.auth('Resend OTP request', { email });

    const result = await authService.resendOTP(email);

    if (result.success) {
      logger.auth('OTP resent successfully', { email });
      return res.json({
        success: true,
        message: 'OTP sent successfully. Please check your email.'
      });
    } else {
      logger.auth('Resend OTP failed', { email, error: result.error });
      return res.status(400).json({
        success: false,
        error: result.error,
        code: 'RESEND_FAILED'
      });
    }
  } catch (error) {
    logger.error('Resend OTP error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * User registration controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const register = async (req, res) => {
  try {
    const { email, password, confirmPassword, fullName, role, phone } = req.body;

    logger.auth('Registration attempt started', { email, role });

    // Validate and sanitize input data
    const validation = validateRegistrationData(req.body);
    if (!validation.isValid) {
      logger.auth('Registration validation failed', { 
        email, 
        errors: validation.errors 
      });
      
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', '),
        code: 'VALIDATION_ERROR',
        details: validation.errors
      });
    }

    // Check if email already exists
    const existingUser = await authService.emailExists(validation.sanitizedData.email);
    if (existingUser) {
      logger.auth('Registration failed - email exists', { email });
      
      return res.status(400).json({
        success: false,
        error: 'Email already registered',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // Create user
    const { user, verificationToken } = await authService.createUser(validation.sanitizedData);

    // Log verification link for development/testing
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    console.log('\n📧 VERIFICATION LINK:');
    console.log(verificationLink);
    console.log('\n');

    logger.auth('Registration successful', { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for the verification code.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        verified: user.verified
      },
      requiresOTP: true
    });
  } catch (error) {
    logger.error('Registration error', { 
      email: req.body?.email, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Server error during registration',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Email verification controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      logger.auth('Email verification failed - no token', { ip: req.ip });
      
      return res.status(400).json({
        success: false,
        error: 'Verification token is required',
        code: 'TOKEN_REQUIRED'
      });
    }

    const user = await authService.verifyEmail(token);

    if (!user) {
      logger.auth('Email verification failed - invalid token', { 
        token: token.substring(0, 8) + '...' 
      });
      
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN'
      });
    }

    logger.auth('Email verification successful', { 
      userId: user.id, 
      email: user.email 
    });

    // Send welcome email after successful verification
    try {
      const emailResult = await emailService.sendWelcomeEmail(
        user.email,
        user.full_name,
        user.role
      );
      
      if (emailResult.success) {
        logger.auth('Welcome email sent', { email: user.email });
      } else {
        logger.error('Failed to send welcome email', { 
          email: user.email, 
          error: emailResult.error 
        });
      }
    } catch (error) {
      logger.error('Email service error during welcome email', { 
        email: user.email, 
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Email verified successfully! You can now login.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (error) {
    logger.error('Email verification error', { 
      token: req.query?.token?.substring(0, 8) + '...', 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Server error during verification',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * User login controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.auth('Login attempt started', { email, ip: req.ip });

    // Validate input
    const validation = validateLoginData(req.body);
    if (!validation.isValid) {
      logger.auth('Login validation failed', { 
        email, 
        errors: validation.errors 
      });
      
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', '),
        code: 'VALIDATION_ERROR'
      });
    }

    // Find user
    const user = await authService.findUserByEmail(validation.sanitizedData.email);

    if (!user) {
      logger.auth('Login failed - user not found', { email });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if email is verified
    if (!user.verified) {
      logger.auth('Login failed - email not verified', { 
        userId: user.id, 
        email 
      });
      
      return res.status(403).json({
        success: false,
        error: 'Please verify your email before logging in',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      logger.auth('Login failed - invalid password', { 
        userId: user.id, 
        email 
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Update last login
    await authService.updateLastLogin(user.id);

    logger.auth('Login successful', { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    logger.error('Login error', { 
      email: req.body?.email, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Server error during login',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Forgot password controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
        code: 'EMAIL_REQUIRED'
      });
    }

    logger.auth('Password reset requested', { email, ip: req.ip });

    const user = await authService.findUserByEmail(email.toLowerCase().trim());

    if (user) {
      // Generate reset token
      const resetToken = uuidv4();
      const expires = new Date(Date.now() + 3600000); // 1 hour from now

      await authService.setPasswordResetToken(user.id, resetToken, expires);

      // Send password reset email
      try {
        const emailResult = await emailService.sendPasswordResetEmail(
          user.email,
          user.full_name,
          resetToken
        );
        
        if (emailResult.success) {
          logger.auth('Password reset email sent', { email: user.email });
        } else {
          logger.error('Failed to send password reset email', { 
            email: user.email, 
            error: emailResult.error 
          });
        }
      } catch (error) {
        logger.error('Email service error during password reset', { 
          email: user.email, 
          error: error.message 
        });
      }

      // Log reset link for development/testing
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      console.log('\n🔑 PASSWORD RESET LINK:');
      console.log(resetLink);
      console.log('\n');

      logger.auth('Password reset token generated', { 
        userId: user.id, 
        email 
      });
    } else {
      logger.auth('Password reset requested for non-existent email', { email });
    }

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: "If that email exists, we've sent password reset instructions."
    });
  } catch (error) {
    logger.error('Forgot password error', { 
      email: req.body?.email, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Reset password controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required',
        code: 'MISSING_FIELDS'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match',
        code: 'PASSWORDS_DO_NOT_MATCH'
      });
    }

    logger.auth('Password reset attempt', { 
      token: token.substring(0, 8) + '...', 
      ip: req.ip 
    });

    // Find user by reset token
    const user = await authService.findUserByResetToken(token);

    if (!user) {
      logger.auth('Password reset failed - invalid token', { 
        token: token.substring(0, 8) + '...' 
      });
      
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if token expired
    if (new Date() > new Date(user.password_reset_expires)) {
      logger.auth('Password reset failed - token expired', { 
        userId: user.id, 
        expiredAt: user.password_reset_expires 
      });
      
      return res.status(400).json({
        success: false,
        error: 'Reset token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Validate new password
    const { validatePassword } = require('../utils/validation');
    const passwordValidation = validatePassword(newPassword);
    
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.errors.join(', '),
        code: 'WEAK_PASSWORD',
        details: passwordValidation.errors
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await authService.resetPassword(user.id, newPasswordHash);

    logger.auth('Password reset successful', { 
      userId: user.id, 
      email: user.email 
    });

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    logger.error('Reset password error', { 
      token: req.body?.token?.substring(0, 8) + '...', 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get current user profile controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    logger.auth('Get current user request', { userId });

    const user = await authService.findUserById(userId);

    if (!user) {
      logger.auth('Get current user failed - user not found', { userId });
      
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    logger.auth('Get current user successful', { 
      userId: user.id, 
      email: user.email 
    });

    res.json({
      success: true,
      user: formatUserResponse(user)
    });
  } catch (error) {
    logger.error('Get current user error', { 
      userId: req.user?.userId, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Update user profile controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    logger.auth('Profile update request', { userId, role });

    // Validate role-specific fields
    const allowedFields = ['fullName', 'phone', 'avatarUrl'];
    
    if (role === 'FREELANCER') {
      allowedFields.push('bio', 'skills', 'hourlyRate', 'experienceYears', 'availabilityStatus');
    } else if (role === 'CLIENT') {
      allowedFields.push('companyName', 'industry', 'website');
    }

    // Filter out non-allowed fields
    const updateData = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields provided for update',
        code: 'NO_UPDATE_FIELDS'
      });
    }

    // Validate specific fields
    if (updateData.hourlyRate && (isNaN(updateData.hourlyRate) || updateData.hourlyRate < 0)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hourly rate',
        code: 'INVALID_HOURLY_RATE'
      });
    }

    if (updateData.experienceYears && (isNaN(updateData.experienceYears) || updateData.experienceYears < 0)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid experience years',
        code: 'INVALID_EXPERIENCE_YEARS'
      });
    }

    if (updateData.website && updateData.website.length > 0) {
      const { isValidUrl } = require('../utils/validation');
      if (!isValidUrl(updateData.website)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid website URL',
          code: 'INVALID_WEBSITE_URL'
        });
      }
    }

    const updatedUser = await authService.updateUserProfile(userId, role, updateData);

    logger.auth('Profile update successful', { 
      userId, 
      role, 
      updatedFields: Object.keys(updateData) 
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: formatUserResponse(updatedUser)
    });
  } catch (error) {
    logger.error('Update profile error', { 
      userId: req.user?.userId, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Logout controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = (req, res) => {
  logger.auth('User logout', { 
    userId: req.user?.userId, 
    email: req.user?.email 
  });
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

/**
 * Get user statistics (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserStats = async (req, res) => {
  try {
    logger.auth('Get user statistics request', { 
      adminId: req.user.userId 
    });

    const stats = await authService.getUserStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Get user statistics error', { 
      adminId: req.user?.userId, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  verifyEmailWithOTP,
  resendOTP,
  login,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateProfile,
  logout,
  getUserStats
};