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
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!user) {
      window.location.href = '/login';
      return null;
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