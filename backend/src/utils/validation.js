/**
 * Validation utilities for input sanitization and validation
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Validation result
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with details
 */
const validatePassword = (password) => {
  const result = {
    isValid: true,
    errors: []
  };

  if (!password || password.length < 8) {
    result.isValid = false;
    result.errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one number');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one special character');
  }

  return result;
};

/**
 * Validate user role
 * @param {string} role - Role to validate
 * @returns {boolean} Validation result
 */
const isValidRole = (role) => {
  const validRoles = ['ADMIN', 'FREELANCER', 'CLIENT'];
  return validRoles.includes(role);
};

/**
 * Validate phone number format (Nepal format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Validation result
 */
const isValidPhone = (phone) => {
  if (!phone) return true; // Phone is optional
  
  // Nepal phone number patterns
  const phoneRegex = /^(\+977[-\s]?)?[0-9]{10}$|^(\+977[-\s]?)?[0-9]{3}[-\s]?[0-9]{7}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} Validation result
 */
const isValidUrl = (url) => {
  if (!url) return true; // URL is optional
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sanitize string input by removing potentially harmful characters
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

/**
 * Validate and sanitize user registration data
 * @param {Object} userData - User data to validate
 * @returns {Object} Validation result
 */
const validateRegistrationData = (userData) => {
  const result = {
    isValid: true,
    errors: [],
    sanitizedData: {}
  };

  const { email, password, confirmPassword, fullName, role, phone } = userData;

  // Required fields validation
  if (!email) {
    result.isValid = false;
    result.errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    result.isValid = false;
    result.errors.push('Invalid email format');
  } else {
    result.sanitizedData.email = email.toLowerCase().trim();
  }

  if (!password) {
    result.isValid = false;
    result.errors.push('Password is required');
  } else {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      result.isValid = false;
      result.errors.push(...passwordValidation.errors);
    } else {
      result.sanitizedData.password = password;
    }
  }

  if (!confirmPassword) {
    result.isValid = false;
    result.errors.push('Password confirmation is required');
  } else if (password !== confirmPassword) {
    result.isValid = false;
    result.errors.push('Passwords do not match');
  }

  if (!fullName) {
    result.isValid = false;
    result.errors.push('Full name is required');
  } else if (fullName.trim().length < 2) {
    result.isValid = false;
    result.errors.push('Full name must be at least 2 characters long');
  } else {
    result.sanitizedData.fullName = sanitizeString(fullName);
  }

  if (!role) {
    result.isValid = false;
    result.errors.push('Role is required');
  } else if (!isValidRole(role)) {
    result.isValid = false;
    result.errors.push('Invalid role selected');
  } else {
    result.sanitizedData.role = role;
  }

  if (phone && !isValidPhone(phone)) {
    result.isValid = false;
    result.errors.push('Invalid phone number format');
  } else if (phone) {
    result.sanitizedData.phone = sanitizeString(phone);
  }

  return result;
};

/**
 * Validate login data
 * @param {Object} loginData - Login data to validate
 * @returns {Object} Validation result
 */
const validateLoginData = (loginData) => {
  const result = {
    isValid: true,
    errors: [],
    sanitizedData: {}
  };

  const { email, password } = loginData;

  if (!email) {
    result.isValid = false;
    result.errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    result.isValid = false;
    result.errors.push('Invalid email format');
  } else {
    result.sanitizedData.email = email.toLowerCase().trim();
  }

  if (!password) {
    result.isValid = false;
    result.errors.push('Password is required');
  } else {
    result.sanitizedData.password = password;
  }

  return result;
};

module.exports = {
  isValidEmail,
  validatePassword,
  isValidRole,
  isValidPhone,
  isValidUrl,
  sanitizeString,
  validateRegistrationData,
  validateLoginData
};