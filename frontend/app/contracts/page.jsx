"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CommandRail from "@/components/layout/CommandRail";
import EmptyState from "@/components/common/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { getUserContracts } from "@/lib/api";
import {
  FileText,
  Banknote,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase,
  MessageSquare,
  ArrowRight,
  Shield
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export default function ContractsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchContractsData();
    }
  }, [user, filter]);

  const fetchContractsData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = filter !== "all" ? { status: filter } : {};
      const response = await getUserContracts(params);
      
      if (response.success) {
        setContracts(response.contracts || []);
      } else {
        setError(response.error || "Could not load active contracts.");
      }
    } catch (err) {
      console.error("Error fetching contracts:", err);
      setError("Network sync error while loading contract register.");
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 lg:pl-20 py-8 sm:py-12 space-y-10 flex-1 w-full pb-24 lg:pb-12">
        
        {/* EDITORIAL HEADER */}
        <section className="space-y-4 text-left border-b border-[var(--ink)] pb-8">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
            <span>FREELANCEHUB CONTRACT REGISTER · ESCROW DIRECTORY</span>
          </p>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="font-serif-ledger text-[38px] sm:text-[50px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
                Contract Register.
              </h1>
              <p className="text-[15px] text-[var(--muted)] max-w-xl">
                View, execute, and manage active milestone contracts and secure escrow reserves.
              </p>
            </div>

            {userType === 'client' && (
              <Link 
                href="/client/post-project" 
                className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-5 py-3 transition-colors inline-flex items-center space-x-2 shrink-0 shadow-xs"
              >
                <span>CREATE NEW ENGAGEMENT →</span>
              </Link>
            )}
          </div>
        </section>


        {/* FILTER BAR & LEDGER TABS */}
        <section className="space-y-4 text-left font-mono-ledger text-[11px] uppercase">
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--ink)] pb-3">
            <span className="text-[var(--muted)] font-bold mr-2">STATUS FILTER:</span>
            {[
              { id: "all", label: "ALL REGISTERED" },
              { id: "active", label: "ACTIVE & IN PROGRESS" },
              { id: "pending", label: "PENDING SIGNATURES" },
              { id: "completed", label: "COMPLETED & RELEASED" }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`px-3.5 py-1.5 border transition-colors ${
                  filter === t.id
                    ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-bold"
                    : "bg-[var(--paper-2)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--ink)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>


        {/* ERROR BANNER */}
        {error && (
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
              <span>{error}</span>
            </div>
            <button 
              onClick={fetchContractsData}
              className="px-3 py-1 bg-[var(--signal)] text-[var(--paper)] font-sans-ledger font-medium text-[12px] hover:bg-[var(--signal-dark)] transition-colors"
            >
              Retry Sync
            </button>
          </div>
        )}


        {/* CONTRACT REGISTER SPECIMEN LIST */}
        <section className="space-y-6 text-left">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="border-2 border-[var(--line)] bg-[var(--paper-2)] h-36 animate-pulse p-6"></div>
              ))}
            </div>
          ) : contracts.length === 0 ? (
            <EmptyState
              marker="01 / CONTRACT REGISTER"
              title="No contracts found on record."
              description="Once a client accepts a freelancer proposal or posts a direct contract, signed engagements will populate your financial register."
              actionLabel={userType === 'client' ? "POST A PROJECT BRIEF →" : "FIND OPEN PROJECTS →"}
              actionHref={userType === 'client' ? "/client/post-project" : "/projects"}
            />
          ) : (
            <div className="space-y-6">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="border-2 border-[var(--ink)] bg-[var(--paper)] p-6 space-y-4 text-left hover:border-[var(--signal)] transition-colors shadow-xs group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--line)] pb-3 gap-3 font-mono-ledger text-[11px] uppercase">
                    <span className="text-[var(--signal)] font-bold flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
                      <span>CONTRACT SPECIMEN / #{contract.id?.slice(0, 8) || '0001'}</span>
                    </span>

                    <div className="flex items-center space-x-3 text-[10px]">
                      {contract.signedByClient && contract.signedByFreelancer ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 border border-green-300 font-bold">
                          [EXECUTED & ACTIVE]
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                          [PENDING SIGNATURES]
                        </span>
                      )}

                      <span className="text-[var(--ink)] font-bold">
                        [{contract.status?.toUpperCase() || 'REGISTERED'}]
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-1.5 max-w-2xl">
                      <h3 className="font-serif-ledger text-[22px] font-medium text-[var(--ink)] leading-snug group-hover:text-[var(--signal)] transition-colors">
                        {contract.projectTitle || 'Software Engineering Contract'}
                      </h3>
                      <p className="font-mono-ledger text-[12px] text-[var(--muted)]">
                        {userType === 'client' ? `FREELANCER: ${contract.freelancerName || 'Independent Talent'}` : `CLIENT: ${contract.clientName || 'Client Participant'}`}
                        {contract.agreedTimeline && ` • TIMELINE: ${contract.agreedTimeline}`}
                      </p>
                    </div>

                    <div className="text-left lg:text-right font-mono-ledger space-y-0.5 shrink-0">
                      <span className="text-[10px] text-[var(--muted)] uppercase block">AGREED BUDGET (NPR)</span>
                      <span className="text-[24px] font-bold text-[var(--signal)] block tracking-tight">
                        {formatCurrency(contract.agreedBudget || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--line)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono-ledger text-[11px]">
                    <span className="text-[var(--muted)] text-[10px]">
                      CREATED: {new Date(contract.createdAt || contract.created_at || Date.now()).toLocaleDateString()}
                    </span>

                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/chat?userId=${userType === "client" ? contract.freelancerId : contract.clientId}&contractId=${contract.id}`}
                        className="px-4 py-2 border border-[var(--ink)] bg-[var(--paper-2)] text-[var(--ink)] hover:bg-[var(--paper)] transition-colors flex items-center space-x-1.5 font-bold uppercase"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-[var(--signal)]" />
                        <span>MESSAGE</span>
                      </Link>

                      <Link
                        href={`/contracts/${contract.id}`}
                        className="px-5 py-2 bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold transition-colors uppercase inline-flex items-center space-x-1"
                      >
                        <span>OPEN WORKSPACE →</span>
                      </Link>
                    </div>
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
          <span>FreelanceHub · Contract Register & Escrow Directory</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
