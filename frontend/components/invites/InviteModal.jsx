"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Send, AlertCircle, CheckCircle } from "lucide-react";
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
          setError("You don't have any active projects. Please create a project first.");
        }
      } else {
        setError("Failed to load projects");
      }
    } catch (err) {
      console.error("Error loading projects:", err);
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!selectedProject) {
      setError("Please select a project");
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
        }, 2000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Invite {freelancer.fullName}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select a project and send an invitation to this freelancer
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <Alert className="mb-4 border-2 border-green-200 bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 font-semibold">
              Invitation sent successfully! The freelancer will be notified.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && !success && (
          <Alert className="mb-4 border-2 border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-semibold">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        ) : (
          <>
            {/* Project Selection */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Select Project <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                disabled={projects.length === 0 || sending}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Choose a project...</option>
                {projects.map((project) => {
                  const budgetDisplay = project.project_type === 'hourly' 
                    ? `Hourly` 
                    : project.budget_min && project.budget_max
                      ? `$${project.budget_min} - $${project.budget_max}`
                      : project.budget_min
                        ? `$${project.budget_min}+`
                        : 'Budget TBD';
                  
                  return (
                    <option key={project.id} value={project.id}>
                      {project.title} - {project.category} ({budgetDisplay})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selected Project Details */}
            {selectedProject && (
              <div className="mb-4 rounded-xl border border-border bg-secondary/30 p-4">
                {(() => {
                  const project = projects.find(p => p.id === selectedProject);
                  if (!project) return null;
                  
                  const budgetDisplay = project.project_type === 'hourly' 
                    ? 'Hourly Rate Project' 
                    : project.budget_min && project.budget_max
                      ? `$${project.budget_min} - $${project.budget_max}`
                      : project.budget_min
                        ? `$${project.budget_min}+`
                        : 'Budget TBD';
                  
                  return (
                    <>
                      <h3 className="font-semibold text-foreground mb-2">
                        {project.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                      <div className="mt-2 flex gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Category: <span className="text-foreground font-medium">{project.category}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Budget: <span className="text-foreground font-medium">{budgetDisplay}</span>
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Custom Message */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Personal Message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sending}
                placeholder="Add a personal message to your invitation..."
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                This message will be included in the notification sent to the freelancer
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={handleSendInvite}
                disabled={!selectedProject || sending || projects.length === 0 || success}
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
