'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { resetPassword } from '@/lib/api';

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { 
    register, 
    handleSubmit, 
    formState: { errors }
  } = useForm({
    resolver: zodResolver(resetPasswordSchema)
  });

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const onSubmit = async (data) => {
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      const response = await resetPassword({
        token: token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      });
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login?reset=true');
        }, 2500);
      } else {
        setError(response.error || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Header */}
      <header className="border-b border-[var(--ink)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="font-serif-ledger text-[19px] font-semibold tracking-tight text-[var(--ink)] hover:text-[var(--signal)] transition-colors">
            FreelanceHub
          </Link>

          <Link href="/login" className="font-mono-ledger text-[12px] text-[var(--muted)] hover:text-[var(--signal)] transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </header>

      {/* Archetype B: Asymmetric Split Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 md:py-16 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
              FREELANCEHUB / RECOVERY · AUTH LEDGER ARCHETYPE B
            </p>

            <h1 className="font-serif-ledger text-[40px] sm:text-[56px] leading-[1.0] font-medium tracking-tight text-[var(--ink)]">
              Set new password.
            </h1>

            <p className="text-[15px] sm:text-[16px] leading-relaxed text-[var(--muted)] max-w-md font-sans-ledger">
              Enter and confirm your new account password to complete recovery and update your credentials.
            </p>

            <div className="pt-4 border-t border-[var(--line)] space-y-2 font-mono-ledger text-[11px]">
              <div className="flex items-center justify-between text-[var(--muted)]">
                <span>SECURITY SPEC</span>
                <span className="text-[var(--signal)] font-bold">[MIN 8 CHARS + SPECIAL]</span>
              </div>
              <div className="flex items-center justify-between text-[var(--muted)]">
                <span>TOKEN STATUS</span>
                <span className="text-[var(--ink)] font-bold">[{token ? 'VALID' : 'INVALID'}]</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-7">
            <div className="border-2 border-[var(--ink)] bg-[var(--paper)] p-6 sm:p-10 space-y-6 text-left">
              
              <div className="flex items-center justify-between border-b border-[var(--ink)] pb-3 font-mono-ledger text-[11px]">
                <span className="text-[var(--ink)] font-bold uppercase tracking-wider">02 / NEW CREDENTIAL SPECIMEN</span>
                <span className="text-[var(--signal)] font-bold">[RESET PASSWORD]</span>
              </div>

              {success ? (
                <div className="space-y-4 font-mono-ledger text-left">
                  <div className="p-4 bg-[var(--paper-2)] border border-[var(--signal)] text-[var(--ink)] space-y-2">
                    <div className="flex items-center space-x-2 text-[var(--signal)] font-bold text-[13px]">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>PASSWORD RESET COMPLETE</span>
                    </div>
                    <p className="text-[12px] text-[var(--muted)]">
                      Your account password has been updated. Redirecting to login workspace in 3 seconds...
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/login?reset=true"
                      className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider py-3.5 px-4 transition-colors flex items-center justify-center block text-center"
                    >
                      <span>SIGN IN WITH NEW PASSWORD →</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {error && (
                    <div className="p-3.5 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* New Password */}
                  <div className="space-y-2 border-b border-[var(--line)] pb-4">
                    <label htmlFor="newPassword" className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--ink)] font-bold block">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        {...register('newPassword')}
                        placeholder="••••••••••••"
                        className="w-full bg-[var(--paper-2)] border border-[var(--line)] focus:border-[var(--ink)] font-sans-ledger text-[14px] p-3 pr-10 outline-none transition-all placeholder:text-[var(--muted)]"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3.5 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="font-mono-ledger text-[11px] text-[var(--signal)] mt-1">
                        {errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2 border-b border-[var(--line)] pb-4">
                    <label htmlFor="confirmPassword" className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--ink)] font-bold block">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...register('confirmPassword')}
                        placeholder="••••••••••••"
                        className="w-full bg-[var(--paper-2)] border border-[var(--line)] focus:border-[var(--ink)] font-sans-ledger text-[14px] p-3 pr-10 outline-none transition-all placeholder:text-[var(--muted)]"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3.5 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="font-mono-ledger text-[11px] text-[var(--signal)] mt-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !token}
                    className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider py-3.5 px-4 transition-colors flex items-center justify-center space-x-2"
                  >
                    {loading ? 'UPDATING CREDENTIALS...' : 'UPDATE PASSWORD & SIGN IN →'}
                  </button>
                </form>
              )}

              <div className="pt-4 border-t border-[var(--line)] text-center font-mono-ledger text-[12px]">
                <Link href="/login" className="text-[var(--muted)] hover:text-[var(--signal)]">
                  ← Cancel and return to sign in
                </Link>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)] text-[var(--ink)] font-mono-ledger">
        <div className="flex items-center space-x-3 text-[13px]">
          <span className="w-2.5 h-2.5 bg-[var(--signal)] rounded-full animate-pulse"></span>
          <span>LOADING SYSTEM...</span>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
