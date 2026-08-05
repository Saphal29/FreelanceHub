"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CommandRail from "@/components/layout/CommandRail";
import SubmitProposalModal from "@/components/proposals/SubmitProposalModal";
import { useAuth } from "@/contexts/AuthContext";
import { getProjectById, getUserRatingStats, getReceivedReviews } from "@/lib/api";
import { 
  Clock,
  Banknote,
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
import { formatCurrency } from "@/lib/currency";

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
      if (!params?.id) return;

      try {
        setLoading(true);
        setError("");

        const response = await getProjectById(params.id);

        if (response.success) {
          setProject(response.project);
          if (response.project?.client?.id) {
            loadClientData(response.project.client.id);
          }
        } else {
          setError(response.error || "Failed to load project brief");
        }
      } catch (err) {
        console.error("Error fetching project brief:", err);
        setError("Network error while retrieving project brief.");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [params?.id]);

  // Load client rating stats & reviews
  const loadClientData = async (clientId) => {
    try {
      setLoadingClientData(true);
      
      const [statsResponse, reviewsResponse] = await Promise.allSettled([
        getUserRatingStats(clientId),
        getReceivedReviews(clientId, { page: 1, limit: 5 })
      ]);

      if (statsResponse.status === 'fulfilled' && statsResponse.value?.success) {
        setClientStats(statsResponse.value.stats);
      }

      if (reviewsResponse.status === 'fulfilled' && reviewsResponse.value?.success) {
        setClientReviews(reviewsResponse.value.reviews || []);
      }
    } catch (err) {
      console.error("Error loading client data:", err);
    } finally {
      setLoadingClientData(false);
    }
  };

  const handleProposalSuccess = () => {
    if (params?.id) {
      getProjectById(params.id).then(response => {
        if (response.success) {
          setProject(response.project);
        }
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger">
        <div className="space-y-3 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--signal)] mx-auto"></div>
          <p className="text-[12px] text-[var(--muted)] uppercase">LOADING PROJECT BRIEF SPECIMEN...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger">
        <Navbar userType={user?.role?.toLowerCase() || "freelancer"} />
        <CommandRail userType={user?.role?.toLowerCase() || "freelancer"} />
        <main className="max-w-4xl mx-auto px-4 py-16 space-y-6 text-left">
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px]">
            {error || "Project brief specimen not found."}
          </div>
          <Link 
            href="/projects" 
            className="inline-flex items-center space-x-2 bg-[var(--ink)] text-[var(--paper)] font-mono-ledger text-[12px] font-bold px-5 py-2.5 uppercase hover:bg-[var(--signal)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>RETURN TO BRIEF DIRECTORY</span>
          </Link>
        </main>
      </div>
    );
  }

  const isFreelancer = user?.role === "FREELANCER" || !user;
  const isOwner = user?.id === project.client?.id;

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType={user?.role?.toLowerCase() || "freelancer"} />

      {/* Floating Tool Rail */}
      <CommandRail userType={user?.role?.toLowerCase() || "freelancer"} />

      {/* Main Specimen Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 lg:pl-20 py-8 sm:py-12 space-y-10 flex-1 w-full pb-24 lg:pb-12">
        
        {/* SPECIMEN HEADER */}
        <section className="space-y-4 text-left border-b border-[var(--ink)] pb-8">
          
          <div className="flex items-center justify-between font-mono-ledger text-[11px] uppercase tracking-wider">
            <Link 
              href="/projects" 
              className="text-[var(--muted)] hover:text-[var(--ink)] flex items-center space-x-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>PROJECT DIRECTORY</span>
            </Link>
            <span className="text-[var(--signal)] font-bold">
              SPECIMEN / #{project.id?.slice(0, 8) || '0001'}
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="font-serif-ledger text-[34px] sm:text-[48px] leading-[1.1] font-medium tracking-tight text-[var(--ink)]">
              {project.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 font-mono-ledger text-[11px] text-[var(--muted)] border-t border-[var(--line)] pt-3">
              <span>POSTED: {new Date(project.createdAt || project.created_at || Date.now()).toLocaleDateString()}</span>
              <span>•</span>
              <span>CATEGORY: <strong className="text-[var(--ink)]">{project.category || 'Engineering'}</strong></span>
              <span>•</span>
              <span>PROPOSALS: <strong className="text-[var(--signal)]">{project.proposalsCount || 0} BIDS RECEIVED</strong></span>
              {project.location && (
                <>
                  <span>•</span>
                  <span>LOCATION: {project.location}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Proposal Action Strip */}
          {isFreelancer && !isOwner && (
            <div className="pt-2 font-mono-ledger text-[12px]">
              {project.hasApplied ? (
                <div className="p-3 bg-green-50 border border-green-600 text-green-800 font-bold flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                  <span>PROPOSAL SUBMITTED ON RECORD</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowProposalModal(true)}
                  className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider px-6 py-3 transition-colors inline-flex items-center space-x-2 shadow-xs"
                >
                  <Send className="h-4 w-4" />
                  <span>SUBMIT PROPOSAL BRIEF →</span>
                </button>
              )}
            </div>
          )}

          {isOwner && (
            <div className="pt-2 font-mono-ledger text-[12px]">
              <Link 
                href={`/client/projects/${project.id}`}
                className="bg-[var(--ink)] text-[var(--paper)] font-bold px-6 py-3 uppercase hover:bg-[var(--signal)] transition-colors inline-block"
              >
                MANAGE PROJECT BRIEF & BIDS →
              </Link>
            </div>
          )}

        </section>


        {/* ASYMMETRIC 2-COLUMN SPECIMEN LAYOUT (70% Brief / 30% Client Record) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start text-left">
          
          {/* Left Column (70% Width: Cols 1 to 8) - PROJECT SPECIMEN SHEET */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* 01 / PROJECT SCOPE & OBJECTIVES */}
            <div className="space-y-4">
              <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider font-bold text-[var(--ink)]">
                01 / PROJECT SCOPE & OBJECTIVES
              </div>
              <div className="font-sans-ledger text-[15px] leading-relaxed text-[var(--ink)] whitespace-pre-wrap">
                {project.description}
              </div>
            </div>

            {/* 02 / REQUIRED TECHNICAL SKILLS */}
            {project.skills && project.skills.length > 0 && (
              <div className="space-y-4">
                <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider font-bold text-[var(--ink)]">
                  02 / REQUIRED TECHNICAL SKILLS
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="font-mono-ledger text-[11px] uppercase px-3 py-1.5 bg-[var(--paper-2)] border border-[var(--ink)] text-[var(--ink)] font-bold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 03 / PROJECT MILESTONES */}
            {project.milestones && project.milestones.length > 0 && (
              <div className="space-y-4">
                <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider font-bold text-[var(--ink)]">
                  03 / PROJECT MILESTONES & SCHEDULE
                </div>
                <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] divide-y divide-[var(--line)] font-mono-ledger text-[12px]">
                  {project.milestones.map((milestone, index) => (
                    <div key={milestone.id || index} className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between font-bold">
                        <span>{index + 1}. {milestone.title}</span>
                        <span className="text-[var(--signal)]">NPR {milestone.amount?.toLocaleString()}</span>
                      </div>
                      {milestone.description && (
                        <p className="font-sans-ledger text-[13px] text-[var(--muted)]">
                          {milestone.description}
                        </p>
                      )}
                      {milestone.dueDate && (
                        <p className="text-[10px] text-[var(--muted)] uppercase">
                          DUE DATE: {new Date(milestone.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Action CTA */}
            {isFreelancer && !isOwner && !project.hasApplied && (
              <div className="pt-6 border-t border-[var(--ink)] space-y-3 font-mono-ledger">
                <h4 className="font-serif-ledger text-[20px] font-medium text-[var(--ink)]">
                  Ready to submit your proposal?
                </h4>
                <p className="text-[13px] text-[var(--muted)]">
                  Include your rate estimate in NPR, delivery timeline, and portfolio specimens to stand out to the client.
                </p>
                <button
                  onClick={() => setShowProposalModal(true)}
                  className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider px-6 py-3.5 transition-colors inline-flex items-center space-x-2 shadow-xs"
                >
                  <Send className="h-4 w-4" />
                  <span>SUBMIT PROPOSAL BRIEF →</span>
                </button>
              </div>
            )}

          </div>


          {/* Right Column (30% Width: Cols 9 to 12) - BRIEF DETAILS & CLIENT RECORD */}
          <div className="lg:col-span-4 space-y-8 font-mono-ledger text-[12px]">
            
            {/* SPECIMEN DETAILS */}
            <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 space-y-4">
              <div className="border-b border-[var(--ink)] pb-2 text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>BRIEF SPECIFICATIONS</span>
                <span className="text-[var(--signal)]">[DETAILS]</span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[var(--muted)] text-[10px] uppercase block">BUDGET RANGE (NPR)</span>
                  <span className="font-bold text-[16px] text-[var(--signal)]">
                    NPR {project.budget?.min?.toLocaleString() || project.budget_min?.toLocaleString() || 'Agreed'} - {project.budget?.max?.toLocaleString() || project.budget_max?.toLocaleString() || 'Agreed'}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] block">
                    {project.budget?.type === "fixed_price" ? "Fixed Price Contract" : "Hourly Rate Contract"}
                  </span>
                </div>

                {project.duration && (
                  <div className="border-t border-[var(--line)] pt-2">
                    <span className="text-[var(--muted)] text-[10px] uppercase block">DURATION</span>
                    <span className="font-bold text-[var(--ink)]">{project.duration}</span>
                  </div>
                )}

                {project.experienceLevel && (
                  <div className="border-t border-[var(--line)] pt-2">
                    <span className="text-[var(--muted)] text-[10px] uppercase block">EXPERIENCE LEVEL</span>
                    <span className="font-bold text-[var(--ink)] capitalize">
                      {project.experienceLevel.replace("_", " ")}
                    </span>
                  </div>
                )}

                {project.deadline && (
                  <div className="border-t border-[var(--line)] pt-2">
                    <span className="text-[var(--muted)] text-[10px] uppercase block">DEADLINE</span>
                    <span className="font-bold text-[var(--ink)]">
                      {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>


            {/* CLIENT VERIFICATION RECORD */}
            <div className="border-2 border-[var(--ink)] bg-[var(--paper)] p-6 space-y-4">
              <div className="border-b border-[var(--ink)] pb-2 text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>CLIENT VERIFICATION</span>
                <span className="text-[var(--signal)]">• RECORD</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[var(--ink)] text-[var(--paper)] font-bold text-[14px] flex items-center justify-center">
                    {project.client?.name?.charAt(0) || 'C'}
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-[var(--ink)] text-[13px]">{project.client?.name || 'Client Participant'}</p>
                    {project.client?.company && (
                      <p className="text-[11px] text-[var(--muted)]">{project.client.company}</p>
                    )}
                  </div>
                </div>

                {project.client?.location && (
                  <p className="text-[11px] text-[var(--muted)] border-t border-[var(--line)] pt-2">
                    <MapPin className="h-3 w-3 inline mr-1 text-[var(--signal)]" />
                    {project.client.location}
                  </p>
                )}

                {/* Rating Stats */}
                {loadingClientData ? (
                  <p className="text-[10px] text-[var(--muted)]">Loading client feedback record...</p>
                ) : clientStats && clientStats.totalReviews > 0 ? (
                  <div className="border-t border-[var(--line)] pt-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-[var(--signal)] fill-[var(--signal)]" />
                      <span className="font-bold text-[14px] text-[var(--ink)]">
                        {clientStats.averageRating?.toFixed(1)} / 5.0
                      </span>
                      <span className="text-[10px] text-[var(--muted)]">
                        ({clientStats.totalReviews} REVIEWS)
                      </span>
                    </div>

                    {/* Recent Reviews */}
                    {clientReviews.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-[var(--line)]">
                        <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">RECENT FEEDBACK</span>
                        {clientReviews.slice(0, 2).map((rev) => (
                          <div key={rev.id} className="p-2 bg-[var(--paper-2)] border border-[var(--line)] space-y-1 text-[11px]">
                            <div className="flex justify-between text-[10px] text-[var(--signal)] font-bold">
                              <span>⭐ {rev.overallRating || 5}.0</span>
                              <span className="text-[var(--muted)] font-normal">{new Date(rev.createdAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                            <p className="font-sans-ledger text-[12px] text-[var(--ink)] line-clamp-2">
                              {rev.feedback}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-[var(--muted)] border-t border-[var(--line)] pt-2">
                    VERIFIED CLIENT · NO PAST REVIEWS YET
                  </p>
                )}

              </div>
            </div>

          </div>

        </div>

      </main>

      {/* PROPOSAL MODAL */}
      {showProposalModal && (
        <SubmitProposalModal
          project={project}
          onClose={() => setShowProposalModal(false)}
          onSuccess={handleProposalSuccess}
        />
      )}

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center mt-12 font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Architectural Brief Specimen</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
