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
  Users,
  Plus,
  ArrowRight,
  FileText,
  Clock,
  Star,
  Banknote,
  AlertCircle,
  RefreshCw,
  Search,
  Shield,
  Layers
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export default function ClientDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [myProjects, setMyProjects] = useState([]);
  const [activeContracts, setActiveContracts] = useState([]);
  const [topFreelancers, setTopFreelancers] = useState([]);

  const [stats, setStats] = useState({
    activeProjectsCount: 0,
    totalProposalsReceived: 0,
    activeContractsCount: 0,
    totalEscrowFunded: 0
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectsRes, contractsRes, freelancersRes] = await Promise.allSettled([
        api.get('/client/projects'),
        api.get('/contracts'),
        api.get('/profile/search/freelancers?limit=6')
      ]);

      // Process Projects
      let projectsData = [];
      if (projectsRes.status === 'fulfilled' && projectsRes.value?.data) {
        projectsData = projectsRes.value.data.projects || projectsRes.value.data || [];
      }
      setMyProjects(projectsData);

      // Process Contracts
      let contractsData = [];
      if (contractsRes.status === 'fulfilled' && contractsRes.value?.data) {
        contractsData = contractsRes.value.data.contracts || [];
      }
      const activeContractsData = contractsData.filter(c => 
        c.status === 'active' || c.status === 'in_progress' || c.status === 'pending'
      );
      setActiveContracts(activeContractsData);

      // Process Freelancers
      let freelancersData = [];
      if (freelancersRes.status === 'fulfilled' && freelancersRes.value?.data) {
        freelancersData = freelancersRes.value.data.freelancers || [];
      }
      setTopFreelancers(freelancersData);

      // Calculate Stats
      const totalProposals = projectsData.reduce((sum, p) => sum + (p.proposalsCount || p.proposals_count || 0), 0);
      const totalEscrow = contractsData.reduce((sum, c) => sum + (parseFloat(c.agreedBudget) || 0), 0);

      setStats({
        activeProjectsCount: projectsData.length,
        totalProposalsReceived: totalProposals,
        activeContractsCount: activeContractsData.length,
        totalEscrowFunded: totalEscrow
      });

    } catch (err) {
      console.error('Error fetching client dashboard data:', err);
      setError('Could not sync latest client ledger data. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.fullName?.split(' ')[0] || 'Client';

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType="client" />

      {/* Floating Tool Rail */}
      <CommandRail userType="client" />

      {/* Main Workspace Stage */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 lg:pl-20 py-8 sm:py-12 space-y-10 flex-1 w-full pb-24 lg:pb-12">
        
        {/* HEADER: WORKSPACE IDENTITY & ACTIONS */}
        <section className="space-y-4 text-left border-b border-[var(--ink)] pb-8">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
            <span>CLIENT WORKSPACE · HIRING & PROJECT OVERVIEW</span>
          </p>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="font-serif-ledger text-[38px] sm:text-[52px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
                Welcome back, {firstName}.
              </h1>
              <p className="text-[15px] text-[var(--muted)] max-w-xl">
                Here’s where your posted projects, incoming proposals, and escrow funds stand.
              </p>
            </div>

            {/* Contextual Action Links */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link 
                href="/client/post-project" 
                className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-5 py-3 transition-colors inline-flex items-center space-x-2 shadow-xs"
              >
                <span>POST A PROJECT →</span>
              </Link>

              <Link 
                href="/client/talent" 
                className="bg-[var(--paper-2)] border border-[var(--ink)] hover:bg-[var(--paper)] text-[var(--ink)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-5 py-3 transition-colors inline-flex items-center space-x-2"
              >
                <span>FIND TALENT →</span>
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
              
              {/* Escrow Funded Metric */}
              <div className="space-y-1 text-left">
                <div className="font-mono-ledger text-[10px] uppercase tracking-wider text-[var(--muted)] flex items-center space-x-1">
                  <span className="text-[var(--signal)] font-bold">₹</span>
                  <span>COMMITTED ESCROW</span>
                </div>
                <p className="font-mono-ledger text-[26px] sm:text-[34px] font-bold text-[var(--signal)] tracking-tight">
                  {formatCurrency(stats.totalEscrowFunded)}
                </p>
                <p className="font-mono-ledger text-[10px] text-[var(--muted)]">Locked in milestones</p>
              </div>

              {/* Projects Metric */}
              <div className="space-y-1 text-left border-l border-[var(--line)]/50 pl-4 sm:pl-6">
                <div className="font-mono-ledger text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  PROJECTS
                </div>
                <p className="font-mono-ledger text-[26px] sm:text-[34px] font-bold text-[var(--ink)] tracking-tight">
                  {String(stats.activeProjectsCount).padStart(2, '0')}
                </p>
                <p className="font-mono-ledger text-[10px] text-[var(--muted)]">Active briefs</p>
              </div>

              {/* Proposals Metric */}
              <div className="space-y-1 text-left border-l border-[var(--line)]/50 pl-4 sm:pl-6">
                <div className="font-mono-ledger text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  PROPOSALS
                </div>
                <p className="font-mono-ledger text-[26px] sm:text-[34px] font-bold text-[var(--ink)] tracking-tight">
                  {String(stats.totalProposalsReceived).padStart(2, '0')}
                </p>
                <p className="font-mono-ledger text-[10px] text-[var(--muted)]">Reviewing bids</p>
              </div>

              {/* Contracts Metric */}
              <div className="space-y-1 text-left border-l border-[var(--line)]/50 pl-4 sm:pl-6">
                <div className="font-mono-ledger text-[10px] uppercase tracking-wider text-[var(--muted)] flex items-center space-x-1">
                  <Users className="h-3 w-3 text-[var(--signal)]" />
                  <span>CONTRACTS</span>
                </div>
                <p className="font-mono-ledger text-[26px] sm:text-[34px] font-bold text-[var(--ink)] tracking-tight">
                  {String(stats.activeContractsCount).padStart(2, '0')}
                </p>
                <p className="font-mono-ledger text-[10px] text-[var(--muted)]">Hired talent</p>
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
            
            {/* 01 / POSTED PROJECTS & BRIEFS */}
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider">
                <span className="text-[var(--ink)] font-bold">01 / POSTED PROJECTS & BRIEFS</span>
                <Link href="/client/projects" className="text-[var(--signal)] hover:underline flex items-center space-x-1">
                  <span>MY PROJECTS ({myProjects.length}) →</span>
                </Link>
              </div>

              {loading ? (
                <div className="py-8 space-y-4 animate-pulse">
                  <div className="h-4 bg-[var(--line)] w-1/4"></div>
                  <div className="h-8 bg-[var(--line)] w-3/4"></div>
                </div>
              ) : myProjects.length === 0 ? (
                <EmptyState 
                  marker="01 / POSTED PROJECTS"
                  title="No active projects posted yet."
                  description="Your project briefs will appear here once you've posted your first opportunity to receive freelancer bids."
                  actionLabel="POST YOUR FIRST PROJECT →"
                  actionHref="/client/post-project"
                />
              ) : (
                /* Project Brief Specimen Card */
                <div className="border-2 border-[var(--ink)] bg-[var(--paper)] p-6 space-y-4 text-left hover:border-[var(--signal)] transition-colors shadow-xs">
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 font-mono-ledger text-[11px] uppercase">
                    <span className="text-[var(--signal)] font-bold flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
                      <span>PROJECT BRIEF / #{myProjects[0].id?.slice(0, 8) || '0001'}</span>
                    </span>
                    <span className="text-[var(--ink)] font-bold">[{myProjects[0].status?.toUpperCase() || 'OPEN'}]</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-serif-ledger text-[22px] font-medium text-[var(--ink)] leading-snug">
                      {myProjects[0].title}
                    </h3>
                    <p className="font-mono-ledger text-[12px] text-[var(--muted)]">
                      PROPOSALS: <span className="text-[var(--ink)] font-bold">{myProjects[0].proposalsCount || myProjects[0].proposals_count || 0} BIDS</span> • BUDGET: <span className="text-[var(--signal)] font-bold">NPR {myProjects[0].budget_min?.toLocaleString() || myProjects[0].budget_max?.toLocaleString() || 'Agreed'}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between font-mono-ledger text-[11px]">
                    <span className="text-[var(--muted)]">
                      POSTED: {myProjects[0].created_at ? new Date(myProjects[0].created_at).toLocaleDateString() : 'ACTIVE'}
                    </span>

                    <Link
                      href={`/client/projects/${myProjects[0].id}`}
                      className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[11px] uppercase tracking-wider px-4 py-2 transition-colors inline-flex items-center space-x-1"
                    >
                      <span>REVIEW PROPOSALS →</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>


            {/* 02 / HIRING PROCESS FUNNEL VISUALIZATION */}
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider">
                <span className="text-[var(--ink)] font-bold">02 / HIRING PROCESS FUNNEL</span>
                <Link href="/client/projects" className="text-[var(--signal)] hover:underline">
                  <span>VIEW PROJECTS →</span>
                </Link>
              </div>

              {/* Horizontal Process Funnel Visualization */}
              <div className="py-4 font-mono-ledger text-[11px]">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center border border-[var(--ink)] bg-[var(--paper-2)] p-4">
                  
                  <div className="space-y-1 border-r border-[var(--line)]/50 pr-2">
                    <span className="text-[var(--muted)] text-[9px] uppercase block">01 / POST BRIEF</span>
                    <span className="font-bold text-[20px] text-[var(--ink)] block">
                      {String(myProjects.length).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-[var(--muted)]">BRIEFS POSTED</span>
                  </div>

                  <div className="space-y-1 border-r border-[var(--line)]/50 pr-2">
                    <span className="text-[var(--muted)] text-[9px] uppercase block">02 / RECEIVING BIDS</span>
                    <span className="font-bold text-[20px] text-[var(--signal)] block">
                      {String(stats.totalProposalsReceived).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-bold text-[var(--signal)]">PROPOSALS</span>
                  </div>

                  <div className="space-y-1 border-r border-[var(--line)]/50 pr-2">
                    <span className="text-[var(--muted)] text-[9px] uppercase block">03 / REVIEWING</span>
                    <span className="font-bold text-[20px] text-[var(--ink)] block">00</span>
                    <span className="text-[9px] text-[var(--muted)]">INTERVIEWS</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[var(--muted)] text-[9px] uppercase block">04 / SIGNED</span>
                    <span className="font-bold text-[20px] text-[var(--ink)] block">
                      {String(stats.activeContractsCount).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-[var(--muted)]">HIRED</span>
                  </div>

                </div>
              </div>

              {activeContracts.length === 0 ? (
                <EmptyState 
                  marker="02 / CONTRACTS"
                  title="No active contracts yet."
                  description="Review incoming proposals and hire a freelancer to begin your first milestone engagement."
                  actionLabel="REVIEW PROPOSALS →"
                  actionHref="/client/projects"
                />
              ) : (
                <div className="divide-y divide-[var(--line)] font-mono-ledger text-[12px]">
                  {activeContracts.slice(0, 3).map((contract) => (
                    <div key={contract.id} className="py-3 flex items-center justify-between text-left">
                      <div className="truncate max-w-md">
                        <span className="text-[var(--muted)]">CONTRACT: </span>
                        <span className="font-bold text-[var(--ink)]">{contract.projectTitle || 'Milestone Contract'}</span>
                      </div>
                      <div className="flex items-center space-x-4 shrink-0">
                        <span className="text-[var(--signal)] font-bold">{formatCurrency(contract.agreedBudget || 0)}</span>
                        <Link href={`/contracts/${contract.id}`} className="text-[var(--ink)] font-bold hover:underline">
                          MANAGE →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* 03 / PROJECT SPEND & ESCROW SVG TIMELINE CHART */}
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider">
                <span className="text-[var(--ink)] font-bold">03 / ESCROW SPEND & TIMELINE CHART</span>
                <span className="text-[var(--signal)] font-bold">NPR ESCROW REGISTERED</span>
              </div>

              <div className="border border-[var(--ink)] bg-[var(--paper-2)] p-6 space-y-6 font-mono-ledger text-[12px]">
                
                {/* SVG Line Graph */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-[var(--muted)] uppercase">
                    <span>COMMITTED ESCROW TREND (NPR)</span>
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
                    <span className="text-[var(--muted)] block text-[10px]">COMMITTED ESCROW</span>
                    <span className="font-bold text-[var(--signal)] text-[15px]">NPR {stats.totalEscrowFunded.toLocaleString()} FUNDED</span>
                  </div>
                  <div className="border-l border-[var(--line)] pl-3 space-y-0.5">
                    <span className="text-[var(--muted)] block text-[10px]">ACTIVE CONTRACTS</span>
                    <span className="font-bold text-[var(--ink)] text-[15px]">{stats.activeContractsCount} HIRED</span>
                  </div>
                  <div className="border-l border-[var(--line)] pl-3 space-y-0.5">
                    <span className="text-[var(--muted)] block text-[10px]">POSTED BRIEFS</span>
                    <span className="font-bold text-[var(--ink)] text-[15px]">{stats.activeProjectsCount} BRIEFS</span>
                  </div>
                </div>

              </div>
            </div>

          </div>


          {/* SECONDARY COLUMN (~32% Width: Cols 9 to 12 - STACKED EDITORIAL MODULES) */}
          <div className="lg:col-span-4 space-y-8 text-left font-mono-ledger text-[12px]">
            
            {/* MODULE 1: HIRING SIGNALS */}
            <div className="space-y-3 pb-6 border-b border-[var(--ink)]">
              <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>HIRING SIGNALS</span>
                <span className="text-[var(--signal)]">• LIVE</span>
              </div>

              <div className="space-y-2 text-[12px]">
                <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">Project Briefs</span>
                  <span className="font-bold text-[var(--ink)]">{myProjects.length}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">Proposals Received</span>
                  <span className="font-bold text-[var(--signal)]">{stats.totalProposalsReceived}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">Hired Contracts</span>
                  <span className="font-bold text-[var(--ink)]">{stats.activeContractsCount}</span>
                </div>
              </div>
            </div>


            {/* MODULE 2: CLIENT ACCOUNT RECORD */}
            <div className="space-y-3 pb-6 border-b border-[var(--ink)]">
              <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>CLIENT ACCOUNT RECORD</span>
                <span className="text-[var(--signal)]">VERIFIED</span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between text-[var(--muted)]">
                  <span>ESCROW ACCOUNT</span>
                  <span className="text-[var(--signal)] font-bold">[NPR LOCAL]</span>
                </div>
                <div className="flex items-center justify-between text-[var(--muted)]">
                  <span>POSTED BRIEFS</span>
                  <span className="text-[var(--ink)] font-bold">[{stats.activeProjectsCount}]</span>
                </div>
                <div className="flex items-center justify-between text-[var(--muted)]">
                  <span>ACTIVE CONTRACTS</span>
                  <span className="text-[var(--ink)] font-bold">[{stats.activeContractsCount}]</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/how-it-works"
                  className="text-[11px] text-[var(--signal)] font-bold hover:underline block uppercase"
                >
                  HOW ESCROW WORKS →
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
                  <span className="text-[var(--muted)]">● FUNDED</span>
                  <span className="font-bold text-[var(--signal)]">NPR {stats.totalEscrowFunded.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">● RELEASED</span>
                  <span className="font-bold text-[var(--ink)]">NPR 0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">● PENDING</span>
                  <span className="font-bold text-[var(--ink)]">NPR 0</span>
                </div>
              </div>
            </div>


            {/* MODULE 4: DIRECT CLIENT COMMANDS */}
            <div className="space-y-3">
              <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>CLIENT COMMANDS</span>
                <span className="text-[var(--signal)]">[ACTIONS]</span>
              </div>

              <div className="space-y-2">
                <Link
                  href="/client/post-project"
                  className="flex items-center justify-between py-2 border-b border-[var(--line)] hover:text-[var(--signal)] transition-colors font-bold text-[var(--ink)]"
                >
                  <span>01. POST A NEW PROJECT</span>
                  <span>→</span>
                </Link>

                <Link
                  href="/client/talent"
                  className="flex items-center justify-between py-2 border-b border-[var(--line)] hover:text-[var(--signal)] transition-colors font-bold text-[var(--ink)]"
                >
                  <span>02. FIND & BROWSE TALENT</span>
                  <span>→</span>
                </Link>

                <Link
                  href="/client/projects"
                  className="flex items-center justify-between py-2 border-b border-[var(--line)] hover:text-[var(--signal)] transition-colors font-bold text-[var(--ink)]"
                >
                  <span>03. REVIEW MY PROJECTS</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

          </div>

        </div>


        {/* 04 / RECOMMENDED INDEPENDENT TALENT */}
        <section className="space-y-4 text-left pt-8 border-t border-[var(--ink)]">
          <div className="flex items-center justify-between font-mono-ledger text-[11px] uppercase tracking-wider">
            <span className="text-[var(--ink)] font-bold">04 / RECOMMENDED INDEPENDENT TALENT</span>
            <Link href="/client/talent" className="text-[var(--signal)] hover:underline">
              <span>ALL VERIFIED FREELANCERS →</span>
            </Link>
          </div>

          {loading ? (
            <div className="py-8 space-y-4 animate-pulse">
              <div className="h-4 bg-[var(--line)] w-1/4"></div>
            </div>
          ) : topFreelancers.length === 0 ? (
            <EmptyState 
              marker="04 / TALENT SEARCH"
              title="No recommended talent matched."
              description="Post a project brief to allow verified software and design professionals to submit custom proposals directly to you."
              actionLabel="POST A PROJECT →"
              actionHref="/client/post-project"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {topFreelancers.slice(0, 6).map((freelancer) => (
                <div 
                  key={freelancer.id}
                  className="border border-[var(--ink)] bg-[var(--paper)] p-5 space-y-3 text-left hover:border-[var(--signal)] transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-mono-ledger">
                      <span className="text-[11px] text-[var(--signal)] font-bold">
                        NPR {freelancer.hourlyRate?.toLocaleString() || '2,500'}/hr
                      </span>
                      <span className="text-[10px] text-[var(--muted)]">
                        ⭐ {freelancer.averageRating ? parseFloat(freelancer.averageRating).toFixed(1) : '5.0'}
                      </span>
                    </div>

                    <h3 className="font-serif-ledger text-[18px] font-normal text-[var(--ink)]">
                      {freelancer.fullName}
                    </h3>

                    <p className="text-[13px] text-[var(--muted)] line-clamp-2 leading-relaxed">
                      {freelancer.title || 'Senior Mobile & Web Software Engineer'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between font-mono-ledger text-[11px]">
                    <span className="text-[var(--muted)]">{freelancer.location || 'Kathmandu, Nepal'}</span>
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

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between text-[12px] font-mono-ledger text-[var(--muted)] gap-2">
          <span>FreelanceHub · Client Editorial Workspace</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
