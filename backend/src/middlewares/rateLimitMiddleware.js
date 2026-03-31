const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Create rate limiter with custom configuration
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express middleware function
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      logger.security('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });
      
      res.status(429).json(options.message || defaultOptions.message);
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    }
  };
  
  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res) => {
    logger.security('Authentication rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(15 * 60) // 15 minutes in seconds
    });
  }
});

/**
 * Password reset rate limiter
 * 3 requests per hour
 */
const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: 'Too many password reset attempts, please try again later',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res) => {
    logger.security('Password reset rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email: req.body?.email
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many password reset attempts, please try again later',
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(60 * 60) // 1 hour in seconds
    });
  }
});

/**
 * Registration rate limiter
 * 3 registrations per hour per IP
 */
const registrationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registrations per hour
  message: {
    success: false,
    error: 'Too many registration attempts, please try again later',
    code: 'REGISTRATION_RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res) => {
    logger.security('Registration rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email: req.body?.email
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many registration attempts, please try again later',
      code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(60 * 60) // 1 hour in seconds
    });
  }
});

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const generalRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'GENERAL_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Profile update rate limiter
 * 10 updates per hour
 */
const profileUpdateRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 profile updates per hour
  message: {
    success: false,
    error: 'Too many profile update attempts, please try again later',
    code: 'PROFILE_UPDATE_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Email verification rate limiter
 * 10 verification attempts per hour
 */
const emailVerificationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 verification attempts per hour
  message: {
    success: false,
    error: 'Too many email verification attempts, please try again later',
    code: 'EMAIL_VERIFICATION_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Create user-based rate limiter (requires authentication)
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express middleware function
 */
const createUserRateLimiter = (options = {}) => {
  const store = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next(); // Skip if not authenticated
    }
    
    const userId = req.user.userId;
    const now = Date.now();
    const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    const max = options.max || 50;
    
    // Clean up old entries
    for (const [key, data] of store.entries()) {
      if (now - data.resetTime > windowMs) {
        store.delete(key);
      }
    }
    
    // Get or create user entry
    let userEntry = store.get(userId);
    if (!userEntry || now - userEntry.resetTime > windowMs) {
      userEntry = {
        count: 0,
        resetTime: now
      };
      store.set(userId, userEntry);
    }
    
    userEntry.count++;
    
    if (userEntry.count > max) {
      logger.security('User rate limit exceeded', {
        userId,
        count: userEntry.count,
        max,
        path: req.path
      });
      
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later',
        code: 'USER_RATE_LIMIT_EXCEEDED'
      });
    }
    
    next();
  };
};

/**
 * Middleware to log rate limit information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const logRateLimit = (req, res, next) => {
  const rateLimitInfo = {
    limit: res.get('RateLimit-Limit'),
    remaining: res.get('RateLimit-Remaining'),
    reset: res.get('RateLimit-Reset')
  };
  
  if (rateLimitInfo.limit) {
    logger.debug('Rate limit info', {
      ip: req.ip,
      path: req.path,
      ...rateLimitInfo
    });
  }
  
  next();
};

/**
 * Image upload rate limiter
 * 5 uploads per hour
 */
const imageUploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 image uploads per hour
  message: {
    success: false,
    error: 'Too many image upload attempts, please try again later',
    code: 'IMAGE_UPLOAD_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Search rate limiter
 * 500 searches per hour (very generous for authenticated users)
 */
const searchRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500, // Limit each IP to 500 searches per hour
  message: {
    success: false,
    error: 'Too many search requests, please try again later',
    code: 'SEARCH_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Project creation rate limiter
 * 10 projects per hour
 */
const projectCreateRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 project creations per hour
  message: {
    success: false,
    error: 'Too many project creation attempts, please try again later',
    code: 'PROJECT_CREATE_RATE_LIMIT_EXCEEDED'
  },
  keyGenerator: (req) => req.user?.userId || req.ip
});

/**
 * Project update rate limiter
 * 20 updates per hour
 */
const projectUpdateRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 project updates per hour
  message: {
    success: false,
    error: 'Too many project update attempts, please try again later',
    code: 'PROJECT_UPDATE_RATE_LIMIT_EXCEEDED'
  },
  keyGenerator: (req) => req.user?.userId || req.ip
});

module.exports = {
  createRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  registrationRateLimiter,
  generalRateLimiter,
  profileUpdateRateLimiter,
  emailVerificationRateLimiter,
  imageUploadRateLimiter,
  searchRateLimiter,
  projectCreateRateLimiter,
  projectUpdateRateLimiter,
  createUserRateLimiter,
  logRateLimit
};