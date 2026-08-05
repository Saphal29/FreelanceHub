'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getCurrentUser, 
  login as apiLogin, 
  logout as apiLogout,
  isAuthenticated as checkTokenAuthenticated,
  getToken,
  setToken,
  removeToken
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

      // Check if JWT token exists
      if (!checkTokenAuthenticated()) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Get authenticated user data from API
      const response = await getCurrentUser();
      
      if (response && response.success) {
        setUser(response.user);
      } else {
        removeToken();
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading authenticated user:', error);
      if (error.status === 401) {
        removeToken();
        setUser(null);
      } else {
        setError(error.message || 'Failed to load user session');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login user with credentials
   */
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiLogin(credentials);
      if (response && response.success) {
        setUser(response.user);
        return { success: true, user: response.user };
      } else {
        const errorMsg = response?.error || 'Login failed';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Invalid credentials or login failed';
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
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setLoading(false);
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, []);

  /**
   * Update user data in context
   */
  const updateUser = useCallback((userData) => {
    setUser(prevUser => (prevUser ? { ...prevUser, ...userData } : null));
  }, []);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    if (!checkTokenAuthenticated()) {
      setUser(null);
      return;
    }

    try {
      const response = await getCurrentUser();
      if (response && response.success) {
        setUser(response.user);
      }
    } catch (error) {
      if (error.status === 401) {
        removeToken();
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (e.newValue) {
          loadUser();
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadUser]);

  // Context value
  const value = {
    user,
    loading,
    isAuthenticated: !!user,
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
        <div className="min-h-screen flex items-center justify-center bg-[var(--paper)] text-[var(--ink)] font-mono-ledger">
          <div className="flex items-center space-x-3 text-[14px]">
            <span className="w-3 h-3 bg-[var(--signal)] rounded-full animate-pulse"></span>
            <span>VERIFYING SESSION...</span>
          </div>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--paper)] text-[var(--ink)] p-4 font-sans-ledger">
          <div className="w-full max-w-md bg-[var(--paper)] border-2 border-[var(--ink)] p-6 space-y-5">
            <div className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--signal)] border-b border-[var(--line)] pb-2 flex items-center justify-between font-bold">
              <span>ACCESS DENIED</span>
              <span>AUTHENTICATION REQUIRED</span>
            </div>

            <h2 className="font-serif-ledger text-[28px] font-normal">
              Sign in to continue.
            </h2>

            <p className="text-[14px] text-[var(--muted)]">
              This route is protected on the ledger. Please log in to your account to proceed.
            </p>

            <div className="pt-2 space-y-3 font-mono-ledger text-[12px]">
              <a
                href="/login"
                className="w-full bg-[var(--signal)] text-[var(--paper)] py-3 px-4 text-center block hover:bg-[var(--signal-dark)] transition-colors font-sans-ledger font-bold uppercase"
              >
                Go to Sign in →
              </a>

              <a
                href="/"
                className="w-full bg-[var(--paper-2)] border border-[var(--ink)] text-[var(--ink)] py-2.5 px-4 text-center block hover:bg-[var(--paper)] transition-colors font-sans-ledger font-bold uppercase"
              >
                Back to Main Ledger
              </a>
            </div>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

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

export const useProfileCompletion = () => {
  const { user } = useAuth();
  if (!user) return { isComplete: false, missingFields: [] };
  
  const missingFields = [];
  if (!user.fullName) missingFields.push('Full Name');
  if (!user.phone) missingFields.push('Phone Number');
  
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