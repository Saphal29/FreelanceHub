'use client';

import { useState } from 'react';
import MilestoneSubmission from './MilestoneSubmission';
import MilestoneReview from './MilestoneReview';
import MilestoneRevisions from './MilestoneRevisions';

export default function MilestoneCard({ milestone, userRole, onUpdate }) {
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'under_review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSubmitSuccess = (submission) => {
    onUpdate?.();
    setActiveTab('review');
  };

  const handleReviewComplete = (submission) => {
    onUpdate?.();
    setActiveTab('overview');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Milestone Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{milestone.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(milestone.status)}`}>
                {milestone.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            {milestone.description && (
              <p className="text-gray-600 text-sm mb-3">{milestone.description}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              NPR {milestone.amount ? parseFloat(milestone.amount).toFixed(2) : '0.00'}
            </p>
            {milestone.dueDate && (
              <p className="text-sm text-gray-500 mt-1">
                Due: {new Date(milestone.dueDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Milestone Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {milestone.revisionCount > 0 && (
            <div className="text-center p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Revisions</p>
              <p className="text-lg font-semibold text-gray-900">{milestone.revisionCount}</p>
            </div>
          )}
          {milestone.totalTimeTracked > 0 && (
            <div className="text-center p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Time Tracked</p>
              <p className="text-lg font-semibold text-gray-900">
                {milestone.totalTimeTracked ? (parseFloat(milestone.totalTimeTracked) / 60).toFixed(1) : '0.0'} hrs
              </p>
            </div>
          )}
          {milestone.completedAt && (
            <div className="text-center p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(milestone.completedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
        >
          {showDetails ? '▲ Hide Details' : '▼ Show Details'}
        </button>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="border-t border-gray-200 p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            
            {userRole === 'freelancer' && milestone.status !== 'completed' && (
              <button
                onClick={() => setActiveTab('submit')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'submit'
                    ? 'text-amber-600 border-b-2 border-amber-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Submit
              </button>
            )}
            
            {userRole === 'client' && milestone.status === 'under_review' && (
              <button
                onClick={() => setActiveTab('review')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'review'
                    ? 'text-amber-600 border-b-2 border-amber-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Review
              </button>
            )}
            
            {milestone.revisionCount > 0 && (
              <button
                onClick={() => setActiveTab('revisions')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'revisions'
                    ? 'text-amber-600 border-b-2 border-amber-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Revisions ({milestone.revisionCount})
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Milestone Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p className="font-medium">{milestone.status.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Amount</p>
                      <p className="font-medium">
                        NPR {milestone.amount ? parseFloat(milestone.amount).toFixed(2) : '0.00'}
                      </p>
                    </div>
                    {milestone.dueDate && (
                      <div>
                        <p className="text-gray-500">Due Date</p>
                        <p className="font-medium">{new Date(milestone.dueDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="font-medium">{new Date(milestone.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {milestone.submissionNotes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Latest Submission Notes</h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{milestone.submissionNotes}</p>
                    </div>
                  </div>
                )}

                {milestone.reviewNotes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Review Feedback</h4>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{milestone.reviewNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'submit' && userRole === 'freelancer' && (
              <MilestoneSubmission
                milestone={milestone}
                onSubmitSuccess={handleSubmitSuccess}
              />
            )}

            {activeTab === 'review' && userRole === 'client' && (
              <MilestoneReview
                milestone={milestone}
                onReviewComplete={handleReviewComplete}
              />
            )}

            {activeTab === 'revisions' && (
              <MilestoneRevisions
                milestone={milestone}
                userRole={userRole}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
