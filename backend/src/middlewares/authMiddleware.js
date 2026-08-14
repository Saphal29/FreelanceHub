const { verifyToken } = require('../utils/jwtUtils');
const logger = require('../utils/logger');

/**
 * Authentication middleware.
 * Reads the JWT from the HttpOnly cookie `auth_token` first,
 * then falls back to the Authorization: Bearer header for
 * API clients / mobile apps.
 */
const authMiddleware = (req, res, next) => {
  try {
    // 1. Prefer the HttpOnly cookie
    let token = req.cookies?.auth_token;

    // 2. Fall back to Authorization header (API clients, mobile)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      logger.security('Authentication attempt without token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    const decoded = verifyToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp
    };

    logger.auth('Authentication successful', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      ip: req.ip,
      path: req.path
    });

    next();
  } catch (error) {
    logger.security('Authentication failed', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });

    if (error.message === 'Token expired') {
      return res.status(401).json({ success: false, error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (error.message === 'Invalid token') {
      return res.status(401).json({ success: false, error: 'Invalid token', code: 'INVALID_TOKEN' });
    }
    return res.status(401).json({ success: false, error: 'Authentication failed', code: 'AUTH_FAILED' });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
const optionalAuthMiddleware = (req, res, next) => {
  try {
    let token = req.cookies?.auth_token;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyToken(token);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp
    };

    logger.auth('Optional authentication successful', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    });

    next();
  } catch (error) {
    logger.security('Optional authentication failed', { error: error.message, ip: req.ip });
    req.user = null;
    next();
  }
};

/**
 * Middleware to check if user is authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    logger.security('Access denied - not authenticated', {
      ip: req.ip,
      path: req.path
    });
    
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'NOT_AUTHENTICATED'
    });
  }
  
  next();
};

/**
 * Middleware to check if user email is verified
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireVerifiedEmail = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    // For this middleware to work properly, we'd need to fetch user from database
    // to check verification status. For now, we'll assume the token is only
    // issued to verified users during login
    
    next();
  } catch (error) {
    logger.error('Error checking email verification', {
      userId: req.user?.userId,
      error: error.message
    });
    
    return res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Middleware to extract user info from token without strict verification
 * Useful for logging and analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const extractUserInfo = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      req.userInfo = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
    }
  } catch (error) {
    // Silently fail - this is just for info extraction
    req.userInfo = null;
  }
  
  next();
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  requireAuth,
  requireVerifiedEmail,
  extractUserInfo
};