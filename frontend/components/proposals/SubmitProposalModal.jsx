"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  // Lock body scroll when modal is open
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
        fileIds: proposalFiles.map(f => f.file.id) // Add file IDs
      });

      console.log('Submitting proposal with fileIds:', proposalFiles.map(f => f.file.id));

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess && onSuccess(response.proposal);
          onClose();
        }, 2000);
      } else {
        setError(response.error || "Failed to submit proposal");
      }
    } catch (err) {
      console.error("Error submitting proposal:", err);
      setError(err.message || "Failed to submit proposal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl my-8 max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-card rounded-t-2xl border-b border-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Submit Proposal
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {project.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-secondary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
        {/* Success Message */}
        {success && (
          <Alert className="mb-6 border-2 border-green-200 bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 font-semibold">
              Proposal submitted successfully! Redirecting...
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert className="mb-6 border-2 border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-semibold">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Letter */}
          <div>
            <Label htmlFor="coverLetter" className="text-foreground font-semibold">
              Cover Letter <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Explain why you're the best fit for this project (minimum 50 characters)
            </p>
            <textarea
              id="coverLetter"
              name="coverLetter"
              value={formData.coverLetter}
              onChange={handleChange}
              rows={6}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Dear Client,&#10;&#10;I am excited to submit my proposal for your project...&#10;&#10;I have extensive experience in..."
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {formData.coverLetter.length} / 5000 characters
            </p>
          </div>

          {/* Proposed Budget */}
          <div>
            <Label htmlFor="proposedBudget" className="text-foreground font-semibold">
              Proposed Budget (NPR)
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Project budget: {formatCurrency(project.budget?.min)} - {formatCurrency(project.budget?.max)}
            </p>
            <Input
              id="proposedBudget"
              name="proposedBudget"
              type="number"
              min="0"
              step="0.01"
              value={formData.proposedBudget}
              onChange={handleChange}
              placeholder="Enter your proposed budget"
              className="h-12"
            />
          </div>

          {/* Proposed Timeline */}
          <div>
            <Label htmlFor="proposedTimeline" className="text-foreground font-semibold">
              Proposed Timeline
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              How long will it take to complete this project?
            </p>
            <Input
              id="proposedTimeline"
              name="proposedTimeline"
              type="text"
              value={formData.proposedTimeline}
              onChange={handleChange}
              placeholder="e.g., 2-3 weeks, 1 month"
              className="h-12"
            />
          </div>

          {/* Attachments */}
          <div>
            <Label className="text-foreground font-semibold">
              Attachments (Optional)
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Attach your portfolio, resume, or work samples (files upload automatically)
            </p>
            <FileUpload
              category="proposal_attachment"
              maxSize={25}
              multiple={true}
              onUploadStart={() => {
                setFilesUploading(true);
              }}
              onUploadSuccess={(files) => {
                console.log('Files uploaded:', files);
                setProposalFiles(prev => [...prev, ...files]);
                setFilesUploading(false);
              }}
              onUploadError={() => {
                setFilesUploading(false);
              }}
            />
            {proposalFiles.length > 0 && (
              <div className="mt-2 text-sm text-green-600">
                ✓ {proposalFiles.length} file(s) uploaded successfully
              </div>
            )}
          </div>
        </form>
        </div>

        {/* Footer - Fixed */}
        <div className="bg-card rounded-b-2xl border-t border-border p-6">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              disabled={loading || success || filesUploading}
              onClick={handleSubmit}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : filesUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading files...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Proposal
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
