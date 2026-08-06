'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { forgotPassword } from '@/lib/api';

const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
});

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    getValues
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      const response = await forgotPassword(data.email);

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
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
              Reset password.
            </h1>

            <p className="text-[15px] sm:text-[16px] leading-relaxed text-[var(--muted)] max-w-md font-sans-ledger">
              Enter your registered email address to receive password reset instructions and regain secure access to your ledger account.
            </p>

            <div className="pt-4 border-t border-[var(--line)] space-y-2 font-mono-ledger text-[11px]">
              <div className="flex items-center justify-between text-[var(--muted)]">
                <span>RESET TOKEN EXPIRATION</span>
                <span className="text-[var(--signal)] font-bold">[1 HOUR]</span>
              </div>
              <div className="flex items-center justify-between text-[var(--muted)]">
                <span>ENCRYPTION SPEC</span>
                <span>[CRYPTOGRAPHIC SIGNATURE]</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-7">
            <div className="border-2 border-[var(--ink)] bg-[var(--paper)] p-6 sm:p-10 space-y-6 text-left">
              
              <div className="flex items-center justify-between border-b border-[var(--ink)] pb-3 font-mono-ledger text-[11px]">
                <span className="text-[var(--ink)] font-bold uppercase tracking-wider">01 / RECOVERY DISPATCH</span>
                <span className="text-[var(--signal)] font-bold">[RESET REQUEST]</span>
              </div>

              {success ? (
                <div className="space-y-4 font-mono-ledger text-left">
                  <div className="p-4 bg-[var(--paper-2)] border border-[var(--signal)] text-[var(--ink)] space-y-2">
                    <div className="flex items-center space-x-2 text-[var(--signal)] font-bold text-[13px]">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>INSTRUCTIONS DISPATCHED</span>
                    </div>
                    <p className="text-[12px] text-[var(--muted)]">
                      If an account exists for <strong className="text-[var(--ink)]">{getValues('email')}</strong>, password recovery instructions have been sent.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/login"
                      className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider py-3.5 px-4 transition-colors flex items-center justify-center block text-center"
                    >
                      <span>RETURN TO SIGN IN →</span>
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

                  <div className="space-y-2 border-b border-[var(--line)] pb-4">
                    <label htmlFor="email" className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--ink)] font-bold block">
                      Registered Email Address *
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider py-3.5 px-4 transition-colors flex items-center justify-center space-x-2"
                  >
                    {loading ? 'DISPATCHING RESET EMAIL...' : 'DISPATCH RECOVERY EMAIL →'}
                  </button>
                </form>
              )}

              <div className="pt-4 border-t border-[var(--line)] text-center font-mono-ledger text-[12px]">
                <Link href="/login" className="text-[var(--muted)] hover:text-[var(--signal)]">
                  ← Remember your password? Sign in
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