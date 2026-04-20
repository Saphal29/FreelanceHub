'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { forgotPassword } from '@/lib/api';

// Validation schema
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-50 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-xl font-semibold text-gray-800">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-gray-600">
              We've sent password reset instructions to your email
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert variant="success">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                If an account with email <strong>{getValues('email')}</strong> exists, 
                you will receive password reset instructions shortly.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 text-center">
              <div className="text-sm text-gray-600 space-y-2">
                <p>Didn't receive the email? Check your spam folder.</p>
                <p>The reset link will expire in 1 hour.</p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                >
                  Send Another Email
                </Button>
                
                <Link href="/login">
                  <Button variant="ghost" className="w-full hover:bg-amber-50 hover:text-amber-700">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>

            {/* Help Section */}
            <div className="pt-6 border-t border-gray-100">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Still having trouble?
                </p>
                <div className="flex justify-center space-x-4 text-xs">
                  <Link 
                    href="/contact" 
                    className="text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    Contact Support
                  </Link>
                  <span className="text-gray-300">•</span>
                  <Link 
                    href="/help" 
                    className="text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    Help Center
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-amber-50 rounded-full">
              <Mail className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            Forgot Password?
          </CardTitle>
          <CardDescription className="text-gray-600">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="Enter your email address"
                  className="pl-10 h-11 border-gray-200 focus:border-amber-500 focus:ring-amber-500"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500 animate-in slide-in-from-top-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending Reset Link...
                </div>
              ) : (
                <div className="flex items-center">
                  <Send className="h-4 w-4 mr-2" />
                  Send Reset Link
                </div>
              )}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="text-center pt-4 border-t border-gray-100">
            <Link href="/login">
              <Button variant="ghost" className="text-sm hover:bg-amber-50 hover:text-amber-700">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </div>

          {/* Additional Info */}
          <div className="bg-amber-50 rounded-lg p-4 text-sm text-amber-900 border border-amber-100">
            <div className="flex items-start">
              <Mail className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0 text-amber-600" />
              <div>
                <p className="font-medium mb-1">Security Notice</p>
                <p className="text-amber-800">
                  For security reasons, we'll send reset instructions to your email 
                  regardless of whether an account exists with that address.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}