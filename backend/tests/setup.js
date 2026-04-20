// Test setup file
// Runs before all tests

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jwt-tokens';
process.env.JWT_EXPIRES_IN = '24h';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/freelancehub_test';
process.env.EMAIL_HOST = 'smtp.test.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'test@test.com';
process.env.EMAIL_PASSWORD = 'test-password';
process.env.EMAIL_FROM = 'noreply@freelancehub.com';

// Increase timeout for all tests
jest.setTimeout(10000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
