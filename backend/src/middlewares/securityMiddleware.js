const logger = require('../utils/logger');

/**
 * CORS middleware configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const corsMiddleware = (req, res, next) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.100.6:3000',  // Local WiFi network access (HTTP)
    'https://localhost:3000',      // HTTPS localhost
    'https://192.168.100.6:3000'   // HTTPS network access
  ];
  
  const origin = req.headers.origin;
  
  // In development, allow all origins from local network
  if (process.env.NODE_ENV === 'development' && origin) {
    // Allow any origin from 192.168.x.x network
    if (origin.match(/^http:\/\/192\.168\.\d+\.\d+:\d+$/)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  } else if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

/**
 * Security headers middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy - allow websockets and API connections from local network
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "connect-src 'self' ws://localhost:5000 wss://localhost:5000 http://localhost:5000 " +
      "ws://192.168.100.6:5000 wss://192.168.100.6:5000 http://192.168.100.6:5000"
    );
  } else {
    res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self' ws://localhost:5000 wss://localhost:5000 http://localhost:5000");
  }
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * Input sanitization middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    logger.error('Input sanitization error', {
      error: error.message,
      path: req.path
    });
    
    return res.status(400).json({
      success: false,
      error: 'Invalid input data',
      code: 'INVALID_INPUT'
    });
  }
};

/**
 * Sanitize object recursively
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeValue(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeValue(key);
    sanitized[sanitizedKey] = sanitizeObject(value);
  }
  
  return sanitized;
};

/**
 * Sanitize individual value
 * @param {any} value - Value to sanitize
 * @returns {any} Sanitized value
 */
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    // Remove potential XSS vectors
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  
  return value;
};

/**
 * Request logging middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId || 'anonymous'
  });
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.userId || 'anonymous'
    });
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Error sanitization middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const sanitizeError = (err, req, res, next) => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId
  });
  
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  let errorMessage = 'Internal server error';
  let errorCode = 'SERVER_ERROR';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    errorMessage = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
    res.status(400);
  } else if (err.name === 'UnauthorizedError') {
    errorMessage = 'Unauthorized access';
    errorCode = 'UNAUTHORIZED';
    res.status(401);
  } else if (err.name === 'ForbiddenError') {
    errorMessage = 'Access forbidden';
    errorCode = 'FORBIDDEN';
    res.status(403);
  } else {
    res.status(500);
  }
  
  const errorResponse = {
    success: false,
    error: errorMessage,
    code: errorCode
  };
  
  // Include error details in development
  if (isDevelopment) {
    errorResponse.details = {
      message: err.message,
      stack: err.stack
    };
  }
  
  res.json(errorResponse);
};

/**
 * IP whitelist middleware (for admin endpoints)
 * @param {Array<string>} allowedIPs - Array of allowed IP addresses
 * @returns {Function} Express middleware function
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.length === 0) {
      return next(); // No restrictions if no IPs specified
    }
    
    if (!allowedIPs.includes(clientIP)) {
      logger.security('IP access denied', {
        ip: clientIP,
        path: req.path,
        allowedIPs
      });
      
      return res.status(403).json({
        success: false,
        error: 'Access denied from this IP address',
        code: 'IP_FORBIDDEN'
      });
    }
    
    next();
  };
};

/**
 * Suspicious activity detection middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const suspiciousActivityDetection = (req, res, next) => {
  // More specific SQL injection patterns that look for actual SQL syntax
  const suspiciousPatterns = [
    /(\bunion\s+select\b|\bselect\s+.*\s+from\b)/i, // SQL injection with SELECT FROM
    /(\bdrop\s+table\b|\bdrop\s+database\b)/i, // DROP statements
    /(\binsert\s+into\b.*\bvalues\b)/i, // INSERT statements
    /(\bdelete\s+from\b)/i, // DELETE statements
    /(\bupdate\s+.*\s+set\b)/i, // UPDATE statements
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS
    /\.\.\//g, // Path traversal
    /\bjavascript:/gi // JavaScript protocol
  ];
  
  const checkString = JSON.stringify(req.body) + JSON.stringify(req.query) + req.path;
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      logger.security('Suspicious activity detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        pattern: pattern.toString(),
        userId: req.user?.userId
      });
      
      return res.status(400).json({
        success: false,
        error: 'Suspicious activity detected',
        code: 'SUSPICIOUS_ACTIVITY'
      });
    }
  }
  
  next();
};

module.exports = {
  corsMiddleware,
  securityHeaders,
  sanitizeInput,
  requestLogger,
  sanitizeError,
  ipWhitelist,
  suspiciousActivityDetection
};