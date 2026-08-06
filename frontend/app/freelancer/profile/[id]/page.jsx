"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import InviteModal from "@/components/invites/InviteModal";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export default function FreelancerProfilePage() {
  const params = useParams();
  const freelancerId = params?.id;
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (freelancerId) {
      fetchProfile();
    }
  }, [freelancerId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/${freelancerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.profile);
      } else {
        setError(data.error || "Failed to load profile specimen.");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err.message || "Failed to load profile specimen.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger text-[12px] text-[var(--muted)]">
        LOADING TALENT SPECIMEN...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger">
        <Navbar userType={user?.role === "CLIENT" ? "client" : "freelancer"} />
        <main className="max-w-4xl mx-auto px-4 py-16 space-y-6 text-left font-mono-ledger text-[12px]">
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)]">
            {error || "Profile specimen not found."}
          </div>
          <Link 
            href="/client/talent" 
            className="inline-block text-[var(--ink)] font-bold hover:text-[var(--signal)] underline"
          >
            ← Back to Talent Directory
          </Link>
        </main>
      </div>
    );
  }

  const skills = Array.isArray(profile.skills) 
    ? profile.skills 
    : (typeof profile.skills === 'string' 
      ? profile.skills.split(',').map(s => s.trim()) 
      : []);

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType={user?.role === "CLIENT" ? "client" : "freelancer"} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-8 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* ARCHETYPE F: 1. BACK LINK */}
        <div className="font-mono-ledger text-[11px]">
          <Link href="/client/talent" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
            ← Back to Talent Directory
          </Link>
        </div>

        {/* ARCHETYPE F: 2. RECORD SUMMARY STRIP */}
        <section className="space-y-2">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            TALENT SPECIMEN RECORD · #{profile.id?.slice(0, 8) || '0001'}
          </p>

          <div className="border-y-2 border-[var(--ink)] py-5 my-2 flex flex-col lg:flex-row lg:items-center justify-between gap-6 font-mono-ledger text-[12px]">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[var(--ink)] text-[var(--paper)] font-bold text-[14px] flex items-center justify-center shrink-0">
                {profile.fullName?.charAt(0) || 'F'}
              </div>
              <div className="space-y-0.5">
                <h1 className="font-serif-ledger text-[28px] sm:text-[36px] font-medium text-[var(--ink)] leading-snug">
                  {profile.fullName}
                </h1>
                <p className="text-[12px] text-[var(--muted)] uppercase font-bold">
                  {profile.title || "Independent Developer"} · [{profile.location?.toUpperCase() || 'NEPAL'}]
                </p>
              </div>
            </div>

            <div className="text-left lg:text-right space-y-1 shrink-0">
              <span className="text-[10px] text-[var(--muted)] uppercase block">Hourly Rate (NPR)</span>
              <span className="text-[26px] font-bold text-[var(--signal)] block">
                {profile.hourlyRate ? `${formatCurrency(profile.hourlyRate)}/hr` : 'AGREED RATE'}
              </span>
              <span className="text-[12px] font-bold text-[var(--signal)] block">
                [{profile.averageRating ? `${parseFloat(profile.averageRating).toFixed(1)} RATING` : "VERIFIED TALENT"}]
              </span>
            </div>
          </div>
        </section>

        {/* ARCHETYPE F: 3. TWO-COLUMN BODY (65 / 35 SPLIT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column (65%): COMPLETED WORK HISTORY & BIO */}
          <div className="lg:col-span-8 space-y-8">
            
            <div className="space-y-3 font-mono-ledger text-[12px]">
              <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
                Professional Bio & Expertise
              </span>
              <div className="border border-[var(--ink)] bg-[var(--paper)] p-5 font-sans-ledger text-[14px] leading-relaxed text-[var(--ink)] whitespace-pre-wrap">
                {profile.bio || "Verified independent professional specializing in software architecture and modern web systems."}
              </div>
            </div>

            {skills.length > 0 && (
              <div className="space-y-3 font-mono-ledger text-[12px]">
                <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
                  Technical Disciplines
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[var(--paper-2)] border border-[var(--ink)] text-[var(--ink)] font-bold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* COMPLETED WORK HISTORY */}
            <div className="space-y-4 font-mono-ledger text-[12px]">
              <div className="border-b border-[var(--ink)] pb-2 uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between text-[11px]">
                <span>COMPLETED WORK HISTORY</span>
                <span className="text-[var(--signal)]">{profile.completedProjects?.length || 0} RECORDS</span>
              </div>

              {!profile.completedProjects || profile.completedProjects.length === 0 ? (
                <div className="border border-[var(--line)] bg-[var(--paper-2)] p-6 text-center text-[var(--muted)]">
                  NO COMPLETED PROJECT RECORDS ON LEDGER YET
                </div>
              ) : (
                <div className="border border-[var(--ink)] divide-y divide-[var(--line)] bg-[var(--paper)]">
                  {profile.completedProjects.map((project) => (
                    <div key={project.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif-ledger text-[16px] font-medium text-[var(--ink)]">{project.title}</h4>
                        <span className="font-bold text-[var(--signal)]">
                          {project.budget ? formatCurrency(project.budget) : '[VERIFIED]'}
                        </span>
                      </div>
                      <p className="font-sans-ledger text-[13px] text-[var(--muted)]">{project.description}</p>
                      <div className="text-[10px] text-[var(--muted)] uppercase">
                        Completed: {new Date(project.completedAt || Date.now()).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column (35%): ACTION PANEL */}
          <div className="lg:col-span-4 space-y-6 font-mono-ledger text-[12px]">
            
            <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 space-y-5">
              <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
                Action Panel
              </span>

              {/* Primary Action Button */}
              {user?.role === "CLIENT" ? (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider py-3.5 px-4 transition-colors"
                >
                  Invite to project →
                </button>
              ) : (
                <Link
                  href="/client/talent"
                  className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider py-3.5 px-4 transition-colors block text-center"
                >
                  Browse talent directory →
                </Link>
              )}

              {/* Secondary Links */}
              <div className="space-y-2 pt-2 border-t border-[var(--line)] text-[11px]">
                <Link 
                  href={`/chat?userId=${freelancerId}`}
                  className="text-[var(--ink)] font-bold hover:text-[var(--signal)] underline block"
                >
                  Direct message talent →
                </Link>
              </div>

              {/* Profile Block */}
              <div className="pt-4 border-t border-[var(--ink)] space-y-3">
                <span className="font-bold text-[var(--ink)] uppercase text-[10px] block">Talent Identity</span>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[var(--ink)] text-[var(--paper)] font-bold text-[14px] flex items-center justify-center shrink-0">
                    {profile.fullName?.charAt(0) || 'F'}
                  </div>
                  <div>
                    <span className="font-bold text-[var(--ink)] block">{profile.fullName}</span>
                    <span className="text-[10px] text-[var(--muted)] uppercase block">{profile.title || "Developer"}</span>
                  </div>
                </div>
              </div>

              {/* Record Details List */}
              <div className="pt-4 border-t border-[var(--ink)] space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Talent ID:</span>
                  <span className="font-bold text-[var(--ink)]">#{profile.id?.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Rating:</span>
                  <span className="font-bold text-[var(--signal)]">
                    {profile.averageRating ? `${parseFloat(profile.averageRating).toFixed(1)} / 5.0` : "5.0"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Jobs Completed:</span>
                  <span className="font-bold text-[var(--ink)]">{profile.totalJobsCompleted || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Verification:</span>
                  <span className="font-bold text-green-700">[VERIFIED]</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* INVITE MODAL */}
      {showInviteModal && (
        <InviteModal
          freelancer={profile}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Public Talent Record Archetype F</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
