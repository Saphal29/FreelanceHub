'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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

  useEffect(() => {
    const registered = searchParams.get('registered');
    const expired = searchParams.get('expired');
    const verified = searchParams.get('verified');

    if (registered === 'true' || verified === 'true') {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }

    if (expired === 'true') {
      setError('Your session has expired. Please log in again.');
    }

    setFocus('email');
  }, [searchParams, setFocus]);

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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)] text-[var(--ink)] font-mono-ledger">
        <div className="flex items-center space-x-3 text-[13px]">
          <span className="w-2.5 h-2.5 bg-[var(--signal)] rounded-full animate-pulse"></span>
          <span>AUTHENTICATING SESSION...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Header */}
      <header className="border-b border-[var(--ink)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="font-serif-ledger text-[19px] font-semibold tracking-tight text-[var(--ink)] hover:text-[var(--signal)] transition-colors">
            FreelanceHub
          </Link>

          <Link 
            href="/" 
            className="font-mono-ledger text-[12px] text-[var(--muted)] hover:text-[var(--signal)] transition-colors"
          >
            ← Return to home
          </Link>
        </div>
      </header>

      {/* Archetype B: Asymmetric Split Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 md:py-16 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Wordmark + Quiet Line + Identity Kicker */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
              FREELANCEHUB / ACCESS · AUTH LEDGER ARCHETYPE B
            </p>

            <h1 className="font-serif-ledger text-[40px] sm:text-[56px] leading-[1.0] font-medium tracking-tight text-[var(--ink)]">
              Sign in to ledger.
            </h1>

            <p className="text-[15px] sm:text-[16px] leading-relaxed text-[var(--muted)] max-w-md font-sans-ledger">
              Access your open contracts, active milestone escrows, and direct project communications on Nepal’s open freelance ledger.
            </p>

            {/* Quiet Status Specimen List */}
            <div className="pt-4 border-t border-[var(--line)] space-y-2 font-mono-ledger text-[11px]">
              <div className="flex items-center justify-between text-[var(--muted)]">
                <span>AUTH PROTOCOL</span>
                <span className="text-[var(--signal)] font-bold">[ACTIVE]</span>
              </div>
              <div className="flex items-center justify-between text-[var(--muted)]">
                <span>ENCRYPTION</span>
                <span className="text-[var(--ink)] font-bold">[256-BIT TLS]</span>
              </div>
              <div className="flex items-center justify-between text-[var(--muted)]">
                <span>ESCROW CURRENCY</span>
                <span>[NPR LOCAL]</span>
              </div>
            </div>

          </div>

          {/* Right Column: Form Fields Directly on --paper with Hairline Separators */}
          <div className="lg:col-span-7">
            <div className="border-2 border-[var(--ink)] bg-[var(--paper)] p-6 sm:p-10 space-y-6 text-left">
              
              {/* Form Header Tag */}
              <div className="flex items-center justify-between border-b border-[var(--ink)] pb-3 font-mono-ledger text-[11px]">
                <span className="text-[var(--ink)] font-bold uppercase tracking-wider">01 / CREDENTIAL VERIFICATION</span>
                <span className="text-[var(--signal)] font-bold">[SIGN IN]</span>
              </div>

              {/* Success Notification Alert */}
              {showSuccessMessage && (
                <div className="p-3.5 bg-[var(--paper-2)] border border-[var(--signal)] text-[var(--ink)] font-mono-ledger text-[12px] flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--signal)] shrink-0" />
                  <span>Verified successfully! Please enter your credentials.</span>
                </div>
              )}

              {/* Error Notification Alert */}
              {error && (
                <div className="p-3.5 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Email Field */}
                <div className="space-y-2 border-b border-[var(--line)] pb-4">
                  <label htmlFor="email" className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--ink)] font-bold block">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="name@domain.com"
                    className="w-full bg-[var(--paper-2)] border border-[var(--line)] focus:border-[var(--ink)] font-sans-ledger text-[14px] p-3 outline-none transition-all placeholder:text-[var(--muted)]"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="font-mono-ledger text-[11px] text-[var(--signal)] mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2 border-b border-[var(--line)] pb-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--ink)] font-bold block">
                      Password *
                    </label>
                    <Link 
                      href="/forgot-password" 
                      className="font-mono-ledger text-[11px] text-[var(--signal)] hover:underline font-bold"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      placeholder="••••••••••••"
                      className="w-full bg-[var(--paper-2)] border border-[var(--line)] focus:border-[var(--ink)] font-sans-ledger text-[14px] p-3 pr-10 outline-none transition-all placeholder:text-[var(--muted)]"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
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

                {/* Single Primary Action Button */}
                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider py-3.5 px-4 transition-colors flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <span className="font-mono-ledger text-[12px] flex items-center">
                        <span className="w-2 h-2 rounded-full bg-[var(--paper)] animate-pulse mr-2"></span>
                        VERIFYING CREDENTIALS...
                      </span>
                    ) : (
                      <span>Sign in to ledger →</span>
                    )}
                  </button>
                </div>

              </form>

              {/* Secondary Links */}
              <div className="pt-4 border-t border-[var(--line)] text-center space-y-2 font-mono-ledger text-[12px]">
                <p className="text-[var(--muted)]">
                  New to FreelanceHub?{' '}
                  <Link 
                    href="/register" 
                    className="text-[var(--ink)] font-bold hover:text-[var(--signal)] transition-colors"
                  >
                    Create account →
                  </Link>
                </p>
                <div className="flex justify-center space-x-4 text-[11px] text-[var(--muted)] pt-1">
                  <Link href="/verify-email" className="hover:text-[var(--ink)]">Verify Email</Link>
                  <span>·</span>
                  <Link href="/terms" className="hover:text-[var(--ink)]">Terms of Service</Link>
                  <span>·</span>
                  <Link href="/privacy" className="hover:text-[var(--ink)]">Privacy Policy</Link>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Auth Ledger Archetype B</span>
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
        <div className="flex items-center space-x-3 text-[13px]">
          <span className="w-2.5 h-2.5 bg-[var(--signal)] rounded-full animate-pulse"></span>
          <span>LOADING SYSTEM...</span>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}