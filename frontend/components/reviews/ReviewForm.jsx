"use client";

import { useState } from "react";
import StarRating from "./StarRating";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { submitReview } from "@/lib/api";

export default function ReviewForm({ contractId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    overallRating: 0,
    communicationRating: 0,
    qualityRating: 0,
    timelinessRating: 0,
    professionalismRating: 0,
    feedback: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.overallRating === 0) {
      setError("Please provide an overall rating");
      return;
    }
    
    if (!formData.feedback.trim()) {
      setError("Please provide written feedback");
      return;
    }
    
    try {
      setSubmitting(true);
      setError("");
      
      const response = await submitReview({
        contractId,
        ...formData
      });
      
      if (response.success) {
        setSuccess("Review submitted successfully!");
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        setError(response.error || "Failed to submit review");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      setError(err.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-[var(--ink)] bg-[var(--paper)] p-6 space-y-6 text-left font-mono-ledger text-[12px]">
      
      {/* Header */}
      <div className="border-b border-[var(--ink)] pb-4 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--signal)] font-bold">
          FREELANCEHUB FORM · REPUTATION EVALUATION
        </p>
        <h3 className="font-serif-ledger text-[24px] font-medium text-[var(--ink)]">
          Submit performance review
        </h3>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-[var(--paper-2)] border border-[var(--signal)] text-[var(--ink)] flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-[var(--signal)] shrink-0" />
          <span className="font-bold">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div className="space-y-2">
          <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
            Overall rating *
          </label>
          <StarRating
            rating={formData.overallRating}
            size="xl"
            interactive
            onChange={(rating) => setFormData({ ...formData, overallRating: rating })}
          />
        </div>

        {/* Category Ratings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[var(--line)] pt-4">
          <div className="space-y-1">
            <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
              Communication
            </label>
            <StarRating
              rating={formData.communicationRating}
              size="lg"
              interactive
              onChange={(rating) => setFormData({ ...formData, communicationRating: rating })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
              Quality of work
            </label>
            <StarRating
              rating={formData.qualityRating}
              size="lg"
              interactive
              onChange={(rating) => setFormData({ ...formData, qualityRating: rating })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
              Timeliness
            </label>
            <StarRating
              rating={formData.timelinessRating}
              size="lg"
              interactive
              onChange={(rating) => setFormData({ ...formData, timelinessRating: rating })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
              Professionalism
            </label>
            <StarRating
              rating={formData.professionalismRating}
              size="lg"
              interactive
              onChange={(rating) => setFormData({ ...formData, professionalismRating: rating })}
            />
          </div>
        </div>

        {/* Written Feedback */}
        <div className="space-y-1">
          <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
            Written feedback *
          </label>
          <textarea
            value={formData.feedback}
            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
            className={`w-full bg-[var(--paper)] border p-3 text-[13px] text-[var(--ink)] font-sans-ledger leading-relaxed outline-none transition-colors ${
              error && !formData.feedback.trim() ? "border-[var(--signal)]" : "border-[var(--line)] focus:border-[var(--ink)]"
            }`}
            placeholder="Share your experience working on this contract brief..."
            rows={4}
            required
          />
        </div>

        {/* Actions (Sentence case) */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--line)] text-[11px]">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] font-bold hover:bg-[var(--paper-2)] transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold transition-colors"
          >
            {submitting ? "Submitting..." : "Submit review →"}
          </button>
        </div>
      </form>
    </div>
  );
}
