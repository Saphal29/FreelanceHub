const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
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
const profileRoutes = require('./routes/profileRoutes');
const projectRoutes = require('./routes/projectRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

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

// Increase timeout for slow Render startup (120 seconds)
app.use((req, res, next) => {
  req.setTimeout(120000); // 120 seconds
  res.setTimeout(120000); // 120 seconds
  next();
});

// Security and logging middleware
app.use(requestLogger);
app.use(sanitizeInput);
app.use(suspiciousActivityDetection);

// Rate limiting (applied to all routes)
app.use(generalRateLimiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contracts', require('./routes/contractRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/time', require('./routes/timeTrackingRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/calls', require('./routes/callRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/milestones', require('./routes/milestoneRoutes'));
app.use('/api/disputes', require('./routes/disputeRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/invites', require('./routes/inviteRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));

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
    const httpServer = http.createServer(app);

    // Initialize Socket.io
    const io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          // In development, allow all origins from local network
          if (process.env.NODE_ENV === 'development') {
            const allowedOrigins = [
              process.env.FRONTEND_URL || 'http://localhost:3000',
              'http://localhost:3000',
              'http://192.168.44.82:3000',
              'https://localhost:3000',
              'https://192.168.44.82:3000'
            ];
            
            // Allow any origin from 192.168.x.x network
            if (!origin || allowedOrigins.includes(origin) || /^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin)) {
              callback(null, true);
            } else {
              callback(new Error('Not allowed by CORS'));
            }
          } else {
            // Production: strict origin checking
            const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:3000'];
            if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true);
            } else {
              callback(new Error('Not allowed by CORS'));
            }
          }
        },
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    const { initSocket } = require('./socket/socketHandler');
    initSocket(io);

    const { initVideoSignaling } = require('./socket/videoSignalingHandler');
    initVideoSignaling(io);

    const server = httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📍 API available at http://localhost:${PORT}/api`);
      logger.info(`📍 Network API available at http://192.168.44.82:${PORT}/api`);
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
