"use client";

import { useState, useEffect } from "react";
import { X, Send, AlertCircle, CheckCircle } from "lucide-react";
import { getClientProjectsForInvite, sendInvitation } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/60 backdrop-blur-xs p-4 text-left font-sans-ledger">
      <div className="relative w-full max-w-xl border-2 border-[var(--ink)] bg-[var(--paper)] shadow-2xl flex flex-col font-mono-ledger text-[12px]">
        
        {/* Header */}
        <div className="border-b border-[var(--ink)] p-5 bg-[var(--paper-2)] flex items-center justify-between uppercase">
          <div>
            <span className="text-[var(--signal)] font-bold block">TALENT INVITATION SPECIMEN</span>
            <span className="text-[var(--ink)] font-bold text-[14px]">{freelancer.fullName}</span>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--ink)] font-bold text-[14px]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {success && (
            <div className="p-4 bg-green-50 border border-green-600 text-green-800 text-[12px] flex items-center space-x-2 font-bold">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <span>Invitation dispatched! Freelancer has been notified.</span>
            </div>
          )}

          {error && !success && (
            <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] text-[12px] flex items-center space-x-2 font-bold">
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
                  SELECT PROJECT BRIEF *
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  disabled={projects.length === 0 || sending}
                  className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[13px] font-bold focus:outline-none"
                >
                  <option value="">CHOOSE A PROJECT BRIEF...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title} - [{project.category}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                  PERSONAL INVITATION MESSAGE (OPTIONAL)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sending}
                  placeholder="Add a personal message inviting this talent to review your scope..."
                  rows={4}
                  className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[13px] text-[var(--ink)] focus:outline-none font-sans-ledger"
                />
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-[var(--ink)] p-4 bg-[var(--paper-2)] flex justify-end gap-3 uppercase text-[11px]">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="px-5 py-2.5 border border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] font-bold"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSendInvite}
            disabled={!selectedProject || sending || projects.length === 0 || success}
            className="px-6 py-2.5 bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold transition-colors"
          >
            {sending ? "DISPATCHING..." : "DISPATCH INVITATION →"}
          </button>
        </div>

      </div>
    </div>
  );
}
