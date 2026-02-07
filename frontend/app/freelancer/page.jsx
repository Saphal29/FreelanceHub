"use client";

import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/cards/StatCard";
import JobCard from "@/components/cards/JobCard";
import {
  DollarSign,
  Briefcase,
  Clock,
  Star,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";

const stats = [
  { icon: DollarSign, label: "Total Earnings", value: "$12,450", change: "12%", isPositive: true },
  { icon: Briefcase, label: "Active Projects", value: "5", change: "2", isPositive: true },
  { icon: Clock, label: "Pending Proposals", value: "8" },
  { icon: Star, label: "Average Rating", value: "4.9", change: "0.1", isPositive: true },
];

const activeOrders = [
  {
    id: "1",
    title: "E-commerce Website Development",
    client: "TechStart Inc.",
    deadline: "Dec 28, 2024",
    progress: 75,
    amount: "$2,500",
    status: "in_progress",
  },
  {
    id: "2",
    title: "Mobile App UI/UX Design",
    client: "HealthApp Co.",
    deadline: "Jan 5, 2025",
    progress: 45,
    amount: "$1,800",
    status: "in_progress",
  },
  {
    id: "3",
    title: "Brand Identity Package",
    client: "GreenLeaf Organic",
    deadline: "Jan 2, 2025",
    progress: 90,
    amount: "$800",
    status: "review",
  },
];

const recommendedJobs = [
  {
    title: "Senior React Developer for SaaS Platform",
    description: "Looking for an experienced React developer to help build and maintain our SaaS platform. Must have experience with TypeScript, Node.js, and cloud services.",
    budget: "$5,000 - $8,000",
    duration: "3-6 months",
    location: "Remote",
    skills: ["React", "TypeScript", "Node.js", "AWS"],
    postedAt: "2 hours ago",
    proposals: 12,
  },
  {
    title: "UI/UX Designer for Fintech Mobile App",
    description: "We need a talented designer to create intuitive and beautiful interfaces for our financial technology mobile application.",
    budget: "$2,000 - $3,500",
    duration: "1-2 months",
    location: "Remote",
    skills: ["Figma", "Mobile Design", "UI/UX", "Prototyping"],
    postedAt: "5 hours ago",
    proposals: 8,
  },
  {
    title: "Full-Stack Developer for E-learning Platform",
    description: "Building an innovative e-learning platform and need a full-stack developer to implement new features and optimize performance.",
    budget: "$4,000 - $6,000",
    duration: "2-3 months",
    location: "Remote",
    skills: ["React", "Python", "PostgreSQL", "Docker"],
    postedAt: "1 day ago",
    proposals: 23,
  },
];

const FreelancerHome = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="freelancer" />

      {/* Welcome Section */}
      <section className="border-b border-border bg-gradient-hero py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Welcome back, <span className="text-accent">Alex</span>! 👋
              </h1>
              <p className="mt-1 text-muted-foreground">
                Here's what's happening with your freelance business today.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
              <Button variant="accent">
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
                <h2 className="font-display text-xl font-bold text-foreground">Active Orders</h2>
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {activeOrders.map((order, index) => (
                  <div
                    key={order.id}
                    className="animate-fade-up rounded-xl border border-border bg-card p-5 opacity-0"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-semibold text-foreground">{order.title}</h3>
                          {order.status === "review" && (
                            <span className="flex items-center gap-1 rounded-full bg-amber/10 px-2 py-0.5 text-xs font-medium text-amber">
                              <AlertCircle className="h-3 w-3" />
                              In Review
                            </span>
                          )}
                          {order.status === "in_progress" && (
                            <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                              <Clock className="h-3 w-3" />
                              In Progress
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{order.client}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Due: {order.deadline}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <DollarSign className="h-4 w-4 text-accent" />
                        <span>{order.amount}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{order.progress}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-500"
                          style={{ width: `${order.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                      {order.status === "review" && (
                        <Button variant="accent" size="sm" className="flex-1">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Deliver Work
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions & Notifications */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: "Create New Gig", icon: Briefcase },
                    { label: "Update Profile", icon: Star },
                    { label: "Withdraw Earnings", icon: DollarSign },
                  ].map((action) => (
                    <button
                      key={action.label}
                      className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-secondary"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                        <action.icon className="h-4 w-4 text-accent" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Performance Summary */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display font-semibold text-foreground mb-4">This Month</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completed Orders</span>
                    <span className="font-semibold text-foreground">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Response Rate</span>
                    <span className="font-semibold text-accent">98%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">On-Time Delivery</span>
                    <span className="font-semibold text-accent">100%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Order Completion</span>
                    <span className="font-semibold text-foreground">95%</span>
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
                    <p className="font-display font-semibold text-foreground">Level 2 Seller</p>
                    <p className="text-sm text-muted-foreground">85% to Level 3</p>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-accent/20">
                  <div className="h-full w-[85%] rounded-full bg-accent" />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Complete 5 more orders to reach Level 3
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
            {recommendedJobs.map((job, index) => (
              <div
                key={job.title}
                className="animate-fade-up opacity-0"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <JobCard {...job} />
              </div>
            ))}
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
