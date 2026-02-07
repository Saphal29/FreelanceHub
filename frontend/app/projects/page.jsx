"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  Calendar,
  User,
  MessageSquare,
  FileText,
} from "lucide-react";

// Dummy projects data
const projectsData = {
  active: [
    {
      id: 1,
      title: "E-commerce Website Development",
      client: "TechStart Inc.",
      clientAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      deadline: "Dec 28, 2024",
      progress: 75,
      amount: "$2,500",
      status: "in_progress",
      description: "Building a modern e-commerce platform with React and Node.js",
      startDate: "Nov 15, 2024",
    },
    {
      id: 2,
      title: "Mobile App UI/UX Design",
      client: "HealthApp Co.",
      clientAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      deadline: "Jan 5, 2025",
      progress: 45,
      amount: "$1,800",
      status: "in_progress",
      description: "Designing user interfaces for a health and fitness mobile application",
      startDate: "Dec 1, 2024",
    },
    {
      id: 3,
      title: "Brand Identity Package",
      client: "GreenLeaf Organic",
      clientAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      deadline: "Jan 2, 2025",
      progress: 90,
      amount: "$800",
      status: "review",
      description: "Complete brand identity including logo, colors, and guidelines",
      startDate: "Nov 20, 2024",
    },
  ],
  completed: [
    {
      id: 4,
      title: "WordPress Blog Setup",
      client: "Digital Marketing Pro",
      clientAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      completedDate: "Dec 10, 2024",
      amount: "$600",
      rating: 5,
      review: "Excellent work! Very professional and delivered on time.",
    },
    {
      id: 5,
      title: "Logo Design for Startup",
      client: "InnovateTech",
      clientAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
      completedDate: "Nov 28, 2024",
      amount: "$450",
      rating: 5,
      review: "Amazing designer! Captured our vision perfectly.",
    },
  ],
  cancelled: [
    {
      id: 6,
      title: "Social Media Management",
      client: "Fashion Boutique",
      clientAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
      cancelledDate: "Nov 15, 2024",
      amount: "$300",
      reason: "Client changed requirements",
    },
  ],
};

export default function MyProjectsPage() {
  const [activeTab, setActiveTab] = useState("active");

  const tabs = [
    { id: "active", label: "Active", count: projectsData.active.length },
    { id: "completed", label: "Completed", count: projectsData.completed.length },
    { id: "cancelled", label: "Cancelled", count: projectsData.cancelled.length },
  ];

  const renderActiveProjects = () => (
    <div className="space-y-6">
      {projectsData.active.map((project) => (
        <div
          key={project.id}
          className="rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {project.title}
                </h3>
                {project.status === "review" && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
                    <AlertCircle className="h-3 w-3" />
                    In Review
                  </span>
                )}
                {project.status === "in_progress" && (
                  <span className="flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    <Clock className="h-3 w-3" />
                    In Progress
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <img
              src={project.clientAvatar}
              alt={project.client}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-medium text-foreground">{project.client}</p>
              <p className="text-xs text-muted-foreground">Client</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-secondary p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Start Date</p>
              <p className="mt-1 text-sm font-medium text-foreground">{project.startDate}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="mt-1 text-sm font-medium text-foreground">{project.deadline}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="mt-1 text-sm font-medium text-accent">{project.amount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="mt-1 text-sm font-medium text-foreground">{project.progress}%</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="flex-1">
              <MessageSquare className="mr-2 h-4 w-4" />
              Message Client
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <FileText className="mr-2 h-4 w-4" />
              View Details
            </Button>
            {project.status === "review" && (
              <Button variant="accent" size="sm" className="flex-1">
                <CheckCircle className="mr-2 h-4 w-4" />
                Deliver Work
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderCompletedProjects = () => (
    <div className="space-y-6">
      {projectsData.completed.map((project) => (
        <div
          key={project.id}
          className="rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {project.title}
                </h3>
                <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Completed
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <img
              src={project.clientAvatar}
              alt={project.client}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-medium text-foreground">{project.client}</p>
              <p className="text-xs text-muted-foreground">Client</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-secondary p-4">
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="mt-1 text-sm font-medium text-foreground">{project.completedDate}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Earned</p>
              <p className="mt-1 text-sm font-medium text-accent">{project.amount}</p>
            </div>
          </div>

          {/* Rating */}
          <div className="mt-4 rounded-xl border border-border bg-secondary/50 p-4">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(project.rating)].map((_, i) => (
                  <CheckCircle key={i} className="h-5 w-5 fill-accent text-accent" />
                ))}
              </div>
              <span className="font-semibold text-foreground">{project.rating}.0</span>
            </div>
            <p className="mt-2 text-sm italic text-muted-foreground">"{project.review}"</p>
          </div>

          <div className="mt-4 flex gap-3">
            <Button variant="outline" size="sm" className="flex-1">
              <FileText className="mr-2 h-4 w-4" />
              View Details
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact Client
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCancelledProjects = () => (
    <div className="space-y-6">
      {projectsData.cancelled.map((project) => (
        <div
          key={project.id}
          className="rounded-2xl border border-border bg-card p-6 opacity-75 transition-all hover:shadow-lg"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {project.title}
                </h3>
                <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600">
                  <XCircle className="h-3 w-3" />
                  Cancelled
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <img
              src={project.clientAvatar}
              alt={project.client}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-medium text-foreground">{project.client}</p>
              <p className="text-xs text-muted-foreground">Client</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-secondary p-4">
            <p className="text-xs text-muted-foreground">Cancellation Reason</p>
            <p className="mt-1 text-sm text-foreground">{project.reason}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Cancelled on {project.cancelledDate}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="freelancer" />

      {/* Header */}
      <section className="border-b border-border bg-secondary/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                My Projects
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Manage and track all your ongoing and completed projects
              </p>
            </div>
            <Button variant="accent" className="hidden sm:flex">
              <Briefcase className="mr-2 h-5 w-5" />
              Find New Work
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-background py-6">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {projectsData.active.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {projectsData.completed.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <DollarSign className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="font-display text-2xl font-bold text-foreground">$12,450</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="border-b border-border bg-background">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    activeTab === tab.id
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === "active" && renderActiveProjects()}
        {activeTab === "completed" && renderCompletedProjects()}
        {activeTab === "cancelled" && renderCancelledProjects()}
      </main>
    </div>
  );
}
