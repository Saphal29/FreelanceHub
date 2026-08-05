'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, User, Mail, Lock, Phone, AlertCircle, Briefcase, Crown } from 'lucide-react';

import { register as registerUser } from '@/lib/api';
import { validatePassword, getPasswordStrength } from '@/lib/utils';

// Validation schema  
const registerSchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  confirmPassword: z.string(),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^(\+977[-\s]?)?[0-9]{10}$|^(\+977[-\s]?)?[0-9]{3}[-\s]?[0-9]{7}$/.test(val), {
      message: 'Invalid Nepal phone number format'
    }),
  role: z.enum(['FREELANCER', 'CLIENT'], {
    required_error: 'Please select your role'
  }),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must read and agree to the Terms of Service, Privacy Policy, and Escrow Refund Policy'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'FREELANCER',
      agreeToTerms: false
    }
  });

  const watchedPassword = watch('password');
  const watchedRole = watch('role');

  // Update password strength when password changes
  useEffect(() => {
    if (watchedPassword) {
      const strength = validatePassword(watchedPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  }, [watchedPassword]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await registerUser(data);

      if (response.success) {
        setSuccess(response.message || 'Registration successful!');
        
        // Redirect to OTP verification page
        setTimeout(() => {
          router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
        }, 1200);
      } else {
        setError(response.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strengthInfo = getPasswordStrength(passwordStrength.score);

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
          
          {/* Left Column: Editorial Intro & Registration Ledger Specimen */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
              FREELANCEHUB / REGISTRATION · SYSTEM IDENTITY
            </p>

            <h1 className="font-serif-ledger text-[40px] sm:text-[56px] leading-[1.0] font-medium tracking-tight text-[var(--ink)]">
              Enter the ledger.
            </h1>

            <p className="text-[15px] sm:text-[16px] leading-relaxed text-[var(--muted)] max-w-md">
              Create your identity and choose how you participate in Nepal’s open freelance marketplace.
            </p>

            {/* Registration System Specimen Box */}
            <div className="pt-2">
              <div className="border border-[var(--line)] bg-[var(--paper-2)] p-4 space-y-3 font-mono-ledger text-[12px]">
                <div className="flex items-center justify-between text-[var(--muted)] border-b border-[var(--line)] pb-2 text-[10px] uppercase tracking-wider">
                  <span>REGISTRATION PROTOCOL</span>
                  <span className="text-[var(--signal)] flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] inline-block mr-1.5 animate-pulse"></span>
                    STEP 01 OF 02
                  </span>
                </div>
                <div className="flex items-center justify-between text-[var(--ink)]">
                  <span>01. Identity & Role</span>
                  <span className="text-[var(--signal)] font-bold">[ACTIVE]</span>
                </div>
                <div className="flex items-center justify-between text-[var(--ink)]">
                  <span>02. OTP Verification</span>
                  <span className="text-[var(--muted)]">[PENDING]</span>
                </div>
                <div className="flex items-center justify-between text-[var(--ink)]">
                  <span>03. Escrow Access</span>
                  <span>NPR LOCAL</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Structured Editorial Signup Form Panel */}
          <div className="lg:col-span-7">
            <div className="bg-[var(--paper)] border-2 border-[var(--ink)] p-6 sm:p-8 space-y-6 shadow-sm">
              
              {/* Form Header Tag */}
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 font-mono-ledger text-[11px]">
                <span className="text-[var(--ink)] font-bold uppercase tracking-wider">01 / ACCOUNT REGISTRATION SPECIMEN</span>
                <span className="text-[var(--signal)]">CREATE ACCOUNT</span>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3.5 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Alert */}
              {success && (
                <div className="p-3.5 bg-[var(--paper-2)] border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-start space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--signal)] animate-pulse shrink-0 mt-1"></span>
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                
                {/* ROLE SELECTION (Key Editorial Component) */}
                <div className="space-y-2 text-left">
                  <label className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--ink)] block">
                    Choose Your Role *
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Role 1: FREELANCER */}
                    <div 
                      onClick={() => setValue('role', 'FREELANCER')}
                      className={`p-3.5 border-2 transition-all cursor-pointer text-left space-y-1 ${
                        watchedRole === 'FREELANCER' 
                          ? 'border-[var(--signal)] bg-[var(--signal)]/5 text-[var(--ink)] shadow-sm' 
                          : 'border-[var(--line)] bg-[var(--paper-2)] hover:border-[var(--ink)] text-[var(--muted)]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono-ledger text-[11px] font-bold">
                        <span className={watchedRole === 'FREELANCER' ? 'text-[var(--signal)]' : 'text-[var(--ink)]'}>
                          01 / FREELANCER
                        </span>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          watchedRole === 'FREELANCER' ? 'border-[var(--signal)] bg-[var(--signal)]' : 'border-[var(--muted)]'
                        }`}>
                          {watchedRole === 'FREELANCER' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--paper)]" />}
                        </div>
                      </div>
                      <p className="text-[13px] leading-snug">
                        Offer your skills and services.
                      </p>
                    </div>

                    {/* Role 2: CLIENT */}
                    <div 
                      onClick={() => setValue('role', 'CLIENT')}
                      className={`p-3.5 border-2 transition-all cursor-pointer text-left space-y-1 ${
                        watchedRole === 'CLIENT' 
                          ? 'border-[var(--signal)] bg-[var(--signal)]/5 text-[var(--ink)] shadow-sm' 
                          : 'border-[var(--line)] bg-[var(--paper-2)] hover:border-[var(--ink)] text-[var(--muted)]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono-ledger text-[11px] font-bold">
                        <span className={watchedRole === 'CLIENT' ? 'text-[var(--signal)]' : 'text-[var(--ink)]'}>
                          02 / CLIENT
                        </span>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          watchedRole === 'CLIENT' ? 'border-[var(--signal)] bg-[var(--signal)]' : 'border-[var(--muted)]'
                        }`}>
                          {watchedRole === 'CLIENT' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--paper)]" />}
                        </div>
                      </div>
                      <p className="text-[13px] leading-snug">
                        Find independent talent.
                      </p>
                    </div>

                  </div>
                  {errors.role && (
                    <p className="font-mono-ledger text-[11px] text-[var(--signal)] mt-1">
                      {errors.role.message}
                    </p>
                  )}
                </div>

                {/* Full Name */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="fullName" className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--ink)] block">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--muted)]" />
                    <input
                      id="fullName"
                      type="text"
                      {...register('fullName')}
                      placeholder="e.g. Aayush Maharjan"
                      className="w-full bg-[var(--paper-2)] border border-[var(--line)] focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)] font-sans-ledger text-[14px] pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-[var(--muted)]"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="font-mono-ledger text-[11px] text-[var(--signal)] mt-1">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="email" className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--ink)] block">
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
                    />
                  </div>
                  {errors.email && (
                    <p className="font-mono-ledger text-[11px] text-[var(--signal)] mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password & Confirm Password (Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Password */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="password" className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--ink)] block">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--muted)]" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        {...register('password')}
                        placeholder="••••••••"
                        className="w-full bg-[var(--paper-2)] border border-[var(--line)] focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)] font-sans-ledger text-[14px] pl-10 pr-9 py-2.5 outline-none transition-all placeholder:text-[var(--muted)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
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

                  {/* Confirm Password */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="confirmPassword" className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--ink)] block">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--muted)]" />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...register('confirmPassword')}
                        placeholder="••••••••"
                        className="w-full bg-[var(--paper-2)] border border-[var(--line)] focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)] font-sans-ledger text-[14px] pl-10 pr-9 py-2.5 outline-none transition-all placeholder:text-[var(--muted)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3.5 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
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

                </div>

                {/* Password Strength Meter */}
                {watchedPassword && (
                  <div className="p-3 bg-[var(--paper-2)] border border-[var(--line)] space-y-2 text-left font-mono-ledger text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--muted)]">Password Strength:</span>
                      <span className="font-bold text-[var(--signal)] uppercase">
                        {strengthInfo.label}
                      </span>
                    </div>
                    <div className="w-full bg-[var(--paper)] border border-[var(--line)] h-2 overflow-hidden">
                      <div
                        className="h-full bg-[var(--signal)] transition-all duration-300"
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-[10px] text-[var(--muted)] space-y-0.5 pt-1">
                        {passwordStrength.feedback.map((fb, idx) => (
                          <li key={idx}>• {fb}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Phone Number (Optional) */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="phone" className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--ink)] block">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--muted)]" />
                    <input
                      id="phone"
                      type="text"
                      {...register('phone')}
                      placeholder="+977-9812345678"
                      className="w-full bg-[var(--paper-2)] border border-[var(--line)] focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)] font-sans-ledger text-[14px] pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-[var(--muted)]"
                    />
                  </div>
                  {errors.phone && (
                    <p className="font-mono-ledger text-[11px] text-[var(--signal)] mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Terms & Privacy Agreement Checkbox */}
                <div className="space-y-1 text-left pt-1 font-mono-ledger">
                  <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      {...register('agreeToTerms')}
                      className="mt-1 h-4 w-4 accent-[var(--signal)] rounded border-[var(--ink)] cursor-pointer"
                    />
                    <span className="text-[12px] text-[var(--ink)] leading-snug">
                      I have read and agree to the{' '}
                      <Link href="/terms" target="_blank" className="font-bold underline text-[var(--signal)] hover:text-[var(--ink)]">Terms of Service</Link>,{' '}
                      <Link href="/privacy" target="_blank" className="font-bold underline text-[var(--signal)] hover:text-[var(--ink)]">Privacy Policy</Link>, and{' '}
                      <Link href="/refund-policy" target="_blank" className="font-bold underline text-[var(--signal)] hover:text-[var(--ink)]">Escrow Policy</Link>. *
                    </span>
                  </label>
                  {errors.agreeToTerms && (
                    <p className="font-mono-ledger text-[11px] text-[var(--signal)] mt-1">
                      {errors.agreeToTerms.message}
                    </p>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-sans-ledger font-medium text-[15px] py-3.5 px-4 transition-colors flex items-center justify-center space-x-2 shadow-xs"
                  >
                    {loading ? (
                      <span className="font-mono-ledger text-[13px] flex items-center">
                        <span className="w-2 h-2 rounded-full bg-[var(--paper)] animate-pulse mr-2"></span>
                        CREATING IDENTITY...
                      </span>
                    ) : (
                      <>
                        <span>Create account & enter ledger</span>
                        <ArrowRight className="h-4 w-4 text-[var(--paper)]" />
                      </>
                    )}
                  </button>
                </div>

              </form>

              {/* Secondary Navigation Links */}
              <div className="pt-4 border-t border-[var(--line)] text-center font-mono-ledger text-[12px]">
                <p className="text-[var(--muted)]">
                  Already have an account?{' '}
                  <Link 
                    href="/login" 
                    className="text-[var(--ink)] font-bold hover:text-[var(--signal)] transition-colors"
                  >
                    Sign in →
                  </Link>
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Editorial Footer with Legal Links */}
      <footer className="border-t border-[var(--line)] py-6 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between text-[12px] font-mono-ledger text-[var(--muted)] gap-4">
          <div className="flex space-x-4">
            <Link href="/terms" className="hover:text-[var(--ink)]">Terms of Service</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-[var(--ink)]">Privacy Policy</Link>
            <span>·</span>
            <Link href="/refund-policy" className="hover:text-[var(--ink)]">Escrow Policy</Link>
          </div>
          <span>FreelanceHub · Nepal Marketplace Ledger · Engineered by Nantio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}