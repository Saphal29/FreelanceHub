const logger = require('../utils/logger');

/**
 * Role-based authorization middleware
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        logger.security('Role check failed - user not authenticated', {
          ip: req.ip,
          path: req.path,
          requiredRoles: allowedRoles
        });
        
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }
      
      // Check if user role is allowed
      if (!allowedRoles.includes(req.user.role)) {
        logger.security('Role check failed - insufficient permissions', {
          userId: req.user.userId,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          ip: req.ip,
          path: req.path
        });
        
        return res.status(403).json({
          success: false,
          error: 'Access denied. Insufficient permissions.',
          code: 'FORBIDDEN'
        });
      }
      
      logger.auth('Role check passed', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path
      });
      
      next();
    } catch (error) {
      logger.error('Role middleware error', {
        userId: req.user?.userId,
        requiredRoles: allowedRoles,
        error: error.message
      });
      
      return res.status(500).json({
        success: false,
        error: 'Server error during authorization',
        code: 'SERVER_ERROR'
      });
    }
  };
};

/**
 * Admin only middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const adminOnly = roleMiddleware(['ADMIN']);

/**
 * Freelancer only middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const freelancerOnly = roleMiddleware(['FREELANCER']);

/**
 * Client only middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const clientOnly = roleMiddleware(['CLIENT']);

/**
 * Freelancer or Client middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const freelancerOrClient = roleMiddleware(['FREELANCER', 'CLIENT']);

/**
 * Admin or Freelancer middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const adminOrFreelancer = roleMiddleware(['ADMIN', 'FREELANCER']);

/**
 * Admin or Client middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const adminOrClient = roleMiddleware(['ADMIN', 'CLIENT']);

/**
 * Any authenticated user middleware (all roles)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const anyRole = roleMiddleware(['ADMIN', 'FREELANCER', 'CLIENT']);

/**
 * Check if user owns resource or is admin
 * @param {string} userIdField - Field name in req.params or req.body containing user ID
 * @returns {Function} Express middleware function
 */
const ownerOrAdmin = (userIdField = 'userId') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }
      
      // Admin can access any resource
      if (req.user.role === 'ADMIN') {
        logger.auth('Admin access granted', {
          adminId: req.user.userId,
          path: req.path
        });
        return next();
      }
      
      // Get target user ID from params or body
      const targetUserId = req.params[userIdField] || req.body[userIdField];
      
      // Check if user is accessing their own resource
      if (req.user.userId === targetUserId) {
        logger.auth('Owner access granted', {
          userId: req.user.userId,
          path: req.path
        });
        return next();
      }
      
      logger.security('Access denied - not owner or admin', {
        userId: req.user.userId,
        targetUserId,
        path: req.path
      });
      
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own resources.',
        code: 'FORBIDDEN'
      });
    } catch (error) {
      logger.error('Owner or admin middleware error', {
        userId: req.user?.userId,
        error: error.message
      });
      
      return res.status(500).json({
        success: false,
        error: 'Server error during authorization',
        code: 'SERVER_ERROR'
      });
    }
  };
};

/**
 * Check if user can modify resource (owner or admin)
 * @param {Function} getResourceOwner - Function that returns resource owner ID
 * @returns {Function} Express middleware function
 */
const canModifyResource = (getResourceOwner) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }
      
      // Admin can modify any resource
      if (req.user.role === 'ADMIN') {
        return next();
      }
      
      // Get resource owner ID
      const ownerId = await getResourceOwner(req);
      
      if (req.user.userId === ownerId) {
        return next();
      }
      
      logger.security('Modification denied - not owner or admin', {
        userId: req.user.userId,
        ownerId,
        path: req.path
      });
      
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only modify your own resources.',
        code: 'FORBIDDEN'
      });
    } catch (error) {
      logger.error('Can modify resource middleware error', {
        userId: req.user?.userId,
        error: error.message
      });
      
      return res.status(500).json({
        success: false,
        error: 'Server error during authorization',
        code: 'SERVER_ERROR'
      });
    }
  };
};

module.exports = {
  roleMiddleware,
  adminOnly,
  freelancerOnly,
  clientOnly,
  freelancerOrClient,
  adminOrFreelancer,
  adminOrClient,
  anyRole,
  ownerOrAdmin,
  canModifyResource
};