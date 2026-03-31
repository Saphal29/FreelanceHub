const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { adminMiddleware } = require('../middlewares/adminMiddleware');

// All admin routes require authentication AND admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// ============================================
// DASHBOARD
// ============================================

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/dashboard', adminController.getDashboard);

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filters
 * @access  Private (Admin only)
 */
router.get('/users', adminController.getUsers);

/**
 * @route   GET /api/admin/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/users/stats', adminController.getUserStats);

/**
 * @route   PUT /api/admin/users/:id/suspend
 * @desc    Suspend/ban user
 * @access  Private (Admin only)
 */
router.put('/users/:id/suspend', adminController.suspendUser);

/**
 * @route   PUT /api/admin/users/:id/verify
 * @desc    Verify user account
 * @access  Private (Admin only)
 */
router.put('/users/:id/verify', adminController.verifyUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete('/users/:id', adminController.deleteUser);

// ============================================
// PROJECT MANAGEMENT
// ============================================

/**
 * @route   GET /api/admin/projects
 * @desc    Get all projects with filters
 * @access  Private (Admin only)
 */
router.get('/projects', adminController.getProjects);

/**
 * @route   GET /api/admin/projects/stats
 * @desc    Get project statistics
 * @access  Private (Admin only)
 */
router.get('/projects/stats', adminController.getProjectStats);

/**
 * @route   DELETE /api/admin/projects/:id
 * @desc    Delete project
 * @access  Private (Admin only)
 */
router.delete('/projects/:id', adminController.deleteProject);

// ============================================
// DISPUTE MANAGEMENT
// ============================================

/**
 * @route   GET /api/admin/disputes
 * @desc    Get all disputes with filters
 * @access  Private (Admin only)
 */
router.get('/disputes', adminController.getDisputes);

/**
 * @route   GET /api/admin/disputes/stats
 * @desc    Get dispute statistics
 * @access  Private (Admin only)
 */
router.get('/disputes/stats', adminController.getDisputeStats);

// ============================================
// FINANCIAL MANAGEMENT
// ============================================

/**
 * @route   GET /api/admin/transactions
 * @desc    Get all transactions with filters
 * @access  Private (Admin only)
 */
router.get('/transactions', adminController.getTransactions);

/**
 * @route   GET /api/admin/transactions/stats
 * @desc    Get financial statistics
 * @access  Private (Admin only)
 */
router.get('/transactions/stats', adminController.getFinancialStats);

module.exports = router;
