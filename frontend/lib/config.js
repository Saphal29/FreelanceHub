// Frontend configuration
const config = {
  // API Configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // App Information
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'FreelanceHub',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Security
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableErrorReporting: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true',

  // Feature Flags
  features: {
    registration: process.env.NEXT_PUBLIC_ENABLE_REGISTRATION !== 'false',
    passwordReset: process.env.NEXT_PUBLIC_ENABLE_PASSWORD_RESET !== 'false',
    emailVerification: process.env.NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION !== 'false',
  },

  // Development Settings
  debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  showDevTools: process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS === 'true',

  // API Timeouts
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },

  // Authentication
  auth: {
    tokenKey: 'auth_token',
    userKey: 'auth_user',
    refreshTokenKey: 'refresh_token',
    sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  },

  // UI Configuration
  ui: {
    toastDuration: 5000, // 5 seconds
    loadingDelay: 200, // Show loading after 200ms
    debounceDelay: 300, // 300ms for search inputs
  },

  // Validation
  validation: {
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
    name: {
      minLength: 2,
      maxLength: 50,
    },
    bio: {
      maxLength: 500,
    },
    skills: {
      maxItems: 20,
      maxLength: 100,
    },
  },

  // File Upload
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },

  // External Services
  services: {
    // Add external service configurations here
    // analytics: { ... },
    // errorReporting: { ... },
  },
};

// Validation function to ensure required config is present
export function validateConfig() {
  const requiredFields = [
    'apiUrl',
    'appUrl',
    'appName',
  ];

  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
  }

  // Validate URLs
  try {
    new URL(config.apiUrl);
    new URL(config.appUrl);
  } catch (error) {
    throw new Error('Invalid URL configuration');
  }

  return true;
}

// Helper functions
export function getApiUrl(endpoint = '') {
  return `${config.apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

export function getAppUrl(path = '') {
  return `${config.appUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function isFeatureEnabled(feature) {
  return config.features[feature] === true;
}

export function isDevelopment() {
  return config.isDevelopment;
}

export function isProduction() {
  return config.isProduction;
}

// Initialize configuration validation in development
if (config.isDevelopment) {
  try {
    validateConfig();
    console.log('✅ Configuration validated successfully');
  } catch (error) {
    console.error('❌ Configuration validation failed:', error.message);
  }
}

export default config;