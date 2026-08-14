"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import EmptyState from "@/components/common/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { getProjects, getProjectCategories } from "@/lib/api";
import { Search, AlertCircle, Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export default function FindWorkPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isAuthorized, isLoading, UnauthorizedUI, LoadingUI } = useProtectedRoute('FREELANCER');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All jobs");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dbCategories, setDbCategories] = useState([]);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("DESC");
  
  const [filters, setFilters] = useState({
    budgetRanges: [],
    durations: [],
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getProjectCategories();
        if (response.success) {
          setDbCategories(response.categories || []);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (user && user.role === "FREELANCER") {
      fetchProjects();
    }
  }, [user, authLoading, selectedCategory, sortBy, sortOrder]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        status: "active",
        sortBy: sortBy,
        sortOrder: sortOrder,
        limit: 50
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (selectedCategory && selectedCategory !== "All jobs") {
        params.category = selectedCategory;
      }

      const response = await getProjects(params);

      if (response.success) {
        let fetchedProjects = response.projects || [];

        if (filters.budgetRanges.length > 0) {
          fetchedProjects = fetchedProjects.filter(p => {
            const bMin = p.budget_min || p.budgetMin || 0;
            const bMax = p.budget_max || p.budgetMax || Infinity;

            return filters.budgetRanges.some(range => {
              if (range === "Under Rs. 5,000") return bMax <= 5000;
              if (range === "Rs. 5,000 - Rs. 25,000") return bMax >= 5000 && bMin <= 25000;
              if (range === "Rs. 25,000 - Rs. 75,000") return bMax >= 25000 && bMin <= 75000;
              if (range === "Above Rs. 75,000") return bMin >= 75000;
              return true;
            });
          });
        }

        setProjects(fetchedProjects);
      } else {
        setError(response.error || "Failed to sync project briefs from ledger.");
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err.message || "Network error loading project directory.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      const currentValues = prev[filterType];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterType]: newValues };
    });
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All jobs");
    setSortBy("created_at");
    setSortOrder("DESC");
    setFilters({ budgetRanges: [], durations: [] });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  if (authLoading || isLoading) return <LoadingUI />;
  if (!isAuthorized) return <UnauthorizedUI />;

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType="freelancer" />

      {/* Main Container */}
      <main data-tour="jobs-list" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-8 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* EDITORIAL HEADER */}
        <section className="space-y-4 border-b border-[var(--ink)] pb-8">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
            <span>FREELANCEHUB DIRECTORY · OPEN PROJECT BRIEFS</span>
          </p>
          
          <div className="space-y-2">
            <h1 className="font-serif-ledger text-[38px] sm:text-[52px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
              Find Client Briefs.
            </h1>
            <p className="text-[15px] text-[var(--muted)] max-w-2xl">
              Discover verified project briefs, evaluate milestone budgets in Nepalese Rupees (NPR), and submit proposals directly to clients.
            </p>
          </div>
        </section>

        {/* ARCHETYPE E: THE ONE FILTER BAR */}
        <section className="border-y border-[var(--ink)] py-3 font-mono-ledger text-[11px] space-y-3">
          
          {/* Row 1: Search Bar with Neutral --ink Button */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Search by keywords, required skills, or brief title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-[var(--paper-2)] border border-[var(--ink)] p-2.5 text-[12px] text-[var(--ink)] placeholder:[var(--muted)] outline-none"
            />
            <button
              type="submit"
              className="bg-[var(--ink)] text-[var(--paper)] font-bold px-5 py-2.5 text-[11px] uppercase tracking-wider hover:bg-[var(--signal)] transition-colors shrink-0"
            >
              Search briefs
            </button>
          </form>

          {/* Row 2: Inline Category Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[var(--muted)] font-bold mr-1 uppercase">Category:</span>
              {["All jobs", ...dbCategories.map(c => c.name)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 border transition-colors ${
                    selectedCategory === cat
                      ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-bold"
                      : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--ink)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[var(--muted)] font-bold uppercase">Sort:</span>
              <select
                value={sortBy === "created_at" && sortOrder === "DESC" ? "newest" : "oldest"}
                onChange={(e) => {
                  if (e.target.value === "newest") { setSortBy("created_at"); setSortOrder("DESC"); }
                  else { setSortBy("created_at"); setSortOrder("ASC"); }
                }}
                className="bg-[var(--paper-2)] border border-[var(--ink)] px-2 py-1 text-[11px] font-mono-ledger outline-none"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>

        </section>

        {/* ERROR BANNER */}
        {error && (
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchProjects} className="px-3 py-1 bg-[var(--signal)] text-[var(--paper)] font-bold uppercase hover:bg-[var(--signal-dark)]">
              Retry sync
            </button>
          </div>
        )}

        {/* 2-COLUMN LAYOUT: BUDGET SIDEBAR & BRIEF ROWS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* SIDEBAR FILTERS */}
          <aside className="lg:col-span-3 space-y-4 font-mono-ledger text-[11px]">
            <div className="border border-[var(--ink)] bg-[var(--paper-2)] p-4 space-y-3">
              <span className="font-bold text-[var(--ink)] uppercase block border-b border-[var(--line)] pb-2">
                Budget Filter (NPR)
              </span>
              <div className="space-y-2 pt-1">
                {[
                  "Under Rs. 5,000",
                  "Rs. 5,000 - Rs. 25,000",
                  "Rs. 25,000 - Rs. 75,000",
                  "Above Rs. 75,000"
                ].map((range) => (
                  <label key={range} className="flex items-center space-x-2 cursor-pointer text-[11px] text-[var(--ink)]">
                    <input
                      type="checkbox"
                      checked={filters.budgetRanges.includes(range)}
                      onChange={() => handleFilterChange("budgetRanges", range)}
                      className="accent-[var(--signal)]"
                    />
                    <span>{range}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={fetchProjects}
                className="w-full py-2 bg-[var(--ink)] text-[var(--paper)] font-bold text-[11px] uppercase hover:bg-[var(--signal)] transition-colors mt-2"
              >
                Apply budget filter
              </button>
            </div>

            {(searchQuery || selectedCategory !== "All jobs" || filters.budgetRanges.length > 0) && (
              <button
                onClick={clearAllFilters}
                className="w-full py-2 border border-[var(--signal)] text-[var(--signal)] font-bold text-[11px] uppercase hover:bg-[var(--signal)] hover:text-[var(--paper)] transition-colors"
              >
                Clear all filters ×
              </button>
            )}
          </aside>

          {/* MAIN RESULTS STREAM */}
          <div className="lg:col-span-9 space-y-4">
            {loading ? (
              <div className="space-y-3 font-mono-ledger text-[12px] text-[var(--muted)] py-12 text-center border border-[var(--line)]">
                LOADING PROJECT BRIEFS...
              </div>
            ) : projects.length === 0 ? (
              <EmptyState
                marker="BRIEF DIRECTORY · STATUS: EMPTY"
                title="No matching project briefs found."
                description="Try adjusting your search query or category filter to discover available client briefs."
                actionLabel="Find open projects →"
                onActionClick={clearAllFilters}
              />
            ) : (
              <div className="border border-[var(--ink)] divide-y divide-[var(--line)] bg-[var(--paper)]">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-5 sm:p-6 space-y-3 hover:bg-[var(--paper-2)] transition-colors group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center space-x-2 font-mono-ledger text-[10px] uppercase">
                          <span className="text-[var(--signal)] font-bold">
                            SPECIMEN / #{project.id?.slice(0, 6) || '0042'}
                          </span>
                          <span>·</span>
                          <span className="text-[var(--muted)]">
                            {project.category || 'General Software'}
                          </span>
                        </div>

                        <h3 className="font-serif-ledger text-[20px] font-medium text-[var(--ink)] group-hover:text-[var(--signal)] transition-colors leading-snug">
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
                                className="px-2 py-0.5 bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink)]"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="sm:text-right space-y-2 shrink-0 font-mono-ledger text-[12px] border-t sm:border-t-0 sm:border-l border-[var(--line)] pt-3 sm:pt-0 sm:pl-6">
                        <span className="text-[var(--muted)] text-[10px] uppercase block">Budget (NPR)</span>
                        <div className="font-bold text-[var(--signal)] text-[16px]">
                          {formatCurrency(project.budget_min || project.budgetMin || 0)} - {formatCurrency(project.budget_max || project.budgetMax || 0)}
                        </div>
                        <span className="text-[10px] text-[var(--muted)] block">
                          [{project.project_type === 'hourly' ? 'HOURLY RATE' : 'FIXED PRICE'}]
                        </span>

                        <Link
                          href={`/projects/${project.id}`}
                          className="inline-block bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[11px] uppercase tracking-wider px-4 py-2 transition-colors mt-2"
                        >
                          Submit proposal →
                        </Link>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Job Directory Archetype E</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
