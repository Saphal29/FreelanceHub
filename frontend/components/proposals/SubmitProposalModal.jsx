"use client";

import { useState, useEffect } from "react";
import { submitProposal } from "@/lib/api";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";
import FileUpload from "@/components/files/FileUpload";

export default function SubmitProposalModal({ project, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    coverLetter: "",
    proposedBudget: "",
    proposedTimeline: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [proposalFiles, setProposalFiles] = useState([]);
  const [filesUploading, setFilesUploading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.coverLetter || formData.coverLetter.trim().length < 50) {
      setError("Minimum 50 characters required in cover letter");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await submitProposal({
        projectId: project.id,
        coverLetter: formData.coverLetter,
        proposedBudget: formData.proposedBudget ? parseFloat(formData.proposedBudget) : null,
        proposedTimeline: formData.proposedTimeline || null,
        fileIds: proposalFiles.map(f => f.file?.id || f.id).filter(Boolean)
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess && onSuccess(response.proposal);
          onClose();
        }, 1800);
      } else {
        setError(response.error || "Failed to submit proposal brief");
      }
    } catch (err) {
      console.error("Error submitting proposal:", err);
      setError(err.message || "Failed to submit proposal brief");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/40 p-4 text-left font-sans-ledger">
      {/* ARCHETYPE G: MODAL SHELL */}
      <div className="relative w-full max-w-2xl border border-[var(--line)] bg-[var(--paper)] max-h-[90vh] flex flex-col rounded-none">
        
        {/* Header */}
        <div className="border-b border-[var(--line)] p-5 flex items-start justify-between">
          <div className="space-y-1">
            <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--signal)] font-bold">
              PROPOSAL SUBMISSION SPECIMEN
            </p>
            <h2 className="font-serif-ledger text-[24px] sm:text-[28px] font-medium text-[var(--ink)] leading-snug">
              {project.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--ink)] hover:opacity-70 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {success && (
            <div className="p-4 bg-[var(--paper-2)] border border-[var(--signal)] text-[var(--ink)] font-mono-ledger text-[12px] flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--signal)] shrink-0" />
              <span className="font-bold">Proposal brief submitted on record! Closing window...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Cover Letter */}
            <div className="space-y-1.5 font-mono-ledger text-[11px]">
              <div className="flex justify-between items-center font-bold text-[var(--muted)] uppercase">
                <label htmlFor="coverLetter">Cover letter & approach (min 50 chars) *</label>
                <span>{formData.coverLetter.length}/5000</span>
              </div>
              <textarea
                id="coverLetter"
                name="coverLetter"
                value={formData.coverLetter}
                onChange={handleChange}
                rows={6}
                placeholder="Dear Client, I am writing to submit my technical proposal..."
                className={`w-full bg-[var(--paper)] border p-3 text-[14px] text-[var(--ink)] font-sans-ledger leading-relaxed outline-none transition-colors ${
                  error && formData.coverLetter.trim().length < 50
                    ? "border-[var(--signal)]"
                    : "border-[var(--line)] focus:border-[var(--ink)]"
                }`}
                required
              />
              {error && formData.coverLetter.trim().length < 50 && (
                <span className="text-[var(--signal-dark)] text-[10px] block">Minimum 50 characters required</span>
              )}
            </div>

            {/* Currency & Timeline Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono-ledger text-[11px]">
              {/* Proposed Budget with Static NPR Prefix */}
              <div className="space-y-1">
                <label htmlFor="proposedBudget" className="text-[var(--muted)] uppercase font-bold block">
                  Proposed bid (NPR)
                </label>
                <div className="flex items-center border border-[var(--line)] bg-[var(--paper)] focus-within:border-[var(--ink)]">
                  <span className="px-3 py-2.5 bg-[var(--paper-2)] border-r border-[var(--line)] text-[var(--muted)] font-bold text-[12px]">
                    NPR
                  </span>
                  <input
                    id="proposedBudget"
                    name="proposedBudget"
                    type="number"
                    step="0.01"
                    value={formData.proposedBudget}
                    onChange={handleChange}
                    placeholder="45000"
                    className="w-full bg-transparent p-2.5 text-[14px] font-bold text-[var(--ink)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Timeline Input */}
              <div className="space-y-1">
                <label htmlFor="proposedTimeline" className="text-[var(--muted)] uppercase font-bold block">
                  Estimated timeline
                </label>
                <input
                  id="proposedTimeline"
                  name="proposedTimeline"
                  type="text"
                  value={formData.proposedTimeline}
                  onChange={handleChange}
                  placeholder="e.g. 3 Weeks"
                  className="w-full bg-[var(--paper)] border border-[var(--line)] p-2.5 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                />
              </div>
            </div>

            {/* Single Hairline File Upload Row */}
            <div className="space-y-1.5 font-mono-ledger text-[11px]">
              <label className="text-[var(--muted)] uppercase font-bold block">
                Portfolio & specimen attachments (optional)
              </label>
              <FileUpload
                category="proposal_attachment"
                maxSize={25}
                multiple={true}
                onUploadStart={() => setFilesUploading(true)}
                onUploadSuccess={(files) => {
                  setProposalFiles(prev => [...prev, ...files]);
                  setFilesUploading(false);
                }}
                onUploadError={() => setFilesUploading(false)}
              />
              {proposalFiles.length > 0 && (
                <p className="text-[11px] text-[var(--ink)] font-bold pt-1">
                  ✓ {proposalFiles.length} specimen file(s) attached
                </p>
              )}
            </div>

          </form>

        </div>

        {/* Modal Footer (Sentence Case CTAs) */}
        <div className="border-t border-[var(--line)] p-4 flex justify-end gap-3 font-mono-ledger text-[11px]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 border border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] font-bold transition-colors hover:bg-[var(--paper-2)]"
          >
            Cancel
          </button>

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || success || filesUploading}
            className="px-6 py-2.5 bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold transition-colors"
          >
            {loading ? "Submitting..." : filesUploading ? "Uploading..." : "Submit proposal brief →"}
          </button>
        </div>

      </div>
    </div>
  );
}
