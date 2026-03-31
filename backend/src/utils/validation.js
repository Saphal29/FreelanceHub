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

/**
 * Validate profile data based on user role
 * @param {Object} profileData - Profile data to validate
 * @param {string} role - User role (FREELANCER or CLIENT)
 * @param {boolean} partial - Whether this is a partial update
 * @returns {Object} Validation result
 */
const validateProfileData = (profileData, role, partial = false) => {
  const result = {
    isValid: true,
    errors: [],
    sanitizedData: {}
  };

  // Base user fields validation
  if (profileData.fullName !== undefined) {
    if (!partial && !profileData.fullName) {
      result.isValid = false;
      result.errors.push('Full name is required');
    } else if (profileData.fullName && profileData.fullName.trim().length < 2) {
      result.isValid = false;
      result.errors.push('Full name must be at least 2 characters long');
    } else if (profileData.fullName && profileData.fullName.trim().length > 100) {
      result.isValid = false;
      result.errors.push('Full name must be less than 100 characters');
    } else if (profileData.fullName) {
      result.sanitizedData.fullName = sanitizeString(profileData.fullName);
    }
  }

  if (profileData.phone !== undefined) {
    if (profileData.phone && !isValidPhone(profileData.phone)) {
      result.isValid = false;
      result.errors.push('Invalid phone number format');
    } else if (profileData.phone) {
      result.sanitizedData.phone = sanitizeString(profileData.phone);
    }
  }

  if (profileData.location !== undefined) {
    if (profileData.location && profileData.location.trim().length > 255) {
      result.isValid = false;
      result.errors.push('Location must be less than 255 characters');
    } else if (profileData.location) {
      result.sanitizedData.location = sanitizeString(profileData.location);
    }
  }

  if (profileData.website !== undefined) {
    if (profileData.website && !isValidUrl(profileData.website)) {
      result.isValid = false;
      result.errors.push('Invalid website URL format');
    } else if (profileData.website) {
      result.sanitizedData.website = sanitizeString(profileData.website);
    }
  }

  // Role-specific validation
  if (role === 'FREELANCER') {
    // Freelancer-specific fields
    if (profileData.title !== undefined) {
      if (profileData.title && profileData.title.trim().length > 255) {
        result.isValid = false;
        result.errors.push('Professional title must be less than 255 characters');
      } else if (profileData.title) {
        result.sanitizedData.title = sanitizeString(profileData.title);
      }
    }

    if (profileData.bio !== undefined) {
      if (profileData.bio && profileData.bio.trim().length > 500) {
        result.isValid = false;
        result.errors.push('Bio must be less than 500 characters');
      } else if (profileData.bio) {
        result.sanitizedData.bio = sanitizeString(profileData.bio);
      }
    }

    if (profileData.skills !== undefined) {
      if (profileData.skills && profileData.skills.trim().length > 1000) {
        result.isValid = false;
        result.errors.push('Skills must be less than 1000 characters');
      } else if (profileData.skills) {
        result.sanitizedData.skills = sanitizeString(profileData.skills);
      }
    }

    if (profileData.hourlyRate !== undefined) {
      const rate = parseFloat(profileData.hourlyRate);
      if (profileData.hourlyRate && (isNaN(rate) || rate < 0 || rate > 10000)) {
        result.isValid = false;
        result.errors.push('Hourly rate must be a valid number between 0 and 10000');
      } else if (profileData.hourlyRate) {
        result.sanitizedData.hourlyRate = rate;
      }
    }

    if (profileData.availabilityStatus !== undefined) {
      const validStatuses = ['available', 'busy', 'unavailable', 'vacation'];
      if (profileData.availabilityStatus && !validStatuses.includes(profileData.availabilityStatus)) {
        result.isValid = false;
        result.errors.push('Invalid availability status');
      } else if (profileData.availabilityStatus) {
        result.sanitizedData.availabilityStatus = profileData.availabilityStatus;
      }
    }

    if (profileData.languages !== undefined) {
      if (Array.isArray(profileData.languages)) {
        result.sanitizedData.languages = profileData.languages.map(lang => sanitizeString(lang));
      } else if (profileData.languages) {
        result.isValid = false;
        result.errors.push('Languages must be an array');
      }
    }

    if (profileData.timezone !== undefined) {
      if (profileData.timezone && profileData.timezone.trim().length > 100) {
        result.isValid = false;
        result.errors.push('Timezone must be less than 100 characters');
      } else if (profileData.timezone) {
        result.sanitizedData.timezone = sanitizeString(profileData.timezone);
      }
    }

  } else if (role === 'CLIENT') {
    // Client-specific fields
    if (profileData.companyName !== undefined) {
      if (profileData.companyName && profileData.companyName.trim().length > 255) {
        result.isValid = false;
        result.errors.push('Company name must be less than 255 characters');
      } else if (profileData.companyName) {
        result.sanitizedData.companyName = sanitizeString(profileData.companyName);
      }
    }

    if (profileData.industry !== undefined) {
      if (profileData.industry && profileData.industry.trim().length > 100) {
        result.isValid = false;
        result.errors.push('Industry must be less than 100 characters');
      } else if (profileData.industry) {
        result.sanitizedData.industry = sanitizeString(profileData.industry);
      }
    }

    if (profileData.companySize !== undefined) {
      const validSizes = ['1-10', '11-50', '51-200', '201-500', '500+'];
      if (profileData.companySize && !validSizes.includes(profileData.companySize)) {
        result.isValid = false;
        result.errors.push('Invalid company size');
      } else if (profileData.companySize) {
        result.sanitizedData.companySize = profileData.companySize;
      }
    }

    if (profileData.companyDescription !== undefined) {
      if (profileData.companyDescription && profileData.companyDescription.trim().length > 1000) {
        result.isValid = false;
        result.errors.push('Company description must be less than 1000 characters');
      } else if (profileData.companyDescription) {
        result.sanitizedData.companyDescription = sanitizeString(profileData.companyDescription);
      }
    }

    if (profileData.foundedYear !== undefined) {
      const year = parseInt(profileData.foundedYear);
      const currentYear = new Date().getFullYear();
      if (profileData.foundedYear && (isNaN(year) || year < 1800 || year > currentYear)) {
        result.isValid = false;
        result.errors.push(`Founded year must be between 1800 and ${currentYear}`);
      } else if (profileData.foundedYear) {
        result.sanitizedData.foundedYear = year;
      }
    }

    if (profileData.employeeCount !== undefined) {
      const count = parseInt(profileData.employeeCount);
      if (profileData.employeeCount && (isNaN(count) || count < 0 || count > 1000000)) {
        result.isValid = false;
        result.errors.push('Employee count must be a valid number between 0 and 1,000,000');
      } else if (profileData.employeeCount) {
        result.sanitizedData.employeeCount = count;
      }
    }

    if (profileData.annualRevenue !== undefined) {
      if (profileData.annualRevenue && profileData.annualRevenue.trim().length > 50) {
        result.isValid = false;
        result.errors.push('Annual revenue must be less than 50 characters');
      } else if (profileData.annualRevenue) {
        result.sanitizedData.annualRevenue = sanitizeString(profileData.annualRevenue);
      }
    }

    if (profileData.companyLogoUrl !== undefined) {
      if (profileData.companyLogoUrl && !isValidUrl(profileData.companyLogoUrl)) {
        result.isValid = false;
        result.errors.push('Invalid company logo URL format');
      } else if (profileData.companyLogoUrl) {
        result.sanitizedData.companyLogoUrl = sanitizeString(profileData.companyLogoUrl);
      }
    }

    if (profileData.linkedinUrl !== undefined) {
      if (profileData.linkedinUrl && !isValidUrl(profileData.linkedinUrl)) {
        result.isValid = false;
        result.errors.push('Invalid LinkedIn URL format');
      } else if (profileData.linkedinUrl) {
        result.sanitizedData.linkedinUrl = sanitizeString(profileData.linkedinUrl);
      }
    }

    if (profileData.twitterUrl !== undefined) {
      if (profileData.twitterUrl && !isValidUrl(profileData.twitterUrl)) {
        result.isValid = false;
        result.errors.push('Invalid Twitter URL format');
      } else if (profileData.twitterUrl) {
        result.sanitizedData.twitterUrl = sanitizeString(profileData.twitterUrl);
      }
    }

    if (profileData.facebookUrl !== undefined) {
      if (profileData.facebookUrl && !isValidUrl(profileData.facebookUrl)) {
        result.isValid = false;
        result.errors.push('Invalid Facebook URL format');
      } else if (profileData.facebookUrl) {
        result.sanitizedData.facebookUrl = sanitizeString(profileData.facebookUrl);
      }
    }

    if (profileData.preferredCommunication !== undefined) {
      const validMethods = ['email', 'chat', 'video', 'phone'];
      if (profileData.preferredCommunication && !validMethods.includes(profileData.preferredCommunication)) {
        result.isValid = false;
        result.errors.push('Invalid preferred communication method');
      } else if (profileData.preferredCommunication) {
        result.sanitizedData.preferredCommunication = profileData.preferredCommunication;
      }
    }
  }

  return result;
};

