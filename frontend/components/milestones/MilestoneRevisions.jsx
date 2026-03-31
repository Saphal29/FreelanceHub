'use client';

import { useState, useEffect } from 'react';
import { getMilestoneRevisions, resolveMilestoneRevision } from '@/lib/api';

export default function MilestoneRevisions({ milestone, userRole }) {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRevisions();
  }, [milestone.id]);

  const loadRevisions = async () => {
    try {
      setLoading(true);
      const response = await getMilestoneRevisions(milestone.id);
      if (response.success) {
        setRevisions(response.revisions);
      }
    } catch (err) {
      setError('Failed to load revisions');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (revisionId) => {
    setError('');
    setResolving(revisionId);

    try {
      const response = await resolveMilestoneRevision(revisionId);
      if (response.success) {
        loadRevisions(); // Reload to show updated status
      }
    } catch (err) {
      setError(err.message || 'Failed to resolve revision');
    } finally {
      setResolving(null);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading revisions...</div>;
  }

  if (revisions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-600 text-sm">No revision requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Revision Requests</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {revisions.map((revision) => (
          <div
            key={revision.id}
            className={`border rounded-lg p-4 ${
              revision.resolved
                ? 'bg-gray-50 border-gray-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  revision.resolved
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {revision.resolved ? '✓ Resolved' : '⚠ Pending'}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(revision.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              {!revision.resolved && userRole === 'freelancer' && (
                <button
                  onClick={() => handleResolve(revision.id)}
                  disabled={resolving === revision.id}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {resolving === revision.id ? 'Resolving...' : 'Mark as Resolved'}
                </button>
              )}
            </div>

            <div className="mb-2">
              <p className="text-sm text-gray-500">Requested by {revision.requestedByName}</p>
            </div>

            <div className="bg-white rounded p-3 mb-2">
              <p className="text-gray-700">{revision.revisionNotes}</p>
            </div>

            {revision.resolved && (
              <div className="text-sm text-gray-500">
                Resolved by {revision.resolvedByName} on {new Date(revision.resolvedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {revisions.some(r => !r.resolved) && userRole === 'freelancer' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> Address the revision requests and mark them as resolved before resubmitting the milestone.
          </p>
        </div>
      )}
    </div>
  );
}
