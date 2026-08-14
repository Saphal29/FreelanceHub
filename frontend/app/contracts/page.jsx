"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import EmptyState from "@/components/common/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { getUserContracts } from "@/lib/api";
import { MessageSquare, AlertCircle } from "lucide-react";
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

      {/* Main Container */}
      <main data-tour="contracts-list" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-8 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* EDITORIAL HEADER */}
        <section className="space-y-4 border-b border-[var(--ink)] pb-8">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
            <span>FREELANCEHUB REGISTER · CONTRACT DIRECTORY</span>
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
                className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-5 py-3 transition-colors inline-flex items-center space-x-2 shrink-0"
              >
                <span>Create new engagement →</span>
              </Link>
            )}
          </div>
        </section>

        {/* ARCHETYPE E: THE ONE FILTER BAR */}
        <section className="border-y border-[var(--ink)] py-3 font-mono-ledger text-[11px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[var(--muted)] font-bold mr-2 uppercase">Status:</span>
              {[
                { id: "all", label: "All registered" },
                { id: "active", label: "Active & in progress" },
                { id: "pending", label: "Pending signatures" },
                { id: "completed", label: "Completed & released" }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id)}
                  className={`px-3 py-1.5 border transition-colors ${
                    filter === t.id
                      ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-bold"
                      : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--ink)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="text-[var(--muted)] text-[11px]">
              Showing {contracts.length} contract record{contracts.length === 1 ? '' : 's'}
            </div>
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
              className="px-3 py-1 bg-[var(--signal)] text-[var(--paper)] font-mono-ledger font-bold text-[11px] hover:bg-[var(--signal-dark)] transition-colors"
            >
              Retry sync
            </button>
          </div>
        )}

        {/* CONTRACT REGISTER ROWS */}
        <section className="space-y-4">
          {loading ? (
            <div className="space-y-3 font-mono-ledger text-[12px] text-[var(--muted)] py-12 text-center border border-[var(--line)]">
              LOADING CONTRACT REGISTER...
            </div>
          ) : contracts.length === 0 ? (
            <EmptyState
              marker="CONTRACT REGISTER · STATUS: EMPTY"
              title="No contract records found."
              description="Once a client accepts a proposal or issues a direct engagement, active milestone contracts will populate this register."
              actionLabel={userType === 'client' ? "Create new engagement →" : "Find open projects →"}
              actionHref={userType === 'client' ? "/client/post-project" : "/projects"}
            />
          ) : (
            <div className="border border-[var(--ink)] divide-y divide-[var(--line)] bg-[var(--paper)]">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="p-5 sm:p-6 space-y-4 hover:bg-[var(--paper-2)] transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono-ledger text-[11px]">
                    <span className="text-[var(--signal)] font-bold">
                      RECORD / #{contract.id?.slice(0, 8) || '0001'}
                    </span>

                    <div className="flex items-center space-x-2">
                      {contract.signedByClient && contract.signedByFreelancer ? (
                        <span className="text-[var(--ink)] font-bold">
                          [EXECUTED]
                        </span>
                      ) : (
                        <span className="text-[var(--signal)] font-bold">
                          [PENDING SIGNATURES]
                        </span>
                      )}

                      <span className="text-[var(--muted)]">
                        [{contract.status?.toUpperCase() || 'REGISTERED'}]
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-serif-ledger text-[20px] font-medium text-[var(--ink)] leading-snug">
                        {contract.projectTitle || 'Software Engineering Contract'}
                      </h3>
                      <p className="font-mono-ledger text-[12px] text-[var(--muted)]">
                        {userType === 'client' ? `Freelancer: ${contract.freelancerName || 'Independent Talent'}` : `Client: ${contract.clientName || 'Client Participant'}`}
                        {contract.agreedTimeline && ` · Timeline: ${contract.agreedTimeline}`}
                      </p>
                    </div>

                    <div className="font-mono-ledger text-left lg:text-right shrink-0">
                      <span className="text-[10px] text-[var(--muted)] uppercase block">Agreed Budget (NPR)</span>
                      <span className="text-[22px] font-bold text-[var(--signal)] block">
                        {formatCurrency(contract.agreedBudget || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--line)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono-ledger text-[11px]">
                    <span className="text-[var(--muted)] text-[10px]">
                      Created: {new Date(contract.createdAt || contract.created_at || Date.now()).toLocaleDateString()}
                    </span>

                    <div className="flex items-center space-x-4">
                      <Link
                        href={`/chat?userId=${userType === "client" ? contract.freelancerId : contract.clientId}&contractId=${contract.id}`}
                        className="text-[var(--ink)] font-bold hover:text-[var(--signal)] underline"
                      >
                        Message party →
                      </Link>

                      <Link
                        href={`/contracts/${contract.id}`}
                        className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold px-4 py-2 text-[11px] uppercase transition-colors"
                      >
                        Open contract workspace →
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
      <footer className="border-t border-[var(--line)] py-6 text-center font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Contract Register Archetype E</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
