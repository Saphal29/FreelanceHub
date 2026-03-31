const logger = require('../utils/logger');

/**
 * Middleware to check if user is an admin
 * Must be used after authMiddleware
 */
const adminMiddleware = (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by authMiddleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'ADMIN') {
      logger.warn('Non-admin user attempted to access admin route', {
        userId: req.user.userId,
        role: req.user.role,
        path: req.path
      });

      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        code: 'FORBIDDEN'
      });
    }

    // User is admin, proceed
    logger.info('Admin access granted', {
      userId: req.user.userId,
      path: req.path
    });

    next();
  } catch (error) {
    logger.error('Error in admin middleware', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = { adminMiddleware };
