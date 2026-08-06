"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import EmptyState from "@/components/common/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { getMyProjects, updateProject, deleteProject } from "@/lib/api";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export default function BrowseProjectsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "CLIENT")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user || user.role !== "CLIENT") return;

      try {
        setLoading(true);
        setError("");

        const params = {};
        if (statusFilter !== "all") {
          params.status = statusFilter;
        }

        const response = await getMyProjects(params);

        if (response.success) {
          setProjects(response.projects || []);
        } else {
          setError(response.error || "Failed to load project register.");
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(err.message || "Failed to load project register.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchProjects();
    }
  }, [user, authLoading, statusFilter]);

  const handlePublish = async (projectId) => {
    if (!confirm("Are you sure you want to publish this project? It will become visible to freelancers.")) return;

    try {
      setActionLoading({ ...actionLoading, [projectId]: "publishing" });
      setError("");
      setSuccessMessage("");

      const response = await updateProject(projectId, { status: "active" });

      if (response.success) {
        setSuccessMessage("Project published successfully!");
        setProjects(projects.map(p => 
          p.id === projectId ? { ...p, status: "active" } : p
        ));
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(response.error || "Failed to publish project");
      }
    } catch (err) {
      console.error("Error publishing project:", err);
      setError(err.message || "Failed to publish project");
    } finally {
      setActionLoading({ ...actionLoading, [projectId]: null });
    }
  };

  const handleDelete = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;

    try {
      setActionLoading({ ...actionLoading, [projectId]: "deleting" });
      setError("");
      setSuccessMessage("");

      const response = await deleteProject(projectId);

      if (response.success) {
        setSuccessMessage("Project deleted successfully!");
        setProjects(projects.filter(p => p.id !== projectId));
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(response.error || "Failed to delete project");
      }
    } catch (err) {
      console.error("Error deleting project:", err);
      setError(err.message || "Failed to delete project");
    } finally {
      setActionLoading({ ...actionLoading, [projectId]: null });
    }
  };

  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.title?.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      project.skills?.some((skill) => skill.toLowerCase().includes(query))
    );
  });

  if (authLoading || (loading && projects.length === 0)) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger">
        <p className="text-[12px] text-[var(--muted)] uppercase">LOADING CLIENT REGISTER...</p>
      </div>
    );
  }

  if (!user || user.role !== "CLIENT") return null;

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType="client" />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-8 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* EDITORIAL HEADER */}
        <section className="space-y-4 border-b border-[var(--ink)] pb-8">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
            <span>FREELANCEHUB REGISTER · CLIENT PROJECTS</span>
          </p>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="font-serif-ledger text-[38px] sm:text-[50px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
                My Projects.
              </h1>
              <p className="text-[15px] text-[var(--muted)] max-w-xl">
                Manage your posted project briefs, track incoming freelancer proposals, and publish draft specifications.
              </p>
            </div>

            <Link 
              href="/client/post-project" 
              className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-5 py-3 transition-colors inline-flex items-center space-x-2 shrink-0"
            >
              <span>Post a project brief →</span>
            </Link>
          </div>
        </section>

        {/* ARCHETYPE E: THE ONE FILTER BAR */}
        <section className="border-y border-[var(--ink)] py-3 font-mono-ledger text-[11px] space-y-3">
          
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <input
              type="text"
              placeholder="Search posted project briefs by title or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-[var(--paper-2)] border border-[var(--ink)] p-2.5 text-[12px] text-[var(--ink)] placeholder:[var(--muted)] outline-none"
            />
          </form>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[var(--muted)] font-bold mr-2 uppercase">Status:</span>
              {[
                { id: "all", label: "All" },
                { id: "draft", label: "Draft" },
                { id: "active", label: "Active" },
                { id: "in_progress", label: "In progress" },
                { id: "completed", label: "Completed" },
                { id: "cancelled", label: "Cancelled" }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setStatusFilter(t.id)}
                  className={`px-3 py-1.5 border transition-colors ${
                    statusFilter === t.id
                      ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-bold"
                      : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--ink)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="text-[var(--muted)] text-[11px]">
              Showing {filteredProjects.length} project record{filteredProjects.length === 1 ? '' : 's'}
            </div>
          </div>

        </section>

        {/* NOTIFICATIONS */}
        {error && (
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-[var(--paper-2)] border border-[var(--signal)] text-[var(--ink)] font-mono-ledger text-[12px] flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
        )}

        {/* CLIENT PROJECTS ROWS */}
        <section className="space-y-4">
          {loading ? (
            <div className="space-y-3 font-mono-ledger text-[12px] text-[var(--muted)] py-12 text-center border border-[var(--line)]">
              LOADING PROJECT REGISTER...
            </div>
          ) : filteredProjects.length === 0 ? (
            <EmptyState
              marker="CLIENT REGISTER · STATUS: EMPTY"
              title="No project briefs found."
              description="Get started by posting your first project brief to receive proposals from verified talent across Nepal."
              actionLabel="Post a project brief →"
              actionHref="/client/post-project"
            />
          ) : (
            <div className="border border-[var(--ink)] divide-y divide-[var(--line)] bg-[var(--paper)]">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-5 sm:p-6 space-y-3 hover:bg-[var(--paper-2)] transition-colors text-left group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono-ledger text-[11px]">
                    <span className="text-[var(--signal)] font-bold">
                      PROJECT / #{project.id?.slice(0, 8) || '0001'}
                    </span>

                    <div className="flex items-center space-x-2">
                      <span className="text-[var(--muted)]">Proposals: {project.proposalsCount || 0}</span>
                      <span>·</span>
                      <span className="text-[var(--ink)] font-bold">
                        [{project.status?.replace("_", " ")?.toUpperCase() || 'DRAFT'}]
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-1 max-w-2xl">
                      <Link href={`/client/projects/${project.id}`}>
                        <h3 className="font-serif-ledger text-[20px] font-medium text-[var(--ink)] leading-snug group-hover:text-[var(--signal)] transition-colors">
                          {project.title}
                        </h3>
                      </Link>

                      <p className="font-sans-ledger text-[13px] text-[var(--muted)] line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    <div className="font-mono-ledger text-left lg:text-right shrink-0 space-y-0.5">
                      <span className="text-[10px] text-[var(--muted)] uppercase block">Budget (NPR)</span>
                      <span className="text-[22px] font-bold text-[var(--signal)] block">
                        {formatCurrency(project.budget?.min || 0)} - {formatCurrency(project.budget?.max || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--line)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono-ledger text-[11px]">
                    <span className="text-[var(--muted)] text-[10px]">
                      Posted: {new Date(project.createdAt || Date.now()).toLocaleDateString()}
                    </span>

                    <div className="flex items-center space-x-4">
                      <Link
                        href={`/client/post-project?edit=${project.id}`}
                        className="text-[var(--ink)] font-bold hover:text-[var(--signal)] underline"
                      >
                        Edit specification →
                      </Link>

                      {project.status === "draft" && (
                        <button
                          onClick={() => handlePublish(project.id)}
                          disabled={actionLoading[project.id] === "publishing"}
                          className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold px-3 py-1.5 text-[11px] uppercase transition-colors"
                        >
                          {actionLoading[project.id] === "publishing" ? "Publishing..." : "Publish brief →"}
                        </button>
                      )}

                      {(project.status === "draft" || (project.status === "active" && project.proposalsCount === 0)) && (
                        <button
                          onClick={() => handleDelete(project.id)}
                          disabled={actionLoading[project.id] === "deleting"}
                          className="text-[var(--signal)] font-bold hover:underline"
                        >
                          {actionLoading[project.id] === "deleting" ? "Deleting..." : "Delete project"}
                        </button>
                      )}
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
          <span>FreelanceHub · Client Projects Archetype E</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
