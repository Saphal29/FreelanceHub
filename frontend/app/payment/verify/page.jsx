"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPayment } from "@/lib/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PaymentVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying | success | failed
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const pidx = searchParams.get("pidx");
    const purchaseOrderId = searchParams.get("purchase_order_id") || searchParams.get("orderId");
    const txnStatus = searchParams.get("status");

    if (!pidx || !purchaseOrderId) {
      setStatus("failed");
      setError("Invalid payment callback. Missing required parameters.");
      return;
    }

    // If Khalti says it failed, don't bother verifying
    if (txnStatus && txnStatus !== "Completed") {
      setStatus("failed");
      setError(`Payment was not completed. Status: ${txnStatus}`);
      return;
    }

    verifyPayment(pidx, purchaseOrderId)
      .then((res) => {
        if (res.success) {
          setPayment(res.payment);
          setStatus("success");
        } else {
          setStatus("failed");
          setError(res.error || "Payment verification failed");
        }
      })
      .catch((err) => {
        setStatus("failed");
        setError(err.message || "Payment verification failed");
      });
  }, [searchParams]);

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
        <p className="text-lg font-semibold text-foreground">Verifying your payment...</p>
        <p className="text-muted-foreground text-sm">Please wait, do not close this page.</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 px-4">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Payment Successful</h1>
          <p className="text-muted-foreground mb-6">
            Your funds have been securely held in escrow.
          </p>
          {payment && (
            <div className="bg-muted rounded-xl p-4 text-left space-y-2 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-foreground">NPR {payment.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee (10%)</span>
                <span className="font-semibold text-foreground">NPR {payment.platformFee?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Freelancer Receives</span>
                <span className="font-semibold text-green-600">NPR {payment.netAmount?.toLocaleString()}</span>
              </div>
              {payment.transactionId && (
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs text-foreground">{payment.transactionId}</span>
                </div>
              )}
            </div>
          )}
          <Link href="/contracts">
            <Button className="w-full" variant="accent">View Contracts</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 px-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Payment Failed</h1>
        <p className="text-muted-foreground mb-6">{error || "Something went wrong with your payment."}</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => router.back()}>
            Go Back
          </Button>
          <Link href="/contracts" className="flex-1">
            <Button className="w-full" variant="accent">View Contracts</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
