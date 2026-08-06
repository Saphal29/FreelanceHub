'use client';

import { useState } from 'react';
import { submitMilestone } from '@/lib/api';
import FileUpload from '@/components/files/FileUpload';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function MilestoneSubmission({ milestone, onSubmitSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [deliverables, setDeliverables] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (deliverables.length === 0) {
      setError('Please attach at least one deliverable file');
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = {
        notes: notes.trim() || null,
        fileIds: deliverables.map(f => f.file?.id || f.id).filter(Boolean)
      };

      const response = await submitMilestone(milestone.id, submissionData);
      
      if (response.success) {
        onSubmitSuccess?.(response.submission);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit milestone');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (milestone.status === 'completed') {
    return (
      <div className="bg-[var(--paper-2)] border border-[var(--signal)] p-4 font-mono-ledger text-[12px] text-[var(--ink)] flex items-center space-x-2">
        <CheckCircle2 className="h-4 w-4 text-[var(--signal)] shrink-0" />
        <span className="font-bold">✓ This milestone has been completed and approved on ledger</span>
      </div>
    );
  }

  if (milestone.status === 'under_review') {
    return (
      <div className="bg-amber-50 border border-[var(--ink)] p-4 font-mono-ledger text-[12px] text-[var(--ink)]">
        <span className="font-bold">⏳ Milestone deliverable is currently under review</span>
      </div>
    );
  }

  return (
    <div className="border border-[var(--ink)] bg-[var(--paper)] p-6 space-y-6 font-mono-ledger text-[12px] text-left">
      
      {/* Header */}
      <div className="border-b border-[var(--ink)] pb-4 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--signal)] font-bold">
          MILESTONE SUBMISSION SPECIMEN
        </p>
        <h3 className="font-serif-ledger text-[24px] font-medium text-[var(--ink)]">
          Submit milestone for review
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
            Submission notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe completed deliverables, technical notes, or implementation details..."
            className="w-full bg-[var(--paper)] border border-[var(--line)] p-3 text-[13px] text-[var(--ink)] font-sans-ledger leading-relaxed outline-none focus:border-[var(--ink)]"
            rows={4}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
            Deliverable attachments *
          </label>
          <FileUpload
            category="milestone_attachment"
            maxSize={50}
            multiple={true}
            onUploadSuccess={(files) => setDeliverables(files)}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-[var(--line)]">
          <button
            type="submit"
            disabled={isSubmitting || deliverables.length === 0}
            className="px-6 py-2.5 bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[11px] uppercase transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit for review →'}
          </button>
        </div>
      </form>

    </div>
  );
}
