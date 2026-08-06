'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resending, setResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      router.push('/register');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    if (value.length > 1) {
      value = value[0];
    }
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    while (newOtp.length < 6) newOtp.push('');
    setOtp(newOtp);
    
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp: otpCode });

      if (response.data.success) {
        setSuccess('verified');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      setError('');

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_URL}/auth/resend-otp`, { email });

      if (response.data.success) {
        setSuccess('New OTP sent to your email.');
        setCanResend(false);
        setCountdown(60);
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setResending(false);
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

          <Link href="/register" className="font-mono-ledger text-[12px] text-[var(--muted)] hover:text-[var(--signal)] transition-colors">
            ← Back to registration
          </Link>
        </div>
      </header>

      {/* Archetype B: Asymmetric Split Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 md:py-16 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
              FREELANCEHUB / VERIFICATION · AUTH LEDGER ARCHETYPE B
            </p>

            <h1 className="font-serif-ledger text-[40px] sm:text-[56px] leading-[1.0] font-medium tracking-tight text-[var(--ink)]">
              Verify your identity.
            </h1>

            <p className="text-[15px] sm:text-[16px] leading-relaxed text-[var(--muted)] max-w-md font-sans-ledger">
              Enter the 6-digit one-time code sent to <strong className="text-[var(--ink)] font-mono-ledger">{email}</strong> to activate your ledger identity.
            </p>

            <div className="pt-4 border-t border-[var(--line)] space-y-2 font-mono-ledger text-[11px]">
              <div className="flex items-center justify-between text-[var(--muted)]">
                <span>IDENTITY VERIFICATION</span>
                <span className="text-[var(--signal)] font-bold">[STEP 02 OF 02]</span>
              </div>
              <div className="flex items-center justify-between text-[var(--muted)]">
                <span>DISPATCH STATUS</span>
                <span className="text-[var(--ink)] font-bold">[EMAIL DISPATCHED]</span>
              </div>
            </div>

          </div>

          {/* Right Column: OTP Form */}
          <div className="lg:col-span-7">
            <div className="border-2 border-[var(--ink)] bg-[var(--paper)] p-6 sm:p-10 space-y-6 text-left">
              
              <div className="flex items-center justify-between border-b border-[var(--ink)] pb-3 font-mono-ledger text-[11px]">
                <span className="text-[var(--ink)] font-bold uppercase tracking-wider">02 / OTP CODE SPECIMEN</span>
                <span className="text-[var(--signal)] font-bold">[6-DIGIT CODE]</span>
              </div>

              {success === 'verified' ? (
                <div className="py-6 space-y-4 font-mono-ledger text-left">
                  <div className="p-4 bg-[var(--paper-2)] border border-[var(--signal)] text-[var(--ink)] space-y-2">
                    <div className="flex items-center space-x-2 text-[var(--signal)] font-bold text-[13px]">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>EMAIL VERIFIED SUCCESSFULLY</span>
                    </div>
                    <p className="text-[12px] text-[var(--muted)]">
                      Your identity has been confirmed on the ledger. You may now sign in to your workspace.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/login"
                      className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider py-3.5 px-4 transition-colors flex items-center justify-center block text-center"
                    >
                      <span>SIGN IN TO WORKSPACE →</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="p-3.5 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && success !== 'verified' && (
                    <div className="p-3.5 bg-[var(--paper-2)] border border-[var(--signal)] text-[var(--ink)] font-mono-ledger text-[12px] flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-[var(--signal)] shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2 text-left">
                      <label className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--ink)] font-bold block">
                        6-Digit Verification Code *
                      </label>
                      <div className="flex gap-2 sm:gap-3 justify-between">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono-ledger text-[22px] font-bold border-2 border-[var(--ink)] bg-[var(--paper-2)] focus:border-[var(--signal)] outline-none"
                            disabled={loading}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otp.join('').length !== 6}
                      className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider py-3.5 px-4 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {loading ? 'VERIFYING CODE...' : 'VERIFY EMAIL IDENTITY →'}
                    </button>
                  </form>

                  <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between font-mono-ledger text-[11px] text-[var(--muted)]">
                    <span>Didn&apos;t receive code?</span>
                    {canResend ? (
                      <button
                        onClick={handleResend}
                        disabled={resending}
                        className="text-[var(--signal)] font-bold hover:underline uppercase"
                      >
                        {resending ? 'RESENDING...' : 'RESEND CODE →'}
                      </button>
                    ) : (
                      <span>RESEND IN {countdown}S</span>
                    )}
                  </div>
                </>
              )}

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

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)] text-[var(--ink)] font-mono-ledger">
        <div className="flex items-center space-x-3 text-[13px]">
          <span className="w-2.5 h-2.5 bg-[var(--signal)] rounded-full animate-pulse"></span>
          <span>LOADING...</span>
        </div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}
