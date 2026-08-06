"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import MilestoneManager from "@/components/milestones/MilestoneManager";
import ProposalList from "@/components/proposals/ProposalList";
import { useAuth } from "@/contexts/AuthContext";
import { getProjectById, deleteProject } from "@/lib/api";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

function ProjectDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params?.id;
  const { user, loading: authLoading } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    const scrollTo = searchParams.get('scrollTo');
    if (scrollTo && !loading && project) {
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
        setError(response.error || "Failed to load project record.");
      }
    } catch (err) {
      console.error("Error fetching project:", err);
      setError(err.message || "Failed to load project record.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;

    try {
      setDeleting(true);
      setError("");
      
      const response = await deleteProject(projectId);
      
      if (response.success) {
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
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger text-[12px] text-[var(--muted)]">
        LOADING PROJECT RECORD...
      </div>
    );
  }

  if (!user || user.role !== "CLIENT") return null;

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger">
        <Navbar userType="client" />
        <main className="max-w-4xl mx-auto px-4 py-16 space-y-6 text-left font-mono-ledger text-[12px]">
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)]">
            {error}
          </div>
          <Link 
            href="/client/projects" 
            className="inline-block text-[var(--ink)] font-bold hover:text-[var(--signal)] underline"
          >
            ← Back to Client Projects
          </Link>
        </main>
      </div>
    );
  }

  if (!project) return null;

  const isOwner = project.client?.id === user.id;

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType="client" />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-8 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* ARCHETYPE F: 1. BACK LINK */}
        <div className="font-mono-ledger text-[11px]">
          <Link href="/client/projects" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
            ← Back to Client Projects
          </Link>
        </div>

        {/* ARCHETYPE F: 2. RECORD SUMMARY STRIP */}
        <section className="space-y-2">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            CLIENT PROJECT RECORD · #{project.id?.slice(0, 8) || '0001'}
          </p>

          <div className="border-y-2 border-[var(--ink)] py-5 my-2 flex flex-col lg:flex-row lg:items-center justify-between gap-6 font-mono-ledger text-[12px]">
            <div className="space-y-2 max-w-2xl">
              <h1 className="font-serif-ledger text-[28px] sm:text-[36px] font-medium text-[var(--ink)] leading-snug">
                {project.title}
              </h1>

              <div className="flex items-center space-x-3 text-[12px] pt-1">
                <div className="w-10 h-10 bg-[var(--ink)] text-[var(--paper)] font-bold text-[14px] flex items-center justify-center shrink-0">
                  {(user.fullName || 'C').charAt(0)}
                </div>
                <div>
                  <span className="text-[10px] text-[var(--muted)] block uppercase">CLIENT OWNER</span>
                  <span className="font-bold text-[var(--ink)]">{user.fullName || 'Client'}</span>
                </div>
              </div>
            </div>

            <div className="text-left lg:text-right space-y-1 shrink-0">
              <span className="text-[10px] text-[var(--muted)] uppercase block">Budget (NPR)</span>
              <span className="text-[26px] font-bold text-[var(--signal)] block">
                {formatCurrency(project.budget?.min || 0)} - {formatCurrency(project.budget?.max || 0)}
              </span>
              <span className="text-[12px] font-bold text-[var(--signal)] block">
                [{project.status?.replace("_", " ")?.toUpperCase() || 'DRAFT'}]
              </span>
            </div>
          </div>
        </section>

        {/* ARCHETYPE F: 3. TWO-COLUMN BODY (65 / 35 SPLIT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column (65%): SPECIFICATIONS & PROPOSALS */}
          <div className="lg:col-span-8 space-y-8">
            
            <div className="space-y-3 font-mono-ledger text-[12px]">
              <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
                Project Scope & Deliverable Brief
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

            {/* Milestones Manager */}
            <div ref={milestonesRef} className="space-y-3 font-mono-ledger text-[12px]">
              <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
                Milestone Schedule & Approvals
              </span>
              <MilestoneManager projectId={projectId} isOwner={isOwner} />
            </div>

            {/* Proposals List */}
            {isOwner && (
              <div ref={proposalsRef} className="space-y-3 font-mono-ledger text-[12px]">
                <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
                  Received Freelancer Proposals ({project.proposalsCount || 0})
                </span>
                <ProposalList 
                  projectId={projectId} 
                  onProposalAccepted={() => fetchProject()}
                />
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
              <Link
                href={`/client/post-project?edit=${projectId}`}
                className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider py-3.5 px-4 transition-colors block text-center"
              >
                Edit project specification →
              </Link>

              {/* Secondary Actions as Plain Underlined Text Links */}
              <div className="space-y-2 pt-2 border-t border-[var(--line)] text-[11px]">
                {(project.status === "draft" || (project.status === "active" && project.proposalsCount === 0)) && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-[var(--signal)] font-bold hover:underline block text-left"
                  >
                    {deleting ? "Deleting project..." : "Delete project record →"}
                  </button>
                )}

                <Link 
                  href="/client/projects" 
                  className="text-[var(--ink)] font-bold hover:text-[var(--signal)] underline block"
                >
                  Return to projects register →
                </Link>
              </div>

              {/* Compact Owner Block */}
              <div className="pt-4 border-t border-[var(--ink)] space-y-3">
                <span className="font-bold text-[var(--ink)] uppercase text-[10px] block">Project Owner</span>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[var(--ink)] text-[var(--paper)] font-bold text-[14px] flex items-center justify-center shrink-0">
                    {(user.fullName || 'C').charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-[var(--ink)] block">{user.fullName}</span>
                    <span className="text-[10px] text-[var(--muted)] uppercase block">VERIFIED CLIENT</span>
                  </div>
                </div>
              </div>

              {/* Record Details Key-Value List */}
              <div className="pt-4 border-t border-[var(--ink)] space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Project ID:</span>
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
                  <span className="text-[var(--muted)]">Views Count:</span>
                  <span className="font-bold text-[var(--ink)]">{project.viewsCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)] font-mono-ledger">Posted Date:</span>
                  <span className="font-bold text-[var(--ink)]">{new Date(project.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Client Project Record Archetype F</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}

export default function ProjectDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger text-[12px] text-[var(--muted)]">
        LOADING PROJECT RECORD...
      </div>
    }>
      <ProjectDetailsContent />
    </Suspense>
  );
}
