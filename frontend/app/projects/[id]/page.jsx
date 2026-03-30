"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SubmitProposalModal from "@/components/proposals/SubmitProposalModal";
import RatingDisplay from "@/components/reviews/RatingDisplay";
import ReviewCard from "@/components/reviews/ReviewCard";
import { useAuth } from "@/contexts/AuthContext";
import { getProjectById, getUserRatingStats, getReceivedReviews } from "@/lib/api";
import { 
  Clock,
  DollarSign,
  MapPin,
  Briefcase,
  AlertCircle,
  Calendar,
  Users,
  CheckCircle,
  Send,
  ArrowLeft,
  Star,
  Award,
  FileText
} from "lucide-react";

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [clientStats, setClientStats] = useState(null);
  const [clientReviews, setClientReviews] = useState([]);
  const [loadingClientData, setLoadingClientData] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      if (!params.id) return;

      try {
        setLoading(true);
        setError("");

        const response = await getProjectById(params.id);

        if (response.success) {
          setProject(response.project);
          // Load client data after project is loaded
          if (response.project.client?.id) {
            loadClientData(response.project.client.id);
          }
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

    fetchProject();
  }, [params.id]);

  // Load client rating stats and reviews
  const loadClientData = async (clientId) => {
    try {
      setLoadingClientData(true);
      
      const [statsResponse, reviewsResponse] = await Promise.all([
        getUserRatingStats(clientId),
        getReceivedReviews(clientId, { page: 1, limit: 5 })
      ]);

      if (statsResponse.success) {
        setClientStats(statsResponse.stats);
      }

      if (reviewsResponse.success) {
        setClientReviews(reviewsResponse.reviews || []);
      }
    } catch (err) {
      console.error("Error loading client data:", err);
    } finally {
      setLoadingClientData(false);
    }
  };

  const handleProposalSuccess = () => {
    // Refresh project to update hasApplied status
    if (params.id) {
      getProjectById(params.id).then(response => {
        if (response.success) {
          setProject(response.project);
        }
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar userType={user?.role?.toLowerCase()} />
        <div className="container mx-auto px-4 py-12">
          <Alert className="border-2 border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-semibold">
              {error || "Project not found"}
            </AlertDescription>
          </Alert>
          <Link href="/freelancer/jobs">
            <Button variant="outline" className="mt-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isFreelancer = user?.role === "FREELANCER";
  const isOwner = user?.id === project.client?.id;

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={user?.role?.toLowerCase()} />

      {/* Project Header */}
      <section className="border-b border-border bg-gradient-hero py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <Link href={isFreelancer ? "/freelancer/jobs" : "/client/projects"}>
              <Button variant="outline" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                  {project.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Posted {new Date(project.createdAt).toLocaleDateString()}
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

              <div className="rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
                {project.category}
              </div>
            </div>

            {/* Quick Action Buttons */}
            {isFreelancer && !isOwner && (
              <div className="flex flex-wrap gap-2 mt-4">
                {project.hasApplied ? (
                  <Alert className="border-2 border-green-200 bg-green-50 flex-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertDescription className="text-green-800 font-semibold">
                      You have already submitted a proposal
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowProposalModal(true)}
                      className="border-accent text-accent hover:bg-accent hover:text-white transition-colors"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit Proposal
                    </Button>
                    <Link href="/freelancer/proposals">
                      <Button variant="outline" size="sm" className="gap-2">
                        <FileText className="h-4 w-4" />
                        View Proposal
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}

            {isOwner && (
              <div className="mt-4">
                <Link href={`/client/projects/${project.id}`}>
                  <Button variant="accent" size="sm">
                    Manage Project
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Left Column - Project Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h2 className="font-display text-xl font-bold text-foreground mb-4">
                    Project Description
                  </h2>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {project.description}
                  </p>
                </div>

                {/* Skills Required */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h2 className="font-display text-xl font-bold text-foreground mb-4">
                    Skills Required
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {project.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-secondary px-4 py-2 text-sm text-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Milestones */}
                {project.milestones && project.milestones.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <h2 className="font-display text-xl font-bold text-foreground mb-4">
                      Project Milestones
                    </h2>
                    <div className="space-y-4">
                      {project.milestones.map((milestone, index) => (
                        <div key={milestone.id} className="border-l-4 border-accent pl-4">
                          <h3 className="font-semibold text-foreground">
                            {index + 1}. {milestone.title}
                          </h3>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {milestone.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-accent font-semibold">
                              ${milestone.amount.toLocaleString()}
                            </span>
                            {milestone.dueDate && (
                              <span className="text-muted-foreground">
                                Due: {new Date(milestone.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Project Info & Actions */}
              <div className="space-y-6">
                {/* Budget & Timeline */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-display text-lg font-bold text-foreground mb-4">
                    Project Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Budget</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-accent" />
                        <p className="font-semibold text-foreground">
                          ${project.budget.min.toLocaleString()} - ${project.budget.max.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {project.budget.type === "fixed_price" ? "Fixed Price" : "Hourly Rate"}
                      </p>
                    </div>

                    {project.duration && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Duration</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-accent" />
                          <p className="font-semibold text-foreground">{project.duration}</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Experience Level</p>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-accent" />
                        <p className="font-semibold text-foreground capitalize">
                          {project.experienceLevel.replace("_", " ")}
                        </p>
                      </div>
                    </div>

                    {project.deadline && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Deadline</p>
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-accent" />
                          <p className="font-semibold text-foreground">
                            {new Date(project.deadline).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Client Info - Enhanced */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-display text-lg font-bold text-foreground mb-4">
                    About the Client
                  </h3>
                  
                  <div className="flex items-center gap-3 mb-4">
                    {project.client.avatar ? (
                      <img
                        src={project.client.avatar}
                        alt={project.client.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                        <span className="text-accent font-semibold text-lg">
                          {project.client.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-foreground">{project.client.name}</p>
                      {project.client.company && (
                        <p className="text-sm text-muted-foreground">{project.client.company}</p>
                      )}
                    </div>
                  </div>

                  {project.client.location && (
                    <p className="text-sm text-muted-foreground mb-4">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      {project.client.location}
                    </p>
                  )}

                  {/* Client Rating */}
                  {loadingClientData ? (
                    <div className="py-4 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto"></div>
                    </div>
                  ) : clientStats && clientStats.totalReviews > 0 ? (
                    <div className="space-y-4 pt-4 border-t border-border">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                          <span className="text-2xl font-bold text-foreground">
                            {clientStats.averageRating.toFixed(1)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({clientStats.totalReviews} review{clientStats.totalReviews !== 1 ? 's' : ''})
                          </span>
                        </div>
                        
                        {/* Rating bars */}
                        <div className="space-y-1">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const count = clientStats[`rating${rating}Count`] || 0;
                            const percentage = clientStats.totalReviews > 0 
                              ? (count / clientStats.totalReviews) * 100 
                              : 0;
                            
                            return (
                              <div key={rating} className="flex items-center gap-2 text-xs">
                                <span className="w-8">{rating} ★</span>
                                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-yellow-400 transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="w-6 text-right text-muted-foreground">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recent Reviews */}
                      {clientReviews.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Award className="h-4 w-4 text-accent" />
                            Recent Reviews
                          </h4>
                          <div className="space-y-3">
                            {clientReviews.slice(0, showAllReviews ? clientReviews.length : 2).map((review) => (
                              <div key={review.id} className="bg-secondary/30 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 ${
                                          i < review.overallRating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground line-clamp-3">
                                  {review.feedback}
                                </p>
                                {review.reviewerName && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    - {review.reviewerName}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {clientReviews.length > 2 && (
                            <button
                              onClick={() => setShowAllReviews(!showAllReviews)}
                              className="text-sm text-accent hover:underline mt-2"
                            >
                              {showAllReviews ? 'Show less' : `Show all ${clientReviews.length} reviews`}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground pt-4 border-t border-border">
                      No reviews yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proposal Modal */}
      {showProposalModal && (
        <SubmitProposalModal
          project={project}
          onClose={() => setShowProposalModal(false)}
          onSuccess={handleProposalSuccess}
        />
      )}
    </div>
  );
}
