"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import EmptyState from "@/components/common/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { getDisputes } from "@/lib/api";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

const STATUS_TABS = [
  { id: "", label: "All cases" },
  { id: "open", label: "Open" },
  { id: "under_review", label: "Under review" },
  { id: "in_mediation", label: "In mediation" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Closed" }
];

const CATEGORY_OPTIONS = [
  { value: "payment_issue", label: "Payment issue" },
  { value: "quality_of_work", label: "Quality of work" },
  { value: "missed_deadline", label: "Missed deadline" },
  { value: "scope_disagreement", label: "Scope disagreement" },
  { value: "communication_issue", label: "Communication issue" },
  { value: "contract_breach", label: "Contract breach" },
  { value: "other", label: "Other" }
];

export default function DisputesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDisputesData();
    }
  }, [user, statusFilter, categoryFilter]);

  const fetchDisputesData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (categoryFilter) filters.category = categoryFilter;
      
      const response = await getDisputes(filters);
      
      if (response.success) {
        setDisputes(response.disputes || []);
      } else {
        setError(response.error || "Could not load dispute register.");
      }
    } catch (err) {
      console.error("Error fetching disputes:", err);
      setError(err.message || "Network sync error loading disputes.");
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-8 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* EDITORIAL HEADER */}
        <section className="space-y-4 border-b border-[var(--ink)] pb-8">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
            <span>FREELANCEHUB REGISTER · DISPUTE & MEDIATION</span>
          </p>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="font-serif-ledger text-[38px] sm:text-[50px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
                Dispute Register.
              </h1>
              <p className="text-[15px] text-[var(--muted)] max-w-xl">
                Manage formal contract disputes, review evidence files, and track neutral mediation progress.
              </p>
            </div>

            <Link 
              href="/disputes/file" 
              className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-5 py-3 transition-colors inline-flex items-center space-x-2 shrink-0"
            >
              <span>File a dispute →</span>
            </Link>
          </div>
        </section>

        {/* ARCHETYPE E: THE ONE FILTER BAR */}
        <section className="border-y border-[var(--ink)] py-3 font-mono-ledger text-[11px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[var(--muted)] font-bold mr-2 uppercase">Status:</span>
              {STATUS_TABS.map((t) => (
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

            <div className="flex items-center space-x-2">
              <span className="text-[var(--muted)] font-bold uppercase">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[var(--paper-2)] border border-[var(--ink)] px-3 py-1 text-[11px] font-mono-ledger outline-none"
              >
                <option value="">All categories</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
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

        {/* DISPUTES REGISTER ROWS */}
        <section className="space-y-4">
          {loading ? (
            <div className="space-y-3 font-mono-ledger text-[12px] text-[var(--muted)] py-12 text-center border border-[var(--line)]">
              LOADING DISPUTE REGISTER...
            </div>
          ) : disputes.length === 0 ? (
            <EmptyState
              marker="DISPUTE REGISTER · STATUS: EMPTY"
              title="No formal dispute records found."
              description={statusFilter || categoryFilter ? "No disputes matched your current filter criteria." : "You currently have no active or historical contract disputes on record."}
              actionLabel="File a dispute →"
              actionHref="/disputes/file"
            />
          ) : (
            <div className="border border-[var(--ink)] divide-y divide-[var(--line)] bg-[var(--paper)]">
              {disputes.map((dispute) => {
                const isFiledByUser = dispute.filedBy === user?.id;

                return (
                  <Link key={dispute.id} href={`/disputes/${dispute.id}`} className="block group">
                    <div className="p-5 sm:p-6 space-y-3 hover:bg-[var(--paper-2)] transition-colors text-left">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono-ledger text-[11px]">
                        <span className="text-[var(--signal)] font-bold">
                          CASE / #{dispute.id?.slice(0, 8) || '0001'}
                        </span>

                        <div className="flex items-center space-x-2">
                          <span className="text-[var(--ink)] font-bold">
                            [{dispute.status?.replace('_', ' ')?.toUpperCase() || 'OPEN'}]
                          </span>
                          <span className="text-[var(--muted)]">
                            [{dispute.category?.replace("_", " ")?.toUpperCase()}]
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-serif-ledger text-[20px] font-medium text-[var(--ink)] leading-snug group-hover:text-[var(--signal)] transition-colors">
                          {dispute.title}
                        </h3>
                        <p className="font-sans-ledger text-[13px] text-[var(--muted)] line-clamp-2 leading-relaxed">
                          {dispute.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-4 font-mono-ledger text-[11px]">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--muted)]">
                          <span>Project: <strong className="text-[var(--ink)]">{dispute.projectTitle}</strong></span>
                          <span>·</span>
                          <span>Filed: {isFiledByUser ? "by you" : `by ${dispute.filedByName || 'participant'}`}</span>
                          <span>·</span>
                          <span>Date: {new Date(dispute.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center space-x-3 text-[11px] font-bold text-[var(--signal)]">
                          {dispute.amountDisputed && (
                            <span>{formatCurrency(dispute.amountDisputed)} DISPUTED</span>
                          )}
                          <span>Open case log →</span>
                        </div>
                      </div>

                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Dispute Register Archetype E</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
