"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CommandRail from "@/components/layout/CommandRail";
import ReviewForm from "@/components/reviews/ReviewForm";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { canReviewContract, getContractById } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function ContractReviewPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params?.id;
  const { user } = useAuth();

  const [contract, setContract] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [checkMessage, setCheckMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (contractId) checkEligibility();
  }, [contractId]);

  const checkEligibility = async () => {
    try {
      setLoading(true);
      setError("");

      const contractResponse = await getContractById(contractId);
      if (contractResponse.success) {
        setContract(contractResponse.contract);
      }

      const eligibilityResponse = await canReviewContract(contractId);
      if (eligibilityResponse.success) {
        setCanReview(eligibilityResponse.canReview);
        setCheckMessage(eligibilityResponse.reason || "");
      }
    } catch (err) {
      console.error("Error checking eligibility:", err);
      setError("Failed to load review verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSuccess = () => {
    router.push(`/contracts/${contractId}`);
  };

  const handleCancel = () => {
    router.push(`/contracts/${contractId}`);
  };

  const userType = user?.role === "CLIENT" ? "client" : "freelancer";

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger">
        <div className="space-y-3 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--signal)] mx-auto"></div>
          <p className="text-[12px] text-[var(--muted)] uppercase">VERIFYING CONTRACT REVIEW ELIGIBILITY...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType={userType} />

      {/* Floating Tool Rail */}
      <CommandRail userType={userType} />

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 flex-1 w-full pb-24 lg:pb-12 text-left font-mono-ledger">
        
        <div className="flex items-center justify-between border-b border-[var(--ink)] pb-4 text-[11px] uppercase tracking-wider">
          <button
            onClick={handleCancel}
            className="text-[var(--muted)] hover:text-[var(--ink)] flex items-center space-x-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>RETURN TO CONTRACT WORKSPACE</span>
          </button>
          <span className="text-[var(--signal)] font-bold">[PERFORMANCE EVALUATION]</span>
        </div>

        <div className="space-y-2">
          <h1 className="font-serif-ledger text-[34px] font-medium text-[var(--ink)]">
            Post-Contract Performance Evaluation.
          </h1>
          {contract && (
            <p className="text-[14px] text-[var(--muted)]">
              CONTRACT: <strong className="text-[var(--ink)]">{contract.projectTitle}</strong> (ID: #{contractId?.slice(0, 8)})
            </p>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] text-[12px] flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!canReview ? (
          <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-8 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-[var(--signal)] mx-auto" />
            <h3 className="font-serif-ledger text-[22px] font-medium text-[var(--ink)]">
              Evaluation Record Unavailable
            </h3>
            <p className="text-[13px] text-[var(--muted)] max-w-md mx-auto">
              {checkMessage || "You are currently unable to submit a review for this contract."}
            </p>
            <button
              onClick={handleCancel}
              className="bg-[var(--ink)] text-[var(--paper)] font-bold text-[11px] uppercase px-6 py-3 hover:bg-[var(--signal)] transition-colors inline-block"
            >
              RETURN TO CONTRACT WORKSPACE →
            </button>
          </div>
        ) : (
          <div className="border-2 border-[var(--ink)] bg-[var(--paper)] p-6 sm:p-8 space-y-6">
            <ReviewForm
              contractId={contractId}
              onSuccess={handleReviewSuccess}
              onCancel={handleCancel}
            />
          </div>
        )}

      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center mt-12 font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Performance Evaluation Form</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
