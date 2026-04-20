"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/cards/StatCard";
import JobCard from "@/components/cards/JobCard";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import {
  Briefcase,
  Clock,
  Star,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Loader2,
  Banknote,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

const FreelancerHome = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { icon: Banknote, label: "Total Earnings", value: "Rs. 0", change: "0%", isPositive: true },
    { icon: Briefcase, label: "Active Projects", value: "0", change: "0", isPositive: true },
    { icon: Clock, label: "Pending Proposals", value: "0" },
    { icon: Star, label: "Average Rating", value: "0", change: "0", isPositive: true },
  ]);
  const [activeContracts, setActiveContracts] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [contractsRes, proposalsRes, projectsRes] = await Promise.all([
        api.get('/contracts'),
        api.get('/proposals/my-proposals'),
        api.get('/projects?page=1&limit=6')
      ]);

      // Process contracts
      const contracts = contractsRes.data.contracts || [];
      console.log('Contracts data:', contracts); // Debug log
      
      const activeContractsData = contracts.filter(c => 
        c.status === 'active' || c.status === 'in_progress' || c.status === 'pending'
      );
      
      // Fetch detailed info for each contract
      const contractsWithDetails = await Promise.all(
        activeContractsData.map(async (contract) => {
          try {
            const detailRes = await api.get(`/contracts/${contract.id}`);
            return detailRes.data.contract;
          } catch (error) {
            console.error(`Error fetching contract ${contract.id}:`, error);
            return contract;
          }
        })
      );
      
      setActiveContracts(contractsWithDetails);

      // Process proposals
      const proposalsData = proposalsRes.data.proposals || [];
      setProposals(proposalsData);
      const pendingProposals = proposalsData.filter(p => p.status === 'pending');

      // Process projects for recommendations
      const projects = projectsRes.data.projects || [];
      setRecommendedJobs(projects);

      // Calculate stats
      const totalEarnings = contracts.reduce((sum, c) => {
        if (c.status === 'completed') {
          return sum + (parseFloat(c.agreedBudget) || 0);
        }
        return sum;
      }, 0);

      // Get average rating (placeholder - would need reviews endpoint)
      const avgRating = "4.8";

      // Update stats
      setStats([
        { 
          icon: Banknote, 
          label: "Total Earnings", 
          value: formatCurrency(totalEarnings), 
          change: "12%", 
          isPositive: true 
        },
        { 
          icon: Briefcase, 
          label: "Active Projects", 
          value: activeContractsData.length.toString(), 
          change: "2", 
          isPositive: true 
        },
        { 
          icon: Clock, 
          label: "Pending Proposals", 
          value: pendingProposals.length.toString() 
        },
        { 
          icon: Star, 
          label: "Average Rating", 
          value: avgRating, 
          change: "0.1", 
          isPositive: true 
        },
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (contract) => {
    // If we have milestone stats from workspace endpoint
    if (contract.stats) {
      const total = contract.stats.totalMilestones;
      const completed = contract.stats.completedMilestones;
      if (total === 0) return 0;
      return Math.round((completed / total) * 100);
    }
    // Fallback: no milestones data
    return 0;
  };

  const getContractStatus = (contract) => {
    if (contract.status === 'pending') return { label: 'Pending Signature', color: 'amber' };
    if (contract.status === 'active') return { label: 'In Progress', color: 'accent' };
    if (contract.status === 'in_progress') return { label: 'In Progress', color: 'accent' };
    if (contract.status === 'completed') return { label: 'Completed', color: 'green' };
    return { label: contract.status, color: 'gray' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar userType="freelancer" />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="freelancer" />

      {/* Welcome Section */}
      <section className="border-b border-border bg-gradient-hero py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Welcome back, <span className="text-accent">{user?.fullName?.split(' ')[0] || 'Freelancer'}</span>! 👋
              </h1>
              <p className="mt-1 text-muted-foreground">
                Here's what's happening with your freelance business today.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/freelancer/proposals')}>
                <TrendingUp className="mr-2 h-4 w-4" />
                View Proposals
              </Button>
              <Button variant="accent" onClick={() => router.push('/projects')}>
                Find New Jobs
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="animate-fade-up opacity-0"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <StatCard {...stat} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Active Orders */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold text-foreground">Active Contracts</h2>
                <Button variant="ghost" size="sm" onClick={() => router.push('/contracts')}>
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {activeContracts.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-display font-semibold text-foreground mb-2">No Active Contracts</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start applying to projects to get your first contract
                  </p>
                  <Button variant="accent" onClick={() => router.push('/projects')}>
                    Browse Projects
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeContracts.slice(0, 3).map((contract, index) => {
                    const status = getContractStatus(contract);
                    const progress = calculateProgress(contract);
                    
                    return (
                      <div
                        key={contract.id}
                        className="animate-fade-up rounded-xl border border-border bg-card p-5 opacity-0"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-display font-semibold text-foreground">
                                {contract.projectTitle || 'Project'}
                              </h3>
                              <span className={`flex items-center gap-1 rounded-full bg-${status.color}/10 px-2 py-0.5 text-xs font-medium text-${status.color}`}>
                                {status.label === 'In Progress' && <Clock className="h-3 w-3" />}
                                {status.label === 'Pending Signature' && <AlertCircle className="h-3 w-3" />}
                                {status.label}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Client
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="shrink-0"
                            onClick={() => router.push(`/contracts/${contract.id}`)}
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              {contract.completedAt 
                                ? `Completed: ${new Date(contract.completedAt).toLocaleDateString()}` 
                                : contract.startedAt
                                ? `Started: ${new Date(contract.startedAt).toLocaleDateString()}`
                                : 'Not started'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium text-foreground">
                            <Banknote className="h-4 w-4 text-accent" />
                            <span>{formatCurrency(contract.agreedBudget || 0)}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium text-foreground">{progress}%</span>
                          </div>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-accent transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex gap-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => router.push(`/contracts/${contract.id}`)}
                          >
                            View Details
                          </Button>
                          {contract.status === 'active' && (
                            <Button 
                              variant="accent" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => router.push(`/contracts/${contract.id}`)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Continue Work
                            </Button>
                          )}
                          {contract.status === 'pending' && (
                            <Button 
                              variant="accent" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => router.push(`/contracts/${contract.id}`)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Sign Contract
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions & Notifications */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/profile')}
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-secondary"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                      <Star className="h-4 w-4 text-accent" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Update Profile</span>
                  </button>
                  <button
                    onClick={() => router.push('/projects')}
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-secondary"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                      <Briefcase className="h-4 w-4 text-accent" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Browse Projects</span>
                  </button>
                  <button
                    onClick={() => router.push('/freelancer/proposals')}
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-secondary"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                      <Banknote className="h-4 w-4 text-accent" />
                    </div>
                    <span className="text-sm font-medium text-foreground">My Proposals</span>
                  </button>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display font-semibold text-foreground mb-4">This Month</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Contracts</span>
                    <span className="font-semibold text-foreground">{activeContracts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pending Proposals</span>
                    <span className="font-semibold text-accent">
                      {proposals.filter(p => p.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Accepted Proposals</span>
                    <span className="font-semibold text-accent">
                      {proposals.filter(p => p.status === 'accepted').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Proposals</span>
                    <span className="font-semibold text-foreground">{proposals.length}</span>
                  </div>
                </div>
              </div>

              {/* Level Progress */}
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                    <Star className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground">Freelancer</p>
                    <p className="text-sm text-muted-foreground">
                      {activeContracts.length} active {activeContracts.length === 1 ? 'contract' : 'contracts'}
                    </p>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-accent/20">
                  <div 
                    className="h-full rounded-full bg-accent" 
                    style={{ width: `${Math.min((activeContracts.length / 5) * 100, 100)}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {activeContracts.length < 5 
                    ? `Complete ${5 - activeContracts.length} more ${5 - activeContracts.length === 1 ? 'contract' : 'contracts'} to level up`
                    : 'Great job! Keep up the excellent work'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Jobs Section */}
      <section className="bg-secondary/30 py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Recommended for You
              </h2>
              <p className="mt-1 text-muted-foreground">
                Jobs that match your skills and preferences
              </p>
            </div>
            <Button variant="ghost" className="hidden sm:flex">
              Browse All Jobs <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {recommendedJobs.length === 0 ? (
              <div className="col-span-full rounded-xl border border-border bg-card p-8 text-center">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-display font-semibold text-foreground mb-2">No Projects Available</h3>
                <p className="text-sm text-muted-foreground">
                  Check back later for new opportunities
                </p>
              </div>
            ) : (
              recommendedJobs.map((job, index) => (
                <div
                  key={job.id}
                  className="animate-fade-up opacity-0"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <JobCard 
                    title={job.title}
                    description={job.description}
                    budget={`$${job.budget_min} - $${job.budget_max}`}
                    duration={job.duration_estimate || 'Not specified'}
                    location={job.location || 'Remote'}
                    skills={job.skills || []}
                    postedAt={new Date(job.created_at).toLocaleDateString()}
                    proposals={job.proposals_count || 0}
                    onClick={() => router.push(`/projects/${job.id}`)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <span className="font-display text-sm font-bold text-accent-foreground">F</span>
              </div>
              <span className="font-display text-lg font-bold text-foreground">
                Freelance<span className="text-accent">Hub</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 FreelanceHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FreelancerHome;
