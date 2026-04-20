"use client";

import { XCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="h-10 w-10 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Payment Cancelled</h1>
        <p className="text-muted-foreground mb-6">
          Your payment was cancelled. No charges have been made to your account.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          You can try again anytime from the contract page.
        </p>
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