/**
 * Validate project data
 * @param {Object} projectData - Project data to validate
 * @param {boolean} partial - Whether this is a partial update
 * @returns {Object} Validation result
 */
const validateProjectData = (projectData, partial = false) => {
  const result = {
    isValid: true,
    errors: [],
    sanitizedData: {}
  };

  // Required fields for new projects
  if (!partial) {
    if (!projectData.title || projectData.title.trim().length === 0) {
      result.isValid = false;
      result.errors.push('Project title is required');
    }

    if (!projectData.description || projectData.description.trim().length === 0) {
      result.isValid = false;
      result.errors.push('Project description is required');
    }

    if (!projectData.category || projectData.category.trim().length === 0) {
      result.isValid = false;
      result.errors.push('Project category is required');
    }
  }

  // Title validation
  if (projectData.title !== undefined) {
    if (projectData.title && projectData.title.trim().length < 5) {
      result.isValid = false;
      result.errors.push('Project title must be at least 5 characters long');
    } else if (projectData.title && projectData.title.trim().length > 255) {
      result.isValid = false;
      result.errors.push('Project title must be less than 255 characters');
    } else if (projectData.title) {
      result.sanitizedData.title = sanitizeString(projectData.title);
    }
  }

  // Description validation
  if (projectData.description !== undefined) {
    if (projectData.description && projectData.description.trim().length < 20) {
      result.isValid = false;
      result.errors.push('Project description must be at least 20 characters long');
    } else if (projectData.description && projectData.description.trim().length > 5000) {
      result.isValid = false;
      result.errors.push('Project description must be less than 5000 characters');
    } else if (projectData.description) {
      result.sanitizedData.description = sanitizeString(projectData.description);
    }
  }

  // Category validation
  if (projectData.category !== undefined) {
    if (projectData.category && projectData.category.trim().length > 100) {
      result.isValid = false;
      result.errors.push('Category must be less than 100 characters');
    } else if (projectData.category) {
      result.sanitizedData.category = sanitizeString(projectData.category);
    }
  }

  // Skills validation
  if (projectData.skills !== undefined) {
    if (Array.isArray(projectData.skills)) {
      if (projectData.skills.length === 0 && !partial) {
        result.isValid = false;
        result.errors.push('At least one skill is required');
      } else if (projectData.skills.length > 20) {
        result.isValid = false;
        result.errors.push('Maximum 20 skills allowed');
      } else {
        result.sanitizedData.skills = projectData.skills.map(skill => sanitizeString(skill));
      }
    } else if (typeof projectData.skills === 'string') {
      const skillsArray = projectData.skills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
      if (skillsArray.length === 0 && !partial) {
        result.isValid = false;
        result.errors.push('At least one skill is required');
      } else if (skillsArray.length > 20) {
        result.isValid = false;
        result.errors.push('Maximum 20 skills allowed');
      } else {
        result.sanitizedData.skills = skillsArray.map(skill => sanitizeString(skill));
      }
    }
  }

  // Budget validation
  if (projectData.budgetMin !== undefined) {
    const budgetMin = parseFloat(projectData.budgetMin);
    if (isNaN(budgetMin) || budgetMin < 0) {
      result.isValid = false;
      result.errors.push('Minimum budget must be a valid positive number');
    } else if (budgetMin > 1000000) {
      result.isValid = false;
      result.errors.push('Minimum budget cannot exceed $1,000,000');
    } else {
      result.sanitizedData.budgetMin = budgetMin;
    }
  }

  if (projectData.budgetMax !== undefined) {
    const budgetMax = parseFloat(projectData.budgetMax);
    if (isNaN(budgetMax) || budgetMax < 0) {
      result.isValid = false;
      result.errors.push('Maximum budget must be a valid positive number');
    } else if (budgetMax > 1000000) {
      result.isValid = false;
      result.errors.push('Maximum budget cannot exceed $1,000,000');
    } else {
      result.sanitizedData.budgetMax = budgetMax;
    }
  }

  // Validate budget range
  if (result.sanitizedData.budgetMin && result.sanitizedData.budgetMax) {
    if (result.sanitizedData.budgetMin > result.sanitizedData.budgetMax) {
      result.isValid = false;
      result.errors.push('Minimum budget cannot be greater than maximum budget');
    }
  }

  // Project type validation
  if (projectData.projectType !== undefined) {
    const validTypes = ['fixed_price', 'hourly'];
    if (!validTypes.includes(projectData.projectType)) {
      result.isValid = false;
      result.errors.push('Invalid project type');
    } else {
      result.sanitizedData.projectType = projectData.projectType;
    }
  }

  // Hourly rate validation
  if (projectData.hourlyRate !== undefined) {
    const hourlyRate = parseFloat(projectData.hourlyRate);
    if (projectData.hourlyRate && (isNaN(hourlyRate) || hourlyRate < 0 || hourlyRate > 1000)) {
      result.isValid = false;
      result.errors.push('Hourly rate must be a valid number between 0 and 1000');
    } else if (projectData.hourlyRate) {
      result.sanitizedData.hourlyRate = hourlyRate;
    }
  }

  // Duration validation
  if (projectData.durationEstimate !== undefined) {
    if (projectData.durationEstimate && projectData.durationEstimate.trim().length > 100) {
      result.isValid = false;
      result.errors.push('Duration estimate must be less than 100 characters');
    } else if (projectData.durationEstimate) {
      result.sanitizedData.durationEstimate = sanitizeString(projectData.durationEstimate);
    }
  }

  // Deadline validation
  if (projectData.deadline !== undefined) {
    if (projectData.deadline) {
      const deadline = new Date(projectData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isNaN(deadline.getTime())) {
        result.isValid = false;
        result.errors.push('Invalid deadline date format');
      } else if (deadline < today) {
        result.isValid = false;
        result.errors.push('Deadline cannot be in the past');
      } else {
        result.sanitizedData.deadline = deadline.toISOString().split('T')[0]; // YYYY-MM-DD format
      }
    }
  }

  // Experience level validation
  if (projectData.experienceLevel !== undefined) {
    const validLevels = ['entry_level', 'intermediate', 'expert'];
    if (!validLevels.includes(projectData.experienceLevel)) {
      result.isValid = false;
      result.errors.push('Invalid experience level');
    } else {
      result.sanitizedData.experienceLevel = projectData.experienceLevel;
    }
  }

  // Visibility validation
  if (projectData.visibility !== undefined) {
    const validVisibility = ['public', 'private', 'invite_only'];
    if (!validVisibility.includes(projectData.visibility)) {
      result.isValid = false;
      result.errors.push('Invalid visibility setting');
    } else {
      result.sanitizedData.visibility = projectData.visibility;
    }
  }

  // Location validation
  if (projectData.location !== undefined) {
    if (projectData.location && projectData.location.trim().length > 255) {
      result.isValid = false;
      result.errors.push('Location must be less than 255 characters');
    } else if (projectData.location) {
      result.sanitizedData.location = sanitizeString(projectData.location);
    }
  }

  // Remote work validation
  if (projectData.isRemote !== undefined) {
    if (typeof projectData.isRemote !== 'boolean') {
      result.isValid = false;
      result.errors.push('Remote work setting must be true or false');
    } else {
      result.sanitizedData.isRemote = projectData.isRemote;
    }
  }

  // Status validation
  if (projectData.status !== undefined) {
    const validStatuses = ['draft', 'active', 'in_progress', 'completed', 'cancelled', 'archived'];
    if (!validStatuses.includes(projectData.status)) {
      result.isValid = false;
      result.errors.push('Invalid project status');
    } else {
      result.sanitizedData.status = projectData.status;
    }
  }

  // Milestones validation (optional)
  if (projectData.milestones !== undefined) {
    if (Array.isArray(projectData.milestones)) {
      if (projectData.milestones.length > 50) {
        result.isValid = false;
        result.errors.push('Maximum 50 milestones allowed');
      } else {
        result.sanitizedData.milestones = projectData.milestones.map(milestone => ({
          title: sanitizeString(milestone.title),
          description: milestone.description ? sanitizeString(milestone.description) : null,
          amount: parseFloat(milestone.amount),
          dueDate: milestone.dueDate || null,
          orderIndex: milestone.orderIndex || 0
        }));
      }
    }
  }

  return result;
};

