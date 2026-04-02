const path = require('path');

// Load environment variables
require('dotenv').config();

// Environment configuration
const config = {
  // Server Configuration
  port: parseInt(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'freelancehub_pro',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000, // Increased from 2000 to 10000 for Render
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    algorithm: 'HS256',
  },

  // Email Configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    fromName: process.env.EMAIL_FROM_NAME || 'FreelanceHub',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@freelancehub.com',
    googleScriptUrl: process.env.GOOGLE_SCRIPT_URL || '',
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    trustProxy: process.env.TRUST_PROXY === 'true',
  },

  // Application URLs
  urls: {
    frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
    backend: process.env.BACKEND_URL || 'http://localhost:5000',
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  },

  // Redis Configuration (optional)
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: !!process.env.REDIS_URL,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
    enableConsole: process.env.NODE_ENV === 'development',
    enableFile: process.env.NODE_ENV === 'production',
  },

  // Feature Flags
  features: {
    registration: process.env.ENABLE_REGISTRATION !== 'false',
    emailVerification: process.env.ENABLE_EMAIL_VERIFICATION !== 'false',
    passwordReset: process.env.ENABLE_PASSWORD_RESET !== 'false',
    rateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
  },

  // Development Settings
  development: {
    debugMode: process.env.DEBUG_MODE === 'true',
    enableCors: process.env.ENABLE_CORS !== 'false',
    logQueries: process.env.LOG_QUERIES === 'true',
    seedDatabase: process.env.SEED_DATABASE === 'true',
  },

  // Email Templates
  emailTemplates: {
    verification: {
      subject: 'Verify your FreelanceHub account',
      template: 'verification',
    },
    passwordReset: {
      subject: 'Reset your FreelanceHub password',
      template: 'password-reset',
    },
    welcome: {
      subject: 'Welcome to FreelanceHub',
      template: 'welcome',
    },
  },

  // Token Expiration Times
  tokens: {
    emailVerification: 24 * 60 * 60 * 1000, // 24 hours
    passwordReset: 60 * 60 * 1000, // 1 hour
    refreshToken: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
};

// Helper functions
const isDevelopment = () => config.nodeEnv === 'development';
const isProduction = () => config.nodeEnv === 'production';
const isTest = () => config.nodeEnv === 'test';

// Validation function
function validateConfig() {
  const requiredFields = [
    'jwt.secret',
    'database.host',
    'database.name',
    'database.user',
  ];

  const missingFields = [];

  requiredFields.forEach(field => {
    const keys = field.split('.');
    let value = config;
    
    for (const key of keys) {
      value = value[key];
      if (value === undefined || value === '') {
        missingFields.push(field);
        break;
      }
    }
  });

  if (missingFields.length > 0) {
    throw new Error(`Missing required environment variables: ${missingFields.join(', ')}`);
  }

  // Validate JWT secret in production
  if (isProduction() && config.jwt.secret === 'your-super-secret-jwt-key-change-this-in-production') {
    throw new Error('JWT_SECRET must be changed in production');
  }

  // Validate email configuration if email features are enabled
  if (config.features.emailVerification || config.features.passwordReset) {
    if (!config.email.user || !config.email.password) {
      console.warn('⚠️  Email configuration incomplete. Email features may not work.');
    }
  }

  return true;
}

// Initialize validation
try {
  validateConfig();
  if (isDevelopment()) {
    console.log('✅ Environment configuration validated successfully');
  }
} catch (error) {
  console.error('❌ Environment configuration validation failed:', error.message);
  process.exit(1);
}

module.exports = {
  ...config,
  isDevelopment,
  isProduction,
  isTest,
  validateConfig,
};