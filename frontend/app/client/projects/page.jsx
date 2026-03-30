"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { getMyProjects, updateProject, deleteProject } from "@/lib/api";
import { 
  Search, 
  Clock,
  DollarSign,
  MapPin,
  Filter,
  ChevronDown,
  Calendar,
  Users,
  Briefcase,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Send,
  MoreVertical
} from "lucide-react";

// Dummy project data (fallback)
const dummyProjects = [
  {
    id: "1",
    title: "E-commerce Website Development with React",
    description: "Looking for an experienced React developer to build a modern e-commerce platform with payment integration, product management, and user authentication.",
    budget: { min: 3000, max: 5000 },
    duration: "2-3 months",
    postedDate: "2 days ago",
    proposals: 12,
    category: "Web Development",
    skills: ["React", "Node.js", "MongoDB", "Stripe", "AWS"],
    experienceLevel: "Expert",
    projectType: "Fixed Price",
    client: {
      name: "TechStart Inc",
      location: "San Francisco, USA",
      jobsPosted: 15,
      hireRate: 87
    }
  },
  {
    id: "2",
    title: "Mobile App UI/UX Design for Fitness Platform",
    description: "Need a talented UI/UX designer to create modern, user-friendly designs for our fitness tracking mobile app. Must include wireframes and high-fidelity mockups.",
    budget: { min: 1500, max: 2500 },
    duration: "3-4 weeks",
    postedDate: "5 hours ago",
    proposals: 8,
    category: "Design",
    skills: ["Figma", "UI Design", "Mobile Design", "Prototyping"],
    experienceLevel: "Intermediate",
    projectType: "Fixed Price",
    client: {
      name: "FitLife Solutions",
      location: "New York, USA",
      jobsPosted: 8,
      hireRate: 92
    }
  },
  {
    id: "3",
    title: "SEO Optimization and Content Marketing Strategy",
    description: "Seeking an SEO expert to improve our website rankings and develop a comprehensive content marketing strategy. Must have proven track record.",
    budget: { min: 2000, max: 3500 },
    duration: "1-2 months",
    postedDate: "1 day ago",
    proposals: 15,
    category: "Marketing",
    skills: ["SEO", "Content Strategy", "Google Analytics", "Link Building"],
    experienceLevel: "Expert",
    projectType: "Fixed Price",
    client: {
      name: "Digital Growth Co",
      location: "London, UK",
      jobsPosted: 23,
      hireRate: 95
    }
  },
  {
    id: "4",
    title: "Python Data Analysis and Visualization Dashboard",
    description: "Need a data scientist to analyze sales data and create interactive dashboards using Python, Pandas, and visualization libraries.",
    budget: { min: 1000, max: 2000 },
    duration: "2-3 weeks",
    postedDate: "3 days ago",
    proposals: 10,
    category: "Data Science",
    skills: ["Python", "Pandas", "Data Visualization", "Tableau", "SQL"],
    experienceLevel: "Intermediate",
    projectType: "Fixed Price",
    client: {
      name: "Analytics Pro",
      location: "Toronto, Canada",
      jobsPosted: 12,
      hireRate: 88
    }
  },
  {
    id: "5",
    title: "WordPress Website Redesign and Optimization",
    description: "Looking to redesign our existing WordPress site with modern design, improve loading speed, and implement SEO best practices.",
    budget: { min: 800, max: 1500 },
    duration: "2-4 weeks",
    postedDate: "1 week ago",
    proposals: 18,
    category: "Web Development",
    skills: ["WordPress", "PHP", "CSS", "SEO", "Page Speed"],
    experienceLevel: "Intermediate",
    projectType: "Fixed Price",
    client: {
      name: "Small Business Hub",
      location: "Austin, USA",
      jobsPosted: 5,
      hireRate: 80
    }
  },
  {
    id: "6",
    title: "Social Media Content Creation and Management",
    description: "Need a creative content creator to manage our social media accounts, create engaging posts, and grow our online presence.",
    budget: { min: 500, max: 1000 },
    duration: "Ongoing",
    postedDate: "4 days ago",
    proposals: 22,
    category: "Marketing",
    skills: ["Social Media", "Content Creation", "Copywriting", "Canva", "Instagram"],
    experienceLevel: "Entry Level",
    projectType: "Hourly",
    client: {
      name: "Fashion Boutique",
      location: "Los Angeles, USA",
      jobsPosted: 3,
      hireRate: 75
    }
  }
];

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

  // Redirect if not authenticated or not a client
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "CLIENT")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch projects
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
          setError(response.error || "Failed to load projects");
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(err.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchProjects();
    }
  }, [user, authLoading, statusFilter]);

  // Handle publish draft
  const handlePublish = async (projectId) => {
    if (!confirm("Are you sure you want to publish this project? It will become visible to freelancers.")) {
      return;
    }

    try {
      setActionLoading({ ...actionLoading, [projectId]: "publishing" });
      setError("");
      setSuccessMessage("");

      const response = await updateProject(projectId, { status: "active" });

      if (response.success) {
        setSuccessMessage("Project published successfully!");
        // Update the project in the list
        setProjects(projects.map(p => 
          p.id === projectId ? { ...p, status: "active" } : p
        ));
        // Clear success message after 3 seconds
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

  // Handle delete project
  const handleDelete = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }

    try {
      setActionLoading({ ...actionLoading, [projectId]: "deleting" });
      setError("");
      setSuccessMessage("");

      const response = await deleteProject(projectId);

      if (response.success) {
        setSuccessMessage("Project deleted successfully!");
        // Remove the project from the list
        setProjects(projects.filter(p => p.id !== projectId));
        // Clear success message after 3 seconds
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

  // Filter projects by search query
  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.title.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query) ||
      project.skills.some((skill) => skill.toLowerCase().includes(query))
    );
  });
  
  console.log('Render state:', { 
    totalProjects: projects.length, 
    filteredProjects: filteredProjects.length,
    statusFilter,
    searchQuery 
  });

  if (authLoading || (loading && projects.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== "CLIENT") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="client" />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-hero py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
                My <span className="text-gradient-gold">Projects</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage your posted projects and track their progress
              </p>
            </div>

            {/* Search Bar */}
            <div className="w-full max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 w-full rounded-xl border-border bg-card pl-12 pr-4 text-base"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="border-b border-border bg-card py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant={statusFilter === "all" ? "accent" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button 
              variant={statusFilter === "draft" ? "accent" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter("draft")}
            >
              Draft
            </Button>
            <Button 
              variant={statusFilter === "active" ? "accent" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter("active")}
            >
              Active
            </Button>
            <Button 
              variant={statusFilter === "in_progress" ? "accent" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter("in_progress")}
            >
              In Progress
            </Button>
            <Button 
              variant={statusFilter === "completed" ? "accent" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter("completed")}
            >
              Completed
            </Button>
            <Button 
              variant={statusFilter === "cancelled" ? "accent" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter("cancelled")}
            >
              Cancelled
            </Button>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Error Message */}
          {error && (
            <Alert className="mb-6 border-2 border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800 font-semibold">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {successMessage && (
            <Alert className="mb-6 border-2 border-green-200 bg-green-50">
              <AlertCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800 font-semibold">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredProjects.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
                No projects found
              </h3>
              <p className="mt-2 text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Get started by posting your first project"}
              </p>
              {!searchQuery && (
                <Link href="/client/post-project">
                  <Button variant="accent" className="mt-6">
                    <Plus className="h-4 w-4 mr-2" />
                    Post a Project
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Projects List */}
          <div className="space-y-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-xl"
              >
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/client/projects/${project.id}`}>
                      <h3 className="font-display text-xl font-bold text-foreground hover:text-accent transition-colors mb-2 cursor-pointer">
                        {project.title}
                      </h3>
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                      {project.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {project.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {project.proposalsCount} proposal{project.proposalsCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <div className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
                      {project.category}
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-medium ${
                      project.status === "active" ? "bg-green-100 text-green-700" :
                      project.status === "draft" ? "bg-gray-100 text-gray-700" :
                      project.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                      project.status === "completed" ? "bg-purple-100 text-purple-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {project.status.replace("_", " ").toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="mb-4 text-muted-foreground line-clamp-2">
                  {project.description}
                </p>

                {/* Skills */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {project.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-secondary px-3 py-1 text-xs text-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="font-semibold text-foreground">
                          ${project.budget.min.toLocaleString()} - ${project.budget.max.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {project.duration && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Duration</p>
                          <p className="font-semibold text-foreground">{project.duration}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Experience</p>
                        <p className="font-semibold text-foreground capitalize">
                          {project.experienceLevel.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {/* Show different buttons based on status */}
                    {project.status === "draft" ? (
                      <>
                        <Button
                          variant="accent"
                          onClick={() => handlePublish(project.id)}
                          disabled={actionLoading[project.id] === "publishing"}
                        >
                          {actionLoading[project.id] === "publishing" ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Publishing...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Publish
                            </>
                          )}
                        </Button>
                        <Link href={`/client/post-project?edit=${project.id}`}>
                          <Button variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          onClick={() => handleDelete(project.id)}
                          disabled={actionLoading[project.id] === "deleting"}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {actionLoading[project.id] === "deleting" ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link href={`/client/projects/${project.id}`}>
                          <Button variant="outline">
                            View Details
                          </Button>
                        </Link>
                        {(project.status === "active" || project.status === "in_progress") && (
                          <Link href={`/client/post-project?edit=${project.id}`}>
                            <Button variant="accent">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </Link>
                        )}
                        {project.status === "active" && project.proposalsCount === 0 && (
                          <Button
                            variant="outline"
                            onClick={() => handleDelete(project.id)}
                            disabled={actionLoading[project.id] === "deleting"}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {actionLoading[project.id] === "deleting" ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </>
                            )}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
