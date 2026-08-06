"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import EmptyState from "@/components/common/EmptyState";
import ReviewCard from "@/components/reviews/ReviewCard";
import { Star, AlertCircle, ArrowLeft } from "lucide-react";
import { getReceivedReviews, getGivenReviews } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function ReviewsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("received");
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [givenReviews, setGivenReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReviewsData();
  }, []);

  const loadReviewsData = async () => {
    try {
      setLoading(true);
      setError("");

      const [receivedData, givenData] = await Promise.allSettled([
        getReceivedReviews(),
        getGivenReviews()
      ]);

      if (receivedData.status === 'fulfilled' && receivedData.value?.success) {
        setReceivedReviews(receivedData.value.reviews || []);
      }

      if (givenData.status === 'fulfilled' && givenData.value?.success) {
        setGivenReviews(givenData.value.reviews || []);
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
      setError("Failed to load reputation records.");
    } finally {
      setLoading(false);
    }
  };

  const userType = user?.role === "CLIENT" ? "client" : "freelancer";

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType={userType} />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-10 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* EDITORIAL HEADER */}
        <section className="space-y-4 border-b border-[var(--ink)] pb-8">
          <div className="flex items-center justify-between font-mono-ledger text-[11px] uppercase tracking-wider">
            <Link 
              href="/profile" 
              className="text-[var(--muted)] hover:text-[var(--ink)] flex items-center space-x-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>RETURN TO PROFILE SPECIMEN</span>
            </Link>
            <span className="text-[var(--signal)] font-bold">FREELANCEHUB REGISTER · REPUTATION & REVIEWS</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif-ledger text-[36px] sm:text-[48px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
              Reviews & Ratings Ledger.
            </h1>
            <p className="text-[15px] text-[var(--muted)]">
              View official performance evaluations and verified star ratings received from contract participants.
            </p>
          </div>
        </section>


        {/* TABS */}
        <section className="space-y-4 font-mono-ledger text-[11px] uppercase">
          <div className="flex border-b border-[var(--ink)] space-x-6 pb-2">
            <button
              onClick={() => setActiveTab("received")}
              className={`pb-2 border-b-2 font-bold transition-colors ${
                activeTab === "received"
                  ? "border-[var(--signal)] text-[var(--signal)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              RECEIVED REVIEWS ({receivedReviews.length})
            </button>
            <button
              onClick={() => setActiveTab("given")}
              className={`pb-2 border-b-2 font-bold transition-colors ${
                activeTab === "given"
                  ? "border-[var(--signal)] text-[var(--signal)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              GIVEN REVIEWS ({givenReviews.length})
            </button>
          </div>
        </section>


        {/* ERROR BANNER */}
        {error && (
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span>{error}</span>
          </div>
        )}


        {/* REVIEWS STREAM */}
        <section className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="border-2 border-[var(--line)] bg-[var(--paper-2)] h-32 animate-pulse p-6"></div>
              ))}
            </div>
          ) : activeTab === "received" ? (
            receivedReviews.length === 0 ? (
              <EmptyState
                marker="REPUTATION RECORD"
                title="No reviews received yet."
                description="Complete contract milestones to receive official client feedback and rating specimens."
                actionLabel="VIEW CONTRACT REGISTER →"
                actionHref="/contracts"
              />
            ) : (
              <div className="space-y-4">
                {receivedReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    canRespond={!review.response}
                    onUpdate={loadReviewsData}
                  />
                ))}
              </div>
            )
          ) : (
            givenReviews.length === 0 ? (
              <EmptyState
                marker="REPUTATION RECORD"
                title="No reviews given yet."
                description="Once contracts reach completion, you can submit official ratings for participants."
                actionLabel="VIEW CONTRACT REGISTER →"
                actionHref="/contracts"
              />
            ) : (
              <div className="space-y-4">
                {givenReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    canRespond={false}
                    onUpdate={loadReviewsData}
                  />
                ))}
              </div>
            )
          )}
        </section>

      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center mt-12 font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Reviews & Ratings Ledger</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
