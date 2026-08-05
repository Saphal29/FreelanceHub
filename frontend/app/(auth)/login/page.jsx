'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Validation schema
const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(1, 'Password is required')
});

function LoginContent() {
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
      const redirectTo = searchParams.get('redirect');
      if (redirectTo) {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, authLoading, router, searchParams]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');

      const result = await login(data);

      if (result.success) {
        const userRole = result.user?.role;
        let redirectTo = searchParams.get('redirect');
        
        if (!redirectTo) {
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)] text-[var(--ink)] font-mono-ledger">
        <div className="flex items-center space-x-3 text-[14px]">
          <span className="w-3 h-3 bg-[var(--signal)] rounded-full animate-pulse"></span>
          <span>AUTHENTICATING SESSION...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Header */}
      <header className="border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="font-serif-ledger text-[19px] font-semibold tracking-tight text-[var(--ink)] hover:text-[var(--signal)] transition-colors">
            FreelanceHub
          </Link>

          <Link 
            href="/" 
            className="font-mono-ledger text-[12px] text-[var(--muted)] hover:text-[var(--signal)] transition-colors flex items-center space-x-1"
          >
            <span>← Back to main ledger</span>
          </Link>
        </div>
      </header>

      {/* Main 2-Column Editorial Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 md:py-16 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* LEFT COLUMN: Structured Editorial Form Panel */}
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="bg-[var(--paper)] border-2 border-[var(--ink)] p-6 sm:p-8 space-y-6 shadow-sm">
              
              {/* Form Header Tag */}
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 font-mono-ledger text-[11px]">
                <span className="text-[var(--ink)] font-bold uppercase tracking-wider">01 / SYSTEM AUTHENTICATION</span>
                <span className="text-[var(--signal)] flex items-center font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] animate-pulse mr-1.5"></span>
                  LOG IN
                </span>
              </div>

              {/* Success Notification Alert */}
              {showSuccessMessage && (
                <div className="p-3.5 bg-[var(--paper-2)] border border-[var(--signal)] text-[var(--ink)] font-mono-ledger text-[12px] flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--signal)] shrink-0 mt-0.5" />
                  <div>
                    {searchParams.get('registered') === 'true' && 
                      'Registration successful! Please check your email for OTP verification.'
                    }
                    {searchParams.get('verified') === 'true' && 
                      'Email verified successfully! You may now sign in.'
                    }
                  </div>
                </div>
              )}

              {/* Error Notification Alert */}
              {error && (
                <div className="p-3.5 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                
                {/* Email Field */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="email" className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--ink)] block font-bold">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--muted)]" />
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="name@domain.com"
                      className="w-full bg-[var(--paper-2)] border border-[var(--line)] focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)] font-sans-ledger text-[14px] pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-[var(--muted)]"
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <p className="font-mono-ledger text-[11px] text-[var(--signal)] mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--ink)] block font-bold">
                      Password *
                    </label>
                    <Link 
                      href="/forgot-password" 
                      className="font-mono-ledger text-[11px] text-[var(--signal)] hover:text-[var(--signal-dark)] transition-colors font-bold"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--muted)]" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      placeholder="••••••••••••"
                      className="w-full bg-[var(--paper-2)] border border-[var(--line)] focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)] font-sans-ledger text-[14px] pl-10 pr-10 py-2.5 outline-none transition-all placeholder:text-[var(--muted)]"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="font-mono-ledger text-[11px] text-[var(--signal)] mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[13px] uppercase py-3 px-4 transition-colors flex items-center justify-center space-x-2 shadow-xs"
                  >
                    {loading ? (
                      <span className="font-mono-ledger text-[13px] flex items-center">
                        <span className="w-2 h-2 rounded-full bg-[var(--paper)] animate-pulse mr-2"></span>
                        VERIFYING CREDENTIALS...
                      </span>
                    ) : (
                      <>
                        <span>Sign in to ledger →</span>
                      </>
                    )}
                  </button>
                </div>

              </form>

              {/* Secondary Navigation Links */}
              <div className="pt-4 border-t border-[var(--line)] text-center space-y-3 font-mono-ledger text-[12px]">
                <p className="text-[var(--muted)]">
                  New to FreelanceHub?{' '}
                  <Link 
                    href="/register" 
                    className="text-[var(--ink)] font-bold hover:text-[var(--signal)] transition-colors"
                  >
                    Create account →
                  </Link>
                </p>

                <div className="flex justify-center space-x-4 text-[11px] text-[var(--muted)] pt-2">
                  <Link href="/verify-email" className="hover:text-[var(--ink)] transition-colors font-bold">
                    Verify Email
                  </Link>
                  <span>•</span>
                  <Link href="/how-it-works" className="hover:text-[var(--ink)] transition-colors font-bold">
                    System Help
                  </Link>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: Editorial Copy & System Verification Specimen */}
          <div className="lg:col-span-6 order-1 lg:order-2 space-y-6 text-left">
            <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
              FREELANCEHUB / ACCESS · SECURE SYSTEM VERIFICATION
            </p>

            <h1 className="font-serif-ledger text-[40px] sm:text-[56px] leading-[1.0] font-medium tracking-tight text-[var(--ink)]">
              Welcome back.
            </h1>

            <p className="text-[15px] sm:text-[16px] leading-relaxed text-[var(--muted)] max-w-md font-sans-ledger">
              Sign in to access your open contracts, active milestone escrows, and direct project communications on Nepal’s open freelance ledger.
            </p>

            {/* System Specimen Box */}
            <div className="pt-2">
              <div className="border border-[var(--ink)] bg-[var(--paper-2)] p-4 space-y-3 font-mono-ledger text-[12px]">
                <div className="flex items-center justify-between text-[var(--muted)] border-b border-[var(--line)] pb-2 text-[10px] uppercase tracking-wider font-bold">
                  <span>SECURITY PROTOCOL</span>
                  <span className="text-[var(--signal)] flex items-center font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] inline-block mr-1.5 animate-pulse"></span>
                    SESSION ACTIVE
                  </span>
                </div>
                <div className="flex items-center justify-between text-[var(--ink)]">
                  <span>01. Encrypted JWT Authentication</span>
                  <span className="text-[var(--signal)] font-bold">[VERIFIED]</span>
                </div>
                <div className="flex items-center justify-between text-[var(--ink)]">
                  <span>02. Direct Escrow Reserve</span>
                  <span>NPR LOCAL</span>
                </div>
                <div className="flex items-center justify-between text-[var(--ink)]">
                  <span>03. Zero Platform Overhead</span>
                  <span>NANTIO SPEC</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between text-[12px] font-mono-ledger text-[var(--muted)] gap-2">
          <span>FreelanceHub · Nepal Marketplace Ledger</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)] text-[var(--ink)] font-mono-ledger">
        <div className="flex items-center space-x-3 text-[14px]">
          <span className="w-3 h-3 bg-[var(--signal)] rounded-full animate-pulse"></span>
          <span>LOADING SYSTEM...</span>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}