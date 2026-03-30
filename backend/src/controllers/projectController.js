const projectService = require('../services/projectService');
const logger = require('../utils/logger');
const { validateProjectData } = require('../utils/validation');

/**
 * Create a new project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createProject = async (req, res) => {
  try {
    const clientId = req.user.userId;
    const role = req.user.role;
    const projectData = req.body;
    
    // Only clients can create projects
    if (role !== 'CLIENT') {
      return res.status(403).json({
        success: false,
        error: 'Only clients can create projects',
        code: 'FORBIDDEN'
      });
    }
    
    logger.info('Create project request', { clientId, title: projectData.title, hasMilestones: !!projectData.milestones, milestoneCount: projectData.milestones?.length || 0 });
    
    // Validate project data
    const validation = validateProjectData(projectData);
    if (!validation.isValid) {
      logger.warn('Project validation failed', { clientId, errors: validation.errors });
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validation.errors
      });
    }
    
    logger.info('Validation passed', { 
      clientId, 
      hasMilestones: !!validation.sanitizedData.milestones, 
      milestoneCount: validation.sanitizedData.milestones?.length || 0 
    });
    
    // Create project
    const project = await projectService.createProject(clientId, validation.sanitizedData);
    
    logger.info('Project created successfully', { projectId: project.id, clientId });
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    logger.error('Error creating project', { 
      clientId: req.user?.userId, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to create project',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get projects with filters and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProjects = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const {
      search,
      category,
      skills,
      budgetMin,
      budgetMax,
      projectType,
      experienceLevel,
      location,
      isRemote,
      status,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;
    
    logger.info('Get projects request', { 
      userId, 
      filters: { search, category, skills, budgetMin, budgetMax },
      pagination: { page, limit, sortBy, sortOrder }
    });
    
    // Parse skills if provided
    let parsedSkills = null;
    if (skills) {
      parsedSkills = typeof skills === 'string' ? skills.split(',').map(s => s.trim()) : skills;
    }
    
    // Parse boolean values
    const parsedIsRemote = isRemote !== undefined ? isRemote === 'true' : undefined;
    
    const filters = {
      search,
      category,
      skills: parsedSkills,
      budgetMin: budgetMin ? parseFloat(budgetMin) : undefined,
      budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
      projectType,
      experienceLevel,
      location,
      isRemote: parsedIsRemote,
      status
    };
    
    const pagination = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // Max 100 per page
      sortBy,
      sortOrder
    };
    
    const result = await projectService.getProjects(filters, pagination, userId);
    
    logger.info('Projects retrieved successfully', { 
      count: result.projects.length,
      total: result.pagination.total,
      page: result.pagination.page
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error getting projects', { 
      userId: req.user?.userId,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve projects',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get my projects (client's own projects)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMyProjects = async (req, res) => {
  try {
    const clientId = req.user.userId;
    const role = req.user.role;
    
    // Only clients can view their projects
    if (role !== 'CLIENT') {
      return res.status(403).json({
        success: false,
        error: 'Only clients can view their projects',
        code: 'FORBIDDEN'
      });
    }
    
    const {
      status,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;
    
    logger.info('Get my projects request', { clientId, status });
    
    const filters = {
      clientId,
      status
    };
    
    const pagination = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      sortBy,
      sortOrder
    };
    
    const result = await projectService.getProjects(filters, pagination, clientId);
    
    logger.info('My projects retrieved successfully', { 
      clientId,
      count: result.projects.length,
      total: result.pagination.total
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error getting my projects', { 
      clientId: req.user?.userId,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve your projects',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get project by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user?.userId;
    
    logger.info('Get project by ID request', { projectId, userId });
    
    const project = await projectService.getProjectById(projectId, userId);
    
    logger.info('Project retrieved successfully', { projectId });
    
    res.json({
      success: true,
      project
    });
  } catch (error) {
    logger.error('Error getting project by ID', { 
      projectId: req.params.id,
      userId: req.user?.userId,
      error: error.message 
    });
    
    if (error.message === 'Project not found') {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve project',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Update project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const clientId = req.user.userId;
    const role = req.user.role;
    const updateData = req.body;
    
    // Only clients can update projects
    if (role !== 'CLIENT') {
      return res.status(403).json({
        success: false,
        error: 'Only clients can update projects',
        code: 'FORBIDDEN'
      });
    }
    
    logger.info('Update project request', { projectId, clientId });
    
    // Validate update data
    const validation = validateProjectData(updateData, true); // partial = true
    if (!validation.isValid) {
      logger.warn('Project update validation failed', { 
        projectId, 
        clientId, 
        errors: validation.errors 
      });
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validation.errors
      });
    }
    
    // Update project
    const project = await projectService.updateProject(
      projectId, 
      clientId, 
      validation.sanitizedData
    );
    
    logger.info('Project updated successfully', { projectId, clientId });
    
    res.json({
      success: true,
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    logger.error('Error updating project', { 
      projectId: req.params.id,
      clientId: req.user?.userId,
      error: error.message 
    });
    
    if (error.message === 'Project not found') {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'FORBIDDEN'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update project',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Delete/Archive project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const clientId = req.user.userId;
    const role = req.user.role;
    
    // Only clients can delete projects
    if (role !== 'CLIENT') {
      return res.status(403).json({
        success: false,
        error: 'Only clients can delete projects',
        code: 'FORBIDDEN'
      });
    }
    
    logger.info('Delete project request', { projectId, clientId });
    
    const success = await projectService.deleteProject(projectId, clientId);
    
    if (success) {
      logger.info('Project deleted/archived successfully', { projectId, clientId });
      
      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } else {
      throw new Error('Failed to delete project');
    }
  } catch (error) {
    logger.error('Error deleting project', { 
      projectId: req.params.id,
      clientId: req.user?.userId,
      error: error.message 
    });
    
    if (error.message === 'Project not found') {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'FORBIDDEN'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete project',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Toggle project bookmark
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const toggleBookmark = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.userId;
    
    logger.info('Toggle bookmark request', { projectId, userId });
    
    const result = await projectService.toggleProjectBookmark(projectId, userId);
    
    logger.info('Bookmark toggled successfully', { projectId, userId, bookmarked: result.bookmarked });
    
    res.json({
      success: true,
      message: result.bookmarked ? 'Project bookmarked' : 'Bookmark removed',
      bookmarked: result.bookmarked
    });
  } catch (error) {
    logger.error('Error toggling bookmark', { 
      projectId: req.params.id,
      userId: req.user?.userId,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to toggle bookmark',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get project categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCategories = async (req, res) => {
  try {
    logger.info('Get categories request');
    
    const categories = await projectService.getProjectCategories();
    
    logger.info('Categories retrieved successfully', { count: categories.length });
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    logger.error('Error getting categories', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve categories',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get project statistics for dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProjectStats = async (req, res) => {
  try {
    const clientId = req.user.userId;
    const role = req.user.role;
    
    // Only clients can view their project stats
    if (role !== 'CLIENT') {
      return res.status(403).json({
        success: false,
        error: 'Only clients can view project statistics',
        code: 'FORBIDDEN'
      });
    }
    
    logger.info('Get project stats request', { clientId });
    
    // Get stats for different project statuses
    const statsPromises = [
      projectService.getProjects({ clientId, status: 'active' }, { page: 1, limit: 1 }),
      projectService.getProjects({ clientId, status: 'in_progress' }, { page: 1, limit: 1 }),
      projectService.getProjects({ clientId, status: 'completed' }, { page: 1, limit: 1 }),
      projectService.getProjects({ clientId, status: 'draft' }, { page: 1, limit: 1 })
    ];
    
    const [activeResult, inProgressResult, completedResult, draftResult] = await Promise.all(statsPromises);
    
    const stats = {
      active: activeResult.pagination.total,
      inProgress: inProgressResult.pagination.total,
      completed: completedResult.pagination.total,
      draft: draftResult.pagination.total,
      total: activeResult.pagination.total + inProgressResult.pagination.total + 
             completedResult.pagination.total + draftResult.pagination.total
    };
    
    logger.info('Project stats retrieved successfully', { clientId, stats });
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error getting project stats', { 
      clientId: req.user?.userId,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve project statistics',
      code: 'SERVER_ERROR'
    });
  }
};

// ============================================
// MILESTONE MANAGEMENT ENDPOINTS
// ============================================

/**
 * Get milestones for a project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMilestones = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user?.userId;
    
    logger.info('Get milestones request', { projectId, userId });
    
    const milestones = await projectService.getMilestones(projectId, userId);
    
    logger.info('Milestones retrieved successfully', { projectId, count: milestones.length });
    
    res.json({
      success: true,
      milestones
    });
  } catch (error) {
    logger.error('Error getting milestones', { 
      projectId: req.params.projectId,
      error: error.message 
    });
    
    if (error.message === 'Project not found') {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve milestones',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Create milestone for a project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createMilestone = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.userId;
    const role = req.user.role;
    const milestoneData = req.body;
    
    // Only clients can create milestones
    if (role !== 'CLIENT') {
      return res.status(403).json({
        success: false,
        error: 'Only clients can create milestones',
        code: 'FORBIDDEN'
      });
    }
    
    logger.info('Create milestone request', { projectId, userId });
    
    // Verify project ownership
    const projectResult = await projectService.getProjectById(projectId, userId);
    if (projectResult.client.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only create milestones for your own projects',
        code: 'FORBIDDEN'
      });
    }
    
    // Create milestone
    const milestones = await projectService.createProjectMilestones(projectId, [milestoneData]);
    
    logger.info('Milestone created successfully', { projectId, milestoneId: milestones[0].id });
    
    res.status(201).json({
      success: true,
      message: 'Milestone created successfully',
      milestone: milestones[0]
    });
  } catch (error) {
    logger.error('Error creating milestone', { 
      projectId: req.params.projectId,
      userId: req.user?.userId,
      error: error.message 
    });
    
    if (error.message === 'Project not found') {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create milestone',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Update milestone
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateMilestone = async (req, res) => {
  try {
    const milestoneId = req.params.id;
    const userId = req.user.userId;
    const role = req.user.role;
    const updateData = req.body;
    
    // Only clients can update milestones
    if (role !== 'CLIENT') {
      return res.status(403).json({
        success: false,
        error: 'Only clients can update milestones',
        code: 'FORBIDDEN'
      });
    }
    
    logger.info('Update milestone request', { milestoneId, userId });
    
    const milestone = await projectService.updateMilestone(milestoneId, userId, updateData);
    
    logger.info('Milestone updated successfully', { milestoneId, userId });
    
    res.json({
      success: true,
      message: 'Milestone updated successfully',
      milestone
    });
  } catch (error) {
    logger.error('Error updating milestone', { 
      milestoneId: req.params.id,
      userId: req.user?.userId,
      error: error.message 
    });
    
    if (error.message === 'Milestone not found') {
      return res.status(404).json({
        success: false,
        error: 'Milestone not found',
        code: 'MILESTONE_NOT_FOUND'
      });
    }
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'FORBIDDEN'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update milestone',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Delete milestone
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteMilestone = async (req, res) => {
  try {
    const milestoneId = req.params.id;
    const userId = req.user.userId;
    const role = req.user.role;
    
    // Only clients can delete milestones
    if (role !== 'CLIENT') {
      return res.status(403).json({
        success: false,
        error: 'Only clients can delete milestones',
        code: 'FORBIDDEN'
      });
    }
    
    logger.info('Delete milestone request', { milestoneId, userId });
    
    const success = await projectService.deleteMilestone(milestoneId, userId);
    
    if (success) {
      logger.info('Milestone deleted successfully', { milestoneId, userId });
      
      res.json({
        success: true,
        message: 'Milestone deleted successfully'
      });
    } else {
      throw new Error('Failed to delete milestone');
    }
  } catch (error) {
    logger.error('Error deleting milestone', { 
      milestoneId: req.params.id,
      userId: req.user?.userId,
      error: error.message 
    });
    
    if (error.message === 'Milestone not found') {
      return res.status(404).json({
        success: false,
        error: 'Milestone not found',
        code: 'MILESTONE_NOT_FOUND'
      });
    }
    
    if (error.message.includes('Unauthorized') || error.message.includes('Cannot delete')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'FORBIDDEN'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete milestone',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  toggleBookmark,
  getCategories,
  getProjectStats,
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone
};