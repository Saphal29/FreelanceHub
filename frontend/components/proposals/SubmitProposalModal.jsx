"use client";

import { useState, useEffect } from "react";
import { submitProposal } from "@/lib/api";
import { X, Send, AlertCircle, CheckCircle } from "lucide-react";
import FileUpload from "@/components/files/FileUpload";
import { formatCurrency } from "@/lib/currency";

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
      setError("Cover letter must be at least 50 characters long");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/60 backdrop-blur-xs p-4 text-left font-sans-ledger">
      <div className="relative w-full max-w-2xl border-2 border-[var(--ink)] bg-[var(--paper)] shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="border-b border-[var(--ink)] p-5 bg-[var(--paper-2)] flex items-center justify-between font-mono-ledger text-[11px] uppercase tracking-wider">
          <div>
            <span className="text-[var(--signal)] font-bold block">PROPOSAL SUBMISSION SPECIMEN</span>
            <span className="text-[var(--ink)] font-bold text-[13px]">{project.title}</span>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--ink)] font-bold text-[14px]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {success && (
            <div className="p-4 bg-green-50 border border-green-600 text-green-800 font-mono-ledger text-[12px] flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <span className="font-bold">Proposal brief submitted on record! Closing window...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Cover Letter */}
            <div className="space-y-1.5 font-mono-ledger">
              <div className="flex justify-between items-center text-[11px] uppercase font-bold text-[var(--ink)]">
                <label htmlFor="coverLetter">COVER LETTER & APPROACH (MIN 50 CHARS) *</label>
                <span className="text-[var(--muted)]">{formData.coverLetter.length}/5000</span>
              </div>
              <textarea
                id="coverLetter"
                name="coverLetter"
                value={formData.coverLetter}
                onChange={handleChange}
                rows={6}
                placeholder="Dear Client, I am writing to submit my technical proposal..."
                className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--signal)] font-sans-ledger leading-relaxed"
                required
              />
            </div>

            {/* Proposed Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono-ledger">
              <div className="space-y-1">
                <label htmlFor="proposedBudget" className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                  PROPOSED BID (NPR)
                </label>
                <input
                  id="proposedBudget"
                  name="proposedBudget"
                  type="number"
                  step="0.01"
                  value={formData.proposedBudget}
                  onChange={handleChange}
                  placeholder="e.g. 45000"
                  className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[14px] font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="proposedTimeline" className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                  ESTIMATED TIMELINE
                </label>
                <input
                  id="proposedTimeline"
                  name="proposedTimeline"
                  type="text"
                  value={formData.proposedTimeline}
                  onChange={handleChange}
                  placeholder="e.g. 3 Weeks"
                  className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[13px] focus:outline-none"
                />
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-2 font-mono-ledger">
              <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                PORTFOLIO & SPECIMEN ATTACHMENTS (OPTIONAL)
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
                <p className="text-[11px] text-green-700 font-bold">
                  ✓ {proposalFiles.length} specimen file(s) attached
                </p>
              )}
            </div>

          </form>

        </div>

        {/* Modal Footer */}
        <div className="border-t border-[var(--ink)] p-4 bg-[var(--paper-2)] flex justify-end gap-3 font-mono-ledger text-[11px]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 border border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] font-bold uppercase"
          >
            CANCEL
          </button>

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || success || filesUploading}
            className="px-6 py-2.5 bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold uppercase transition-colors"
          >
            {loading ? "SUBMITTING..." : filesUploading ? "UPLOADING..." : "SUBMIT PROPOSAL BRIEF →"}
          </button>
        </div>

      </div>
    </div>
  );
}
