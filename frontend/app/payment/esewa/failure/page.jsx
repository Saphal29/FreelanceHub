"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EsewaFailurePage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 px-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Payment Cancelled</h1>
        <p className="text-muted-foreground mb-6">Your eSewa payment was cancelled or failed. No funds were deducted.</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => router.back()}>Go Back</Button>
          <Link href="/contracts" className="flex-1">
            <Button className="w-full" variant="accent">View Contracts</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
