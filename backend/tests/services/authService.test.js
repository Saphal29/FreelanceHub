/**
 * ============================================
 * AUTH SERVICE - UNIT TESTS
 * ============================================
 * Tests for authentication service functions
 * Covers: registration, login, OTP verification, password reset
 */

const bcrypt = require('bcrypt');
const authService = require('../../src/services/authService');

// Mock dependencies
jest.mock('../../src/utils/dbQueries');
jest.mock('../../src/services/emailService');
jest.mock('bcrypt');

const { query, transaction } = require('../../src/utils/dbQueries');
const emailService = require('../../src/services/emailService');

describe('Auth Service - Unit Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // UT-01: Register with valid data
  // ============================================
  describe('UT-01: Register with valid data', () => {
    it('should create user and send OTP when registration data is valid', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Test User',
        role: 'FREELANCER'
      };

      // Mock: Password hashing
      bcrypt.hash.mockResolvedValue('hashed_password');
      
      // Mock: Transaction for user creation
      transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn()
            .mockResolvedValueOnce({
              rows: [{
                id: 'user-uuid-123',
                email: 'test@example.com',
                full_name: 'Test User',
                role: 'FREELANCER',
                verified: false,
                created_at: new Date()
              }]
            })
            .mockResolvedValueOnce({ rows: [] }) // Profile creation
        };
        return await callback(mockClient);
      });
      
      // Mock: Email sending
      emailService.sendOTPEmail.mockResolvedValue({ success: true });

      const result = await authService.createUser(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('otp');
      expect(result.user.email).toBe('test@example.com');
      expect(emailService.sendOTPEmail).toHaveBeenCalled();
    });
  });

  // ============================================
  // UT-02: Check if email exists
  // ============================================
  describe('UT-02: Check if email exists', () => {
    it('should return true when email already exists', async () => {
      const email = 'existing@example.com';

      // Mock: Email already exists
      query.mockResolvedValueOnce({
        rows: [{ id: 'existing-user-id' }]
      });

      const result = await authService.emailExists(email);

      expect(result).toBe(true);
    });
  });

  // ============================================
  // UT-03: Find user by email
  // ============================================
  describe('UT-03: Find user by email', () => {
    it('should return user when email exists', async () => {
      const email = 'test@example.com';

      // Mock: User exists
      query.mockResolvedValueOnce({
        rows: [{
          id: 'user-uuid-123',
          email: 'test@example.com',
          password_hash: 'hashed_password',
          role: 'FREELANCER',
          full_name: 'Test User',
          verified: true
        }]
      });

      const result = await authService.findUserByEmail(email);

      expect(result).toHaveProperty('id');
      expect(result.email).toBe(email);
      expect(result.role).toBe('FREELANCER');
    });
  });

  // ============================================
  // UT-04: Find user by ID
  // ============================================
  describe('UT-04: Find user by ID', () => {
    it('should return user when ID exists', async () => {
      const userId = 'user-uuid-123';

      // Mock: User exists
      query.mockResolvedValueOnce({
        rows: [{
          id: userId,
          email: 'test@example.com',
          role: 'FREELANCER',
          full_name: 'Test User',
          verified: true
        }]
      });

      const result = await authService.findUserById(userId);

      expect(result).toHaveProperty('id');
      expect(result.id).toBe(userId);
    });
  });

  // ============================================
  // UT-05: OTP verification with expired OTP
  // ============================================
  describe('UT-05: OTP verification with expired OTP', () => {
    it('should return error when OTP is expired', async () => {
      const email = 'test@example.com';
      const otp = '123456';

      // Mock: OTP exists but expired (created 11 minutes ago)
      const expiredDate = new Date(Date.now() - 11 * 60 * 1000);
      query.mockResolvedValueOnce({
        rows: [{
          id: 'user-uuid-123',
          email: email,
          full_name: 'Test User',
          role: 'FREELANCER',
          verified: false,
          verification_otp: otp,
          otp_expires_at: expiredDate,
          otp_attempts: 0
        }]
      });

      const result = await authService.verifyEmailWithOTP(email, otp);

      expect(result.success).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  // ============================================
  // UT-06: OTP verification with valid OTP
  // ============================================
  describe('UT-06: OTP verification with valid OTP', () => {
    it('should verify user when OTP is valid', async () => {
      const email = 'test@example.com';
      const otp = '123456';

      // Mock: Valid OTP (created 5 minutes ago)
      const validDate = new Date(Date.now() + 5 * 60 * 1000); // Future date (not expired)
      query.mockResolvedValueOnce({
        rows: [{
          id: 'user-uuid-123',
          email: email,
          full_name: 'Test User',
          role: 'FREELANCER',
          verified: false,
          verification_otp: otp,
          otp_expires_at: validDate,
          otp_attempts: 0
        }]
      });

      // Mock: User verification update
      query.mockResolvedValueOnce({
        rows: [{
          id: 'user-uuid-123',
          email: email,
          full_name: 'Test User',
          role: 'FREELANCER',
          verified: true
        }]
      });

      const result = await authService.verifyEmailWithOTP(email, otp);

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('user');
      expect(result.user.verified).toBe(true);
    });
  });

  // ============================================
  // UT-07: OTP verification with incorrect OTP
  // ============================================
  describe('UT-07: OTP verification with incorrect OTP', () => {
    it('should return error when OTP is incorrect', async () => {
      const email = 'test@example.com';
      const wrongOtp = '999999';

      // Mock: User with different OTP
      const validDate = new Date(Date.now() + 5 * 60 * 1000);
      query.mockResolvedValueOnce({
        rows: [{
          id: 'user-uuid-123',
          email: email,
          full_name: 'Test User',
          role: 'FREELANCER',
          verified: false,
          verification_otp: '123456', // Correct OTP
          otp_expires_at: validDate,
          otp_attempts: 0
        }]
      });

      // Mock: Increment attempts
      query.mockResolvedValueOnce({ rows: [] });

      const result = await authService.verifyEmailWithOTP(email, wrongOtp);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Incorrect OTP');
    });
  });

  // ============================================
  // UT-08: OTP verification with too many attempts
  // ============================================
  describe('UT-08: OTP verification with too many attempts', () => {
    it('should return error when too many failed attempts', async () => {
      const email = 'test@example.com';
      const otp = '123456';

      // Mock: User with max attempts
      const validDate = new Date(Date.now() + 5 * 60 * 1000);
      query.mockResolvedValueOnce({
        rows: [{
          id: 'user-uuid-123',
          email: email,
          full_name: 'Test User',
          role: 'FREELANCER',
          verified: false,
          verification_otp: otp,
          otp_expires_at: validDate,
          otp_attempts: 5 // Max attempts reached
        }]
      });

      const result = await authService.verifyEmailWithOTP(email, otp);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Too many failed attempts');
    });
  });

  // ============================================
  // UT-09: Resend OTP for valid email
  // ============================================
  describe('UT-09: Resend OTP for valid email', () => {
    it('should generate and send new OTP', async () => {
      const email = 'test@example.com';

      // Mock: Unverified user exists
      query.mockResolvedValueOnce({
        rows: [{
          id: 'user-uuid-123',
          email: email,
          full_name: 'Test User',
          verified: false
        }]
      });

      // Mock: Update with new OTP
      query.mockResolvedValueOnce({ rows: [] });

      // Mock: Email sending
      emailService.sendOTPEmail.mockResolvedValue({ success: true });

      const result = await authService.resendOTP(email);

      expect(result.success).toBe(true);
      expect(result.message).toContain('OTP sent');
      expect(emailService.sendOTPEmail).toHaveBeenCalled();
    });
  });

  // ============================================
  // UT-10: Update last login timestamp
  // ============================================
  describe('UT-10: Update last login timestamp', () => {
    it('should update last login for user', async () => {
      const userId = 'user-uuid-123';

      // Mock: Update query
      query.mockResolvedValueOnce({ rows: [] });

      await authService.updateLastLogin(userId);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET last_login'),
        [userId]
      );
    });
  });

});

