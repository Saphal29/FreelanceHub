const adminService = require('../services/adminService');
const logger = require('../utils/logger');

// ============================================
// DASHBOARD
// ============================================

/**
 * Get dashboard statistics
 * @route GET /api/admin/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    logger.info('Admin dashboard request', { adminId: req.user.userId });
    
    const stats = await adminService.getDashboardStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error getting dashboard stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard statistics',
      code: 'SERVER_ERROR'
    });
  }
};

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * Get all users
 * @route GET /api/admin/users
 */
const getUsers = async (req, res) => {
  try {
    const filters = {
      role: req.query.role,
      verified: req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };
    
    logger.info('Get all users request', { adminId: req.user.userId, filters });
    
    const result = await adminService.getAllUsers(filters);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error getting users', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve users',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get user statistics
 * @route GET /api/admin/users/stats
 */
const getUserStats = async (req, res) => {
  try {
    logger.info('Get user stats request', { adminId: req.user.userId });
    
    const stats = await adminService.getUserStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error getting user stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user statistics',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Suspend user
 * @route PUT /api/admin/users/:id/suspend
 */
const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    logger.info('Suspend user request', { adminId: req.user.userId, userId: id, reason });
    
    const result = await adminService.suspendUser(id, reason);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Error suspending user', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to suspend user',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Verify user
 * @route PUT /api/admin/users/:id/verify
 */
const verifyUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info('Verify user request', { adminId: req.user.userId, userId: id });
    
    const result = await adminService.verifyUserAccount(id);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Error verifying user', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to verify user',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Delete user
 * @route DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info('Delete user request', { adminId: req.user.userId, userId: id });
    
    const result = await adminService.deleteUser(id);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Error deleting user', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      code: 'SERVER_ERROR'
    });
  }
};

// ============================================
// PROJECT MANAGEMENT
// ============================================

/**
 * Get all projects
 * @route GET /api/admin/projects
 */
const getProjects = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      category: req.query.category,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };
    
    logger.info('Get all projects request', { adminId: req.user.userId, filters });
    
    const result = await adminService.getAllProjects(filters);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error getting projects', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve projects',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get project statistics
 * @route GET /api/admin/projects/stats
 */
const getProjectStats = async (req, res) => {
  try {
    logger.info('Get project stats request', { adminId: req.user.userId });
    
    const stats = await adminService.getProjectStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error getting project stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve project statistics',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Delete project
 * @route DELETE /api/admin/projects/:id
 */
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info('Delete project request', { adminId: req.user.userId, projectId: id });
    
    const result = await adminService.deleteProject(id);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Error deleting project', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to delete project',
      code: 'SERVER_ERROR'
    });
  }
};

// ============================================
// DISPUTE MANAGEMENT
// ============================================

/**
 * Get all disputes
 * @route GET /api/admin/disputes
 */
const getDisputes = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      category: req.query.category,
      page: req.query.page,
      limit: req.query.limit
    };
    
    logger.info('Get all disputes request', { adminId: req.user.userId, filters });
    
    const result = await adminService.getAllDisputes(filters);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error getting disputes', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve disputes',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get dispute statistics
 * @route GET /api/admin/disputes/stats
 */
const getDisputeStats = async (req, res) => {
  try {
    logger.info('Get dispute stats request', { adminId: req.user.userId });
    
    const stats = await adminService.getDisputeStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error getting dispute stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dispute statistics',
      code: 'SERVER_ERROR'
    });
  }
};

// ============================================
// FINANCIAL MANAGEMENT
// ============================================

/**
 * Get all transactions
 * @route GET /api/admin/transactions
 */
const getTransactions = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit
    };
    
    logger.info('Get all transactions request', { adminId: req.user.userId, filters });
    
    const result = await adminService.getAllTransactions(filters);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error getting transactions', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve transactions',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get financial statistics
 * @route GET /api/admin/transactions/stats
 */
const getFinancialStats = async (req, res) => {
  try {
    logger.info('Get financial stats request', { adminId: req.user.userId });
    
    const stats = await adminService.getFinancialStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error getting financial stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve financial statistics',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  // Dashboard
  getDashboard,
  
  // User Management
  getUsers,
  getUserStats,
  suspendUser,
  verifyUser,
  deleteUser,
  
  // Project Management
  getProjects,
  getProjectStats,
  deleteProject,
  
  // Dispute Management
  getDisputes,
  getDisputeStats,
  
  // Financial Management
  getTransactions,
  getFinancialStats
};
