"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Star, AlertCircle, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { withAuth } from "@/contexts/AuthContext";
import { useTour } from "@/components/tour/TourContext";

function FreelancerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { start: startTour } = useTour();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeContractsCount: 0,
    pendingProposalsCount: 0,
    acceptedProposalsCount: 0,
    averageRating: "5.0",
  });

  const [activeContracts, setActiveContracts] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  // Auto-start tour for first-time users
  useEffect(() => {
    if (user && !loading && !user.hasCompletedTour) {
      const timer = setTimeout(() => startTour("FREELANCER"), 800);
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [contractsRes, proposalsRes, projectsRes] = await Promise.allSettled([
        api.get("/contracts"),
        api.get("/proposals/my-proposals"),
        api.get("/projects?page=1&limit=6"),
      ]);

      let contractsData = [];
      if (contractsRes.status === "fulfilled" && contractsRes.value?.data) {
        contractsData = contractsRes.value.data.contracts || [];
      }
      const activeContractsData = contractsData.filter(
        (c) => c.status === "active" || c.status === "in_progress" || c.status === "pending"
      );
      setActiveContracts(activeContractsData);

      let proposalsData = [];
      if (proposalsRes.status === "fulfilled" && proposalsRes.value?.data) {
        proposalsData = proposalsRes.value.data.proposals || [];
      }
      setProposals(proposalsData);

      let projectsData = [];
      if (projectsRes.status === "fulfilled" && projectsRes.value?.data) {
        projectsData = projectsRes.value.data.projects || [];
      }
      setRecommendedJobs(projectsData);

      const totalEarnings = contractsData.reduce((sum, c) => {
        if (c.status === "completed") return sum + (parseFloat(c.agreedBudget) || 0);
        return sum;
      }, 0);
      const pendingCount = proposalsData.filter((p) => p.status === "pending").length;
      const acceptedCount = proposalsData.filter((p) => p.status === "accepted").length;

      setStats({
        totalEarnings,
        activeContractsCount: activeContractsData.length,
        pendingProposalsCount: pendingCount,
        acceptedProposalsCount: acceptedCount,
        averageRating: user?.freelancerProfile?.rating
          ? parseFloat(user.freelancerProfile.rating).toFixed(1)
          : "5.0",
      });
    } catch (err) {
      console.error("Error fetching freelancer dashboard data:", err);
      setError("Could not sync latest ledger data. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.fullName?.split(" ")[0] || "Test";

  // Funnel steps — drives the visual pipeline
  const funnelSteps = [
    { label: "DRAFT", value: "00", sub: "Preparing" },
    { label: "SUBMITTED", value: String(proposals.length).padStart(2, "0"), sub: "Active", highlight: true },
    { label: "REVIEWED", value: String(stats.pendingProposalsCount).padStart(2, "0"), sub: "In review" },
    { label: "SHORTLISTED", value: "00", sub: "Interview" },
    { label: "ACCEPTED", value: String(stats.acceptedProposalsCount).padStart(2, "0"), sub: "Hired" },
  ];

  // Determine the active funnel stage index for the progress line
  const activeFunnelStep = proposals.length > 0 ? 1 : 0;

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col">
      <Navbar userType="freelancer" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 flex-1 w-full pb-24 lg:pb-12">

        {/* ── PAGE HEADER ── dominant opening, one clear action */}
        <section className="border-b border-[var(--ink)] pb-8 mb-10">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] inline-block animate-pulse" />
            <span>FREELANCER WORKSPACE · WORKFLOW OVERVIEW</span>
          </p>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-serif-ledger text-[40px] sm:text-[56px] leading-[1.02] font-medium tracking-tight text-[var(--ink)]">
                Welcome back, {firstName}.
              </h1>
              <p className="text-[15px] text-[var(--muted)] mt-2 max-w-lg">
                Your work, proposals, and earnings ledger.
              </p>
            </div>
            <Link
              href="/freelancer/jobs"
              className="shrink-0 bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-6 py-3 transition-colors inline-flex items-center space-x-2 shadow-xs"
            >
              <span>Find work →</span>
            </Link>
          </div>
        </section>


        {/* ── ACCOUNT POSITION ── numbers that matter most, full width */}
        <section className="mb-12" data-tour="account-position">
          <div className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--muted)] border-b border-[var(--ink)] pb-1.5 flex items-center justify-between mb-5">
            <span className="font-bold text-[var(--ink)]">ACCOUNT POSITION</span>
            <span className="text-[var(--signal)] font-bold">[NPR LOCAL REGISTERED]</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
            {/* Earnings — the hero number */}
            <div className="pr-6 sm:pr-10 space-y-1">
              <div className="font-mono-ledger text-[10px] uppercase tracking-wider text-[var(--muted)] flex items-center space-x-1">
                <span className="text-[var(--signal)] font-bold">₹</span>
                <span>EARNINGS</span>
              </div>
              <p className="font-mono-ledger text-[32px] sm:text-[40px] font-bold text-[var(--signal)] tracking-tight leading-none">
                Rs.&nbsp;{stats.totalEarnings?.toLocaleString() || "0"}
              </p>
              <p className="font-mono-ledger text-[10px] text-[var(--muted)]">Released to bank</p>
            </div>

            <div className="space-y-1 border-l border-[var(--line)] pl-6 sm:pl-10">
              <div className="font-mono-ledger text-[10px] uppercase tracking-wider text-[var(--muted)]">ACTIVE WORK</div>
              <p className="font-mono-ledger text-[32px] sm:text-[40px] font-bold text-[var(--ink)] tracking-tight leading-none">
                {String(stats.activeContractsCount).padStart(2, "0")}
              </p>
              <p className="font-mono-ledger text-[10px] text-[var(--muted)]">In progress</p>
            </div>

            <div className="space-y-1 border-l border-[var(--line)] pl-6 sm:pl-10">
              <div className="font-mono-ledger text-[10px] uppercase tracking-wider text-[var(--muted)]">PROPOSALS</div>
              <p className="font-mono-ledger text-[32px] sm:text-[40px] font-bold text-[var(--ink)] tracking-tight leading-none">
                {String(stats.pendingProposalsCount).padStart(2, "0")}
              </p>
              <p className="font-mono-ledger text-[10px] text-[var(--muted)]">Under review</p>
            </div>

            <div className="space-y-1 border-l border-[var(--line)] pl-6 sm:pl-10">
              <div className="font-mono-ledger text-[10px] uppercase tracking-wider text-[var(--muted)] flex items-center space-x-1">
                <Star className="h-3 w-3 text-[var(--signal)] fill-[var(--signal)]" />
                <span>REPUTATION</span>
              </div>
              <p className="font-mono-ledger text-[32px] sm:text-[40px] font-bold text-[var(--ink)] tracking-tight leading-none">
                {stats.averageRating}
                <span className="text-[18px] text-[var(--muted)] font-normal"> / 5.0</span>
              </p>
              <p className="font-mono-ledger text-[10px] text-[var(--muted)]">Verified feedback</p>
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

            {/* 01 / CURRENT WORK */}
            <div className="space-y-4" data-tour="current-work">
              <div className="flex items-center justify-between border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider">
                <span className="font-bold">01 / CURRENT WORK</span>
                <Link href="/contracts" className="text-[var(--signal)] hover:underline">
                  ALL WORK ({activeContracts.length}) →
                </Link>
              </div>

              {loading ? (
                <div className="py-10 space-y-3 animate-pulse">
                  <div className="h-3 bg-[var(--line)] w-1/5 rounded" />
                  <div className="h-6 bg-[var(--line)] w-3/5 rounded" />
                  <div className="h-3 bg-[var(--line)] w-2/5 rounded" />
                </div>
              ) : activeContracts.length === 0 ? (
                <div className="border-2 border-dashed border-[var(--line)] p-8 space-y-3">
                  <p className="font-mono-ledger text-[11px] text-[var(--signal)] font-bold uppercase tracking-wider">
                    STATUS: NO ACTIVE ENGAGEMENT
                  </p>
                  <h3 className="font-serif-ledger text-[22px] font-medium text-[var(--ink)]">
                    Your workspace is waiting for its first contract.
                  </h3>
                  <p className="font-sans-ledger text-[13px] text-[var(--muted)] max-w-md leading-relaxed">
                    Browse open project briefs and submit a proposal. Once a client accepts, your contract workspace opens here.
                  </p>
                  <Link
                    href="/freelancer/jobs"
                    className="inline-flex items-center space-x-1 bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[11px] uppercase tracking-wider px-5 py-2.5 transition-colors mt-2"
                  >
                    <span>Find your first project →</span>
                  </Link>
                </div>
              ) : (
                <div className="border-2 border-[var(--ink)] hover:border-[var(--signal)] transition-colors p-6 space-y-4">
                  <div className="flex items-center justify-between font-mono-ledger text-[11px] uppercase border-b border-[var(--line)] pb-3">
                    <span className="text-[var(--signal)] font-bold flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] inline-block animate-pulse" />
                      <span>CONTRACT / #{activeContracts[0].id?.slice(0, 8) || "0001"}</span>
                    </span>
                    <span className="font-bold">[{activeContracts[0].status?.toUpperCase() || "ACTIVE"}]</span>
                  </div>
                  <div>
                    <h3 className="font-serif-ledger text-[22px] font-medium text-[var(--ink)] leading-snug">
                      {activeContracts[0].projectTitle || "Software Engineering Contract"}
                    </h3>
                    <p className="font-mono-ledger text-[12px] text-[var(--muted)] mt-1">
                      CLIENT: {activeContracts[0].clientName || "Client Participant"} ·{" "}
                      <span className="text-[var(--signal)] font-bold">
                        NPR {activeContracts[0].agreedBudget?.toLocaleString() || "Agreed"}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between font-mono-ledger text-[11px] border-t border-[var(--line)] pt-3">
                    <span className="text-[var(--muted)]">
                      STARTED:{" "}
                      {activeContracts[0].startedAt
                        ? new Date(activeContracts[0].startedAt).toLocaleDateString()
                        : "ACTIVE"}
                    </span>
                    <Link
                      href={`/contracts/${activeContracts[0].id}`}
                      className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[11px] uppercase tracking-wider px-4 py-2 transition-colors"
                    >
                      OPEN WORKSPACE →
                    </Link>
                  </div>
                </div>
              )}
            </div>


            {/* 02 / PROPOSAL PIPELINE — visual funnel with progression line */}
            <div className="space-y-5" data-tour="proposal-pipeline">
              <div className="flex items-center justify-between border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider">
                <span className="font-bold">02 / PROPOSAL PIPELINE</span>
                <Link href="/freelancer/proposals" className="text-[var(--signal)] hover:underline">
                  ALL PROPOSALS ({proposals.length}) →
                </Link>
              </div>

              {/* Visual funnel: numbered stages connected by a progress line */}
              <div className="relative pt-2 pb-4">
                {/* Connector track */}
                <div className="absolute top-[22px] left-[20px] right-[20px] h-px bg-[var(--line)]" />
                {/* Active fill — grows to the current stage */}
                <div
                  className="absolute top-[22px] left-[20px] h-px bg-[var(--signal)] transition-all duration-500"
                  style={{ width: `${(activeFunnelStep / (funnelSteps.length - 1)) * 100}%` }}
                />

                <div className="relative grid grid-cols-5 text-center font-mono-ledger">
                  {funnelSteps.map((step, i) => {
                    const isPast = i < activeFunnelStep;
                    const isActive = i === activeFunnelStep && proposals.length > 0;
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

              {/* Recent proposals list or empty nudge */}
              {proposals.length === 0 ? (
                <div className="border-l-2 border-[var(--signal)] pl-4 py-1 font-mono-ledger text-[12px]">
                  <span className="text-[var(--ink)]">No proposals submitted yet. </span>
                  <Link href="/freelancer/jobs" className="text-[var(--signal)] font-bold hover:underline">
                    Browse open projects →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[var(--line)] font-mono-ledger text-[12px] mt-1">
                  {proposals.slice(0, 3).map((p) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between">
                      <span className="text-[var(--ink)] font-bold truncate max-w-xs">
                        {p.project?.title || p.projectTitle || "Proposal Brief"}
                      </span>
                      <div className="flex items-center space-x-3 shrink-0">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold border ${
                            p.status === "accepted"
                              ? "bg-[var(--signal)] border-[var(--signal)] text-[var(--paper)]"
                              : "bg-[var(--paper-2)] border-[var(--ink)] text-[var(--ink)]"
                          }`}
                        >
                          {p.status?.toUpperCase()}
                        </span>
                        <Link href="/freelancer/proposals" className="text-[var(--signal)] font-bold hover:underline">
                          VIEW →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* 03 / EARNINGS CHART — annotated zero state */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider">
                <span className="font-bold">03 / EARNINGS LEDGER</span>
                <Link href="/payment-summary" className="text-[var(--signal)] hover:underline">
                  FULL STATEMENT →
                </Link>
              </div>

              <div className="border border-[var(--ink)] bg-[var(--paper-2)] p-6 space-y-5 font-mono-ledger text-[12px]">
                <div className="flex justify-between items-center text-[10px] text-[var(--muted)] uppercase">
                  <span>EARNINGS TREND (NPR)</span>
                  <span className="text-[var(--signal)] font-bold">LIVE POSITION</span>
                </div>

                {/* SVG chart — annotated when empty */}
                <div className="relative h-32 w-full border-b border-[var(--ink)]">
                  <svg
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                    viewBox="0 0 400 90"
                  >
                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="400" y2="25" stroke="var(--line)" strokeDasharray="3 3" />
                    <line x1="0" y1="55" x2="400" y2="55" stroke="var(--line)" strokeDasharray="3 3" />

                    {/* Baseline */}
                    <line
                      x1="0" y1="78" x2="400" y2="78"
                      stroke={stats.totalEarnings > 0 ? "var(--signal)" : "var(--line)"}
                      strokeWidth={stats.totalEarnings > 0 ? "2.5" : "1.5"}
                      strokeDasharray={stats.totalEarnings > 0 ? "none" : "4 3"}
                    />

                    {stats.totalEarnings > 0 ? (
                      <>
                        <circle cx="0" cy="78" r="3" fill="var(--ink)" />
                        <circle cx="133" cy="70" r="3" fill="var(--ink)" />
                        <circle cx="266" cy="50" r="3" fill="var(--ink)" />
                        <circle cx="400" cy="28" r="4" fill="var(--signal)" />
                      </>
                    ) : (
                      <>
                        {/* Annotated zero state */}
                        <circle cx="400" cy="78" r="3.5" fill="var(--signal)" />
                        {/* "FIRST PAYMENT" arrow annotation */}
                        <line x1="340" y1="60" x2="393" y2="74" stroke="var(--signal)" strokeWidth="1" />
                        <text
                          x="260"
                          y="58"
                          fill="var(--signal)"
                          fontSize="9"
                          fontFamily="monospace"
                          letterSpacing="0.05em"
                        >
                          FIRST PAYMENT →
                        </text>
                        <text
                          x="140"
                          y="45"
                          fill="var(--muted)"
                          fontSize="8"
                          fontFamily="monospace"
                          letterSpacing="0.04em"
                        >
                          NO EARNINGS RECORDED YET
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
                    <span className="text-[10px] text-[var(--muted)] block uppercase">Released</span>
                    <span className="font-bold text-[var(--signal)] text-[14px]">
                      NPR {stats.totalEarnings?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="space-y-0.5 border-l border-[var(--line)] pl-4">
                    <span className="text-[10px] text-[var(--muted)] block uppercase">In Escrow</span>
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

            {/* SECTION A: PROFILE */}
            <div className="p-5 space-y-3 border-b border-[var(--ink)]" data-tour="freelancer-discipline">
              <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>PROFILE</span>
                {user?.freelancerProfile?.bio && user?.freelancerProfile?.skills ? (
                  <span className="text-[var(--signal)] text-[10px]">[COMPLETE]</span>
                ) : (
                  <span className="text-[var(--muted)] text-[10px]">[INCOMPLETE]</span>
                )}
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">BIO</span>
                  <span className={`font-bold ${user?.freelancerProfile?.bio ? "text-[var(--signal)]" : "text-[var(--muted)]"}`}>
                    {user?.freelancerProfile?.bio ? "[SET]" : "[MISSING]"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">SKILLS</span>
                  <span className={`font-bold ${user?.freelancerProfile?.skills?.length ? "text-[var(--signal)]" : "text-[var(--muted)]"}`}>
                    {user?.freelancerProfile?.skills?.length
                      ? `[${user.freelancerProfile.skills.length} LISTED]`
                      : "[MISSING]"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">HOURLY RATE</span>
                  <span className={`font-bold ${user?.freelancerProfile?.hourlyRate ? "text-[var(--signal)]" : "text-[var(--muted)]"}`}>
                    {user?.freelancerProfile?.hourlyRate
                      ? `[NPR ${user.freelancerProfile.hourlyRate}]`
                      : "[NOT SET]"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[var(--muted)]">REPUTATION</span>
                  <span className="font-bold text-[var(--ink)]">
                    [{stats.averageRating} / 5.0]
                  </span>
                </div>
              </div>

              <Link href="/profile" className="block text-[11px] text-[var(--signal)] font-bold hover:underline uppercase">
                Update profile record →
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
                  <span className="text-[var(--muted)]">Proposals out</span>
                  <span className="font-bold text-[var(--ink)]">{proposals.length}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">Under review</span>
                  <span className="font-bold text-[var(--signal)]">{stats.pendingProposalsCount}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">Accepted</span>
                  <span className="font-bold text-[var(--ink)]">{stats.acceptedProposalsCount}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[var(--muted)]">Active contracts</span>
                  <span className="font-bold text-[var(--ink)]">{stats.activeContractsCount}</span>
                </div>
              </div>
            </div>

            {/* SECTION C: ACTIONS */}
            <div className="p-5 space-y-2" data-tour="actions-rail">
              <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] mb-3">ACTIONS</div>

              <Link
                href="/freelancer/jobs"
                className="flex items-center justify-between py-2 border-b border-[var(--line)] hover:text-[var(--signal)] transition-colors font-bold text-[var(--ink)] text-[11px]"
              >
                <span>01. FIND WORK</span>
                <span>→</span>
              </Link>
              <Link
                href="/freelancer/proposals"
                className="flex items-center justify-between py-2 border-b border-[var(--line)] hover:text-[var(--signal)] transition-colors font-bold text-[var(--ink)] text-[11px]"
              >
                <span>02. MANAGE PROPOSALS</span>
                <span>→</span>
              </Link>
              <Link
                href="/contracts"
                className="flex items-center justify-between py-2 border-b border-[var(--line)] hover:text-[var(--signal)] transition-colors font-bold text-[var(--ink)] text-[11px]"
              >
                <span>03. VIEW CONTRACTS</span>
                <span>→</span>
              </Link>
              <Link
                href="/time-tracking"
                className="flex items-center justify-between py-2 border-b border-[var(--line)] hover:text-[var(--signal)] transition-colors font-bold text-[var(--ink)] text-[11px]"
              >
                <span>04. LOG TIME</span>
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


        {/* 04 / RECOMMENDED OPPORTUNITIES */}
        <section className="mt-14 pt-8 border-t border-[var(--ink)] space-y-5" data-tour="recommended-jobs">
          <div className="flex items-center justify-between font-mono-ledger text-[11px] uppercase tracking-wider">
            <span className="font-bold">04 / RECOMMENDED OPPORTUNITIES</span>
            <Link href="/freelancer/jobs" className="text-[var(--signal)] hover:underline">
              ALL PROJECTS →
            </Link>
          </div>

          {loading ? (
            <div className="py-6 animate-pulse space-y-2">
              <div className="h-3 bg-[var(--line)] w-1/4 rounded" />
            </div>
          ) : recommendedJobs.length === 0 ? (
            <div className="border-l-2 border-[var(--signal)] pl-4 py-1 font-mono-ledger text-[12px]">
              <span className="text-[var(--ink)]">Nothing matched yet. </span>
              <Link href="/profile" className="text-[var(--signal)] font-bold hover:underline">
                Complete your profile to improve recommendations →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendedJobs.slice(0, 6).map((job) => (
                <div
                  key={job.id}
                  className="border border-[var(--ink)] hover:border-[var(--signal)] transition-colors p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-mono-ledger text-[10px] text-[var(--muted)]">
                      <span>{job.created_at ? new Date(job.created_at).toLocaleDateString() : "RECENT"}</span>
                      <span className="text-[var(--signal)] font-bold">
                        NPR {job.budget_min?.toLocaleString() || job.budget_max?.toLocaleString() || "Agreed"}
                      </span>
                    </div>
                    <h3 className="font-serif-ledger text-[17px] font-medium text-[var(--ink)] line-clamp-2 leading-snug">
                      {job.title}
                    </h3>
                    <p className="font-sans-ledger text-[13px] text-[var(--muted)] line-clamp-3 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between font-mono-ledger text-[11px]">
                    <span className="text-[var(--muted)] truncate max-w-[130px]">{job.location || "Remote"}</span>
                    <Link
                      href={`/projects/${job.id}`}
                      className="text-[var(--signal)] font-bold hover:underline"
                    >
                      VIEW & APPLY →
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
          <span>FreelanceHub · Freelancer Workspace</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>
    </div>
  );
}

export default withAuth(FreelancerDashboard);
