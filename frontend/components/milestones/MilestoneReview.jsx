'use client';

import { useState, useEffect } from 'react';
import { getMilestoneSubmissions, reviewMilestoneSubmission } from '@/lib/api';
import { AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export default function MilestoneReview({ milestone, onReviewComplete }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, [milestone.id]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = await getMilestoneSubmissions(milestone.id);
      if (response.success) {
        setSubmissions(response.submissions || []);
        const pending = (response.submissions || []).find(s => s.status === 'pending');
        if (pending) {
          setSelectedSubmission(pending);
        }
      }
    } catch (err) {
      setError('Failed to load milestone submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (action) => {
    if (!selectedSubmission) return;
    
    setError('');
    setReviewing(true);

    try {
      const reviewData = {
        action,
        notes: reviewNotes.trim() || null
      };

      const response = await reviewMilestoneSubmission(selectedSubmission.id, reviewData);
      
      if (response.success) {
        onReviewComplete?.(response.submission);
        loadSubmissions();
        setReviewNotes('');
      }
    } catch (err) {
      console.error('Review error:', err);
      const errorMessage = err.message || err.error || 'Failed to submit milestone review';
      setError(errorMessage);
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center font-mono-ledger text-[12px] text-[var(--muted)] uppercase">
        LOADING SUBMISSIONS...
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="border border-[var(--line)] bg-[var(--paper-2)] p-6 text-center font-mono-ledger text-[12px] text-[var(--muted)]">
        No deliverable submissions recorded on ledger yet.
      </div>
    );
  }

  const pendingSubmission = submissions.find(s => s.status === 'pending');

  return (
    <div className="space-y-6 text-left font-mono-ledger text-[12px]">
      
      {/* Selected Submission Details */}
      {selectedSubmission && (
        <div className="border border-[var(--ink)] bg-[var(--paper)] p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--ink)] pb-3">
            <h3 className="font-serif-ledger text-[22px] font-medium text-[var(--ink)]">
              Milestone deliverable submission
            </h3>
            <span className="text-[11px] font-bold text-[var(--signal)]">
              [{selectedSubmission.status?.toUpperCase()}]
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-[var(--muted)] uppercase block font-bold">SUBMITTED BY</span>
              <span className="font-bold text-[var(--ink)]">{selectedSubmission.submittedByName}</span>
              <span className="text-[10px] text-[var(--muted)] block">
                {new Date(selectedSubmission.createdAt).toLocaleString()}
              </span>
            </div>

            {selectedSubmission.submissionNotes && (
              <div className="space-y-1">
                <span className="text-[10px] text-[var(--muted)] uppercase block font-bold">SUBMISSION NOTES</span>
                <p className="font-sans-ledger text-[13px] text-[var(--ink)] border border-[var(--line)] bg-[var(--paper-2)] p-3 leading-relaxed">
                  {selectedSubmission.submissionNotes}
                </p>
              </div>
            )}

            {/* Deliverable Files */}
            {selectedSubmission.deliverableFiles && selectedSubmission.deliverableFiles.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-[var(--muted)] uppercase block font-bold">DELIVERABLE SPECIMENS</span>
                <div className="space-y-1.5">
                  {selectedSubmission.deliverableFiles.map((file) => {
                    const fileUrl = file.file_url || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/files/${file.id}/download`;
                    return (
                      <div key={file.id} className="flex items-center justify-between p-3 border border-[var(--line)] bg-[var(--paper-2)]">
                        <span className="font-bold text-[var(--ink)] truncate">{file.original_name}</span>
                        <a
                          href={fileUrl}
                          download
                          className="px-3 py-1 bg-[var(--ink)] text-[var(--paper)] text-[10px] font-bold uppercase hover:bg-[var(--signal)] transition-colors"
                        >
                          Download →
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hours & Amount */}
            <div className="border-t border-[var(--line)] pt-3 flex justify-between">
              <div>
                <span className="text-[10px] text-[var(--muted)] uppercase block">Total Hours Logged</span>
                <span className="font-bold text-[var(--ink)]">{selectedSubmission.totalHours?.toFixed(2) || 0} hrs</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[var(--muted)] uppercase block">Total Amount</span>
                <span className="font-bold text-[var(--signal)]">
                  {formatCurrency(selectedSubmission.totalAmount || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Actions Form */}
      {pendingSubmission && selectedSubmission?.status === 'pending' && (
        <div className="border border-[var(--ink)] bg-[var(--paper)] p-6 space-y-4">
          <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
            Review & Escrow Release Action
          </span>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                Review notes (optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add review feedback or revision notes..."
                className="w-full bg-[var(--paper)] border border-[var(--line)] p-2.5 text-[13px] text-[var(--ink)] font-sans-ledger outline-none focus:border-[var(--ink)]"
                rows={3}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions (Sentence case, ONE solid --signal primary) */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleReview('request_revision')}
                disabled={reviewing}
                className="px-4 py-2.5 border border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] font-bold uppercase transition-colors"
              >
                Request revision
              </button>

              <button
                type="button"
                onClick={() => handleReview('reject')}
                disabled={reviewing}
                className="px-4 py-2.5 border border-[var(--ink)] bg-[var(--paper)] text-[var(--signal-dark)] font-bold uppercase transition-colors"
              >
                Reject submission
              </button>

              <button
                type="button"
                onClick={() => handleReview('approve')}
                disabled={reviewing}
                className="px-6 py-2.5 bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold uppercase transition-colors"
              >
                {reviewing ? 'Processing...' : 'Approve & release payment →'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