/**
 * Validate proposal data
 * @param {Object} proposalData - Proposal data to validate
 * @returns {Object} Validation result
 */
const validateProposalData = (proposalData) => {
  const result = {
    isValid: true,
    errors: [],
    sanitizedData: {}
  };

  // Project ID validation
  if (!proposalData.projectId || proposalData.projectId.trim().length === 0) {
    result.isValid = false;
    result.errors.push('Project ID is required');
  } else {
    result.sanitizedData.projectId = proposalData.projectId.trim();
  }

  // Cover letter validation
  if (!proposalData.coverLetter || proposalData.coverLetter.trim().length === 0) {
    result.isValid = false;
    result.errors.push('Cover letter is required');
  } else if (proposalData.coverLetter.trim().length < 50) {
    result.isValid = false;
    result.errors.push('Cover letter must be at least 50 characters long');
  } else if (proposalData.coverLetter.trim().length > 5000) {
    result.isValid = false;
    result.errors.push('Cover letter must be less than 5000 characters');
  } else {
    result.sanitizedData.coverLetter = sanitizeString(proposalData.coverLetter);
  }

  // Proposed budget validation
  if (proposalData.proposedBudget !== undefined && proposalData.proposedBudget !== null && proposalData.proposedBudget !== '') {
    const budget = parseFloat(proposalData.proposedBudget);
    if (isNaN(budget) || budget < 0) {
      result.isValid = false;
      result.errors.push('Proposed budget must be a valid positive number');
    } else if (budget > 1000000) {
      result.isValid = false;
      result.errors.push('Proposed budget cannot exceed $1,000,000');
    } else {
      result.sanitizedData.proposedBudget = budget;
    }
  }

  // Proposed timeline validation
  if (proposalData.proposedTimeline !== undefined && proposalData.proposedTimeline !== null && proposalData.proposedTimeline !== '') {
    if (proposalData.proposedTimeline.trim().length > 100) {
      result.isValid = false;
      result.errors.push('Proposed timeline must be less than 100 characters');
    } else {
      result.sanitizedData.proposedTimeline = sanitizeString(proposalData.proposedTimeline);
    }
  }

  // File IDs validation
  if (proposalData.fileIds !== undefined && proposalData.fileIds !== null) {
    if (Array.isArray(proposalData.fileIds)) {
      // Validate each file ID is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const invalidIds = proposalData.fileIds.filter(id => !uuidRegex.test(id));
      
      if (invalidIds.length > 0) {
        result.isValid = false;
        result.errors.push('Invalid file ID format detected');
      } else {
        result.sanitizedData.fileIds = proposalData.fileIds;
      }
    } else {
      result.isValid = false;
      result.errors.push('File IDs must be an array');
    }
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
  validateLoginData,
  validateProfileData,
  validateProjectData,
  validateProposalData
};
