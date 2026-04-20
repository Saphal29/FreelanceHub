"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { getProjects } from "@/lib/api";
import {
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  MessageSquare,
  FileText,
  Search,
  Filter,
  Banknote,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export default function MyProjectsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Redirect if not authenticated or not a freelancer
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "FREELANCER")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch projects
  useEffect(() => {
    fetchProjects();
  }, [user, authLoading, activeTab]);

  const fetchProjects = async () => {
    if (!user || user.role !== "FREELANCER") return;

    try {
      setLoading(true);
      setError("");

      const params = {
        status: activeTab === "active" ? "in_progress" : activeTab,
        sortBy: "created_at",
        sortOrder: "DESC",
        limit: 50
      };

      // Add search query
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await getProjects(params);

      if (response.success) {
        setProjects(response.projects || []);
      } else {
        setError(response.error || "Failed to load projects");
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  // Filter projects by search query
  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.title.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query) ||
      (project.skills && project.skills.some((skill) => skill.toLowerCase().includes(query)))
    );
  });

  const tabs = [
    { id: "active", label: "Active", count: activeTab === "active" ? filteredProjects.length : 0 },
    { id: "completed", label: "Completed", count: activeTab === "completed" ? filteredProjects.length : 0 },
    { id: "cancelled", label: "Cancelled", count: activeTab === "cancelled" ? filteredProjects.length : 0 },
  ];

  const renderActiveProjects = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      );
    }

    if (filteredProjects.length === 0) {
      return (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
            No active projects
          </h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search query"
              : "You don't have any active projects yet"}
          </p>
          {!searchQuery && (
            <Link href="/freelancer/jobs">
              <Button variant="accent" className="mt-6">
                Find Work
              </Button>
            </Link>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {filteredProjects.map((project) => (
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
                src={project.client?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"}
                alt={project.client?.name || "Client"}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{project.client?.name || "Client"}</p>
                <p className="text-xs text-muted-foreground">Client</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-secondary p-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deadline</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {project.deadline ? new Date(project.deadline).toLocaleDateString() : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="mt-1 text-sm font-medium text-accent">
                  {formatCurrency(project.budget.min)} - {formatCurrency(project.budget.max)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="mt-1 text-sm font-medium text-foreground">0%</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `0%` }}
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
  };

  const renderCompletedProjects = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      );
    }

    if (filteredProjects.length === 0) {
      return (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
            No completed projects
          </h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search query"
              : "You haven't completed any projects yet"}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {filteredProjects.map((project) => (
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
                src={project.client?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"}
                alt={project.client?.name || "Client"}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{project.client?.name || "Client"}</p>
                <p className="text-xs text-muted-foreground">Client</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-secondary p-4">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {project.completedAt ? new Date(project.completedAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Earned</p>
                <p className="mt-1 text-sm font-medium text-accent">
                  {formatCurrency(project.budget.min)} - {formatCurrency(project.budget.max)}
                </p>
              </div>
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
  };

  const renderCancelledProjects = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      );
    }

    if (filteredProjects.length === 0) {
      return (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <XCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
            No cancelled projects
          </h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search query"
              : "You don't have any cancelled projects"}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {filteredProjects.map((project) => (
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
                src={project.client?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"}
                alt={project.client?.name || "Client"}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{project.client?.name || "Client"}</p>
                <p className="text-xs text-muted-foreground">Client</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-secondary p-4">
              <p className="text-xs text-muted-foreground">Cancellation Date</p>
              <p className="mt-1 text-sm text-foreground">
                {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (authLoading || (loading && projects.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== "FREELANCER") {
    return null;
  }

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
            <Link href="/freelancer/jobs">
              <Button variant="accent" className="hidden sm:flex">
                <Briefcase className="mr-2 h-5 w-5" />
                Find New Work
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-6 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects by title, skills, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-xl border-border bg-card pl-12 pr-4 text-base shadow-sm"
              />
            </div>
            <Button type="submit" variant="accent" size="lg" className="px-8">
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <section className="container mx-auto px-4 pt-6">
          <Alert className="border-2 border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-semibold">
              {error}
            </AlertDescription>
          </Alert>
        </section>
      )}

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
                    {activeTab === "active" ? filteredProjects.length : 0}
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
                    {activeTab === "completed" ? filteredProjects.length : 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Banknote className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="font-display text-2xl font-bold text-foreground">Rs. 0</p>
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
