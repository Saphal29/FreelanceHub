'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, Briefcase, Users, Sparkles, Crown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    setValue,
    trigger
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'FREELANCER'
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
        setSuccess(response.message);
        
        // Redirect to OTP verification page
        setTimeout(() => {
          router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
        }, 1500);
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
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-black/5 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-black text-black mb-2">
              Freelance<span className="text-gradient-gold">Hub</span>
            </h1>
          </Link>
          <p className="text-gray-600 text-lg">Join our community</p>
        </div>

        <Card className="card-premium shadow-3xl border-2 border-gray-100">
          <CardHeader className="space-y-6 text-center pb-8">
            <div className="flex justify-center">
              <div className="h-20 w-20 bg-black rounded-2xl flex items-center justify-center shadow-xl">
                <Sparkles className="h-10 w-10 text-amber-500" />
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl font-black text-black mb-2">
                Create Account
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                Start your freelancing journey today
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 px-8 pb-8">
            {error && (
              <Alert className="border-2 border-red-200 bg-red-50 animate-in slide-in-from-top-2">
                <AlertDescription className="text-red-800 font-semibold">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-2 border-green-200 bg-green-50 animate-in slide-in-from-top-2">
                <AlertDescription className="text-green-800 font-semibold">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-3">
                <Label htmlFor="fullName" className="form-label-modern">
                  Full Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  <Input
                    id="fullName"
                    {...register('fullName')}
                    placeholder="Enter your full name"
                    className="form-input-modern pl-12 text-lg"
                  />
                </div>
                {errors.fullName && (
                  <p className="form-error-modern animate-in slide-in-from-top-1">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-3">
                <Label htmlFor="email" className="form-label-modern">
                  Email Address *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Enter your email"
                    className="form-input-modern pl-12 text-lg"
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
                <Label htmlFor="password" className="form-label-modern">
                  Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Create a strong password"
                    className="form-input-modern pl-12 pr-12 text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {watchedPassword && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-semibold">Password Strength</span>
                      <span className={`font-bold ${strengthInfo.color}`}>
                        {strengthInfo.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${strengthInfo.bgColor}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-sm text-gray-600 space-y-1">
                        {passwordStrength.feedback.map((feedback, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-2 h-2 bg-amber-500 rounded-full mr-3" />
                            {feedback}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                
                {errors.password && (
                  <p className="form-error-modern animate-in slide-in-from-top-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="form-label-modern">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    placeholder="Confirm your password"
                    className="form-input-modern pl-12 pr-12 text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="form-error-modern animate-in slide-in-from-top-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-3">
                <Label htmlFor="phone" className="form-label-modern">
                  Phone Number (Optional)
                </Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="+977-9812345678"
                    className="form-input-modern pl-12 text-lg"
                  />
                </div>
                {errors.phone && (
                  <p className="form-error-modern animate-in slide-in-from-top-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-4">
                <Label className="form-label-modern">
                  Choose Your Path *
                </Label>
                <RadioGroup
                  value={watchedRole}
                  onValueChange={(value) => setValue('role', value)}
                  className="grid grid-cols-1 gap-4"
                >
                  <div className="flex items-center space-x-4 p-6 border-2 border-gray-200 rounded-xl hover:border-black hover:bg-gray-50 cursor-pointer transition-all duration-300">
                    <RadioGroupItem value="FREELANCER" id="freelancer" className="border-2 border-black" />
                    <Label htmlFor="freelancer" className="flex items-center cursor-pointer flex-1">
                      <div className="h-12 w-12 bg-black rounded-xl flex items-center justify-center mr-4">
                        <Briefcase className="h-6 w-6 text-amber-500" />
                      </div>
                      <div>
                        <div className="font-bold text-black text-lg">Freelancer</div>
                        <div className="text-gray-600">Offer your skills and services</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-4 p-6 border-2 border-gray-200 rounded-xl hover:border-black hover:bg-gray-50 cursor-pointer transition-all duration-300">
                    <RadioGroupItem value="CLIENT" id="client" className="border-2 border-black" />
                    <Label htmlFor="client" className="flex items-center cursor-pointer flex-1">
                      <div className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center mr-4">
                        <Crown className="h-6 w-6 text-black" />
                      </div>
                      <div>
                        <div className="font-bold text-black text-lg">Client</div>
                        <div className="text-gray-600">Find talented freelancers</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                {errors.role && (
                  <p className="form-error-modern animate-in slide-in-from-top-1">
                    {errors.role.message}
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
                    Creating Your Account...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-3" />
                    Create Account
                  </div>
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-6 border-t-2 border-gray-100">
              <p className="text-gray-600 text-lg">
                Already have an account?{' '}
                <Link 
                  href="/login" 
                  className="font-bold text-black hover:text-amber-600 transition-colors"
                >
                  Sign In
                </Link>
              </p>
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