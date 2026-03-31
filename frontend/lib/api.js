import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    // Only attach token on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: Handle responses and errors
api.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    
    return response;
  },
  (error) => {
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      console.error(`❌ API Error: ${status}`, data);
      
      // Handle authentication errors
      if (status === 401 && typeof window !== 'undefined') {
        // Token expired or invalid
        localStorage.removeItem('token');
        
        // Redirect to login page if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?expired=true';
        }
      }
      
      // Handle rate limiting
      if (status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        if (retryAfter) {
          console.warn(`⏰ Rate limited. Retry after ${retryAfter} seconds`);
        }
      }
      
    } else if (error.request) {
      // Network error
      console.error('🌐 Network Error:', error.message);
    } else {
      // Other error
      console.error('❌ Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API utility functions

/**
 * Handle API errors consistently
 * @param {Error} error - Axios error object
 * @returns {Object} Formatted error object
 */
export const handleApiError = (error) => {
  if (error.response?.data) {
    return {
      message: error.response.data.error || 'An error occurred',
      code: error.response.data.code || 'UNKNOWN_ERROR',
      status: error.response.status,
      details: error.response.data.details || null
    };
  } else if (error.request) {
    return {
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
      status: 0
    };
  } else {
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      status: 0
    };
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // Basic token format validation
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode payload to check expiration
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Token validation error:', error);
    localStorage.removeItem('token');
    return false;
  }
};

/**
 * Get token from localStorage
 * @returns {string|null} JWT token or null
 */
export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

/**
 * Set token in localStorage
 * @param {string} token - JWT token
 */
export const setToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

/**
 * Remove token from localStorage
 */
export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

/**
 * Get user info from token
 * @returns {Object|null} User info or null
 */
export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Authentication API endpoints

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} API response
 */
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Verify user email
 * @param {string} token - Verification token
 * @returns {Promise<Object>} API response
 */
