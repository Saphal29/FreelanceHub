"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CommandRail from "@/components/layout/CommandRail";
import EmptyState from "@/components/common/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { getMyProposals, withdrawProposal } from "@/lib/api";
import { 
  Clock,
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle,
  MinusCircle,
  User,
  Banknote,
  ArrowRight
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export default function MyProposalsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  // Redirect if not authenticated or not a freelancer
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "FREELANCER")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch proposals
  useEffect(() => {
    const fetchProposals = async () => {
      if (!user || user.role !== "FREELANCER") return;

      try {
        setLoading(true);
        setError("");

        const params = {};
        if (statusFilter !== "all") {
          params.status = statusFilter;
        }

        const response = await getMyProposals(params);

        if (response.success) {
          setProposals(response.proposals || []);
        } else {
          setError(response.error || "Could not load proposal register.");
        }
      } catch (err) {
        console.error("Error fetching proposals:", err);
        setError("Network sync error while loading proposals.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchProposals();
    }
  }, [user, authLoading, statusFilter]);

  // Handle withdraw proposal
  const handleWithdraw = async (proposalId) => {
    if (!confirm("Are you sure you want to withdraw this proposal?")) return;

    try {
      setActionLoading({ ...actionLoading, [proposalId]: "withdrawing" });
      setError("");
      setSuccessMessage("");

      const response = await withdrawProposal(proposalId);

      if (response.success) {
        setSuccessMessage("Proposal withdrawn successfully!");
        setProposals(proposals.map(p => 
          p.id === proposalId ? { ...p, status: "withdrawn" } : p
        ));
        setTimeout(() => setSuccessMessage(""), 3500);
      } else {
        setError(response.error || "Failed to withdraw proposal");
      }
    } catch (err) {
      console.error("Error withdrawing proposal:", err);
      setError(err.message || "Failed to withdraw proposal");
    } finally {
      setActionLoading({ ...actionLoading, [proposalId]: null });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType="freelancer" />

      {/* Floating Tool Rail */}
      <CommandRail userType="freelancer" />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 lg:pl-20 py-8 sm:py-12 space-y-10 flex-1 w-full pb-24 lg:pb-12">
        
        {/* EDITORIAL HEADER */}
        <section className="space-y-4 text-left border-b border-[var(--ink)] pb-8">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
            <span>FREELANCEHUB PROPOSAL REGISTER · SUBMITTED BIDS</span>
          </p>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="font-serif-ledger text-[38px] sm:text-[50px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
                Submitted Proposals.
              </h1>
              <p className="text-[15px] text-[var(--muted)] max-w-xl">
                Track your active proposals, review client statuses, and manage bid specifications across open project briefs.
              </p>
            </div>

            <Link 
              href="/projects" 
              className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-5 py-3 transition-colors inline-flex items-center space-x-2 shrink-0 shadow-xs"
            >
              <span>BROWSE OPEN BRIEFS →</span>
            </Link>
          </div>
        </section>


        {/* FILTER TABS */}
        <section className="space-y-4 text-left font-mono-ledger text-[11px] uppercase">
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--ink)] pb-3">
            <span className="text-[var(--muted)] font-bold mr-2">STATUS FILTER:</span>
            {[
              { id: "all", label: "ALL PROPOSALS" },
              { id: "pending", label: "PENDING REVIEW" },
              { id: "accepted", label: "ACCEPTED & CONTRACTED" },
              { id: "rejected", label: "REJECTED" },
              { id: "withdrawn", label: "WITHDRAWN" }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setStatusFilter(t.id)}
                className={`px-3.5 py-1.5 border transition-colors ${
                  statusFilter === t.id
                    ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-bold"
                    : "bg-[var(--paper-2)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--ink)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>


        {/* NOTIFICATIONS */}
        {error && (
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-600 text-green-800 font-mono-ledger text-[12px] flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
        )}


        {/* PROPOSALS SPECIMEN LIST */}
        <section className="space-y-6 text-left">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="border-2 border-[var(--line)] bg-[var(--paper-2)] h-44 animate-pulse p-6"></div>
              ))}
            </div>
          ) : proposals.length === 0 ? (
            <EmptyState
              marker="PROPOSAL ARCHIVE"
              title="No proposals submitted yet."
              description="Explore verified open project briefs and submit tailored proposals with your rate in NPR."
              actionLabel="BROWSE OPEN PROJECTS →"
              actionHref="/projects"
            />
          ) : (
            <div className="space-y-6">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="border-2 border-[var(--ink)] bg-[var(--paper)] p-6 space-y-4 text-left hover:border-[var(--signal)] transition-colors shadow-xs group"
                >
                  {/* Header Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--line)] pb-3 gap-2 font-mono-ledger text-[11px] uppercase">
                    <span className="text-[var(--signal)] font-bold flex items-center space-x-1.5">
                      <span>PROPOSAL SPECIMEN / #{proposal.id?.slice(0, 8) || '0001'}</span>
                    </span>

                    <div className="flex items-center space-x-3 text-[10px]">
                      <span>SUBMITTED: {new Date(proposal.createdAt || Date.now()).toLocaleDateString()}</span>
                      <span className="px-2 py-0.5 border border-[var(--ink)] bg-[var(--paper-2)] font-bold text-[var(--ink)]">
                        [{proposal.status?.toUpperCase() || 'PENDING'}]
                      </span>
                    </div>
                  </div>

                  {/* Body Grid */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    
                    <div className="space-y-2 max-w-2xl">
                      <Link href={`/projects/${proposal.projectId}`}>
                        <h3 className="font-serif-ledger text-[22px] font-medium text-[var(--ink)] leading-snug group-hover:text-[var(--signal)] transition-colors">
                          {proposal.project?.title || "Project Brief Specimen"}
                        </h3>
                      </Link>

                      {proposal.client && (
                        <p className="font-mono-ledger text-[11px] text-[var(--muted)] uppercase">
                          CLIENT: {proposal.client.name} {proposal.client.company && `(${proposal.client.company})`}
                        </p>
                      )}

                      {proposal.coverLetter && (
                        <p className="font-sans-ledger text-[13px] text-[var(--muted)] line-clamp-2 leading-relaxed pt-1">
                          "{proposal.coverLetter}"
                        </p>
                      )}
                    </div>

                    <div className="text-left lg:text-right font-mono-ledger space-y-1 shrink-0">
                      {proposal.proposedBudget && (
                        <div>
                          <span className="text-[10px] text-[var(--muted)] uppercase block">PROPOSED BID (NPR)</span>
                          <span className="text-[22px] font-bold text-[var(--signal)] block tracking-tight">
                            {formatCurrency(proposal.proposedBudget)}
                          </span>
                        </div>
                      )}

                      {proposal.proposedTimeline && (
                        <span className="text-[11px] text-[var(--ink)] font-bold block">
                          TIMELINE: {proposal.proposedTimeline}
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-[var(--line)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono-ledger text-[11px]">
                    <Link
                      href={`/projects/${proposal.projectId}`}
                      className="text-[var(--ink)] hover:text-[var(--signal)] font-bold uppercase underline text-[11px]"
                    >
                      VIEW PROJECT SPECIMEN BRIEF →
                    </Link>

                    {proposal.status === "pending" && (
                      <button
                        onClick={() => handleWithdraw(proposal.id)}
                        disabled={actionLoading[proposal.id] === "withdrawing"}
                        className="px-4 py-2 border border-[var(--ink)] bg-[var(--paper-2)] text-[var(--signal)] hover:bg-red-50 font-bold uppercase transition-colors"
                      >
                        {actionLoading[proposal.id] === "withdrawing" ? "WITHDRAWING..." : "WITHDRAW PROPOSAL"}
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center mt-12 font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Proposal Register & Bids Archive</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
