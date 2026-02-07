const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import utilities and middleware
const { testConnection, validateSchema } = require('./utils/dbQueries');
const { validateJWTConfig } = require('./utils/jwtUtils');
const logger = require('./utils/logger');

// Import middleware
const {
  corsMiddleware,
  securityHeaders,
  sanitizeInput,
  requestLogger,
  sanitizeError,
  suspiciousActivityDetection
} = require('./middlewares/securityMiddleware');
const { generalRateLimiter } = require('./middlewares/rateLimitMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');

// Create Express app
const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware (applied first)
app.use(securityHeaders);
app.use(corsMiddleware);

// CORS configuration (fallback)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security and logging middleware
app.use(requestLogger);
app.use(sanitizeInput);
app.use(suspiciousActivityDetection);

// Rate limiting (applied to all routes)
app.use(generalRateLimiter);

// API routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'FreelanceHub Authentication Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'FreelanceHub Authentication API',
    version: '1.0.0',
    description: 'Authentication and user management API for FreelanceHub',
    endpoints: {
      auth: '/api/auth',
      health: '/health'
    },
    documentation: 'See README.md for API documentation'
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handling middleware (must be last)
app.use(sanitizeError);

// Server startup function
const startServer = async () => {
  try {
    // Validate environment configuration
    logger.info('Starting FreelanceHub Authentication Server...');
    
    // Validate JWT configuration
    if (!validateJWTConfig()) {
      logger.error('JWT configuration validation failed');
      process.exit(1);
    }
    
    // Test database connection
    logger.info('Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Database connection failed');
      process.exit(1);
    }
    
    // Validate database schema
    logger.info('Validating database schema...');
    const schemaValid = await validateSchema();
    if (!schemaValid) {
      logger.error('Database schema validation failed');
      logger.error('Please run the migration script: migrations/001_create_auth_tables.sql');
      process.exit(1);
    }
    
    // Start the server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📍 API available at http://localhost:${PORT}/api`);
      logger.info(`🏥 Health check at http://localhost:${PORT}/health`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info('📧 Email verification and password reset links will be logged to console');
      }
    });
    
    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        
        // Close database connections
        const { closeConnections } = require('./utils/dbQueries');
        closeConnections().then(() => {
          logger.info('Database connections closed');
          process.exit(0);
        }).catch((error) => {
          logger.error('Error closing database connections:', error);
          process.exit(1);
        });
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };
    
    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;