export const verifyEmail = async (token) => {
  try {
    const response = await api.get(`/auth/verify-email?token=${token}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @returns {Promise<Object>} API response
 */
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    
    // Store token if login successful
    if (response.data.success && response.data.token) {
      setToken(response.data.token);
    }
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<Object>} API response
 */
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Reset password
 * @param {Object} resetData - Password reset data
 * @returns {Promise<Object>} API response
 */
export const resetPassword = async (resetData) => {
  try {
    const response = await api.post('/auth/reset-password', resetData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get current user profile
 * @returns {Promise<Object>} API response
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update user profile
 * @param {Object} profileData - Profile update data
 * @returns {Promise<Object>} API response
 */
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/profile', profileData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Partially update user profile
 * @param {Object} profileData - Partial profile update data
 * @returns {Promise<Object>} API response
 */
export const patchProfile = async (profileData) => {
  try {
    const response = await api.patch('/profile', profileData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get complete user profile
 * @returns {Promise<Object>} API response
 */
export const getProfile = async () => {
  try {
    const response = await api.get('/profile');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Upload profile image
 * @param {File} imageFile - Image file to upload
 * @returns {Promise<Object>} API response
 */
export const uploadProfileImage = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await api.post('/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get freelancer skills
 * @returns {Promise<Object>} API response
 */
export const getFreelancerSkills = async () => {
  try {
    const response = await api.get('/profile/skills');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Add or update freelancer skill
 * @param {Object} skillData - Skill data
 * @returns {Promise<Object>} API response
 */
export const upsertFreelancerSkill = async (skillData) => {
  try {
    const response = await api.post('/profile/skills', skillData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete freelancer skill
 * @param {string} skillId - Skill ID to delete
 * @returns {Promise<Object>} API response
 */
export const deleteFreelancerSkill = async (skillId) => {
  try {
    const response = await api.delete(`/profile/skills/${skillId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Search freelancers
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Object>} API response
 */
export const searchFreelancers = async (searchParams) => {
  try {
    const queryString = new URLSearchParams(searchParams).toString();
    const response = await api.get(`/profile/search/freelancers?${queryString}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Logout user
 * @returns {Promise<Object>} API response
 */
export const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    
    // Remove token from localStorage
    removeToken();
    
    return response.data;
  } catch (error) {
    // Remove token even if API call fails
    removeToken();
    throw handleApiError(error);
  }
};

/**
 * Get user statistics (admin only)
 * @returns {Promise<Object>} API response
 */
export const getUserStats = async () => {
  try {
    const response = await api.get('/auth/stats');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// ============================================
// PROJECT API ENDPOINTS
// ============================================

/**
 * Create a new project
 * @param {Object} projectData - Project data
 * @returns {Promise<Object>} API response
 */
export const createProject = async (projectData) => {
  try {
    const response = await api.post('/projects', projectData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get projects with filters and pagination
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response
 */
export const getProjects = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/projects?${queryString}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get my projects (client's own projects)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response
 */
export const getMyProjects = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/projects/my/projects?${queryString}` : '/projects/my/projects';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get project statistics for current client
 * @returns {Promise<Object>} API response
 */
export const getProjectStats = async () => {
  try {
    const response = await api.get('/projects/my/stats');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get project by ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} API response
 */
export const getProjectById = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update project
 * @param {string} projectId - Project ID
 * @param {Object} projectData - Updated project data
 * @returns {Promise<Object>} API response
 */
export const updateProject = async (projectId, projectData) => {
  try {
    const response = await api.put(`/projects/${projectId}`, projectData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete project
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} API response
 */
export const deleteProject = async (projectId) => {
  try {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Toggle project bookmark
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} API response
 */
export const toggleProjectBookmark = async (projectId) => {
  try {
    const response = await api.post(`/projects/${projectId}/bookmark`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get project categories
 * @returns {Promise<Object>} API response
 */
export const getProjectCategories = async () => {
  try {
    const response = await api.get('/projects/categories');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// ============================================
// MILESTONE API ENDPOINTS
// ============================================

/**
 * Get milestones for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} API response
 */
export const getMilestones = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}/milestones`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Create a new milestone for a project
 * @param {string} projectId - Project ID
 * @param {Object} milestoneData - Milestone data
 * @returns {Promise<Object>} API response
 */
export const createMilestone = async (projectId, milestoneData) => {
  try {
    const response = await api.post(`/projects/${projectId}/milestones`, milestoneData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update milestone
 * @param {string} milestoneId - Milestone ID
 * @param {Object} milestoneData - Updated milestone data
 * @returns {Promise<Object>} API response
 */
export const updateMilestone = async (milestoneId, milestoneData) => {
  try {
    const response = await api.put(`/projects/milestones/${milestoneId}`, milestoneData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete milestone
 * @param {string} milestoneId - Milestone ID
 * @returns {Promise<Object>} API response
 */
export const deleteMilestone = async (milestoneId) => {
  try {
    const response = await api.delete(`/projects/milestones/${milestoneId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Submit milestone for review
 * @param {string} milestoneId - Milestone ID
 * @param {Object} submissionData - Submission data (notes, attachments)
 * @returns {Promise<Object>} API response
 */
export const submitMilestone = async (milestoneId, submissionData) => {
  try {
    const response = await api.post(`/milestones/${milestoneId}/submit`, submissionData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get milestone submissions
 * @param {string} milestoneId - Milestone ID
 * @returns {Promise<Object>} API response
 */
export const getMilestoneSubmissions = async (milestoneId) => {
  try {
    const response = await api.get(`/milestones/${milestoneId}/submissions`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Review milestone submission
 * @param {string} submissionId - Submission ID
 * @param {Object} reviewData - Review data (action: approve/reject/request_revision, notes)
 * @returns {Promise<Object>} API response
 */
export const reviewMilestoneSubmission = async (submissionId, reviewData) => {
  try {
    const response = await api.post(`/milestones/submissions/${submissionId}/review`, reviewData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get milestone revisions
 * @param {string} milestoneId - Milestone ID
 * @returns {Promise<Object>} API response
 */
export const getMilestoneRevisions = async (milestoneId) => {
  try {
    const response = await api.get(`/milestones/${milestoneId}/revisions`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Resolve milestone revision
 * @param {string} revisionId - Revision ID
 * @returns {Promise<Object>} API response
 */
export const resolveMilestoneRevision = async (revisionId) => {
  try {
    const response = await api.post(`/milestones/revisions/${revisionId}/resolve`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// ============================================
// WORKSPACE API ENDPOINTS (Freelancer)
// ============================================

/**
 * Get freelancer workspace (all active projects)
 * @returns {Promise<Object>} API response with projects
 */
export const getFreelancerWorkspace = async () => {
  try {
    const response = await api.get('/contracts/workspace');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get detailed project workspace
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} API response with project details
 */
export const getProjectWorkspace = async (projectId) => {
  try {
    const response = await api.get(`/contracts/workspace/${projectId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export default api;

// ============================================
// PROPOSAL API FUNCTIONS
// ============================================

/**
 * Submit a proposal to a project
 * @param {Object} proposalData - Proposal data
 * @returns {Promise<Object>} API response
 */
export const submitProposal = async (proposalData) => {
  try {
    const response = await api.post('/proposals', proposalData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get freelancer's proposals
 * @param {Object} params - Query parameters (status filter)
 * @returns {Promise<Object>} API response
 */
export const getMyProposals = async (params = {}) => {
  try {
    const response = await api.get('/proposals/my-proposals', { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get proposals for a project (client view)
 * @param {string} projectId - Project ID
 * @param {Object} params - Query parameters (status filter)
 * @returns {Promise<Object>} API response
 */
export const getProjectProposals = async (projectId, params = {}) => {
  try {
    const response = await api.get(`/proposals/project/${projectId}`, { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get proposal by ID
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<Object>} API response
 */
export const getProposalById = async (proposalId) => {
  try {
    const response = await api.get(`/proposals/${proposalId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Accept a proposal
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<Object>} API response
 */
export const acceptProposal = async (proposalId) => {
  try {
    const response = await api.put(`/proposals/${proposalId}/accept`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Reject a proposal
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<Object>} API response
 */
export const rejectProposal = async (proposalId) => {
  try {
    const response = await api.put(`/proposals/${proposalId}/reject`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Withdraw a proposal
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<Object>} API response
 */
export const withdrawProposal = async (proposalId) => {
  try {
    const response = await api.put(`/proposals/${proposalId}/withdraw`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};


// ============================================
// NOTIFICATION API FUNCTIONS
// ============================================

/**
 * Get user notifications
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response
 */
export const getNotifications = async (params = {}) => {
  try {
    const response = await api.get('/notifications', { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get unread notification count
 * @returns {Promise<Object>} API response
 */
export const getUnreadNotificationCount = async () => {
  try {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} API response
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} API response
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// ============================================
// CONTRACT ENDPOINTS
// ============================================

export const getUserContracts = async (params = {}) => {
  try {
    const response = await api.get('/contracts', { params });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to fetch contracts');
  }
};

// Alias for getUserContracts
export const getContracts = getUserContracts;

export const getContractById = async (contractId) => {
  try {
    const response = await api.get(`/contracts/${contractId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to fetch contract');
  }
};

export const signContract = async (contractId) => {
  try {
    const response = await api.post(`/contracts/${contractId}/sign`);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to sign contract');
  }
};


// ============================================
// PAYMENT API FUNCTIONS
// ============================================

/**
 * Initiate Khalti payment for escrow deposit
 */
export const initiatePayment = async (paymentData) => {
  try {
    const response = await api.post('/payments/initiate', paymentData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Verify payment after Khalti callback
 */
export const verifyPayment = async (pidx, purchaseOrderId) => {
  try {
    const response = await api.get('/payments/verify', {
      params: { pidx, purchase_order_id: purchaseOrderId }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get payments for a contract
 */
export const getContractPayments = async (contractId) => {
  try {
    const response = await api.get(`/payments/contract/${contractId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get escrow records for a contract
 */
export const getContractEscrow = async (contractId) => {
  try {
    const response = await api.get(`/payments/escrow/contract/${contractId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Release escrow to freelancer
 */
export const releaseEscrow = async (escrowId, releaseNote) => {
  try {
    const response = await api.post(`/payments/escrow/${escrowId}/release`, { releaseNote });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Refund escrow to client
 */
export const refundEscrow = async (escrowId, reason) => {
  try {
    const response = await api.post(`/payments/escrow/${escrowId}/refund`, { reason });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// eSewa
export const initiateEsewaPayment = async (paymentData) => {
  try {
    const response = await api.post('/payments/esewa/initiate', paymentData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const verifyEsewaPayment = async (data) => {
  try {
    const response = await api.get('/payments/esewa/verify', { params: { data } });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// ============================================
// TIME TRACKING API FUNCTIONS
// ============================================

export const startTimer = async (data) => {
  try {
    const response = await api.post('/time/start', data);
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const stopTimer = async (timeEntryId) => {
  try {
    const response = await api.put(`/time/${timeEntryId}/stop`);
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const getActiveTimer = async () => {
  try {
    const response = await api.get('/time/active');
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const createManualTimeEntry = async (data) => {
  try {
    const response = await api.post('/time/manual', data);
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const updateTimeEntry = async (id, data) => {
  try {
    const response = await api.put(`/time/${id}`, data);
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const deleteTimeEntry = async (id) => {
  try {
    const response = await api.delete(`/time/${id}`);
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const getContractTimeEntries = async (contractId, params = {}) => {
  try {
    const response = await api.get(`/time/contract/${contractId}`, { params });
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const submitTimeEntriesForApproval = async (timeEntryIds) => {
  try {
    const response = await api.post('/time/submit', { timeEntryIds });
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const approveTimeEntry = async (id) => {
  try {
    const response = await api.put(`/time/${id}/approve`);
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const rejectTimeEntry = async (id, reason) => {
  try {
    const response = await api.put(`/time/${id}/reject`, { reason });
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const getContractTimeSummary = async (contractId, params = {}) => {
  try {
    const response = await api.get(`/time/contract/${contractId}/summary`, { params });
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

// ============================================
// CHAT API FUNCTIONS
// ============================================

export const getOrCreateConversation = async (otherUserId, contractId = null, projectId = null, disputeId = null) => {
  try {
    const response = await api.post('/chat/conversations', { otherUserId, contractId, projectId, disputeId });
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const getConversations = async () => {
  try {
    const response = await api.get('/chat/conversations');
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const getChatMessages = async (conversationId, params = {}) => {
  try {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`, { params });
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const markConversationAsRead = async (conversationId) => {
  try {
    const response = await api.put(`/chat/conversations/${conversationId}/read`);
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const deleteChatMessage = async (messageId) => {
  try {
    const response = await api.delete(`/chat/messages/${messageId}`);
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const archiveChatConversation = async (conversationId) => {
  try {
    const response = await api.put(`/chat/conversations/${conversationId}/archive`);
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const searchChatMessages = async (conversationId, q) => {
  try {
    const response = await api.get(`/chat/conversations/${conversationId}/search`, { params: { q } });
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const getChatUnreadCount = async () => {
  try {
    const response = await api.get('/chat/unread-count');
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const uploadChatFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

// ============================================
// CALL API FUNCTIONS
// ============================================

export const initiateCallApi = async (calleeId, callType = 'video') => {
  try {
    const response = await api.post('/calls/initiate', { calleeId, callType });
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const endCallApi = async (callId) => {
  try {
    const response = await api.post(`/calls/${callId}/end`);
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const getCallHistory = async (params = {}) => {
  try {
    const response = await api.get('/calls/history', { params });
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const getCallById = async (callId) => {
  try {
    const response = await api.get(`/calls/${callId}`);
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const createRoom = async (data = {}) => {
  try {
    const response = await api.post('/rooms', data);
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const joinRoomApi = async (roomId) => {
  try {
    const response = await api.post(`/rooms/${roomId}/join`);
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const scheduleCall = async (data) => {
  try {
    const response = await api.post('/calls/schedule', data);
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const getScheduledCalls = async () => {
  try {
    const response = await api.get('/calls/scheduled');
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const joinMeeting = async (meetingId) => {
  try {
    const response = await api.get(`/calls/join/${meetingId}`);
    return response.data;
  } catch (error) { throw handleApiError(error); }
};

export const cancelScheduledCall = async (meetingId) => {
  try {
    const response = await api.delete(`/calls/scheduled/${meetingId}`);
    return response.data;
  } catch (error) { throw handleApiError(error); }
};


// ============================================
// DISPUTE API FUNCTIONS
// ============================================

/**
 * File a new dispute
 * @param {Object} disputeData - Dispute data
 * @returns {Promise<Object>} API response
 */
export const fileDispute = async (disputeData) => {
  console.log('🔄 API Request: POST /disputes', disputeData);
  try {
    const response = await api.post('/disputes', disputeData);
    console.log('✅ API Response: File dispute', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Get disputes for current user
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} API response
 */
export const getDisputes = async (filters = {}) => {
  console.log('🔄 API Request: GET /disputes', filters);
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.contractId) params.append('contractId', filters.contractId);
    
    const response = await api.get(`/disputes?${params.toString()}`);
    console.log('✅ API Response: Get disputes', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Get dispute by ID
 * @param {string} disputeId - Dispute ID
 * @returns {Promise<Object>} API response
 */
export const getDisputeById = async (disputeId) => {
  console.log('🔄 API Request: GET /disputes/:id', disputeId);
  try {
    const response = await api.get(`/disputes/${disputeId}`);
    console.log('✅ API Response: Get dispute', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Upload evidence for dispute
 * @param {string} disputeId - Dispute ID
 * @param {Object} evidenceData - Evidence data
 * @returns {Promise<Object>} API response
 */
export const uploadDisputeEvidence = async (disputeId, evidenceData) => {
  console.log('🔄 API Request: POST /disputes/:id/evidence', disputeId);
  try {
    const response = await api.post(`/disputes/${disputeId}/evidence`, evidenceData);
    console.log('✅ API Response: Upload evidence', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Get evidence for dispute
 * @param {string} disputeId - Dispute ID
 * @returns {Promise<Object>} API response
 */
export const getDisputeEvidence = async (disputeId) => {
  console.log('🔄 API Request: GET /disputes/:id/evidence', disputeId);
  try {
    const response = await api.get(`/disputes/${disputeId}/evidence`);
    console.log('✅ API Response: Get evidence', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Send message in dispute thread
 * @param {string} disputeId - Dispute ID
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} API response
 */
export const sendDisputeMessage = async (disputeId, messageData) => {
  console.log('🔄 API Request: POST /disputes/:id/messages', disputeId);
  try {
    const response = await api.post(`/disputes/${disputeId}/messages`, messageData);
    console.log('✅ API Response: Send message', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Get messages for dispute
 * @param {string} disputeId - Dispute ID
 * @returns {Promise<Object>} API response
 */
export const getDisputeMessages = async (disputeId) => {
  console.log('🔄 API Request: GET /disputes/:id/messages', disputeId);
  try {
    const response = await api.get(`/disputes/${disputeId}/messages`);
    console.log('✅ API Response: Get messages', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Assign mediator to dispute (Admin only)
 * @param {string} disputeId - Dispute ID
 * @param {string} mediatorId - Mediator user ID
 * @returns {Promise<Object>} API response
 */
export const assignMediator = async (disputeId, mediatorId) => {
  console.log('🔄 API Request: POST /disputes/:id/assign-mediator', disputeId);
  try {
    const response = await api.post(`/disputes/${disputeId}/assign-mediator`, { mediatorId });
    console.log('✅ API Response: Assign mediator', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Resolve dispute (Mediator only)
 * @param {string} disputeId - Dispute ID
 * @param {Object} resolutionData - Resolution data
 * @returns {Promise<Object>} API response
 */
export const resolveDispute = async (disputeId, resolutionData) => {
  console.log('🔄 API Request: POST /disputes/:id/resolve', disputeId);
  try {
    const response = await api.post(`/disputes/${disputeId}/resolve`, resolutionData);
    console.log('✅ API Response: Resolve dispute', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Close dispute
 * @param {string} disputeId - Dispute ID
 * @returns {Promise<Object>} API response
 */
export const closeDispute = async (disputeId) => {
  console.log('🔄 API Request: POST /disputes/:id/close', disputeId);
  try {
    const response = await api.post(`/disputes/${disputeId}/close`);
    console.log('✅ API Response: Close dispute', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Get dispute timeline
 * @param {string} disputeId - Dispute ID
 * @returns {Promise<Object>} API response
 */
export const getDisputeTimeline = async (disputeId) => {
  console.log('🔄 API Request: GET /disputes/:id/timeline', disputeId);
  try {
    const response = await api.get(`/disputes/${disputeId}/timeline`);
    console.log('✅ API Response: Get timeline', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    throw error;
  }
};

// ============================================
// ADMIN API FUNCTIONS
// ============================================

/**
 * Get admin dashboard statistics
 */
export const getAdminDashboard = async () => {
  try {
    const response = await api.get('/admin/dashboard');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get all users (admin)
 */
export const getAdminUsers = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.verified !== undefined) params.append('verified', filters.verified);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get user statistics (admin)
 */
export const getAdminUserStats = async () => {
  try {
    const response = await api.get('/admin/users/stats');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Suspend user (admin)
 */
export const suspendUser = async (userId, reason) => {
  try {
    const response = await api.put(`/admin/users/${userId}/suspend`, { reason });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Verify user (admin)
 */
export const verifyUser = async (userId) => {
  try {
    const response = await api.put(`/admin/users/${userId}/verify`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete user (admin)
 */
export const deleteAdminUser = async (userId) => {
  try {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get all projects (admin)
 */
export const getAdminProjects = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/admin/projects?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get project statistics (admin)
 */
export const getAdminProjectStats = async () => {
  try {
    const response = await api.get('/admin/projects/stats');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete project (admin)
 */
export const deleteAdminProject = async (projectId) => {
  try {
    const response = await api.delete(`/admin/projects/${projectId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get all disputes (admin)
 */
export const getAdminDisputes = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/admin/disputes?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get dispute statistics (admin)
 */
export const getAdminDisputeStats = async () => {
  try {
    const response = await api.get('/admin/disputes/stats');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get all transactions (admin)
 */
export const getAdminTransactions = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/admin/transactions?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get financial statistics (admin)
 */
export const getAdminFinancialStats = async () => {
  try {
    const response = await api.get('/admin/transactions/stats');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};


// ============================================
// REVIEW & RATING APIs
// ============================================

export const submitReview = async (reviewData) => {
  const response = await api.post('/reviews', reviewData);
  return response.data;
};

export const getReceivedReviews = async (userIdOrFilters, filters) => {
  // Support both old and new API: getReceivedReviews() or getReceivedReviews(userId, filters)
  let url;
  if (typeof userIdOrFilters === 'string') {
    // New API: getReceivedReviews(userId, filters)
    const { page = 1, limit = 10 } = filters || {};
    url = `/reviews/user/${userIdOrFilters}?page=${page}&limit=${limit}`;
  } else {
    // Old API: getReceivedReviews(filters)
    const { page = 1, limit = 10 } = userIdOrFilters || {};
    url = `/reviews/received?page=${page}&limit=${limit}`;
  }
  const response = await api.get(url);
  return response.data;
};

export const getGivenReviews = async (page = 1, limit = 10) => {
  const response = await api.get(`/reviews/given?page=${page}&limit=${limit}`);
  return response.data;
};

export const getUserReviews = async (userId, page = 1, limit = 10) => {
  const response = await api.get(`/reviews/user/${userId}?page=${page}&limit=${limit}`);
  return response.data;
};

export const getUserRatingStats = async (userId) => {
  const response = await api.get(`/reviews/stats/${userId}`);
  return response.data;
};

export const respondToReview = async (reviewId, response) => {
  const res = await api.post(`/reviews/${reviewId}/respond`, { response });
  return res.data;
};

export const flagReview = async (reviewId, reason) => {
  const response = await api.post(`/reviews/${reviewId}/flag`, { reason });
  return response.data;
};

// ============================================
// FILE MANAGEMENT
// ============================================

export const uploadFile = async (file, metadata = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Add metadata
  Object.keys(metadata).forEach(key => {
    if (metadata[key] !== null && metadata[key] !== undefined) {
      formData.append(key, metadata[key]);
    }
  });

  const response = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getUserFiles = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.category) params.append('category', filters.category);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  
  const response = await api.get(`/files?${params.toString()}`);
  return response.data;
};

export const getFileById = async (fileId) => {
  const response = await api.get(`/files/${fileId}`);
  return response.data;
};

export const deleteFile = async (fileId) => {
  const response = await api.delete(`/files/${fileId}`);
  return response.data;
};

export const generateDownloadLink = async (fileId, expiresIn = 1) => {
  const response = await api.post(`/files/${fileId}/link`, { expiresIn });
  return response.data;
};

export const downloadFile = async (fileId) => {
  const response = await api.get(`/files/download/${fileId}`, {
    responseType: 'blob'
  });
  return response.data;
};

export const getStorageUsage = async () => {
  const response = await api.get('/files/storage-usage');
  return response.data;
};

export const getProposalFiles = async (proposalId) => {
  const response = await api.get(`/files/proposal/${proposalId}`);
  return response.data;
};

export const canReviewContract = async (contractId) => {
  const response = await api.get(`/reviews/can-review/${contractId}`);
  return response.data;
};

export const getDisputeFiles = async (disputeId) => {
  const response = await api.get(`/files/dispute/${disputeId}`);
  return response.data;
};

// ============================================
// INVITE API
// ============================================

/**
 * Send project invitation to freelancer
 * @param {Object} inviteData - Invitation data
 * @returns {Promise<Object>} API response
 */
export const sendInvitation = async (inviteData) => {
  try {
    const response = await api.post('/invites/send', inviteData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get client's projects for invitation
 * @returns {Promise<Object>} API response
 */
export const getClientProjectsForInvite = async () => {
  try {
    const response = await api.get('/invites/my-projects');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};
