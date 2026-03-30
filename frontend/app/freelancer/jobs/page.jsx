"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import JobCard from "@/components/cards/JobCard";
import { useAuth } from "@/contexts/AuthContext";
import { getProjects, getProjectCategories } from "@/lib/api";
import {
  Search,
  Filter,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  Star,
  TrendingUp,
  AlertCircle,
} from "lucide-react";



export default function FindWorkPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Jobs");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryCounts, setCategoryCounts] = useState({});
  const [dbCategories, setDbCategories] = useState([]);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("DESC");
  
  // Filter states
  const [filters, setFilters] = useState({
    budgetRanges: [],
    durations: [],
  });

  // Build categories list with counts
  const categories = [
    { name: "All Jobs", count: categoryCounts["All Jobs"] || 0 },
    ...dbCategories.map(cat => ({
      name: cat.name,
      count: categoryCounts[cat.name] || 0
    }))
  ];

  // Redirect if not authenticated or not a freelancer
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "FREELANCER")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Load categories from database
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

  // Fetch projects
  useEffect(() => {
    fetchProjects();
  }, [user, authLoading, selectedCategory, sortBy, sortOrder]);

  const fetchProjects = async () => {
    if (!user || user.role !== "FREELANCER") return;

    try {
      setLoading(true);
      setError("");

      const params = {
        status: "active", // Only show active projects
        sortBy: sortBy,
        sortOrder: sortOrder,
        limit: 50
      };

      // Add search query
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add category filter
      if (selectedCategory && selectedCategory !== "All Jobs") {
        params.category = selectedCategory;
      }

      // Add budget filters
      if (filters.budgetRanges.length > 0) {
        // Find the min and max from selected ranges
        let minBudget = Infinity;
        let maxBudget = 0;
        
        filters.budgetRanges.forEach(range => {
          if (range === "Under $1,000") {
            minBudget = Math.min(minBudget, 0);
            maxBudget = Math.max(maxBudget, 1000);
          } else if (range === "$1,000 - $3,000") {
            minBudget = Math.min(minBudget, 1000);
            maxBudget = Math.max(maxBudget, 3000);
          } else if (range === "$3,000 - $5,000") {
            minBudget = Math.min(minBudget, 3000);
            maxBudget = Math.max(maxBudget, 5000);
          } else if (range === "$5,000 - $10,000") {
            minBudget = Math.min(minBudget, 5000);
            maxBudget = Math.max(maxBudget, 10000);
          } else if (range === "Above $10,000") {
            minBudget = Math.min(minBudget, 10000);
            maxBudget = Math.max(maxBudget, 1000000);
          }
        });
        
        if (minBudget !== Infinity) params.budgetMin = minBudget;
        if (maxBudget !== 0) params.budgetMax = maxBudget;
      }

      // Add duration filter (client-side filtering since backend doesn't support it)

      const response = await getProjects(params);

      if (response.success) {
        let fetchedProjects = response.projects || [];
        
        // Apply duration filter client-side
        if (filters.durations.length > 0) {
          fetchedProjects = fetchedProjects.filter(project => {
            const duration = project.duration?.toLowerCase() || "";
            
            return filters.durations.some(selectedDuration => {
              if (selectedDuration === "Less than 1 month") {
                return duration.includes("week") || 
                       duration.includes("1 week") || 
                       duration.includes("2 week") || 
                       duration.includes("3 week") ||
                       duration.includes("4 week");
              } else if (selectedDuration === "1-3 months") {
                return duration.includes("1 month") || 
                       duration.includes("2 month") || 
                       duration.includes("3 month") ||
                       duration.includes("1-2 month") ||
                       duration.includes("2-3 month");
              } else if (selectedDuration === "3-6 months") {
                return duration.includes("3 month") || 
                       duration.includes("4 month") || 
                       duration.includes("5 month") || 
                       duration.includes("6 month") ||
                       duration.includes("3-6 month") ||
                       duration.includes("4-6 month");
              } else if (selectedDuration === "More than 6 months") {
                return duration.includes("6 month") || 
                       duration.includes("7 month") || 
                       duration.includes("8 month") ||
                       duration.includes("9 month") ||
                       duration.includes("year") ||
                       duration.includes("ongoing");
              }
              return false;
            });
          });
        }
        
        setProjects(fetchedProjects);
        
        // Calculate category counts dynamically based on fetched projects
        const counts = {};
        
        counts["All Jobs"] = fetchedProjects.length;
        
        // Count projects for each database category
        dbCategories.forEach(cat => {
          counts[cat.name] = fetchedProjects.filter(p => p.category === cat.name).length;
        });
        
        setCategoryCounts(counts);
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

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      const currentValues = prev[filterType];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [filterType]: newValues
      };
    });
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All Jobs");
    setSortBy("created_at");
    setSortOrder("DESC");
    setFilters({
      budgetRanges: [],
      durations: [],
    });
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    
    switch (value) {
      case "newest":
        setSortBy("created_at");
        setSortOrder("DESC");
        break;
      case "oldest":
        setSortBy("created_at");
        setSortOrder("ASC");
        break;
      case "highest_budget":
        setSortBy("budget_max");
        setSortOrder("DESC");
        break;
      case "lowest_budget":
        setSortBy("budget_min");
        setSortOrder("ASC");
        break;
      default:
        setSortBy("created_at");
        setSortOrder("DESC");
    }
  };

  const applyFilters = () => {
    fetchProjects();
  };

  // Convert projects to job format for JobCard
  const jobs = projects.map((project) => ({
    title: project.title,
    description: project.description,
    budget: `$${project.budget.min.toLocaleString()} - $${project.budget.max.toLocaleString()}`,
    duration: project.duration || "Not specified",
    location: project.isRemote ? "Remote" : (project.location || "Not specified"),
    skills: project.skills || [],
    postedAt: new Date(project.createdAt).toLocaleDateString(),
    proposals: project.proposalsCount || 0,
    projectId: project.id,
  }));

  // Filter jobs based on search query
  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.description.toLowerCase().includes(query) ||
      job.skills.some((skill) => skill.toLowerCase().includes(query))
    );
  });

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProjects();
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
      <section className="border-b border-border bg-gradient-hero py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Find Work
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Discover opportunities that match your skills and expertise
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-6 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for jobs, skills, or keywords..."
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

      {/* Stats Bar */}
      <section className="border-b border-border bg-secondary/30 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-accent" />
              <span className="font-medium text-foreground">{filteredJobs.length} Jobs Available</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="font-medium text-foreground">
                {projects.filter(p => {
                  const hoursSinceCreated = (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60);
                  return hoursSinceCreated < 24;
                }).length} New Today
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" />
              <span className="font-medium text-foreground">Best Match for You</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Categories */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 flex items-center font-display text-lg font-semibold text-foreground">
                  <Filter className="mr-2 h-5 w-5 text-accent" />
                  Categories
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => {
                        setSelectedCategory(category.name);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                        selectedCategory === category.name
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      <span>{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Filter */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 flex items-center font-display text-lg font-semibold text-foreground">
                  <DollarSign className="mr-2 h-5 w-5 text-accent" />
                  Budget Range
                </h3>
                <div className="space-y-2">
                  {[
                    "Under $1,000",
                    "$1,000 - $3,000",
                    "$3,000 - $5,000",
                    "$5,000 - $10,000",
                    "Above $10,000",
                  ].map((range) => (
                    <label
                      key={range}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
                    >
                      <input
                        type="checkbox"
                        checked={filters.budgetRanges.includes(range)}
                        onChange={() => handleFilterChange("budgetRanges", range)}
                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                      />
                      <span>{range}</span>
                    </label>
                  ))}
                </div>
                <Button 
                  onClick={applyFilters} 
                  variant="accent" 
                  size="sm" 
                  className="w-full mt-3"
                  disabled={loading}
                >
                  Apply Budget Filter
                </Button>
              </div>

              {/* Duration Filter */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 flex items-center font-display text-lg font-semibold text-foreground">
                  <Clock className="mr-2 h-5 w-5 text-accent" />
                  Project Duration
                </h3>
                <div className="space-y-2">
                  {["Less than 1 month", "1-3 months", "3-6 months", "More than 6 months"].map(
                    (duration) => (
                      <label
                        key={duration}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
                      >
                        <input
                          type="checkbox"
                          checked={filters.durations.includes(duration)}
                          onChange={() => handleFilterChange("durations", duration)}
                          className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                        />
                        <span>{duration}</span>
                      </label>
                    )
                  )}
                </div>
                <Button 
                  onClick={applyFilters} 
                  variant="accent" 
                  size="sm" 
                  className="w-full mt-3"
                  disabled={loading}
                >
                  Apply Duration Filter
                </Button>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-3">
            {/* Error Message */}
            {error && (
              <Alert className="mb-6 border-2 border-red-200 bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-800 font-semibold">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filteredJobs.length}</span> jobs
                </p>
                {(searchQuery || selectedCategory !== "All Jobs" || filters.budgetRanges.length > 0 || filters.durations.length > 0) && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
              <select 
                onChange={handleSortChange}
                value={
                  sortBy === "created_at" && sortOrder === "DESC" ? "newest" :
                  sortBy === "created_at" && sortOrder === "ASC" ? "oldest" :
                  sortBy === "budget_max" && sortOrder === "DESC" ? "highest_budget" :
                  sortBy === "budget_min" && sortOrder === "ASC" ? "lowest_budget" :
                  "newest"
                }
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest_budget">Highest Budget</option>
                <option value="lowest_budget">Lowest Budget</option>
              </select>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
              </div>
            )}

            {/* Jobs List */}
            <div className="space-y-6">
              {filteredJobs.map((job, index) => (
                <div
                  key={index}
                  className="animate-fade-up opacity-0"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <JobCard {...job} />
                </div>
              ))}
            </div>

            {!loading && filteredJobs.length === 0 && (
              <div className="rounded-2xl border border-border bg-card p-12 text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
                  No jobs found
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Try adjusting your search or filters to find more opportunities
                </p>
                <Button
                  onClick={clearAllFilters}
                  variant="accent"
                  className="mt-6"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
