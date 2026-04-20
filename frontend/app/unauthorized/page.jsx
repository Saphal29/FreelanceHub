'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, Lock, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnauthorizedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const returnUrl = searchParams.get('returnUrl') || '/login';

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(returnUrl);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, returnUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-50 rounded-full">
              <ShieldAlert className="h-12 w-12 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Access Denied
          </CardTitle>
          <CardDescription className="text-gray-600">
            You need to be logged in to access this page
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Main Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <Lock className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">
                  Authentication Required
                </h3>
                <p className="text-sm text-red-700">
                  This page is protected and requires you to sign in to your account.
                  Please log in to continue.
                </p>
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Redirecting to login page in{' '}
              <span className="font-bold text-red-600 text-lg">{countdown}</span>{' '}
              seconds...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(countdown / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/login">
              <Button className="w-full h-11 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium">
                <Lock className="h-4 w-4 mr-2" />
                Go to Login
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>

            <Link href="/">
              <Button variant="outline" className="w-full h-11 border-gray-300 hover:bg-gray-50">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Additional Info */}
          <div className="pt-4 border-t border-gray-100">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Don't have an account?
              </p>
              <Link 
                href="/register" 
                className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
              >
                Create a free account →
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
