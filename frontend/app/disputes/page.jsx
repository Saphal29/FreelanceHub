"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CommandRail from "@/components/layout/CommandRail";
import EmptyState from "@/components/common/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { getDisputes } from "@/lib/api";
import {
  AlertCircle,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Paperclip,
  Filter,
  ArrowRight
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

const STATUS_CONFIG = {
  open: { label: "OPEN", color: "bg-amber-100 text-amber-900 border-amber-300" },
  under_review: { label: "UNDER REVIEW", color: "bg-blue-100 text-blue-900 border-blue-300" },
  in_mediation: { label: "IN MEDIATION", color: "bg-purple-100 text-purple-900 border-purple-300" },
  resolved: { label: "RESOLVED", color: "bg-green-100 text-green-900 border-green-300" },
  closed: { label: "CLOSED", color: "bg-gray-100 text-gray-800 border-gray-300" },
};

const CATEGORY_OPTIONS = [
  { value: "payment_issue", label: "Payment Issue" },
  { value: "quality_of_work", label: "Quality of Work" },
  { value: "missed_deadline", label: "Missed Deadline" },
  { value: "scope_disagreement", label: "Scope Disagreement" },
  { value: "communication_issue", label: "Communication Issue" },
  { value: "contract_breach", label: "Contract Breach" },
  { value: "other", label: "Other" },
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

      {/* Floating Tool Rail */}
      <CommandRail userType={userType} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 lg:pl-20 py-8 sm:py-12 space-y-10 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* EDITORIAL HEADER */}
        <section className="space-y-4 border-b border-[var(--ink)] pb-8">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
            <span>FREELANCEHUB AUDIT · DISPUTE & MEDIATION REGISTER</span>
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
              className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-5 py-3 transition-colors inline-flex items-center space-x-2 shrink-0 shadow-xs"
            >
              <span>FILE NEW DISPUTE RECORD →</span>
            </Link>
          </div>
        </section>


        {/* FILTERS BAR */}
        <section className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-4 font-mono-ledger text-[12px] space-y-3">
          <span className="font-bold text-[var(--ink)] uppercase text-[11px] block">FILTER DISPUTE RECORDS</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">STATUS</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[var(--paper)] border border-[var(--ink)] p-2.5 text-[12px] focus:outline-none"
              >
                <option value="">ALL STATUSES</option>
                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                  <option key={val} value={val}>{cfg.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">CATEGORY</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-[var(--paper)] border border-[var(--ink)] p-2.5 text-[12px] focus:outline-none"
              >
                <option value="">ALL CATEGORIES</option>
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


        {/* DISPUTES SPECIMEN STREAM */}
        <section className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="border-2 border-[var(--line)] bg-[var(--paper-2)] h-36 animate-pulse p-6"></div>
              ))}
            </div>
          ) : disputes.length === 0 ? (
            <EmptyState
              marker="DISPUTE REGISTER"
              title="No formal dispute records found."
              description={statusFilter || categoryFilter ? "No disputes matched your filter selection." : "You currently have no active or historical contract disputes on record."}
              actionLabel="FILE DISPUTE RECORD →"
              actionHref="/disputes/file"
            />
          ) : (
            <div className="space-y-6">
              {disputes.map((dispute) => {
                const statusCfg = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;
                const isFiledByUser = dispute.filedBy === user?.id;

                return (
                  <Link key={dispute.id} href={`/disputes/${dispute.id}`} className="block group">
                    <div className="border-2 border-[var(--ink)] bg-[var(--paper)] p-6 space-y-4 text-left hover:border-[var(--signal)] transition-colors shadow-xs">
                      
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--line)] pb-3 gap-2 font-mono-ledger text-[11px] uppercase">
                        <span className="text-[var(--signal)] font-bold">
                          DISPUTE SPECIMEN / #{dispute.id?.slice(0, 8) || '0001'}
                        </span>

                        <div className="flex items-center space-x-3 text-[10px]">
                          <span className={`px-2 py-0.5 border font-bold ${statusCfg.color}`}>
                            [{statusCfg.label}]
                          </span>
                          <span className="text-[var(--ink)] font-bold">
                            [{dispute.category?.replace("_", " ")?.toUpperCase()}]
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <h3 className="font-serif-ledger text-[22px] font-medium text-[var(--ink)] leading-snug group-hover:text-[var(--signal)] transition-colors">
                          {dispute.title}
                        </h3>
                        <p className="font-sans-ledger text-[13px] text-[var(--muted)] line-clamp-2 leading-relaxed">
                          {dispute.description}
                        </p>
                      </div>

                      {/* Footer Details */}
                      <div className="pt-3 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-4 font-mono-ledger text-[11px]">
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-[var(--muted)]">
                          <span>PROJECT: <strong className="text-[var(--ink)]">{dispute.projectTitle}</strong></span>
                          <span>•</span>
                          <span>FILED: {isFiledByUser ? "BY YOU" : `BY ${dispute.filedByName?.toUpperCase() || 'PARTICIPANT'}`}</span>
                          <span>•</span>
                          <span>DATE: {new Date(dispute.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center space-x-4 text-[11px] font-bold text-[var(--signal)]">
                          {dispute.amountDisputed && (
                            <span>NPR {dispute.amountDisputed.toLocaleString()} DISPUTED</span>
                          )}
                          <span>OPEN MEDIATION LOG →</span>
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
      <footer className="border-t border-[var(--line)] py-6 text-center mt-12 font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Formal Dispute & Mediation Register</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
