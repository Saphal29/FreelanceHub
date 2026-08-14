"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Users, AlertCircle, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { withAuth } from "@/contexts/AuthContext";
import { useTour } from "@/components/tour/TourContext";

function ClientDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { start: startTour } = useTour();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [myProjects, setMyProjects] = useState([]);
  const [activeContracts, setActiveContracts] = useState([]);
  const [topFreelancers, setTopFreelancers] = useState([]);

  const [stats, setStats] = useState({
    activeProjectsCount: 0,
    totalProposalsReceived: 0,
    activeContractsCount: 0,
    totalEscrowFunded: 0,
  });

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  // Auto-start tour for first-time users
  useEffect(() => {
    if (user && !loading && !user.hasCompletedTour) {
      const timer = setTimeout(() => startTour("CLIENT"), 800);
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectsRes, contractsRes, freelancersRes] = await Promise.allSettled([
        api.get("/client/projects"),
        api.get("/contracts"),
        api.get("/profile/search/freelancers?limit=6"),
      ]);

      let projectsData = [];
      if (projectsRes.status === "fulfilled" && projectsRes.value?.data) {
        projectsData = projectsRes.value.data.projects || projectsRes.value.data || [];
      }
      setMyProjects(projectsData);

      let contractsData = [];
      if (contractsRes.status === "fulfilled" && contractsRes.value?.data) {
        contractsData = contractsRes.value.data.contracts || [];
      }
      const activeContractsData = contractsData.filter(
        (c) => c.status === "active" || c.status === "in_progress" || c.status === "pending"
      );
      setActiveContracts(activeContractsData);

      let freelancersData = [];
      if (freelancersRes.status === "fulfilled" && freelancersRes.value?.data) {
        freelancersData = freelancersRes.value.data.freelancers || [];
      }
      setTopFreelancers(freelancersData);

      const totalProposals = projectsData.reduce(
        (sum, p) => sum + (p.proposalsCount || p.proposals_count || 0),
        0
      );
      const totalEscrow = contractsData.reduce(
        (sum, c) => sum + (parseFloat(c.agreedBudget) || 0),
        0
      );

      setStats({
        activeProjectsCount: projectsData.length,
        totalProposalsReceived: totalProposals,
        activeContractsCount: activeContractsData.length,
        totalEscrowFunded: totalEscrow,
      });
    } catch (err) {
      console.error("Error fetching client dashboard data:", err);
      setError("Could not sync latest client ledger data. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.fullName?.split(" ")[0] || "Client";

  // Hiring funnel steps
  const funnelSteps = [
    { label: "POST BRIEF", value: String(myProjects.length).padStart(2, "0"), sub: "Briefs posted" },
    { label: "RECEIVING BIDS", value: String(stats.totalProposalsReceived).padStart(2, "0"), sub: "Proposals in", highlight: true },
    { label: "REVIEWING", value: "00", sub: "Interviews" },
    { label: "SIGNED", value: String(stats.activeContractsCount).padStart(2, "0"), sub: "Hired" },
  ];

  // Determine the active funnel stage
  const activeFunnelStep =
    stats.activeContractsCount > 0
      ? 3
      : stats.totalProposalsReceived > 0
      ? 1
      : myProjects.length > 0
      ? 0
      : 0;

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col">
      <Navbar userType="client" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 flex-1 w-full pb-24 lg:pb-12">

        {/* ── PAGE HEADER ── */}
        <section className="border-b border-[var(--ink)] pb-8 mb-10">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] inline-block animate-pulse" />
            <span>CLIENT WORKSPACE · HIRING & PROJECT OVERVIEW</span>
          </p>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-serif-ledger text-[40px] sm:text-[56px] leading-[1.02] font-medium tracking-tight text-[var(--ink)]">
                Welcome back, {firstName}.
              </h1>
              <p className="text-[15px] text-[var(--muted)] mt-2 max-w-lg">
                Your posted projects, incoming proposals, and escrow position.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/client/post-project"
                data-tour="post-project-cta"
                className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-6 py-3 transition-colors inline-flex items-center space-x-2 shadow-xs"
              >
                <span>Post a project →</span>
              </Link>
              <Link
                href="/client/talent"
                className="bg-[var(--paper-2)] border border-[var(--ink)] hover:border-[var(--signal)] hover:text-[var(--signal)] text-[var(--ink)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-6 py-3 transition-colors inline-flex items-center space-x-2"
              >
                <span>Find talent →</span>
              </Link>
            </div>
          </div>
        </section>


        {/* ── ACCOUNT POSITION ── */}
        <section className="mb-12" data-tour="account-position">
          <div className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--muted)] border-b border-[var(--ink)] pb-1.5 flex items-center justify-between mb-5">
            <span className="font-bold text-[var(--ink)]">ACCOUNT POSITION</span>
            <span className="text-[var(--signal)] font-bold">[NPR LOCAL REGISTERED]</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
            {/* Escrow — the hero number for clients */}
            <div className="pr-6 sm:pr-10 space-y-1">
              <div className="font-mono-ledger text-[10px] uppercase tracking-wider text-[var(--muted)] flex items-center space-x-1">
                <span className="text-[var(--signal)] font-bold">₹</span>
                <span>COMMITTED ESCROW</span>
              </div>
              <p className="font-mono-ledger text-[32px] sm:text-[40px] font-bold text-[var(--signal)] tracking-tight leading-none">
                {formatCurrency(stats.totalEscrowFunded)}
              </p>
              <p className="font-mono-ledger text-[10px] text-[var(--muted)]">Locked in milestones</p>
            </div>

            <div className="space-y-1 border-l border-[var(--line)] pl-6 sm:pl-10">
              <div className="font-mono-ledger text-[10px] uppercase tracking-wider text-[var(--muted)]">PROJECTS</div>
              <p className="font-mono-ledger text-[32px] sm:text-[40px] font-bold text-[var(--ink)] tracking-tight leading-none">
                {String(stats.activeProjectsCount).padStart(2, "0")}
              </p>
              <p className="font-mono-ledger text-[10px] text-[var(--muted)]">Active briefs</p>
            </div>

            <div className="space-y-1 border-l border-[var(--line)] pl-6 sm:pl-10">
              <div className="font-mono-ledger text-[10px] uppercase tracking-wider text-[var(--muted)]">PROPOSALS</div>
              <p className="font-mono-ledger text-[32px] sm:text-[40px] font-bold text-[var(--ink)] tracking-tight leading-none">
                {String(stats.totalProposalsReceived).padStart(2, "0")}
              </p>
              <p className="font-mono-ledger text-[10px] text-[var(--muted)]">Reviewing bids</p>
            </div>

            <div className="space-y-1 border-l border-[var(--line)] pl-6 sm:pl-10">
              <div className="font-mono-ledger text-[10px] uppercase tracking-wider text-[var(--muted)] flex items-center space-x-1">
                <Users className="h-3 w-3 text-[var(--signal)]" />
                <span>CONTRACTS</span>
              </div>
              <p className="font-mono-ledger text-[32px] sm:text-[40px] font-bold text-[var(--ink)] tracking-tight leading-none">
                {String(stats.activeContractsCount).padStart(2, "0")}
              </p>
              <p className="font-mono-ledger text-[10px] text-[var(--muted)]">Hired talent</p>
            </div>
          </div>

          <div className="border-b border-[var(--ink)] mt-6" />
        </section>


        {/* ── ERROR BANNER ── */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-3 py-1 bg-[var(--signal)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] hover:bg-[var(--signal-dark)] transition-colors flex items-center space-x-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          </div>
        )}


        {/* ── MAIN LAYOUT: 8 col workspace + 4 col command rail ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* PRIMARY WORKSPACE — 8 cols */}
          <div className="lg:col-span-8 space-y-14">

            {/* 01 / POSTED PROJECTS */}
            <div className="space-y-4" data-tour="posted-projects">
              <div className="flex items-center justify-between border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider">
                <span className="font-bold">01 / POSTED PROJECTS</span>
                <Link href="/client/projects" className="text-[var(--signal)] hover:underline">
                  MY PROJECTS ({myProjects.length}) →
                </Link>
              </div>

              {loading ? (
                <div className="py-10 space-y-3 animate-pulse">
                  <div className="h-3 bg-[var(--line)] w-1/5 rounded" />
                  <div className="h-6 bg-[var(--line)] w-3/5 rounded" />
                  <div className="h-3 bg-[var(--line)] w-2/5 rounded" />
                </div>
              ) : myProjects.length === 0 ? (
                <div className="border-2 border-dashed border-[var(--line)] p-8 space-y-3">
                  <p className="font-mono-ledger text-[11px] text-[var(--signal)] font-bold uppercase tracking-wider">
                    STATUS: NO PROJECTS POSTED
                  </p>
                  <h3 className="font-serif-ledger text-[22px] font-medium text-[var(--ink)]">
                    Post your first project brief to start receiving proposals.
                  </h3>
                  <p className="font-sans-ledger text-[13px] text-[var(--muted)] max-w-md leading-relaxed">
                    Describe the work, set a budget, define milestones, and verified freelancers will submit competitive bids directly to you.
                  </p>
                  <Link
                    href="/client/post-project"
                    className="inline-flex items-center space-x-1 bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[11px] uppercase tracking-wider px-5 py-2.5 transition-colors mt-2"
                  >
                    <span>Post a project brief →</span>
                  </Link>
                </div>
              ) : (
                <div className="border-2 border-[var(--ink)] hover:border-[var(--signal)] transition-colors p-6 space-y-4">
                  <div className="flex items-center justify-between font-mono-ledger text-[11px] uppercase border-b border-[var(--line)] pb-3">
                    <span className="text-[var(--signal)] font-bold flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] inline-block animate-pulse" />
                      <span>PROJECT BRIEF / #{myProjects[0].id?.slice(0, 8) || "0001"}</span>
                    </span>
                    <span className="font-bold">[{myProjects[0].status?.toUpperCase() || "OPEN"}]</span>
                  </div>
                  <div>
                    <h3 className="font-serif-ledger text-[22px] font-medium text-[var(--ink)] leading-snug">
                      {myProjects[0].title}
                    </h3>
                    <p className="font-mono-ledger text-[12px] text-[var(--muted)] mt-1">
                      PROPOSALS:{" "}
                      <span className="text-[var(--ink)] font-bold">
                        {myProjects[0].proposalsCount || myProjects[0].proposals_count || 0} BIDS
                      </span>{" "}
                      · BUDGET:{" "}
                      <span className="text-[var(--signal)] font-bold">
                        NPR{" "}
                        {myProjects[0].budget_min?.toLocaleString() ||
                          myProjects[0].budget_max?.toLocaleString() ||
                          "Agreed"}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between font-mono-ledger text-[11px] border-t border-[var(--line)] pt-3">
                    <span className="text-[var(--muted)]">
                      POSTED:{" "}
                      {myProjects[0].created_at
                        ? new Date(myProjects[0].created_at).toLocaleDateString()
                        : "ACTIVE"}
                    </span>
                    <Link
                      href={`/client/projects/${myProjects[0].id}`}
                      className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[11px] uppercase tracking-wider px-4 py-2 transition-colors"
                    >
                      REVIEW PROPOSALS →
                    </Link>
                  </div>
                </div>
              )}
            </div>


            {/* 02 / HIRING FUNNEL — visual pipeline */}
            <div className="space-y-5" data-tour="hiring-funnel">
              <div className="flex items-center justify-between border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider">
                <span className="font-bold">02 / HIRING FUNNEL</span>
                <Link href="/client/projects" className="text-[var(--signal)] hover:underline">
                  VIEW PROJECTS →
                </Link>
              </div>

              {/* Visual funnel with progress line */}
              <div className="relative pt-2 pb-4">
                {/* Connector track */}
                <div className="absolute top-[22px] left-[20px] right-[20px] h-px bg-[var(--line)]" />
                {/* Active fill */}
                <div
                  className="absolute top-[22px] left-[20px] h-px bg-[var(--signal)] transition-all duration-500"
                  style={{ width: `${(activeFunnelStep / (funnelSteps.length - 1)) * 100}%` }}
                />

                <div className="relative grid grid-cols-4 text-center font-mono-ledger">
                  {funnelSteps.map((step, i) => {
                    const isPast = i < activeFunnelStep;
                    const isActive = i === activeFunnelStep && myProjects.length > 0;
                    return (
                      <div key={step.label} className="flex flex-col items-center space-y-2">
                        {/* Node */}
                        <div
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-colors z-10 ${
                            isActive
                              ? "bg-[var(--signal)] border-[var(--signal)] text-[var(--paper)]"
                              : isPast
                              ? "bg-[var(--ink)] border-[var(--ink)] text-[var(--paper)]"
                              : "bg-[var(--paper)] border-[var(--line)] text-[var(--muted)]"
                          }`}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </div>
                        {/* Value */}
                        <span
                          className={`text-[18px] font-bold leading-none ${
                            isActive ? "text-[var(--signal)]" : "text-[var(--ink)]"
                          }`}
                        >
                          {step.value}
                        </span>
                        {/* Label */}
                        <span className="text-[9px] uppercase tracking-wider text-[var(--muted)] leading-tight">
                          {step.label}
                        </span>
                        <span
                          className={`text-[9px] font-bold ${
                            isActive ? "text-[var(--signal)]" : "text-[var(--muted)]"
                          }`}
                        >
                          {step.sub}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active contracts list under funnel, or nudge */}
              {activeContracts.length === 0 ? (
                <div className="border-l-2 border-[var(--signal)] pl-4 py-1 font-mono-ledger text-[12px]">
                  <span className="text-[var(--ink)]">No active contracts yet. </span>
                  <Link href="/client/projects" className="text-[var(--signal)] font-bold hover:underline">
                    Review incoming proposals →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[var(--line)] font-mono-ledger text-[12px] mt-1">
                  {activeContracts.slice(0, 3).map((contract) => (
                    <div key={contract.id} className="py-2.5 flex items-center justify-between">
                      <span className="text-[var(--ink)] font-bold truncate max-w-xs">
                        {contract.projectTitle || "Milestone Contract"}
                      </span>
                      <div className="flex items-center space-x-3 shrink-0">
                        <span className="text-[var(--signal)] font-bold">
                          {formatCurrency(contract.agreedBudget || 0)}
                        </span>
                        <Link
                          href={`/contracts/${contract.id}`}
                          className="text-[var(--ink)] font-bold hover:text-[var(--signal)] transition-colors"
                        >
                          MANAGE →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* 03 / ESCROW CHART — annotated zero state */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider">
                <span className="font-bold">03 / ESCROW & SPEND LEDGER</span>
                <Link href="/payment-summary" className="text-[var(--signal)] hover:underline">
                  FULL STATEMENT →
                </Link>
              </div>

              <div className="border border-[var(--ink)] bg-[var(--paper-2)] p-6 space-y-5 font-mono-ledger text-[12px]">
                <div className="flex justify-between items-center text-[10px] text-[var(--muted)] uppercase">
                  <span>COMMITTED ESCROW TREND (NPR)</span>
                  <span className="text-[var(--signal)] font-bold">LIVE POSITION</span>
                </div>

                {/* SVG chart */}
                <div className="relative h-32 w-full border-b border-[var(--ink)]">
                  <svg
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                    viewBox="0 0 400 90"
                  >
                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="400" y2="25" stroke="var(--line)" strokeDasharray="3 3" />
                    <line x1="0" y1="55" x2="400" y2="55" stroke="var(--line)" strokeDasharray="3 3" />

                    {stats.totalEscrowFunded > 0 ? (
                      <>
                        <path
                          d="M 0 78 Q 100 70, 200 55 T 400 22"
                          fill="none"
                          stroke="var(--signal)"
                          strokeWidth="2.5"
                        />
                        <circle cx="0" cy="78" r="3" fill="var(--ink)" />
                        <circle cx="133" cy="68" r="3" fill="var(--ink)" />
                        <circle cx="266" cy="50" r="3" fill="var(--ink)" />
                        <circle cx="400" cy="22" r="4" fill="var(--signal)" />
                      </>
                    ) : (
                      <>
                        {/* Annotated zero baseline */}
                        <line
                          x1="0" y1="78" x2="400" y2="78"
                          stroke="var(--line)"
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                        />
                        <circle cx="400" cy="78" r="3.5" fill="var(--signal)" />
                        {/* First deposit annotation */}
                        <line x1="310" y1="62" x2="393" y2="74" stroke="var(--signal)" strokeWidth="1" />
                        <text
                          x="210"
                          y="58"
                          fill="var(--signal)"
                          fontSize="9"
                          fontFamily="monospace"
                          letterSpacing="0.05em"
                        >
                          FIRST DEPOSIT →
                        </text>
                        <text
                          x="100"
                          y="42"
                          fill="var(--muted)"
                          fontSize="8"
                          fontFamily="monospace"
                          letterSpacing="0.04em"
                        >
                          NO ESCROW COMMITTED YET
                        </text>
                      </>
                    )}
                  </svg>
                </div>

                {/* Month labels */}
                <div className="flex justify-between text-[10px] text-[var(--muted)] uppercase">
                  <span>MAY 2026</span>
                  <span>JUN 2026</span>
                  <span>JUL 2026</span>
                  <span className="text-[var(--signal)] font-bold">AUG 2026 [CURRENT]</span>
                </div>

                {/* Ledger strip */}
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[var(--line)]">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-[var(--muted)] block uppercase">Committed</span>
                    <span className="font-bold text-[var(--signal)] text-[14px]">
                      NPR {stats.totalEscrowFunded.toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-0.5 border-l border-[var(--line)] pl-4">
                    <span className="text-[10px] text-[var(--muted)] block uppercase">Released</span>
                    <span className="font-bold text-[var(--ink)] text-[14px]">NPR 0</span>
                  </div>
                  <div className="space-y-0.5 border-l border-[var(--line)] pl-4">
                    <span className="text-[10px] text-[var(--muted)] block uppercase">Pending</span>
                    <span className="font-bold text-[var(--ink)] text-[14px]">NPR 0</span>
                  </div>
                </div>
              </div>
            </div>

          </div>


          {/* ── COMMAND RAIL — 4 cols, three intentional sections ── */}
          <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-0 text-left font-mono-ledger text-[12px] border border-[var(--ink)]" data-tour="command-rail">

            {/* SECTION A: ESCROW POSITION */}
            <div className="p-5 space-y-3 border-b border-[var(--ink)]">
              <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>ESCROW POSITION</span>
                <span className="text-[var(--signal)] text-[10px]">[NPR LOCAL]</span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">● FUNDED</span>
                  <span className="font-bold text-[var(--signal)]">
                    NPR {stats.totalEscrowFunded.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">● RELEASED</span>
                  <span className="font-bold text-[var(--ink)]">NPR 0</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[var(--muted)]">● PENDING</span>
                  <span className="font-bold text-[var(--ink)]">NPR 0</span>
                </div>
              </div>

              <Link
                href="/how-it-works"
                className="block text-[11px] text-[var(--signal)] font-bold hover:underline uppercase"
              >
                How escrow works →
              </Link>
            </div>

            {/* SECTION B: SIGNALS */}
            <div className="p-5 space-y-3 border-b border-[var(--ink)]">
              <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>SIGNALS</span>
                <span className="text-[var(--signal)] text-[10px]">● LIVE</span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">Project briefs</span>
                  <span className="font-bold text-[var(--ink)]">{myProjects.length}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">Proposals received</span>
                  <span className="font-bold text-[var(--signal)]">{stats.totalProposalsReceived}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">Active contracts</span>
                  <span className="font-bold text-[var(--ink)]">{stats.activeContractsCount}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[var(--muted)]">Committed escrow</span>
                  <span className="font-bold text-[var(--ink)]">
                    NPR {stats.totalEscrowFunded.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION C: ACTIONS */}
            <div className="p-5 space-y-2">
              <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] mb-3">ACTIONS</div>

              <Link
                href="/client/post-project"
                className="flex items-center justify-between py-2 border-b border-[var(--line)] hover:text-[var(--signal)] transition-colors font-bold text-[var(--ink)] text-[11px]"
              >
                <span>01. POST A NEW PROJECT</span>
                <span>→</span>
              </Link>
              <Link
                href="/client/talent"
                className="flex items-center justify-between py-2 border-b border-[var(--line)] hover:text-[var(--signal)] transition-colors font-bold text-[var(--ink)] text-[11px]"
              >
                <span>02. FIND & BROWSE TALENT</span>
                <span>→</span>
              </Link>
              <Link
                href="/client/projects"
                className="flex items-center justify-between py-2 border-b border-[var(--line)] hover:text-[var(--signal)] transition-colors font-bold text-[var(--ink)] text-[11px]"
              >
                <span>03. REVIEW MY PROJECTS</span>
                <span>→</span>
              </Link>
              <Link
                href="/contracts"
                className="flex items-center justify-between py-2 border-b border-[var(--line)] hover:text-[var(--signal)] transition-colors font-bold text-[var(--ink)] text-[11px]"
              >
                <span>04. MANAGE CONTRACTS</span>
                <span>→</span>
              </Link>
              <Link
                href="/payment-summary"
                className="flex items-center justify-between py-2 hover:text-[var(--signal)] transition-colors font-bold text-[var(--ink)] text-[11px]"
              >
                <span>05. PAYMENT STATEMENT</span>
                <span>→</span>
              </Link>
            </div>

          </div>
        </div>


        {/* 04 / RECOMMENDED TALENT */}
        <section className="mt-14 pt-8 border-t border-[var(--ink)] space-y-5" data-tour="recommended-talent">
          <div className="flex items-center justify-between font-mono-ledger text-[11px] uppercase tracking-wider">
            <span className="font-bold">04 / RECOMMENDED TALENT</span>
            <Link href="/client/talent" className="text-[var(--signal)] hover:underline">
              ALL FREELANCERS →
            </Link>
          </div>

          {loading ? (
            <div className="py-6 animate-pulse space-y-2">
              <div className="h-3 bg-[var(--line)] w-1/4 rounded" />
            </div>
          ) : topFreelancers.length === 0 ? (
            <div className="border-l-2 border-[var(--signal)] pl-4 py-1 font-mono-ledger text-[12px]">
              <span className="text-[var(--ink)]">No recommended talent matched. </span>
              <Link href="/client/post-project" className="text-[var(--signal)] font-bold hover:underline">
                Post a project brief to attract proposals →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {topFreelancers.slice(0, 6).map((freelancer) => (
                <div
                  key={freelancer.id}
                  className="border border-[var(--ink)] hover:border-[var(--signal)] transition-colors p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between font-mono-ledger text-[10px]">
                      <span className="text-[var(--signal)] font-bold">
                        NPR {freelancer.hourlyRate?.toLocaleString() || "2,500"}/hr
                      </span>
                      <span className="text-[var(--muted)]">
                        ⭐{" "}
                        {freelancer.averageRating
                          ? parseFloat(freelancer.averageRating).toFixed(1)
                          : "5.0"}
                      </span>
                    </div>
                    <h3 className="font-serif-ledger text-[17px] font-normal text-[var(--ink)] leading-snug">
                      {freelancer.fullName}
                    </h3>
                    <p className="font-sans-ledger text-[13px] text-[var(--muted)] line-clamp-2 leading-relaxed">
                      {freelancer.title || "Senior Software Engineer"}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between font-mono-ledger text-[11px]">
                    <span className="text-[var(--muted)]">
                      {freelancer.location || "Kathmandu, Nepal"}
                    </span>
                    <Link
                      href={`/freelancer/profile/${freelancer.id}`}
                      className="text-[var(--signal)] font-bold hover:underline"
                    >
                      VIEW PROFILE →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      <footer className="border-t border-[var(--line)] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between text-[12px] font-mono-ledger text-[var(--muted)] gap-2">
          <span>FreelanceHub · Client Workspace</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>
    </div>
  );
}

export default withAuth(ClientDashboard);
