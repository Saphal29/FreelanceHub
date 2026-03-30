const express = require('express');
const router = express.Router();

// Controllers
const projectController = require('../controllers/projectController');

// Middleware
const { authMiddleware } = require('../middlewares/authMiddleware');
const {
  projectCreateRateLimiter,
  projectUpdateRateLimiter,
  searchRateLimiter
} = require('../middlewares/rateLimitMiddleware');

// All routes require authentication except public project browsing
// Public routes (no auth required)

/**
 * @route   GET /api/projects
 * @desc    Get projects with filters and pagination (public browsing)
 * @access  Public
 * @rateLimit 60 requests per hour per IP
 * @query   search - Search term for title/description
 * @query   category - Project category filter
 * @query   skills - Comma-separated skills filter
 * @query   budgetMin - Minimum budget filter
 * @query   budgetMax - Maximum budget filter
 * @query   projectType - Project type filter (fixed_price, hourly)
 * @query   experienceLevel - Experience level filter
 * @query   location - Location filter
 * @query   isRemote - Remote work filter (true/false)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * @query   sortBy - Sort field (created_at, updated_at, title, budget_min, budget_max, proposals_count)
 * @query   sortOrder - Sort order (ASC, DESC)
 */
router.get('/', searchRateLimiter, projectController.getProjects);

/**
 * @route   GET /api/projects/categories
 * @desc    Get all project categories
 * @access  Public
 */
router.get('/categories', projectController.getCategories);

/**
 * @route   GET /api/projects/my/projects
 * @desc    Get current client's projects
 * @access  Private (Clients only)
 * @query   status - Project status filter
 * @query   page - Page number
 * @query   limit - Items per page
 * @query   sortBy - Sort field
 * @query   sortOrder - Sort order
 */
router.get('/my/projects', authMiddleware, projectController.getMyProjects);

/**
 * @route   GET /api/projects/my/stats
 * @desc    Get project statistics for current client
 * @access  Private (Clients only)
 */
router.get('/my/stats', authMiddleware, projectController.getProjectStats);

// ============================================
// MILESTONE ROUTES (must come before /:id route)
// ============================================

/**
 * @route   GET /api/projects/:projectId/milestones
 * @desc    Get all milestones for a project
 * @access  Public
 */
router.get('/:projectId/milestones', projectController.getMilestones);

/**
 * @route   GET /api/projects/:id
 * @desc    Get project by ID with full details
 * @access  Public (increments view count for non-owners)
 */
router.get('/:id', projectController.getProjectById);

// Protected routes (authentication required)
router.use(authMiddleware);

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private (Clients only)
 * @rateLimit 10 requests per hour per user
 */
router.post('/', projectCreateRateLimiter, projectController.createProject);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Private (Project owner only)
 * @rateLimit 20 requests per hour per user
 */
router.put('/:id', projectUpdateRateLimiter, projectController.updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete/Archive project
 * @access  Private (Project owner only)
 * @rateLimit 5 requests per hour per user
 */
router.delete('/:id', projectUpdateRateLimiter, projectController.deleteProject);

/**
 * @route   POST /api/projects/:id/bookmark
 * @desc    Toggle project bookmark
 * @access  Private
 * @rateLimit 30 requests per hour per user
 */
router.post('/:id/bookmark', searchRateLimiter, projectController.toggleBookmark);

/**
 * @route   POST /api/projects/:projectId/milestones
 * @desc    Create a new milestone for a project
 * @access  Private (Project owner only)
 * @rateLimit 20 requests per hour per user
 */
router.post('/:projectId/milestones', projectUpdateRateLimiter, projectController.createMilestone);

/**
 * @route   PUT /api/projects/milestones/:id
 * @desc    Update milestone
 * @access  Private (Project owner only)
 * @rateLimit 20 requests per hour per user
 */
router.put('/milestones/:id', projectUpdateRateLimiter, projectController.updateMilestone);

/**
 * @route   DELETE /api/projects/milestones/:id
 * @desc    Delete milestone
 * @access  Private (Project owner only)
 * @rateLimit 20 requests per hour per user
 */
router.delete('/milestones/:id', projectUpdateRateLimiter, projectController.deleteMilestone);

module.exports = router;