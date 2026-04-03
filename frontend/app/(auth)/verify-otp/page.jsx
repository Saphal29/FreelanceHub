'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';

export default function VerifyOTPPage() {
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

  // Countdown timer for resend
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

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
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
    
    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    const newOtp = pastedData.split('');
    while (newOtp.length < 6) {
      newOtp.push('');
    }
    setOtp(newOtp);
    
    // Focus last filled input
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
      const response = await axios.post(`${API_URL}/auth/verify-otp`, {
        email,
        otp: otpCode
      });

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
        setSuccess('New OTP sent! Please check your email.');
        setCanResend(false);
        setCountdown(60);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

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
          <p className="text-gray-600 text-lg">Verify your email</p>
        </div>

        <Card className="card-premium shadow-3xl border-2 border-gray-100">
          <CardHeader className="space-y-6 text-center pb-8">
            <div className="flex justify-center">
              <div className="h-20 w-20 bg-black rounded-2xl flex items-center justify-center shadow-xl">
                <Mail className="h-10 w-10 text-amber-500" />
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl font-black text-black mb-2">
                Enter Verification Code
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                We sent a 6-digit code to<br />
                <span className="font-bold text-black">{email}</span>
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 px-8 pb-8">
            {/* Success State - Email Verified */}
            {success === 'verified' ? (
              <div className="text-center py-8 space-y-6">
                <div className="flex justify-center">
                  <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in-50">
                    <CheckCircle className="h-16 w-16 text-green-600" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-green-600">Email Verified Successfully!</h3>
                  <p className="text-gray-600 text-base">
                    Your account has been verified. You can now close this page and sign in to your account.
                  </p>
                </div>
                <div className="pt-4">
                  <Link href="/login">
                    <Button className="btn-primary">
                      Go to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Resend Success Message */}
                {success && success !== 'verified' && (
                  <Alert className="border-2 border-green-200 bg-green-50 animate-in slide-in-from-top-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertDescription className="text-green-800 font-semibold">{success}</AlertDescription>
                  </Alert>
                )}

                {/* Error Message */}
                {error && (
                  <Alert className="border-2 border-red-200 bg-red-50 animate-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <AlertDescription className="text-red-800 font-semibold">{error}</AlertDescription>
                  </Alert>
                )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* OTP Input */}
              <div className="flex justify-center gap-3">
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
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-black focus:ring-2 focus:ring-black focus:outline-none transition-all"
                    disabled={loading}
                  />
                ))}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="btn-primary w-full text-lg py-6" 
                disabled={loading || otp.join('').length !== 6}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                    Verifying...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 mr-3" />
                    Verify Email
                  </div>
                )}
              </Button>
            </form>

            {/* Resend OTP */}
            <div className="text-center pt-6 border-t-2 border-gray-100">
              <p className="text-gray-600 mb-3">
                Didn&apos;t receive the code?
              </p>
              {canResend ? (
                <Button
                  variant="ghost"
                  onClick={handleResend}
                  disabled={resending}
                  className="font-bold text-amber-600 hover:text-amber-700"
                >
                  {resending ? 'Sending...' : 'Resend Code'}
                </Button>
              ) : (
                <p className="text-sm text-gray-500">
                  Resend available in {countdown}s
                </p>
              )}
            </div>

                {/* Back Link */}
                <div className="text-center">
                  <Link 
                    href="/register" 
                    className="inline-flex items-center text-gray-600 hover:text-black transition-colors font-semibold"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Register
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            © 2024 FreelanceHub. Built with care.
          </p>
        </div>
      </div>
    </div>
  );
}
