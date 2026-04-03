const express = require('express');
const router = express.Router();

// Controllers
const authController = require('../controllers/authController');

// Middleware
const { authMiddleware } = require('../middlewares/authMiddleware');
const { adminOnly } = require('../middlewares/roleMiddleware');
const {
  authRateLimiter,
  passwordResetRateLimiter,
  registrationRateLimiter,
  profileUpdateRateLimiter,
  emailVerificationRateLimiter
} = require('../middlewares/rateLimitMiddleware');

// Public routes (no authentication required)

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @rateLimit 3 requests per hour per IP
 */
router.post('/register', registrationRateLimiter, authController.register);

/**
 * @route   GET /api/auth/verify-email
 * @desc    Verify user email with token (legacy)
 * @access  Public
 * @rateLimit 10 requests per hour per IP
 */
router.get('/verify-email', emailVerificationRateLimiter, authController.verifyEmail);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify user email with OTP
 * @access  Public
 * @rateLimit 10 requests per hour per IP
 */
router.post('/verify-otp', emailVerificationRateLimiter, authController.verifyEmailWithOTP);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP to user email
 * @access  Public
 * @rateLimit 3 requests per hour per IP
 */
router.post('/resend-otp', passwordResetRateLimiter, authController.resendOTP);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 * @rateLimit 5 requests per 15 minutes per IP
 */
router.post('/login', authRateLimiter, authController.login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 * @rateLimit 3 requests per hour per IP
 */
router.post('/forgot-password', passwordResetRateLimiter, authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 * @rateLimit 3 requests per hour per IP
 */
router.post('/reset-password', passwordResetRateLimiter, authController.resetPassword);

// Protected routes (authentication required)

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 * @rateLimit 10 requests per hour per IP
 */
router.put('/profile', authMiddleware, profileUpdateRateLimiter, authController.updateProfile);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authMiddleware, authController.logout);

// Admin only routes

/**
 * @route   GET /api/auth/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/stats', authMiddleware, adminOnly, authController.getUserStats);

module.exports = router;