'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Mail, Loader2, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { verifyEmail } from '@/lib/api';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing. Please check your email link.');
      return;
    }

    const performVerification = async () => {
      try {
        setIsVerifying(true);
        setStatus('loading');
        
        const response = await verifyEmail(token);
        
        if (response.success) {
          setStatus('success');
          setMessage(response.message);
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(response.error || 'Email verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.message || 'Email verification failed. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    };

    performVerification();
  }, [token, router]);

  const handleRetryVerification = async () => {
    if (!token) return;
    
    try {
      setIsVerifying(true);
      setStatus('loading');
      
      const response = await verifyEmail(token);
      
      if (response.success) {
        setStatus('success');
        setMessage(response.message);
        
        setTimeout(() => {
          router.push('/login?verified=true');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.error || 'Email verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Email verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-50 rounded-full">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
              </div>
            </div>
            <CardTitle className="text-xl font-semibold text-center text-gray-800 mb-2">
              Verifying Your Email
            </CardTitle>
            <CardDescription className="text-center text-gray-600 mb-6">
              Please wait while we verify your email address...
            </CardDescription>
          </>
        );

      case 'success':
        return (
          <>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-50 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-xl font-semibold text-center text-gray-800 mb-2">
              Email Verified Successfully!
            </CardTitle>
            <CardDescription className="text-center text-gray-600 mb-6">
              {message}
            </CardDescription>
            
            <Alert variant="success" className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your account is now active. You will be redirected to the login page in a few seconds.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/login?verified=true')}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
              >
                Continue to Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </>
        );

      case 'error':
        return (
          <>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-50 rounded-full">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
            </div>
            <CardTitle className="text-xl font-semibold text-center text-gray-800 mb-2">
              Verification Failed
            </CardTitle>
            <CardDescription className="text-center text-gray-600 mb-6">
              We couldn't verify your email address.
            </CardDescription>
            
            <Alert variant="destructive" className="mb-6">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {message}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {token && (
                <Button 
                  onClick={handleRetryVerification}
                  disabled={isVerifying}
                  className="w-full"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    'Try Again'
                  )}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => router.push('/register')}
                className="w-full"
              >
                Back to Registration
              </Button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {renderContent()}
          
          {/* Additional Help */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Need help with verification?
              </p>
              <div className="flex justify-center space-x-4 text-xs">
                <Link 
                  href="/contact" 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Contact Support
                </Link>
                <span className="text-gray-300">•</span>
                <Link 
                  href="/help/email-verification" 
                  className="text-primary hover:text-primary/80 transition-colors"
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-black"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
