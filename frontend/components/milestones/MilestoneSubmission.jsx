'use client';

import { useState } from 'react';
import { submitMilestone } from '@/lib/api';
import FileUpload from '@/components/files/FileUpload';

export default function MilestoneSubmission({ milestone, onSubmitSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');
  const [deliverables, setDeliverables] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const submissionData = {
        notes: notes.trim() || null,
        attachments: attachments,
        fileIds: deliverables.map(f => f.file.id) // Add file IDs
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

  const handleAddAttachment = () => {
    const url = prompt('Enter attachment URL:');
    if (url) {
      setAttachments([...attachments, { url, name: url.split('/').pop() }]);
    }
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  if (milestone.status === 'completed') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800">✓ This milestone has been completed and approved</p>
      </div>
    );
  }

  if (milestone.status === 'under_review') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">⏳ This milestone is currently under review</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Submit Milestone for Review</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Submission Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe what you've completed, any challenges faced, or additional information..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments
          </label>
          <div className="space-y-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm text-gray-700 truncate">{attachment.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddAttachment}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Attachment
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deliverables *
          </label>
          <FileUpload
            category="milestone_attachment"
            maxSize={50}
            multiple={true}
            onUploadSuccess={(files) => {
              setDeliverables(files);
            }}
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload your completed work (Max 50MB per file)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> Once submitted, the client will review your work along with tracked time entries. 
          They can approve, request revisions, or reject the submission.
        </p>
      </div>
    </div>
  );
}
