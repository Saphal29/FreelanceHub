"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { AlertCircle } from "lucide-react";
import axios from "axios";
import { formatCurrency } from "@/lib/currency";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AdminProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id;
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setProject(response.data.project);
      } else {
        setError(response.data.error || "Failed to load project specification.");
      }
    } catch (err) {
      console.error("Error fetching project:", err);
      setError(err.response?.data?.error || "Failed to load project record.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger text-[12px] text-[var(--muted)]">
        LOADING ADMIN PROJECT RECORD...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger">
        <Navbar userType="admin" />
        <main className="max-w-4xl mx-auto px-4 py-16 space-y-6 text-left font-mono-ledger text-[12px]">
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)]">
            {error || "Project record not found."}
          </div>
          <Link 
            href="/admin/projects" 
            className="inline-block text-[var(--ink)] font-bold hover:text-[var(--signal)] underline"
          >
            ← Back to Admin Projects
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType="admin" />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-8 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* ARCHETYPE F: 1. BACK LINK */}
        <div className="font-mono-ledger text-[11px]">
          <Link href="/admin/projects" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
            ← Back to Admin Projects
          </Link>
        </div>

        {/* ARCHETYPE F: 2. RECORD SUMMARY STRIP */}
        <section className="space-y-2">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            ADMIN PROJECT RECORD · #{project.id?.slice(0, 8) || '0001'}
          </p>

          <div className="border-y-2 border-[var(--ink)] py-5 my-2 flex flex-col lg:flex-row lg:items-center justify-between gap-6 font-mono-ledger text-[12px]">
            <div className="space-y-2 max-w-2xl">
              <h1 className="font-serif-ledger text-[28px] sm:text-[36px] font-medium text-[var(--ink)] leading-snug">
                {project.title}
              </h1>

              <div className="flex items-center space-x-3 text-[12px] pt-1">
                <div className="w-10 h-10 bg-[var(--ink)] text-[var(--paper)] font-bold text-[14px] flex items-center justify-center shrink-0">
                  {(project.client?.full_name || 'C').charAt(0)}
                </div>
                <div>
                  <span className="text-[10px] text-[var(--muted)] block uppercase">CLIENT POSTER</span>
                  <span className="font-bold text-[var(--ink)]">{project.client?.full_name || 'Client Participant'}</span>
                </div>
              </div>
            </div>

            <div className="text-left lg:text-right space-y-1 shrink-0">
              <span className="text-[10px] text-[var(--muted)] uppercase block">Budget (NPR)</span>
              <span className="text-[26px] font-bold text-[var(--signal)] block">
                {formatCurrency(project.budget_min || 0)} - {formatCurrency(project.budget_max || 0)}
              </span>
              <span className="text-[12px] font-bold text-[var(--signal)] block">
                [{project.status?.replace("_", " ")?.toUpperCase() || 'ACTIVE'}]
              </span>
            </div>
          </div>
        </section>

        {/* ARCHETYPE F: 3. TWO-COLUMN BODY (65 / 35 SPLIT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column (65%): SCOPE & MILESTONES */}
          <div className="lg:col-span-8 space-y-8">
            
            <div className="space-y-3 font-mono-ledger text-[12px]">
              <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
                Project Description & Scope
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

            {/* Milestones Sub-items */}
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
                        <span className="text-[10px] font-bold text-[var(--ink)] block">[{m.status?.toUpperCase() || 'PENDING'}]</span>
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
                Admin Action Panel
              </span>

              {/* Primary Action Button */}
              <button
                onClick={() => alert("Project flagged for moderation audit.")}
                className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider py-3.5 px-4 transition-colors"
              >
                Flag for review →
              </button>

              {/* Secondary Actions */}
              <div className="space-y-2 pt-2 border-t border-[var(--line)] text-[11px]">
                <Link 
                  href="/admin/projects" 
                  className="text-[var(--ink)] font-bold hover:text-[var(--signal)] underline block"
                >
                  Return to admin projects register →
                </Link>
              </div>

              {/* Client Poster Block */}
              <div className="pt-4 border-t border-[var(--ink)] space-y-3">
                <span className="font-bold text-[var(--ink)] uppercase text-[10px] block">Client Poster</span>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[var(--ink)] text-[var(--paper)] font-bold text-[14px] flex items-center justify-center shrink-0">
                    {(project.client?.full_name || 'C').charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-[var(--ink)] block">{project.client?.full_name || 'Client Poster'}</span>
                    <span className="text-[10px] text-[var(--muted)] uppercase block">{project.client?.email || 'VERIFIED CLIENT'}</span>
                  </div>
                </div>
              </div>

              {/* Key-Value Record Details */}
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
                  <span className="text-[var(--muted)]">Proposals Count:</span>
                  <span className="font-bold text-[var(--signal)]">{project.proposals_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)] font-mono-ledger">Posted Date:</span>
                  <span className="font-bold text-[var(--ink)]">{new Date(project.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Admin Project Record Archetype F</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
