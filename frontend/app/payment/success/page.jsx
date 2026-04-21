"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyStripePayment } from "@/lib/api";
import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const paymentId = searchParams.get("payment_id");

    if (sessionId) {
      verifyPayment(sessionId);
    } else {
      setError("Missing payment session information");
      setVerifying(false);
    }
  }, [searchParams]);

  const verifyPayment = async (sessionId) => {
    try {
      const response = await verifyStripePayment(sessionId);
      if (response.success) {
        setPayment(response.payment);
      } else {
        setError(response.error || "Payment verification failed");
      }
    } catch (err) {
      setError(err.message || "Failed to verify payment");
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-accent mx-auto mb-4" />
          <p className="text-lg text-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Payment Verification Failed</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link
            href="/contracts"
            className="inline-block px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            Back to Contracts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground mb-6">
          Your payment has been processed and funds have been deposited into escrow.
        </p>
        
        {payment && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Amount Paid:</span>
              <span className="text-sm font-semibold text-foreground">
                Rs. {payment.amount?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Platform Fee (10%):</span>
              <span className="text-sm font-semibold text-foreground">
                Rs. {payment.platform_fee?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-sm font-medium text-foreground">Freelancer Receives:</span>
              <span className="text-sm font-bold text-green-600">
                Rs. {payment.net_amount?.toLocaleString()}
              </span>
            </div>
          </div>
        )}
        
        <Link
          href="/contracts"
          className="inline-block px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          View Contracts
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-accent mx-auto mb-4" />
          <p className="text-lg text-foreground">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
