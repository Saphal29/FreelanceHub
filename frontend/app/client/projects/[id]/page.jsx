"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MilestoneManager from "@/components/milestones/MilestoneManager";
import ProposalList from "@/components/proposals/ProposalList";
import { useAuth } from "@/contexts/AuthContext";
import { getProjectById, deleteProject } from "@/lib/api";
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Calendar,
  MapPin,
  Users,
  Eye,
  FileText,
  AlertCircle,
  Edit,
  Trash2,
} from "lucide-react";
import Link from "next/link";

function ProjectDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id;
  const { user, loading: authLoading } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Refs for scrolling to sections
  const proposalsRef = useRef(null);
  const milestonesRef = useRef(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "CLIENT")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (projectId && user) {
      fetchProject();
    }
  }, [projectId, user]);

  // Handle scroll to section after page loads
  useEffect(() => {
    const scrollTo = searchParams.get('scrollTo');
    if (scrollTo && !loading && project) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        if (scrollTo === 'proposals' && proposalsRef.current) {
          proposalsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (scrollTo === 'milestones' && milestonesRef.current) {
          milestonesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, [searchParams, loading, project]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await getProjectById(projectId);
      
      if (response.success) {
        setProject(response.project);
      } else {
        setError(response.error || "Failed to load project");
      }
    } catch (err) {
      console.error("Error fetching project:", err);
      setError(err.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      
      const response = await deleteProject(projectId);
      
      if (response.success) {
        // Redirect to projects list after successful deletion
        router.push("/client/projects");
      } else {
        setError(response.error || "Failed to delete project");
      }
    } catch (err) {
      console.error("Error deleting project:", err);
      setError(err.message || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== "CLIENT") {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar userType="client" />
        <div className="container mx-auto px-4 py-8">
          <Alert className="border-2 border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-semibold">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const isOwner = project.client.id === user.id;
  
  // Debug: Log ownership check
  console.log('Ownership check:', {
    projectClientId: project.client.id,
    currentUserId: user.id,
    isOwner
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="client" />

      {/* Header */}
      <section className="border-b border-border bg-secondary/30 py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/client/projects"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Projects</span>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                {project.title}
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Posted on {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            {isOwner && (
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push(`/client/post-project?edit=${projectId}`)}
                  variant="outline"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
                </Button>
                {(project.status === "draft" || (project.status === "active" && project.proposalsCount === 0)) && (
                  <Button
                    onClick={handleDelete}
                    variant="outline"
                    disabled={deleting}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deleting ? (
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
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Details */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center font-display text-xl">
                  <FileText className="h-5 w-5 mr-2 text-accent" />
                  Project Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{project.description}</p>
                
                {project.skills && project.skills.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm text-accent"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Milestones */}
            <div ref={milestonesRef}>
              <MilestoneManager projectId={projectId} isOwner={isOwner} />
            </div>
            
            {/* Proposals */}
            {isOwner && (
              <div ref={proposalsRef}>
                <ProposalList 
                  projectId={projectId} 
                  onProposalAccepted={() => fetchProject()}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Project Info */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10">
                      <DollarSign className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="font-semibold text-foreground">
                        ${project.budget.min.toLocaleString()} - ${project.budget.max.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10">
                      <Briefcase className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Project Type</p>
                      <p className="font-semibold text-foreground capitalize">
                        {project.budget.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  
                  {project.duration && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10">
                        <Calendar className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-semibold text-foreground">{project.duration}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10">
                      <MapPin className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-semibold text-foreground">
                        {project.isRemote ? "Remote" : project.location || "Not specified"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10">
                      <Users className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Experience Level</p>
                      <p className="font-semibold text-foreground capitalize">
                        {project.experienceLevel.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10">
                      <Eye className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Views</p>
                      <p className="font-semibold text-foreground">{project.viewsCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Status */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      project.status === 'active' ? 'bg-green-100 text-green-700' :
                      project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      project.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                      project.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {project.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>{project.proposalsCount} proposals received</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProjectDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    }>
      <ProjectDetailsContent />
    </Suspense>
  );
}
