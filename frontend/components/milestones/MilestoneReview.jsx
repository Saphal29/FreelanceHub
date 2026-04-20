'use client';

import { useState, useEffect } from 'react';
import { getMilestoneSubmissions, reviewMilestoneSubmission } from '@/lib/api';

export default function MilestoneReview({ milestone, onReviewComplete }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewAction, setReviewAction] = useState('');
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
        setSubmissions(response.submissions);
        // Auto-select the latest pending submission
        const pending = response.submissions.find(s => s.status === 'pending');
        if (pending) {
          setSelectedSubmission(pending);
        }
      }
    } catch (err) {
      setError('Failed to load submissions');
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
        action, // 'approve', 'reject', 'request_revision'
        notes: reviewNotes.trim() || null
      };

      const response = await reviewMilestoneSubmission(selectedSubmission.id, reviewData);
      
      if (response.success) {
        onReviewComplete?.(response.submission);
        loadSubmissions(); // Reload to show updated status
        setReviewNotes('');
        setReviewAction('');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading submissions...</div>;
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No submissions yet. Waiting for freelancer to submit work.</p>
      </div>
    );
  }

  const pendingSubmission = submissions.find(s => s.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Submission Details */}
      {selectedSubmission && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Submission Details</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedSubmission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              selectedSubmission.status === 'approved' ? 'bg-green-100 text-green-800' :
              selectedSubmission.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {selectedSubmission.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Submitted by</p>
              <p className="font-medium">{selectedSubmission.submittedByName}</p>
              <p className="text-sm text-gray-500">
                {new Date(selectedSubmission.createdAt).toLocaleString()}
              </p>
            </div>

            {selectedSubmission.submissionNotes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Notes</p>
                <p className="text-gray-700">{selectedSubmission.submissionNotes}</p>
              </div>
            )}

            {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Attachments</p>
                <div className="space-y-1">
                  {selectedSubmission.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:text-blue-800 text-sm"
                    >
                      📎 {attachment.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Deliverable Files */}
            {selectedSubmission.deliverableFiles && selectedSubmission.deliverableFiles.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Deliverable Files</p>
                <div className="space-y-2">
                  {selectedSubmission.deliverableFiles.map((file) => {
                    const fileUrl = file.file_url || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/files/${file.id}/download`;
                    const fileSizeKB = (file.file_size / 1024).toFixed(2);
                    const fileSizeMB = (file.file_size / (1024 * 1024)).toFixed(2);
                    const displaySize = file.file_size > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;
                    
                    // Get file icon based on mime type
                    const getFileIcon = (mimeType) => {
                      if (mimeType.startsWith('image/')) return '🖼️';
                      if (mimeType.startsWith('video/')) return '🎥';
                      if (mimeType.includes('pdf')) return '📄';
                      if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
                      if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
                      if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
                      if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return '📦';
                      return '📎';
                    };

                    return (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-2xl">{getFileIcon(file.mime_type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{file.original_name}</p>
                            <p className="text-xs text-gray-500">
                              {displaySize} • {new Date(file.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <a
                          href={fileUrl}
                          download
                          className="ml-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                        >
                          Download
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Time Tracking Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Time Tracking Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Hours</p>
                  <p className="text-lg font-semibold">{selectedSubmission.totalHours?.toFixed(2) || 0} hrs</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-lg font-semibold">NPR {selectedSubmission.totalAmount?.toFixed(2) || 0}</p>
                </div>
              </div>
              
              {selectedSubmission.timeEntriesSnapshot && selectedSubmission.timeEntriesSnapshot.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Time Entries ({selectedSubmission.timeEntriesSnapshot.length})</p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {selectedSubmission.timeEntriesSnapshot.map((entry, index) => (
                      <div key={index} className="text-sm bg-white p-2 rounded border border-gray-200">
                        <div className="flex justify-between">
                          <span className="text-gray-700">{entry.description || 'No description'}</span>
                          <span className="font-medium">{(entry.duration_minutes / 60).toFixed(2)} hrs</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(entry.start_time).toLocaleString()} - {new Date(entry.end_time).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Actions (only for pending submissions) */}
      {pendingSubmission && selectedSubmission?.status === 'pending' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Review Submission</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add feedback or comments..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleReview('approve')}
                disabled={reviewing}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {reviewing ? 'Processing...' : '✓ Approve & Release Payment'}
              </button>
              
              <button
                onClick={() => handleReview('request_revision')}
                disabled={reviewing}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {reviewing ? 'Processing...' : '↻ Request Revision'}
              </button>
              
              <button
                onClick={() => handleReview('reject')}
                disabled={reviewing}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {reviewing ? 'Processing...' : '✗ Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission History */}
      {submissions.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Submission History</h3>
          <div className="space-y-2">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                onClick={() => setSelectedSubmission(submission)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedSubmission?.id === submission.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{new Date(submission.createdAt).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">
                      {submission.totalHours?.toFixed(2)} hrs • NPR {submission.totalAmount?.toFixed(2)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                    submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {submission.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
