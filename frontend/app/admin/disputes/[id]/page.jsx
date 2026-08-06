"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { getDisputeById, resolveDispute } from "@/lib/api";
import DisputeTimeline from "@/components/disputes/DisputeTimeline";
import DisputeMessages from "@/components/disputes/DisputeMessages";
import DisputeEvidence from "@/components/disputes/DisputeEvidence";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

export default function AdminDisputeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const disputeId = params?.id;
  const { user, loading: authLoading } = useAuth();
  
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resolving, setResolving] = useState(false);
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [activeTab, setActiveTab] = useState("messages");
  
  const [resolutionData, setResolutionData] = useState({
    resolutionType: "",
    resolutionNotes: "",
    resolutionAmount: ""
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "ADMIN" && disputeId) {
      fetchDispute();
    }
  }, [user, disputeId]);

  const fetchDispute = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await getDisputeById(disputeId);
      
      if (response.success) {
        setDispute(response.dispute);
      } else {
        setError(response.error || "Failed to load dispute record.");
      }
    } catch (err) {
      console.error("Error fetching dispute:", err);
      setError(err.message || "Failed to load dispute record.");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    
    if (!resolutionData.resolutionType) {
      setError("Please select a resolution type");
      return;
    }
    
    if (!resolutionData.resolutionNotes.trim()) {
      setError("Please provide resolution notes");
      return;
    }
    
    try {
      setResolving(true);
      setError("");
      
      const response = await resolveDispute(disputeId, {
        resolutionType: resolutionData.resolutionType,
        resolutionNotes: resolutionData.resolutionNotes,
        resolutionAmount: resolutionData.resolutionAmount ? parseFloat(resolutionData.resolutionAmount) : null
      });
      
      if (response.success) {
        setSuccess("Dispute resolved successfully!");
        setShowResolutionForm(false);
        fetchDispute();
        setTimeout(() => setSuccess(""), 3500);
      } else {
        setError(response.error || "Failed to resolve dispute");
      }
    } catch (err) {
      console.error("Error resolving dispute:", err);
      setError(err.message || "Failed to resolve dispute");
    } finally {
      setResolving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger text-[12px] text-[var(--muted)]">
        LOADING ADMIN DISPUTE RECORD...
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") return null;

  if (error && !dispute) {
    return (
      <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger">
        <Navbar userType="admin" />
        <main className="max-w-4xl mx-auto px-4 py-16 space-y-6 text-left font-mono-ledger text-[12px]">
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)]">
            {error}
          </div>
          <Link 
            href="/admin/disputes" 
            className="inline-block text-[var(--ink)] font-bold hover:text-[var(--signal)] underline"
          >
            ← Back to Admin Disputes
          </Link>
        </main>
      </div>
    );
  }

  if (!dispute) return null;

  const canResolve = dispute.status !== "resolved" && dispute.status !== "closed";

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType="admin" />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-8 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* ARCHETYPE F: 1. BACK LINK */}
        <div className="font-mono-ledger text-[11px]">
          <Link href="/admin/disputes" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
            ← Back to Admin Disputes
          </Link>
        </div>

        {/* ARCHETYPE F: 2. RECORD SUMMARY STRIP */}
        <section className="space-y-2">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            ADMIN DISPUTE RECORD · #{dispute.id?.slice(0, 8) || '0001'}
          </p>

          <div className="border-y-2 border-[var(--ink)] py-5 my-2 flex flex-col lg:flex-row lg:items-center justify-between gap-6 font-mono-ledger text-[12px]">
            <div className="space-y-2 max-w-2xl">
              <h1 className="font-serif-ledger text-[28px] sm:text-[36px] font-medium text-[var(--ink)] leading-snug">
                {dispute.title}
              </h1>

              <div className="flex items-center space-x-6 text-[12px] pt-1">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-[var(--ink)] text-[var(--paper)] font-bold text-[14px] flex items-center justify-center shrink-0">
                    {(dispute.filedByName || 'C').charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--muted)] block uppercase">FILED BY</span>
                    <span className="font-bold text-[var(--ink)]">{dispute.filedByName}</span>
                  </div>
                </div>

                <span className="text-[var(--muted)]">↔</span>

                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-[var(--signal)] text-[var(--paper)] font-bold text-[14px] flex items-center justify-center shrink-0">
                    {(dispute.respondentName || 'R').charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--muted)] block uppercase">RESPONDENT</span>
                    <span className="font-bold text-[var(--ink)]">{dispute.respondentName}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-left lg:text-right space-y-1 shrink-0">
              <span className="text-[10px] text-[var(--muted)] uppercase block">Disputed Amount</span>
              <span className="text-[26px] font-bold text-[var(--signal)] block">
                {dispute.amountDisputed ? formatCurrency(dispute.amountDisputed) : 'N/A'}
              </span>
              <span className="text-[12px] font-bold text-[var(--signal)] block">
                [{dispute.status?.replace('_', ' ')?.toUpperCase() || 'OPEN'}]
              </span>
            </div>
          </div>
        </section>

        {/* NOTIFICATIONS */}
        {success && (
          <div className="p-4 bg-[var(--paper-2)] border border-[var(--signal)] text-[var(--ink)] font-mono-ledger text-[12px] flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span className="font-bold">{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {/* Resolution Form Toggle */}
        {showResolutionForm && canResolve && (
          <div className="border-2 border-[var(--signal)] bg-amber-50 p-6 space-y-4 font-mono-ledger text-[12px]">
            <h3 className="font-serif-ledger text-[20px] font-bold text-[var(--ink)]">
              Admin Resolution Dispatch
            </h3>
            <form onSubmit={handleResolveDispute} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--muted)] uppercase font-bold">RESOLUTION TYPE *</label>
                <select
                  value={resolutionData.resolutionType}
                  onChange={(e) => setResolutionData({ ...resolutionData, resolutionType: e.target.value })}
                  className="w-full bg-[var(--paper)] border border-[var(--ink)] p-2.5 outline-none font-bold"
                  required
                >
                  <option value="">Select resolution type</option>
                  <option value="release_to_freelancer">Release payment to freelancer</option>
                  <option value="refund_to_client">Refund to client</option>
                  <option value="partial_settlement">Partial settlement</option>
                  <option value="no_action">No action required</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[var(--muted)] uppercase font-bold">RESOLUTION NOTES *</label>
                <textarea
                  value={resolutionData.resolutionNotes}
                  onChange={(e) => setResolutionData({ ...resolutionData, resolutionNotes: e.target.value })}
                  className="w-full bg-[var(--paper)] border border-[var(--ink)] p-2.5 outline-none font-sans-ledger min-h-[100px]"
                  placeholder="Explain official admin decision..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={resolving}
                  className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold px-5 py-2.5 uppercase transition-colors"
                >
                  {resolving ? "Resolving..." : "Submit resolution →"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResolutionForm(false)}
                  className="bg-[var(--paper)] border border-[var(--ink)] text-[var(--ink)] font-bold px-5 py-2.5 uppercase"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ARCHETYPE F: 3. TWO-COLUMN BODY (65 / 35 SPLIT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column (65%): MEDIATION LOG */}
          <div className="lg:col-span-8 space-y-8">
            
            <div className="space-y-2 font-mono-ledger text-[12px]">
              <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
                Dispute Statement
              </span>
              <div className="border border-[var(--ink)] bg-[var(--paper)] p-5 font-sans-ledger text-[14px] leading-relaxed text-[var(--ink)]">
                {dispute.description}
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>MEDIATION LOG & CASE DISPATCH</span>
                <div className="flex space-x-3">
                  {["messages", "evidence", "timeline"].map(t => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`uppercase transition-colors ${activeTab === t ? "text-[var(--signal)] font-bold border-b-2 border-[var(--signal)]" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-[var(--ink)] bg-[var(--paper)] p-6">
                {activeTab === "messages" && <DisputeMessages disputeId={disputeId} isMediator={true} />}
                {activeTab === "evidence" && <DisputeEvidence disputeId={disputeId} />}
                {activeTab === "timeline" && <DisputeTimeline disputeId={disputeId} />}
              </div>
            </div>

          </div>

          {/* Right Column (35%): ACTION PANEL */}
          <div className="lg:col-span-4 space-y-6 font-mono-ledger text-[12px]">
            
            <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 space-y-5">
              <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
                Admin Action Panel
              </span>

              {/* Single Primary Action Button */}
              {canResolve ? (
                <button
                  onClick={() => setShowResolutionForm(!showResolutionForm)}
                  className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider py-3.5 px-4 transition-colors"
                >
                  Resolve dispute record →
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-[var(--line)] text-[var(--muted)] font-bold text-[12px] uppercase py-3.5 px-4 cursor-not-allowed"
                >
                  Dispute resolved
                </button>
              )}

              {/* Secondary Actions */}
              <div className="space-y-2 pt-2 border-t border-[var(--line)] text-[11px]">
                <Link 
                  href="/admin/disputes" 
                  className="text-[var(--ink)] font-bold hover:text-[var(--signal)] underline block"
                >
                  Return to admin disputes register →
                </Link>
              </div>

              {/* Compact Parties Block */}
              <div className="pt-4 border-t border-[var(--ink)] space-y-3">
                <span className="font-bold text-[var(--ink)] uppercase text-[10px] block">Parties Involved</span>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[var(--ink)] text-[var(--paper)] font-bold text-[14px] flex items-center justify-center shrink-0">
                    {(dispute.filedByName || 'C').charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-[var(--ink)] block">{dispute.filedByName}</span>
                    <span className="text-[10px] text-[var(--muted)] uppercase block">FILED BY</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[var(--signal)] text-[var(--paper)] font-bold text-[14px] flex items-center justify-center shrink-0">
                    {(dispute.respondentName || 'R').charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-[var(--ink)] block">{dispute.respondentName}</span>
                    <span className="text-[10px] text-[var(--muted)] uppercase block">RESPONDENT</span>
                  </div>
                </div>
              </div>

              {/* Key-Value Details List */}
              <div className="pt-4 border-t border-[var(--ink)] space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Case ID:</span>
                  <span className="font-bold text-[var(--ink)]">#{dispute.id?.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Category:</span>
                  <span className="font-bold text-[var(--ink)]">[{dispute.category?.replace('_', ' ')?.toUpperCase()}]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Priority:</span>
                  <span className="font-bold text-[var(--signal)]">[{dispute.priority?.toUpperCase() || 'MEDIUM'}]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)] font-mono-ledger">Filed Date:</span>
                  <span className="font-bold text-[var(--ink)]">{new Date(dispute.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Admin Dispute Record Archetype F</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
