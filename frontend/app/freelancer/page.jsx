"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CommandRail from "@/components/layout/CommandRail";
import EmptyState from "@/components/common/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import {
  Briefcase,
  Clock,
  Star,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Banknote,
  RefreshCw,
  UserCheck,
  FileText,
  Shield,
  Layers,
  ChevronRight
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export default function FreelancerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeContractsCount: 0,
    pendingProposalsCount: 0,
    acceptedProposalsCount: 0,
    averageRating: "5.0"
  });
  
  const [activeContracts, setActiveContracts] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [contractsRes, proposalsRes, projectsRes] = await Promise.allSettled([
        api.get('/contracts'),
        api.get('/proposals/my-proposals'),
        api.get('/projects?page=1&limit=6')
      ]);

      // Process Contracts
      let contractsData = [];
      if (contractsRes.status === 'fulfilled' && contractsRes.value?.data) {
        contractsData = contractsRes.value.data.contracts || [];
      }
      
      const activeContractsData = contractsData.filter(c => 
        c.status === 'active' || c.status === 'in_progress' || c.status === 'pending'
      );
      setActiveContracts(activeContractsData);

      // Process Proposals
      let proposalsData = [];
      if (proposalsRes.status === 'fulfilled' && proposalsRes.value?.data) {
        proposalsData = proposalsRes.value.data.proposals || [];
      }
      setProposals(proposalsData);

      // Process Projects
      let projectsData = [];
      if (projectsRes.status === 'fulfilled' && projectsRes.value?.data) {
        projectsData = projectsRes.value.data.projects || [];
      }
      setRecommendedJobs(projectsData);

      // Calculate Stats
      const totalEarnings = contractsData.reduce((sum, c) => {
        if (c.status === 'completed') {
          return sum + (parseFloat(c.agreedBudget) || 0);
        }
        return sum;
      }, 0);

      const pendingCount = proposalsData.filter(p => p.status === 'pending').length;
      const acceptedCount = proposalsData.filter(p => p.status === 'accepted').length;

      setStats({
        totalEarnings,
        activeContractsCount: activeContractsData.length,
        pendingProposalsCount: pendingCount,
        acceptedProposalsCount: acceptedCount,
        averageRating: user?.freelancerProfile?.rating ? parseFloat(user.freelancerProfile.rating).toFixed(1) : "5.0"
      });

    } catch (err) {
      console.error('Error fetching freelancer dashboard data:', err);
      setError('Could not sync latest ledger data. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.fullName?.split(' ')[0] || 'Freelancer';

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType="freelancer" />

      {/* Floating Tool Rail */}
      <CommandRail userType="freelancer" />

      {/* Main Workspace Stage */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 lg:pl-20 py-8 sm:py-12 space-y-10 flex-1 w-full pb-24 lg:pb-12">
        
        {/* HEADER: WORKSPACE IDENTITY & ACTIONS */}
        <section className="space-y-4 text-left border-b border-[var(--ink)] pb-8">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
            <span>FREELANCER WORKSPACE · WORKFLOW OVERVIEW</span>
          </p>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="font-serif-ledger text-[38px] sm:text-[52px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
                Welcome back, {firstName}.
              </h1>
              <p className="text-[15px] text-[var(--muted)] max-w-xl">
                Here’s where your work, proposals, and earnings ledger stand.
              </p>
            </div>

            {/* Contextual Action Links */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link 
                href="/projects" 
                className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-5 py-3 transition-colors inline-flex items-center space-x-2 shadow-xs"
              >
                <span>FIND WORK →</span>
              </Link>

              <Link 
                href="/freelancer/proposals" 
                className="bg-[var(--paper-2)] border border-[var(--ink)] hover:bg-[var(--paper)] text-[var(--ink)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-5 py-3 transition-colors inline-flex items-center space-x-2"
              >
                <span>VIEW PROPOSALS →</span>
              </Link>
            </div>
          </div>
        </section>


        {/* ACCOUNT POSITION (Single Full-Width Financial Statement Strip) */}
        <section className="space-y-3 text-left">
          <div className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--muted)] border-b border-[var(--ink)] pb-1.5 flex items-center justify-between">
            <span className="font-bold text-[var(--ink)]">ACCOUNT POSITION</span>
            <span className="text-[var(--signal)]">[NPR LOCAL REGISTERED]</span>
          </div>

          <div className="py-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 items-start">
              
              {/* Earnings Metric */}
              <div className="space-y-1 text-left">
                <div className="font-mono-ledger text-[10px] uppercase tracking-wider text-[var(--muted)] flex items-center space-x-1">
                  <span className="text-[var(--signal)] font-bold">₹</span>
                  <span>EARNINGS</span>
                </div>
                <p className="font-mono-ledger text-[26px] sm:text-[34px] font-bold text-[var(--signal)] tracking-tight">
                  {formatCurrency(stats.totalEarnings)}
                </p>
                <p className="font-mono-ledger text-[10px] text-[var(--muted)]">Released to bank</p>
              </div>

              {/* Active Work Metric */}
              <div className="space-y-1 text-left border-l border-[var(--line)]/50 pl-4 sm:pl-6">
                <div className="font-mono-ledger text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  ACTIVE WORK
                </div>
                <p className="font-mono-ledger text-[26px] sm:text-[34px] font-bold text-[var(--ink)] tracking-tight">
                  {String(stats.activeContractsCount).padStart(2, '0')}
                </p>
                <p className="font-mono-ledger text-[10px] text-[var(--muted)]">In progress</p>
              </div>

              {/* Proposals Metric */}
              <div className="space-y-1 text-left border-l border-[var(--line)]/50 pl-4 sm:pl-6">
                <div className="font-mono-ledger text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  PROPOSALS
                </div>
                <p className="font-mono-ledger text-[26px] sm:text-[34px] font-bold text-[var(--ink)] tracking-tight">
                  {String(stats.pendingProposalsCount).padStart(2, '0')}
                </p>
                <p className="font-mono-ledger text-[10px] text-[var(--muted)]">Under review</p>
              </div>

              {/* Rating Metric */}
              <div className="space-y-1 text-left border-l border-[var(--line)]/50 pl-4 sm:pl-6">
                <div className="font-mono-ledger text-[10px] uppercase tracking-wider text-[var(--muted)] flex items-center space-x-1">
                  <Star className="h-3 w-3 text-[var(--signal)] fill-[var(--signal)]" />
                  <span>REPUTATION</span>
                </div>
                <p className="font-mono-ledger text-[26px] sm:text-[34px] font-bold text-[var(--ink)] tracking-tight">
                  {stats.averageRating} / 5.0
                </p>
                <p className="font-mono-ledger text-[10px] text-[var(--muted)]">Verified feedback</p>
              </div>

            </div>
          </div>
          <div className="border-b border-[var(--ink)]" />
        </section>


        {/* Error Notification Banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
              <span>{error}</span>
            </div>
            <button 
              onClick={fetchDashboardData}
              className="px-3 py-1 bg-[var(--signal)] text-[var(--paper)] font-sans-ledger font-medium text-[12px] hover:bg-[var(--signal-dark)] transition-colors flex items-center space-x-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry Sync</span>
            </button>
          </div>
        )}


        {/* ASYMMETRIC DASHBOARD LAYOUT (Primary Workspace ~68% / Secondary Column ~32%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* PRIMARY WORKSPACE COLUMN (~68% Width: Cols 1 to 8) */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* 01 / CURRENT WORK & ENGAGEMENTS */}
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider">
                <span className="text-[var(--ink)] font-bold">01 / CURRENT WORK & ENGAGEMENTS</span>
                <Link href="/contracts" className="text-[var(--signal)] hover:underline">
                  <span>ALL WORK ({activeContracts.length}) →</span>
                </Link>
              </div>

              {loading ? (
                <div className="py-8 space-y-4 animate-pulse">
                  <div className="h-4 bg-[var(--line)] w-1/4"></div>
                  <div className="h-8 bg-[var(--line)] w-3/4"></div>
                </div>
              ) : activeContracts.length === 0 ? (
                <EmptyState 
                  marker="01 / WORKSPACE"
                  title="No active engagements yet."
                  description="Your workspace is waiting for its first contract. Browse open projects and submit a proposal to begin your first milestone."
                  actionLabel="FIND YOUR FIRST PROJECT →"
                  actionHref="/projects"
                />
              ) : (
                /* Contract Specimen Card */
                <div className="border-2 border-[var(--ink)] bg-[var(--paper)] p-6 space-y-4 text-left hover:border-[var(--signal)] transition-colors shadow-xs">
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 font-mono-ledger text-[11px] uppercase">
                    <span className="text-[var(--signal)] font-bold flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
                      <span>CONTRACT SPECIMEN / #{activeContracts[0].id?.slice(0, 8) || '0001'}</span>
                    </span>
                    <span className="text-[var(--ink)] font-bold">[{activeContracts[0].status?.toUpperCase() || 'ACTIVE'}]</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-serif-ledger text-[22px] font-medium text-[var(--ink)] leading-snug">
                      {activeContracts[0].projectTitle || 'Software Engineering Contract'}
                    </h3>
                    <p className="font-mono-ledger text-[12px] text-[var(--muted)]">
                      CLIENT: {activeContracts[0].clientName || 'Client Participant'} • BUDGET: <span className="text-[var(--signal)] font-bold">NPR {activeContracts[0].agreedBudget?.toLocaleString() || 'Agreed'}</span>
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 font-mono-ledger text-[11px]">
                    <div className="flex items-center justify-between text-[var(--muted)]">
                      <span>MILESTONE PROGRESS</span>
                      <span>50% COMPLETE</span>
                    </div>
                    <div className="w-full bg-[var(--paper-2)] border border-[var(--ink)] h-3 p-0.5">
                      <div className="bg-[var(--signal)] h-full w-1/2"></div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between font-mono-ledger text-[11px]">
                    <span className="text-[var(--muted)]">
                      STARTED: {activeContracts[0].startedAt ? new Date(activeContracts[0].startedAt).toLocaleDateString() : 'ACTIVE'}
                    </span>

                    <Link
                      href={`/contracts/${activeContracts[0].id}`}
                      className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[11px] uppercase tracking-wider px-4 py-2 transition-colors inline-flex items-center space-x-1"
                    >
                      <span>OPEN WORKSPACE →</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>


            {/* 02 / PROPOSAL ACTIVITY FUNNEL VISUALIZATION */}
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider">
                <span className="text-[var(--ink)] font-bold">02 / PROPOSAL ACTIVITY FUNNEL</span>
                <Link href="/freelancer/proposals" className="text-[var(--signal)] hover:underline">
                  <span>ALL PROPOSALS ({proposals.length}) →</span>
                </Link>
              </div>

              {/* Horizontal Process Funnel Visualization */}
              <div className="py-4 font-mono-ledger text-[11px]">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center border border-[var(--ink)] bg-[var(--paper-2)] p-4">
                  
                  <div className="space-y-1 border-r border-[var(--line)]/50 pr-2">
                    <span className="text-[var(--muted)] text-[9px] uppercase block">01 / DRAFT</span>
                    <span className="font-bold text-[20px] text-[var(--ink)] block">00</span>
                    <span className="text-[9px] text-[var(--muted)]">PREPARING</span>
                  </div>

                  <div className="space-y-1 border-r border-[var(--line)]/50 pr-2">
                    <span className="text-[var(--muted)] text-[9px] uppercase block">02 / SUBMITTED</span>
                    <span className="font-bold text-[20px] text-[var(--ink)] block">
                      {String(proposals.length).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-[var(--muted)] font-bold text-[var(--signal)]">ACTIVE</span>
                  </div>

                  <div className="space-y-1 border-r border-[var(--line)]/50 pr-2">
                    <span className="text-[var(--muted)] text-[9px] uppercase block">03 / REVIEWED</span>
                    <span className="font-bold text-[20px] text-[var(--ink)] block">
                      {String(stats.pendingProposalsCount).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-[var(--muted)]">IN REVIEW</span>
                  </div>

                  <div className="space-y-1 border-r border-[var(--line)]/50 pr-2">
                    <span className="text-[var(--muted)] text-[9px] uppercase block">04 / SHORTLISTED</span>
                    <span className="font-bold text-[20px] text-[var(--ink)] block">00</span>
                    <span className="text-[9px] text-[var(--muted)]">INTERVIEW</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[var(--muted)] text-[9px] uppercase block">05 / ACCEPTED</span>
                    <span className="font-bold text-[20px] text-[var(--signal)] block">
                      {String(stats.acceptedProposalsCount).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-[var(--muted)]">HIRED</span>
                  </div>

                </div>
              </div>

              {proposals.length === 0 ? (
                <EmptyState 
                  marker="02 / PIPELINE"
                  title="No proposals submitted yet."
                  description="Browse open project briefs matching your skills and send your first proposal to enter the pipeline."
                  actionLabel="BROWSE OPEN PROJECTS →"
                  actionHref="/projects"
                />
              ) : (
                <div className="divide-y divide-[var(--line)] font-mono-ledger text-[12px]">
                  {proposals.slice(0, 3).map((proposal) => (
                    <div key={proposal.id} className="py-3 flex items-center justify-between text-left">
                      <div className="truncate max-w-md">
                        <span className="text-[var(--muted)]">PROPOSAL: </span>
                        <span className="font-bold text-[var(--ink)]">{proposal.project?.title || proposal.projectTitle || 'Proposal Brief'}</span>
                      </div>
                      <div className="flex items-center space-x-4 shrink-0">
                        <span className={`px-2 py-0.5 border ${
                          proposal.status === 'accepted' ? 'bg-[var(--signal)] text-[var(--paper)] border-[var(--signal)] font-bold' :
                          'bg-[var(--paper-2)] text-[var(--ink)] border-[var(--ink)]'
                        }`}>
                          [{proposal.status?.toUpperCase() || 'SUBMITTED'}]
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


            {/* 03 / EARNINGS LEDGER & SVG TIMELINE CHART */}
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider">
                <span className="text-[var(--ink)] font-bold">03 / EARNINGS LEDGER & TIMELINE CHART</span>
                <span className="text-[var(--signal)] font-bold">NPR ESCROW REGISTERED</span>
              </div>

              <div className="border border-[var(--ink)] bg-[var(--paper-2)] p-6 space-y-6 font-mono-ledger text-[12px]">
                
                {/* SVG Line Graph */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-[var(--muted)] uppercase">
                    <span>EARNINGS TREND (NPR)</span>
                    <span className="text-[var(--signal)] font-bold">LIVE POSITION</span>
                  </div>

                  <div className="h-28 w-full relative flex items-end pt-4 pb-2 border-b border-[var(--ink)]">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 80">
                      {/* Grid Lines */}
                      <line x1="0" y1="20" x2="400" y2="20" stroke="var(--line)" strokeDasharray="3 3" />
                      <line x1="0" y1="50" x2="400" y2="50" stroke="var(--line)" strokeDasharray="3 3" />
                      
                      {/* Trend Line (Editorial Vermillion Red) */}
                      <path 
                        d="M 0 70 Q 100 65, 200 60 T 400 20" 
                        fill="none" 
                        stroke="var(--signal)" 
                        strokeWidth="2.5" 
                      />

                      {/* Points */}
                      <circle cx="0" cy="70" r="3" fill="var(--ink)" />
                      <circle cx="133" cy="65" r="3" fill="var(--ink)" />
                      <circle cx="266" cy="55" r="3" fill="var(--ink)" />
                      <circle cx="400" cy="20" r="4" fill="var(--signal)" />
                    </svg>
                  </div>

                  <div className="flex justify-between text-[10px] text-[var(--muted)] uppercase pt-1">
                    <span>MAY 2026</span>
                    <span>JUN 2026</span>
                    <span>JUL 2026</span>
                    <span className="text-[var(--signal)] font-bold">AUG 2026 [CURRENT]</span>
                  </div>
                </div>

                {/* Ledger Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-[12px]">
                  <div className="border-l border-[var(--line)] pl-3 space-y-0.5">
                    <span className="text-[var(--muted)] block text-[10px]">RELEASED PAYMENTS</span>
                    <span className="font-bold text-[var(--signal)] text-[15px]">NPR 0 RELEASED</span>
                  </div>
                  <div className="border-l border-[var(--line)] pl-3 space-y-0.5">
                    <span className="text-[var(--muted)] block text-[10px]">ESCROW RESERVED</span>
                    <span className="font-bold text-[var(--ink)] text-[15px]">NPR 0 IN ESCROW</span>
                  </div>
                  <div className="border-l border-[var(--line)] pl-3 space-y-0.5">
                    <span className="text-[var(--muted)] block text-[10px]">PROPOSED ENGAGEMENTS</span>
                    <span className="font-bold text-[var(--ink)] text-[15px]">NPR 0 PENDING</span>
                  </div>
                </div>

              </div>
            </div>

          </div>


          {/* SECONDARY COLUMN (~32% Width: Cols 9 to 12 - STACKED EDITORIAL MODULES) */}
          <div className="lg:col-span-4 space-y-8 text-left font-mono-ledger text-[12px]">
            
            {/* MODULE 1: WORKSPACE SIGNALS */}
            <div className="space-y-3 pb-6 border-b border-[var(--ink)]">
              <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>WORKSPACE SIGNALS</span>
                <span className="text-[var(--signal)]">• LIVE</span>
              </div>

              <div className="space-y-2 text-[12px]">
                <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">Proposals Submitted</span>
                  <span className="font-bold text-[var(--ink)]">{proposals.length}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">Proposals Reviewed</span>
                  <span className="font-bold text-[var(--signal)]">{stats.pendingProposalsCount}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">Contracts Signed</span>
                  <span className="font-bold text-[var(--ink)]">{stats.activeContractsCount}</span>
                </div>
              </div>
            </div>


            {/* MODULE 2: PROFILE RECORD */}
            <div className="space-y-3 pb-6 border-b border-[var(--ink)]">
              <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>PROFILE RECORD</span>
                <span className="text-[var(--signal)]">68%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[var(--paper-2)] border border-[var(--ink)] h-2.5 p-0.5">
                <div className="bg-[var(--signal)] h-full w-[68%]"></div>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between text-[var(--muted)]">
                  <span>BIO RECORD</span>
                  <span className="text-[var(--ink)] font-bold">[VERIFIED]</span>
                </div>
                <div className="flex items-center justify-between text-[var(--muted)]">
                  <span>SKILLS SPECIMEN</span>
                  <span className="text-[var(--signal)] font-bold">[VERIFIED]</span>
                </div>
                <div className="flex items-center justify-between text-[var(--muted)]">
                  <span>PORTFOLIO</span>
                  <span className="text-[var(--ink)] font-bold">[03 SPECIMENS]</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/profile"
                  className="text-[11px] text-[var(--signal)] font-bold hover:underline block uppercase"
                >
                  COMPLETE PROFILE RECORD →
                </Link>
              </div>
            </div>


            {/* MODULE 3: ESCROW POSITION */}
            <div className="space-y-3 pb-6 border-b border-[var(--ink)]">
              <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>ESCROW POSITION</span>
                <span className="text-[var(--signal)]">NPR LOCAL</span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">● RESERVED</span>
                  <span className="font-bold text-[var(--ink)]">NPR 0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">● RELEASED</span>
                  <span className="font-bold text-[var(--signal)]">NPR 0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">● PENDING</span>
                  <span className="font-bold text-[var(--ink)]">NPR 0</span>
                </div>
              </div>
            </div>


            {/* MODULE 4: DIRECT WORKSPACE COMMANDS */}
            <div className="space-y-3">
              <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>DIRECT COMMANDS</span>
                <span className="text-[var(--signal)]">[ACTIONS]</span>
              </div>

              <div className="space-y-2">
                <Link
                  href="/projects"
                  className="flex items-center justify-between py-2 border-b border-[var(--line)] hover:text-[var(--signal)] transition-colors font-bold text-[var(--ink)]"
                >
                  <span>01. FIND OPEN WORK</span>
                  <span>→</span>
                </Link>

                <Link
                  href="/freelancer/proposals"
                  className="flex items-center justify-between py-2 border-b border-[var(--line)] hover:text-[var(--signal)] transition-colors font-bold text-[var(--ink)]"
                >
                  <span>02. MANAGE PROPOSALS</span>
                  <span>→</span>
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center justify-between py-2 border-b border-[var(--line)] hover:text-[var(--signal)] transition-colors font-bold text-[var(--ink)]"
                >
                  <span>03. UPDATE PROFILE RECORD</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

          </div>

        </div>


        {/* 04 / RECOMMENDED OPPORTUNITIES */}
        <section className="space-y-4 text-left pt-8 border-t border-[var(--ink)]">
          <div className="flex items-center justify-between font-mono-ledger text-[11px] uppercase tracking-wider">
            <span className="text-[var(--ink)] font-bold">04 / RECOMMENDED OPPORTUNITIES</span>
            <Link href="/projects" className="text-[var(--signal)] hover:underline">
              <span>ALL RECOMMENDED PROJECTS →</span>
            </Link>
          </div>

          {loading ? (
            <div className="py-8 space-y-4 animate-pulse">
              <div className="h-4 bg-[var(--line)] w-1/4"></div>
            </div>
          ) : recommendedJobs.length === 0 ? (
            <EmptyState 
              marker="04 / OPPORTUNITIES"
              title="Nothing matched yet."
              description="Complete your profile and skills list to improve project recommendations from our matching system."
              actionLabel="COMPLETE PROFILE RECORD →"
              actionHref="/profile"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {recommendedJobs.slice(0, 6).map((job) => (
                <div 
                  key={job.id}
                  className="border border-[var(--ink)] bg-[var(--paper)] p-5 space-y-3 text-left hover:border-[var(--signal)] transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-mono-ledger text-[10px] text-[var(--muted)]">
                      <span>POSTED: {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'RECENT'}</span>
                      <span className="text-[var(--signal)] font-bold">NPR {job.budget_min?.toLocaleString() || job.budget_max?.toLocaleString() || 'Agreed'}</span>
                    </div>

                    <h3 className="font-serif-ledger text-[18px] font-normal text-[var(--ink)] line-clamp-2">
                      {job.title}
                    </h3>

                    <p className="text-[13px] text-[var(--muted)] line-clamp-3 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between font-mono-ledger text-[11px]">
                    <span className="text-[var(--muted)] truncate max-w-[150px]">{job.location || 'Remote'}</span>
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

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between text-[12px] font-mono-ledger text-[var(--muted)] gap-2">
          <span>FreelanceHub · Freelancer Editorial Workspace</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
