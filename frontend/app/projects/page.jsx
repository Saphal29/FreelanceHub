"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import EmptyState from "@/components/common/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { getProjects } from "@/lib/api";
import {
  AlertCircle,
  Search,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export default function ProjectsIndexPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [allProjects, setAllProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categories = ["ALL", "WEB & SOFTWARE", "MOBILE APPS", "DESIGN & UI", "BACKEND & API", "AI & DATA"];

  useEffect(() => {
    if (!authLoading) {
      fetchProjectsData();
    }
  }, [user, authLoading]);

  const fetchProjectsData = async () => {
    try {
      setLoading(true);
      setError("");

      const [allRes, myRes] = await Promise.all([
        getProjects({ status: "active", sortBy: "created_at", sortOrder: "DESC", limit: 50 }),
        user ? getProjects({ status: "in_progress", sortBy: "created_at", sortOrder: "DESC", limit: 50 }) : Promise.resolve({ success: true, projects: [] })
      ]);

      if (allRes.success) {
        setAllProjects(allRes.projects || []);
      } else {
        setError(allRes.error || "Could not load open project briefs.");
      }

      if (myRes.success) {
        setMyProjects(myRes.projects || []);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Network sync error while retrieving project briefs.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjectsData();
  };

  const filterList = (list) => {
    return list.filter((project) => {
      const matchesSearch = !searchQuery || 
        project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === "ALL" || 
        project.category?.toUpperCase()?.includes(selectedCategory.split(' ')[0]);

      return matchesSearch && matchesCategory;
    });
  };

  const filteredAllProjects = filterList(allProjects);
  const filteredMyProjects = filterList(myProjects);
  const activeProjectsList = activeTab === "all" ? filteredAllProjects : filteredMyProjects;

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType={user?.role?.toLowerCase() || "freelancer"} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-10 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* EDITORIAL HEADER */}
        <section className="space-y-4 text-left border-b border-[var(--ink)] pb-8">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
            <span>FREELANCEHUB DIRECTORY · OPEN PROJECT BRIEFS</span>
          </p>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="font-serif-ledger text-[38px] sm:text-[50px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
                Browse Open Briefs.
              </h1>
              <p className="text-[15px] text-[var(--muted)] max-w-xl">
                Explore verified project briefs, compare budgets in NPR, and submit custom proposals directly to clients across Nepal.
              </p>
            </div>

            {user?.role === 'CLIENT' && (
              <Link 
                href="/client/post-project" 
                className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-5 py-3 transition-colors inline-flex items-center space-x-2 shrink-0"
              >
                <span>Post a project brief →</span>
              </Link>
            )}
          </div>
        </section>

        {/* SEARCH & CATEGORY FILTERING */}
        <section className="space-y-4 text-left font-mono-ledger text-[12px]">
          
          {/* Search Input Bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Search open briefs by title, required skills, or scope..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--paper-2)] border border-[var(--ink)] py-3 pl-11 pr-4 text-[13px] text-[var(--ink)] placeholder-[var(--muted)] outline-none focus:border-[var(--signal)]"
              />
            </div>
            <button
              type="submit"
              className="bg-[var(--ink)] text-[var(--paper)] font-bold px-6 py-3 hover:bg-[var(--signal)] transition-colors uppercase text-[11px]"
            >
              Search briefs
            </button>
          </form>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-[var(--line)] pb-4">
            <span className="text-[var(--muted)] text-[10px] uppercase font-bold mr-2">CATEGORIES:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-[11px] border transition-colors ${
                  selectedCategory === cat
                    ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-bold"
                    : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--ink)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Navigation Tabs with Fixed Accurate Counts */}
          <div className="flex items-center space-x-6 border-b border-[var(--ink)] pb-2 text-[11px] uppercase">
            <button
              onClick={() => setActiveTab("all")}
              className={`pb-2 border-b-2 font-bold transition-colors ${
                activeTab === "all"
                  ? "border-[var(--signal)] text-[var(--signal)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              ALL BRIEFS ({filteredAllProjects.length})
            </button>
            {user && (
              <button
                onClick={() => setActiveTab("my")}
                className={`pb-2 border-b-2 font-bold transition-colors ${
                  activeTab === "my"
                    ? "border-[var(--signal)] text-[var(--signal)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                MY ACTIVE CONTRACTS ({filteredMyProjects.length})
              </button>
            )}
          </div>

        </section>

        {/* ERROR NOTIFICATION */}
        {error && (
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
              <span>{error}</span>
            </div>
            <button 
              onClick={fetchProjectsData}
              className="px-3 py-1 bg-[var(--signal)] text-[var(--paper)] font-bold text-[11px] uppercase hover:bg-[var(--signal-dark)] transition-colors"
            >
              Retry Sync
            </button>
          </div>
        )}

        {/* PROJECTS GRID / BRIEF SPECIMEN DIRECTORY */}
        <section className="space-y-6 text-left">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="border border-[var(--line)] bg-[var(--paper-2)] h-48 animate-pulse p-6 space-y-4">
                  <div className="h-4 bg-[var(--line)] w-1/3"></div>
                  <div className="h-6 bg-[var(--line)] w-3/4"></div>
                </div>
              ))}
            </div>
          ) : activeProjectsList.length === 0 ? (
            <EmptyState
              marker="PROJECT ARCHIVE"
              title="No project briefs found."
              description={searchQuery ? "No open projects matched your filter query. Try adjusting your search keywords." : "There are currently no active project briefs posted."}
              actionLabel={user?.role === 'CLIENT' ? "POST A PROJECT BRIEF →" : "CLEAR SEARCH FILTERS"}
              actionHref={user?.role === 'CLIENT' ? "/client/post-project" : null}
              onActionClick={!user || user.role !== 'CLIENT' ? () => { setSearchQuery(""); setSelectedCategory("ALL"); } : null}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {activeProjectsList.map((project) => (
                <div
                  key={project.id}
                  className="border border-[var(--ink)] bg-[var(--paper)] p-6 space-y-4 text-left hover:border-[var(--signal)] transition-colors flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    
                    {/* Specimen Header & Status */}
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5 font-mono-ledger text-[10px] uppercase">
                      <span className="text-[var(--signal)] font-bold flex items-center space-x-1">
                        <span>SPECIMEN / #{project.id?.slice(0, 6) || '0042'}</span>
                      </span>
                      <span className="text-[var(--ink)] font-bold">
                        [{project.status?.toUpperCase() || 'OPEN'}]
                      </span>
                    </div>

                    <h3 className="font-serif-ledger text-[22px] font-medium text-[var(--ink)] group-hover:text-[var(--signal)] transition-colors leading-snug">
                      <Link href={`/projects/${project.id}`}>
                        {project.title}
                      </Link>
                    </h3>

                    <p className="font-sans-ledger text-[13px] text-[var(--muted)] line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>

                    {project.skills && project.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 font-mono-ledger text-[10px]">
                        {project.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink)] font-bold"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-[var(--line)] font-mono-ledger text-[12px] space-y-3">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[10px] text-[var(--muted)] uppercase block">Budget (NPR)</span>
                        <span className="font-bold text-[var(--signal)] text-[16px]">
                          {formatCurrency(project.budget_min || project.budgetMin || 0)} - {formatCurrency(project.budget_max || project.budgetMax || 0)}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--muted)]">
                        [{project.project_type === 'hourly' ? 'HOURLY' : 'FIXED'}]
                      </span>
                    </div>

                    <Link
                      href={`/projects/${project.id}`}
                      className="w-full bg-[var(--ink)] group-hover:bg-[var(--signal)] text-[var(--paper)] font-bold text-[11px] uppercase tracking-wider py-2.5 px-4 text-center block transition-colors"
                    >
                      View brief & submit →
                    </Link>
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
          <span>FreelanceHub · Open Project Directory</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
