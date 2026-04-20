'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for protecting routes with unauthorized UI
 * @param {string|string[]} allowedRoles - Role(s) allowed to access the route
 * @returns {Object} - { isAuthorized, isLoading, UnauthorizedUI }
 */
export const useProtectedRoute = (allowedRoles = null) => {
  const { user, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setIsAuthorized(false);
      } else if (allowedRoles) {
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        setIsAuthorized(roles.includes(user.role));
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, loading, allowedRoles]);

  const UnauthorizedUI = () => (
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
              {!user 
                ? 'You need to be logged in to access this page'
                : 'You do not have permission to access this page'
              }
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">
                  {!user ? 'Authentication Required' : 'Insufficient Permissions'}
                </h3>
                <p className="text-sm text-red-700">
                  {!user 
                    ? 'This page is protected and requires you to sign in to your account. Please log in to continue.'
                    : `This page requires ${allowedRoles ? (Array.isArray(allowedRoles) ? allowedRoles.join(' or ') : allowedRoles) : 'specific'} role access.`
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {!user ? (
              <>
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
              </>
            ) : (
              <a
                href={user.role === 'FREELANCER' ? '/freelancer' : user.role === 'CLIENT' ? '/client' : '/dashboard'}
                className="flex items-center justify-center w-full h-11 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium rounded-lg transition-all"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go to Dashboard
              </a>
            )}
          </div>

          {!user && (
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
          )}
        </div>
      </div>
    </div>
  );

  const LoadingUI = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-amber-500 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );

  return {
    isAuthorized,
    isLoading: loading,
    UnauthorizedUI,
    LoadingUI
  };
};
