"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";
import { getClientProjectsForInvite, sendInvitation } from "@/lib/api";

export default function InviteModal({ freelancer, onClose }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getClientProjectsForInvite();
      
      if (response.success) {
        setProjects(response.projects || []);
        if (response.projects?.length === 0) {
          setError("You don't have any active projects. Please post a project brief first.");
        }
      } else {
        setError("Failed to load project register");
      }
    } catch (err) {
      console.error("Error loading projects:", err);
      setError(err.message || "Failed to load project register");
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!selectedProject) {
      setError("Please select a project brief");
      return;
    }

    try {
      setSending(true);
      setError("");
      
      const response = await sendInvitation({
        freelancerId: freelancer.id,
        projectId: selectedProject,
        message: message.trim()
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setError(response.error || "Failed to send invitation");
      }
    } catch (err) {
      console.error("Error sending invitation:", err);
      setError(err.message || "Failed to send invitation");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/40 p-4 text-left font-sans-ledger">
      {/* ARCHETYPE G: MODAL SHELL */}
      <div className="relative w-full max-w-xl border border-[var(--line)] bg-[var(--paper)] flex flex-col font-mono-ledger text-[12px] rounded-none">
        
        {/* Header */}
        <div className="border-b border-[var(--line)] p-5 flex items-start justify-between">
          <div className="space-y-1">
            <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--signal)] font-bold">
              TALENT INVITATION SPECIMEN
            </p>
            <h2 className="font-serif-ledger text-[24px] sm:text-[28px] font-medium text-[var(--ink)] leading-snug">
              Invite {freelancer.fullName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--ink)] hover:opacity-70 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {success && (
            <div className="p-4 bg-[var(--paper-2)] border border-[var(--signal)] text-[var(--ink)] text-[12px] flex items-center space-x-2 font-bold">
              <CheckCircle2 className="h-4 w-4 text-[var(--signal)] shrink-0" />
              <span>Invitation dispatched! Freelancer has been notified.</span>
            </div>
          )}

          {error && !success && (
            <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] text-[12px] flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-[var(--muted)] uppercase">
              LOADING ACTIVE PROJECT BRIEFS...
            </div>
          ) : (
            <div className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                  Select project brief *
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  disabled={projects.length === 0 || sending}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] p-2.5 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                >
                  <option value="">Choose a project brief...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title} - [{project.category}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                  Personal invitation message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sending}
                  placeholder="Add a personal message inviting this talent to review your scope..."
                  rows={4}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] p-2.5 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--ink)] font-sans-ledger"
                />
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-[var(--line)] p-4 flex justify-end gap-3 text-[11px]">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="px-5 py-2.5 border border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] font-bold hover:bg-[var(--paper-2)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSendInvite}
            disabled={!selectedProject || sending || projects.length === 0 || success}
            className="px-6 py-2.5 bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold transition-colors"
          >
            {sending ? "Sending..." : "Send invitation →"}
          </button>
        </div>

      </div>
    </div>
  );
}
