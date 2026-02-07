const jwt = require('jsonwebtoken');
const logger = require('./logger');

/**
 * Generate JWT token for user
 * @param {Object} payload - Token payload
 * @param {string} payload.userId - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = null) => {
  try {
    const { userId, email, role } = payload;
    
    if (!userId || !email || !role) {
      throw new Error('Missing required payload fields for JWT token');
    }
    
    const tokenPayload = {
      userId,
      email,
      role,
      iat: Math.floor(Date.now() / 1000)
    };
    
    const options = {
      expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '24h'
    };
    
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, options);
    
    logger.auth('JWT token generated', { 
      userId, 
      email, 
      role, 
      expiresIn: options.expiresIn 
    });
    
    return token;
  } catch (error) {
    logger.error('JWT token generation failed', { 
      payload, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    if (!token) {
      throw new Error('No token provided');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    logger.auth('JWT token verified', { 
      userId: decoded.userId, 
      email: decoded.email, 
      role: decoded.role 
    });
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.security('JWT token expired', { 
        token: token.substring(0, 20) + '...',
        expiredAt: error.expiredAt 
      });
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      logger.security('Invalid JWT token', { 
        token: token.substring(0, 20) + '...',
        error: error.message 
      });
      throw new Error('Invalid token');
    } else {
      logger.error('JWT token verification failed', { 
        token: token.substring(0, 20) + '...',
        error: error.message 
      });
      throw error;
    }
  }
};

/**
 * Decode JWT token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
const decodeToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    logger.error('JWT token decode failed', { 
      token: token.substring(0, 20) + '...',
      error: error.message 
    });
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is expired
 */
const isTokenExpired = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    logger.error('Error checking token expiration', { 
      token: token.substring(0, 20) + '...',
      error: error.message 
    });
    return true;
  }
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date or null
 */
const getTokenExpiration = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    logger.error('Error getting token expiration', { 
      token: token.substring(0, 20) + '...',
      error: error.message 
    });
    return null;
  }
};

/**
 * Refresh token (generate new token with same payload)
 * @param {string} token - Current JWT token
 * @param {string} expiresIn - New expiration time
 * @returns {string} New JWT token
 */
const refreshToken = (token, expiresIn = null) => {
  try {
    const decoded = verifyToken(token);
    
    // Remove JWT specific fields
    const { iat, exp, ...payload } = decoded;
    
    return generateToken(payload, expiresIn);
  } catch (error) {
    logger.error('Token refresh failed', { 
      token: token.substring(0, 20) + '...',
      error: error.message 
    });
    throw error;
  }
};

/**
 * Validate JWT secret configuration
 * @returns {boolean} True if JWT secret is properly configured
 */
const validateJWTConfig = () => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    logger.error('JWT_SECRET environment variable is not set');
    return false;
  }
  
  if (secret.length < 32) {
    logger.error('JWT_SECRET should be at least 32 characters long for security');
    return false;
  }
  
  logger.info('JWT configuration validated successfully');
  return true;
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  refreshToken,
  validateJWTConfig
};