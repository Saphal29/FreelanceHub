"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import SubmitProposalModal from "@/components/proposals/SubmitProposalModal";
import { useAuth } from "@/contexts/AuthContext";
import { getProjectById, getUserRatingStats, getReceivedReviews } from "@/lib/api";
import { CheckCircle2, AlertCircle } from "lucide-react";
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
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger text-[12px] text-[var(--muted)]">
        LOADING PROJECT RECORD...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger">
        <Navbar userType={user?.role?.toLowerCase() || "freelancer"} />
        <main className="max-w-4xl mx-auto px-4 py-16 space-y-6 text-left font-mono-ledger text-[12px]">
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)]">
            {error || "Project brief specimen not found."}
          </div>
          <Link 
            href="/projects" 
            className="inline-block text-[var(--ink)] font-bold hover:text-[var(--signal)] underline"
          >
            ← Back to Open Briefs Directory
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-8 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* ARCHETYPE F: 1. BACK LINK */}
        <div className="font-mono-ledger text-[11px]">
          <Link href="/projects" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
            ← Back to Open Briefs Directory
          </Link>
        </div>

        {/* ARCHETYPE F: 2. RECORD SUMMARY STRIP */}
        <section className="space-y-2">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            PROJECT BRIEF RECORD · #{project.id?.slice(0, 8) || '0001'}
          </p>

          <div className="border-y-2 border-[var(--ink)] py-5 my-2 flex flex-col lg:flex-row lg:items-center justify-between gap-6 font-mono-ledger text-[12px]">
            <div className="space-y-2 max-w-2xl">
              <h1 className="font-serif-ledger text-[28px] sm:text-[36px] font-medium text-[var(--ink)] leading-snug">
                {project.title}
              </h1>

              <div className="flex items-center space-x-3 text-[12px] pt-1">
                <div className="w-10 h-10 bg-[var(--ink)] text-[var(--paper)] font-bold text-[14px] flex items-center justify-center shrink-0">
                  {(project.client?.name || 'C').charAt(0)}
                </div>
                <div>
                  <span className="text-[10px] text-[var(--muted)] block uppercase">CLIENT POSTER</span>
                  <span className="font-bold text-[var(--ink)]">{project.client?.name || 'Client Participant'}</span>
                </div>
              </div>
            </div>

            <div className="text-left lg:text-right space-y-1 shrink-0">
              <span className="text-[10px] text-[var(--muted)] uppercase block">Budget (NPR)</span>
              <span className="text-[26px] font-bold text-[var(--signal)] block">
                {formatCurrency(project.budget?.min || project.budget_min || 0)} - {formatCurrency(project.budget?.max || project.budget_max || 0)}
              </span>
              <span className="text-[12px] font-bold text-[var(--signal)] block">
                [{project.status?.toUpperCase() || 'OPEN BRIEF'}]
              </span>
            </div>
          </div>
        </section>

        {/* ARCHETYPE F: 3. TWO-COLUMN BODY (65 / 35 SPLIT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column (65%): SCOPE & TECHNICAL SPECIFICATIONS */}
          <div className="lg:col-span-8 space-y-8">
            
            <div className="space-y-3 font-mono-ledger text-[12px]">
              <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
                Project Scope & Deliverable Objectives
              </span>
              <div className="border border-[var(--ink)] bg-[var(--paper)] p-5 font-sans-ledger text-[14px] leading-relaxed text-[var(--ink)] whitespace-pre-wrap">
                {project.description}
              </div>
            </div>

            {project.skills && project.skills.length > 0 && (
              <div className="space-y-3 font-mono-ledger text-[12px]">
                <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
                  Required Technical Disciplines
                </span>
                <div className="flex flex-wrap gap-2 pt-1 font-mono-ledger text-[11px]">
                  {project.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[var(--paper-2)] border border-[var(--ink)] text-[var(--ink)] font-bold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones Sub-items using Archetype E pattern */}
            {project.milestones && project.milestones.length > 0 && (
              <div className="space-y-3 font-mono-ledger text-[12px]">
                <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
                  Project Milestones ({project.milestones.length})
                </span>
                <div className="border border-[var(--ink)] divide-y divide-[var(--line)] bg-[var(--paper)]">
                  {project.milestones.map((m, idx) => (
                    <div key={m.id || idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5 text-left">
                        <span className="text-[10px] text-[var(--muted)] uppercase">Milestone 0{idx + 1}</span>
                        <h4 className="font-serif-ledger text-[16px] font-medium text-[var(--ink)]">{m.title}</h4>
                        <p className="font-sans-ledger text-[12px] text-[var(--muted)]">{m.description}</p>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className="font-bold text-[var(--signal)] text-[16px] block">{formatCurrency(m.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column (35%): ACTION PANEL */}
          <div className="lg:col-span-4 space-y-6 font-mono-ledger text-[12px]">
            
            <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 space-y-5">
              <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
                Action Panel
              </span>

              {/* Single Primary Action Button */}
              {isFreelancer && !isOwner ? (
                project.hasApplied ? (
                  <div className="p-3 bg-[var(--paper)] border border-[var(--signal)] text-[var(--signal)] font-bold text-[11px] uppercase text-center">
                    Proposal submitted on record
                  </div>
                ) : (
                  <button
                    onClick={() => setShowProposalModal(true)}
                    className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider py-3.5 px-4 transition-colors"
                  >
                    Submit proposal brief →
                  </button>
                )
              ) : (
                <Link
                  href={`/client/projects/${project.id}`}
                  className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider py-3.5 px-4 transition-colors block text-center"
                >
                  Manage project brief →
                </Link>
              )}

              {/* Secondary Actions as Plain Underlined Text Links */}
              <div className="space-y-2 pt-2 border-t border-[var(--line)] text-[11px]">
                <Link 
                  href="/projects" 
                  className="text-[var(--ink)] font-bold hover:text-[var(--signal)] underline block"
                >
                  Browse open briefs →
                </Link>

                {project.client?.id && (
                  <Link 
                    href={`/chat?userId=${project.client.id}`}
                    className="text-[var(--ink)] font-bold hover:text-[var(--signal)] underline block"
                  >
                    Contact client poster →
                  </Link>
                )}
              </div>

              {/* Compact Parties Block */}
              <div className="pt-4 border-t border-[var(--ink)] space-y-3">
                <span className="font-bold text-[var(--ink)] uppercase text-[10px] block">Client Poster</span>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[var(--ink)] text-[var(--paper)] font-bold text-[14px] flex items-center justify-center shrink-0">
                    {(project.client?.name || 'C').charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-[var(--ink)] block">{project.client?.name || 'Client Poster'}</span>
                    <span className="text-[10px] text-[var(--muted)] uppercase block">{project.client?.company || 'VERIFIED CLIENT'}</span>
                  </div>
                </div>
              </div>

              {/* Record Details Key-Value List */}
              <div className="pt-4 border-t border-[var(--ink)] space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Record ID:</span>
                  <span className="font-bold text-[var(--ink)]">#{project.id?.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Category:</span>
                  <span className="font-bold text-[var(--ink)]">[{project.category || 'GENERAL'}]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Proposals Received:</span>
                  <span className="font-bold text-[var(--signal)]">{project.proposalsCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Posted Date:</span>
                  <span className="font-bold text-[var(--ink)]">{new Date(project.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
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
      <footer className="border-t border-[var(--line)] py-6 text-center font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Project Brief Record Archetype F</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
