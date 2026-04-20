'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getCurrentUser, 
  login as apiLogin, 
  logout as apiLogout,
  isAuthenticated,
  getToken,
  setToken,
  removeToken,
  getUserFromToken
} from '@/lib/api';

// Create the authentication context
const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  updateUser: () => {},
  refreshUser: async () => {},
  clearError: () => {},
  error: null
});

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Authentication provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Clear any authentication errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Load user data from API
   */
  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if token exists and is valid
      if (!isAuthenticated()) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Get user data from API
      const response = await getCurrentUser();
      
      if (response.success) {
        setUser(response.user);
      } else {
        // Invalid token or user not found
        removeToken();
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      
      // If token is invalid, remove it
      if (error.status === 401) {
        removeToken();
        setUser(null);
      } else {
        setError(error.message || 'Failed to load user data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login user with credentials
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} Login result
   */
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiLogin(credentials);
      
      if (response.success) {
        setUser(response.user);
        
        // Token is already stored by the API client
        return { success: true, user: response.user };
      } else {
        setError(response.error || 'Login failed');
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Call logout API (this also removes the token)
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear user state
      setUser(null);
      setLoading(false);
      
      // Redirect to login page
      window.location.href = '/login';
    }
  }, []);

  /**
   * Update user data in context
   * @param {Object} userData - Updated user data
   */
  const updateUser = useCallback((userData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
  }, []);

  /**
   * Refresh user data from API
   */
  const refreshUser = useCallback(async () => {
    if (!isAuthenticated()) {
      setUser(null);
      return;
    }

    try {
      const response = await getCurrentUser();
      
      if (response.success) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      
      if (error.status === 401) {
        removeToken();
        setUser(null);
      }
    }
  }, []);

  /**
   * Check authentication status on mount and token changes
   */
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  /**
   * Listen for storage changes (token updates in other tabs)
   */
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (e.newValue) {
          // Token was added/updated
          loadUser();
        } else {
          // Token was removed
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadUser]);

  /**
   * Auto-refresh user data periodically
   */
  useEffect(() => {
    if (!user || !isAuthenticated()) return;

    const interval = setInterval(() => {
      refreshUser();
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [user, refreshUser]);

  // Context value
  const value = {
    user,
    loading,
    isAuthenticated: !!user && isAuthenticated(),
    login,
    logout,
    updateUser,
    refreshUser,
    clearError,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Higher-order component for protected routes
export const withAuth = (WrappedComponent) => {
  return function AuthenticatedComponent(props) {
    const { user, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-yellow-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-amber-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      // Show unauthorized UI instead of redirecting
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-xl border-0 p-8">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-red-50 rounded-full">
                    <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Access Denied
                </h2>
                <p className="text-gray-600 mb-6">
                  You need to be logged in to access this page
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800 mb-1">
                      Authentication Required
                    </h3>
                    <p className="text-sm text-red-700">
                      This page is protected and requires you to sign in to your account.
                      Please log in to continue.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href="/login"
                  className="flex items-center justify-center w-full h-11 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium rounded-lg transition-all"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Go to Login
                  <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>

                <a
                  href="/"
                  className="flex items-center justify-center w-full h-11 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Back to Home
                </a>
              </div>

              <div className="pt-6 border-t border-gray-100 mt-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Don't have an account?
                  </p>
                  <a 
                    href="/register" 
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
                  >
                    Create a free account →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

// Hook for role-based access control
export const useRole = () => {
  const { user } = useAuth();
  
  return {
    role: user?.role || null,
    isAdmin: user?.role === 'ADMIN',
    isFreelancer: user?.role === 'FREELANCER',
    isClient: user?.role === 'CLIENT',
    hasRole: (roles) => {
      if (!user?.role) return false;
      return Array.isArray(roles) ? roles.includes(user.role) : roles === user.role;
    }
  };
};

// Hook for checking if user profile is complete
export const useProfileCompletion = () => {
  const { user } = useAuth();
  
  if (!user) return { isComplete: false, missingFields: [] };
  
  const missingFields = [];
  
  // Check common required fields
  if (!user.fullName) missingFields.push('Full Name');
  if (!user.phone) missingFields.push('Phone Number');
  
  // Check role-specific fields
  if (user.role === 'FREELANCER') {
    if (!user.freelancerProfile?.bio) missingFields.push('Bio');
    if (!user.freelancerProfile?.skills?.length) missingFields.push('Skills');
    if (!user.freelancerProfile?.hourlyRate) missingFields.push('Hourly Rate');
  } else if (user.role === 'CLIENT') {
    if (!user.clientProfile?.companyName) missingFields.push('Company Name');
    if (!user.clientProfile?.industry) missingFields.push('Industry');
  }
  
  return {
    isComplete: missingFields.length === 0,
    missingFields,
    completionPercentage: Math.round(
      ((user.role === 'FREELANCER' ? 6 : user.role === 'CLIENT' ? 5 : 3) - missingFields.length) /
      (user.role === 'FREELANCER' ? 6 : user.role === 'CLIENT' ? 5 : 3) * 100
    )
  };
};

export default AuthContext;