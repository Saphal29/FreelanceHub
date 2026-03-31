'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MilestoneCard from '@/components/milestones/MilestoneCard';
import { getMilestones } from '@/lib/api';

export default function MilestonesDemo() {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projectId, setProjectId] = useState('');

  const loadMilestones = async () => {
    if (!projectId.trim()) {
      setError('Please enter a project ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await getMilestones(projectId);
      if (response.success) {
        setMilestones(response.milestones || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  const handleMilestoneUpdate = () => {
    loadMilestones();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in to view milestones</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Milestone Submission & Approval Demo
          </h1>
          <p className="text-gray-600 mb-4">
            Test the milestone workflow as a {user.role}
          </p>

          {/* Project ID Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Enter Project ID (UUID)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={loadMilestones}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Load Milestones'}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-900">
            <strong>Logged in as:</strong> {user.fullName} ({user.role})
          </p>
          <p className="text-blue-700 text-sm mt-1">
            {user.role === 'freelancer' 
              ? '✓ You can submit milestones for review'
              : '✓ You can review and approve milestone submissions'}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">How to Test</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">As Freelancer:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Enter a project ID where you're the assigned freelancer</li>
                <li>Click "Load Milestones" to see available milestones</li>
                <li>Expand a milestone and go to "Submit" tab</li>
                <li>Add submission notes and attachments (optional)</li>
                <li>Click "Submit for Review"</li>
                <li>The milestone status will change to "UNDER_REVIEW"</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">As Client:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Enter a project ID where you're the client</li>
                <li>Click "Load Milestones" to see submitted milestones</li>
                <li>Expand a milestone with "UNDER_REVIEW" status</li>
                <li>Go to "Review" tab to see submission details and time tracking</li>
                <li>Add review notes and choose an action:</li>
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li><strong>Approve:</strong> Marks milestone as completed and initiates payment</li>
                  <li><strong>Request Revision:</strong> Sends back to freelancer with feedback</li>
                  <li><strong>Reject:</strong> Rejects the submission</li>
                </ul>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Revision Workflow:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>When client requests revision, freelancer sees it in "Revisions" tab</li>
                <li>Freelancer addresses the feedback and marks revision as resolved</li>
                <li>Freelancer can then resubmit the milestone</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Milestones List */}
        {!loading && milestones.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Milestones ({milestones.length})
            </h2>
            {milestones.map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                userRole={user.role}
                onUpdate={handleMilestoneUpdate}
              />
            ))}
          </div>
        )}

        {!loading && milestones.length === 0 && projectId && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">No milestones found for this project</p>
          </div>
        )}

        {/* API Endpoints Reference */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">API Endpoints</h2>
          <div className="space-y-2 text-sm font-mono">
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-green-600">POST</span> /api/milestones/:milestoneId/submit
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-blue-600">GET</span> /api/milestones/:milestoneId/submissions
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-green-600">POST</span> /api/milestones/submissions/:submissionId/review
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-blue-600">GET</span> /api/milestones/:milestoneId/revisions
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-green-600">POST</span> /api/milestones/revisions/:revisionId/resolve
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
