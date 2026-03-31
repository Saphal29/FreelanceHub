'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Eye, EyeOff, LogIn, Mail, Lock, CheckCircle, AlertCircle, Shield, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

// Validation schema
const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(1, 'Password is required')
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loading: authLoading, isAuthenticated } = useAuth();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setFocus
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  // Handle URL parameters
  useEffect(() => {
    const registered = searchParams.get('registered');
    const expired = searchParams.get('expired');
    const verified = searchParams.get('verified');

    if (registered === 'true') {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }

    if (expired === 'true') {
      setError('Your session has expired. Please log in again.');
    }

    if (verified === 'true') {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }

    // Focus on email field
    setFocus('email');
  }, [searchParams, setFocus]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      // Get user from auth context to determine redirect
      const redirectTo = searchParams.get('redirect');
      if (redirectTo) {
        router.push(redirectTo);
      }
      // If no redirect param, let the login submit handle the role-based redirect
    }
  }, [isAuthenticated, authLoading, router, searchParams]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');

      const result = await login(data);

      if (result.success) {
        // Redirect based on user role
        const userRole = result.user?.role;
        let redirectTo = searchParams.get('redirect');
        
        if (!redirectTo) {
          // Default redirect based on role
          if (userRole === 'FREELANCER') {
            redirectTo = '/freelancer';
          } else if (userRole === 'CLIENT') {
            redirectTo = '/dashboard';
          } else if (userRole === 'ADMIN') {
            redirectTo = '/admin/dashboard';
          } else {
            redirectTo = '/dashboard';
          }
        }
        
        router.push(redirectTo);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-black/5 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-black text-black mb-2">
              Freelance<span className="text-gradient-gold">Hub</span>
            </h1>
          </Link>
          <p className="text-gray-600 text-lg">Welcome back to excellence</p>
        </div>

        <Card className="card-premium shadow-3xl border-2 border-gray-100">
          <CardHeader className="space-y-6 text-center pb-8">
            <div className="flex justify-center">
              <div className="h-20 w-20 bg-black rounded-2xl flex items-center justify-center shadow-xl">
                <Shield className="h-10 w-10 text-amber-500" />
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl font-black text-black mb-2">
                Sign In
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                Access your premium account
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 px-8 pb-8">
            {/* Success Messages */}
            {showSuccessMessage && (
              <Alert className="border-2 border-green-200 bg-green-50 animate-in slide-in-from-top-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800 font-semibold">
                  {searchParams.get('registered') === 'true' && 
                    'Registration successful! Please check your email to verify your account.'
                  }
                  {searchParams.get('verified') === 'true' && 
                    'Email verified successfully! You can now log in.'
                  }
                </AlertDescription>
              </Alert>
            )}

            {/* Error Messages */}
            {error && (
              <Alert className="border-2 border-red-200 bg-red-50 animate-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-800 font-semibold">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <div className="space-y-3">
                <Label htmlFor="email" className="form-label-modern">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Enter your email"
                    className="form-input-modern pl-12 text-lg"
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="form-error-modern animate-in slide-in-from-top-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="form-label-modern">
                    Password
                  </Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Enter your password"
                    className="form-input-modern pl-12 pr-12 text-lg"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error-modern animate-in slide-in-from-top-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="btn-primary w-full text-lg py-6 mt-8" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn className="h-5 w-5 mr-3" />
                    Sign In to Excellence
                  </div>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t-2 border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-white px-4 text-gray-500 font-bold tracking-wide">Or</span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-gray-600 text-lg">
                New to FreelanceHub?{' '}
                <Link 
                  href="/register" 
                  className="font-bold text-black hover:text-amber-600 transition-colors"
                >
                  Join the Elite
                </Link>
              </p>
            </div>

            {/* Additional Links */}
            <div className="flex justify-center space-x-6 text-sm text-gray-500 pt-6 border-t-2 border-gray-100">
              <Link href="/verify-email" className="hover:text-black transition-colors font-semibold">
                Verify Email
              </Link>
              <span className="text-gray-300">•</span>
              <Link href="/help" className="hover:text-black transition-colors font-semibold">
                Need Help?
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500">
            © 2024 FreelanceHub. Crafted with excellence.
          </p>
        </div>
      </div>
    </div>
  );
}