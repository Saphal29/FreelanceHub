"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import EmptyState from "@/components/common/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { getMyProposals, withdrawProposal } from "@/lib/api";
import { AlertCircle, CheckCircle2 } from "lucide-react";
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

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "FREELANCER")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

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

      {/* Main Container */}
      <main data-tour="proposals-list" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-8 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* EDITORIAL HEADER */}
        <section className="space-y-4 border-b border-[var(--ink)] pb-8">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
            <span>FREELANCEHUB REGISTER · SUBMITTED PROPOSALS</span>
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
              className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-5 py-3 transition-colors inline-flex items-center space-x-2 shrink-0"
            >
              <span>Find open projects →</span>
            </Link>
          </div>
        </section>

        {/* ARCHETYPE E: THE ONE FILTER BAR */}
        <section className="border-y border-[var(--ink)] py-3 font-mono-ledger text-[11px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[var(--muted)] font-bold mr-2 uppercase">Status:</span>
              {[
                { id: "all", label: "All proposals" },
                { id: "pending", label: "Pending review" },
                { id: "accepted", label: "Accepted & contracted" },
                { id: "rejected", label: "Rejected" },
                { id: "withdrawn", label: "Withdrawn" }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setStatusFilter(t.id)}
                  className={`px-3 py-1.5 border transition-colors ${
                    statusFilter === t.id
                      ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-bold"
                      : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--ink)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="text-[var(--muted)] text-[11px]">
              Showing {proposals.length} proposal record{proposals.length === 1 ? '' : 's'}
            </div>
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
          <div className="p-4 bg-[var(--paper-2)] border border-[var(--signal)] text-[var(--ink)] font-mono-ledger text-[12px] flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
        )}

        {/* PROPOSALS REGISTER ROWS */}
        <section className="space-y-4">
          {loading ? (
            <div className="space-y-3 font-mono-ledger text-[12px] text-[var(--muted)] py-12 text-center border border-[var(--line)]">
              LOADING PROPOSAL REGISTER...
            </div>
          ) : proposals.length === 0 ? (
            <EmptyState
              marker="PROPOSAL REGISTER · STATUS: EMPTY"
              title="No proposals submitted yet."
              description="Explore open project briefs and submit tailored proposals with your milestone budget in NPR."
              actionLabel="Find open projects →"
              actionHref="/projects"
            />
          ) : (
            <div className="border border-[var(--ink)] divide-y divide-[var(--line)] bg-[var(--paper)]">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="p-5 sm:p-6 space-y-3 hover:bg-[var(--paper-2)] transition-colors group text-left"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono-ledger text-[11px]">
                    <span className="text-[var(--signal)] font-bold">
                      PROPOSAL / #{proposal.id?.slice(0, 8) || '0001'}
                    </span>

                    <div className="flex items-center space-x-2">
                      <span className="text-[var(--muted)]">Submitted: {new Date(proposal.createdAt || Date.now()).toLocaleDateString()}</span>
                      <span className="text-[var(--ink)] font-bold">
                        [{proposal.status?.toUpperCase() || 'PENDING'}]
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-1 max-w-2xl">
                      <Link href={`/projects/${proposal.projectId}`}>
                        <h3 className="font-serif-ledger text-[20px] font-medium text-[var(--ink)] leading-snug group-hover:text-[var(--signal)] transition-colors">
                          {proposal.project?.title || "Project Brief Specimen"}
                        </h3>
                      </Link>

                      {proposal.client && (
                        <p className="font-mono-ledger text-[11px] text-[var(--muted)]">
                          Client: {proposal.client.name} {proposal.client.company && `(${proposal.client.company})`}
                        </p>
                      )}

                      {proposal.coverLetter && (
                        <p className="font-sans-ledger text-[13px] text-[var(--muted)] line-clamp-2 leading-relaxed pt-1">
                          "{proposal.coverLetter}"
                        </p>
                      )}
                    </div>

                    <div className="font-mono-ledger text-left lg:text-right shrink-0 space-y-0.5">
                      {proposal.proposedBudget && (
                        <div>
                          <span className="text-[10px] text-[var(--muted)] uppercase block">Proposed Bid (NPR)</span>
                          <span className="text-[22px] font-bold text-[var(--signal)] block">
                            {formatCurrency(proposal.proposedBudget)}
                          </span>
                        </div>
                      )}

                      {proposal.proposedTimeline && (
                        <span className="text-[11px] text-[var(--ink)] font-bold block">
                          Timeline: {proposal.proposedTimeline}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--line)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono-ledger text-[11px]">
                    <Link
                      href={`/projects/${proposal.projectId}`}
                      className="text-[var(--ink)] font-bold hover:text-[var(--signal)] underline"
                    >
                      View project brief →
                    </Link>

                    {proposal.status === "pending" && (
                      <button
                        onClick={() => handleWithdraw(proposal.id)}
                        disabled={actionLoading[proposal.id] === "withdrawing"}
                        className="text-[var(--signal)] hover:underline font-bold"
                      >
                        {actionLoading[proposal.id] === "withdrawing" ? "Withdrawing..." : "Withdraw proposal"}
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
      <footer className="border-t border-[var(--line)] py-6 text-center font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Proposal Register Archetype E</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
