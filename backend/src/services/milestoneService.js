const { query } = require('../utils/dbQueries');
const logger = require('../utils/logger');
const notificationService = require('./notificationService');

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount) => {
  const numAmount = parseFloat(amount) || 0;
  return `Rs. ${numAmount.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Submit milestone for review
 * @param {string} milestoneId - Milestone ID
 * @param {string} freelancerId - Freelancer user ID
 * @param {Object} submissionData - Submission data
 * @returns {Promise<Object>} Created submission
 */
const submitMilestone = async (milestoneId, freelancerId, submissionData) => {
  try {
    logger.info('Submitting milestone', { milestoneId, freelancerId });
    
    // Get milestone and verify ownership
    const milestoneResult = await query(
      `SELECT pm.*, p.client_id, c.freelancer_id, c.id as contract_id
       FROM project_milestones pm
       JOIN projects p ON pm.project_id = p.id
       JOIN contracts c ON c.project_id = p.id
       WHERE pm.id = $1`,
      [milestoneId]
    );
    
    if (milestoneResult.rows.length === 0) {
      logger.error('Milestone not found', { milestoneId });
      throw new Error('Milestone not found');
    }
    
    const milestone = milestoneResult.rows[0];
    logger.info('Milestone found', { milestone });
    
    if (milestone.freelancer_id !== freelancerId) {
      logger.error('Unauthorized freelancer', { milestoneFreelancerId: milestone.freelancer_id, requestFreelancerId: freelancerId });
      throw new Error('Unauthorized: Only the assigned freelancer can submit this milestone');
    }
    
    if (milestone.status === 'completed') {
      logger.error('Milestone already completed', { milestoneId, status: milestone.status });
      throw new Error('Milestone is already completed');
    }
    
    if (milestone.status === 'under_review') {
      logger.error('Milestone already under review', { milestoneId, status: milestone.status });
      throw new Error('Milestone is already under review');
    }
    
    // Get time entries for this milestone
    logger.info('Fetching time entries', { contractId: milestone.contract_id, projectId: milestone.project_id });
    
    // Get the most recent completed milestone date, or contract start date if no milestones completed
    const lastCompletedResult = await query(
      `SELECT MAX(pm.completed_at) as last_completed
       FROM project_milestones pm
       WHERE pm.project_id = $1 AND pm.status = 'completed'`,
      [milestone.project_id]
    );
    
    const contractResult = await query(
      `SELECT created_at FROM contracts WHERE id = $1`,
      [milestone.contract_id]
    );
    
    const startDate = lastCompletedResult.rows[0]?.last_completed || contractResult.rows[0]?.created_at;
    
    logger.info('Time entries date range', { startDate });
    
    const timeEntriesResult = await query(
      `SELECT id, description, start_time, end_time, duration_minutes, 
              hourly_rate, total_amount, is_billable
       FROM time_entries
       WHERE contract_id = $1 
         AND is_billable = true
         AND status = 'approved'
         AND created_at >= $2
       ORDER BY start_time ASC`,
      [milestone.contract_id, startDate]
    );
    
    logger.info('Time entries fetched', { count: timeEntriesResult.rows.length });
    
    const timeEntries = timeEntriesResult.rows;
    const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.duration_minutes / 60), 0);
    const totalAmount = timeEntries.reduce((sum, entry) => sum + parseFloat(entry.total_amount || 0), 0);
    
    logger.info('Calculated totals', { totalHours, totalAmount });
    
    // Create submission record
    logger.info('Creating submission record', { milestoneId, freelancerId, totalHours, totalAmount });
    
    const submissionResult = await query(
      `INSERT INTO milestone_submissions (
        milestone_id, submitted_by, submission_notes, attachments,
        time_entries_snapshot, total_hours, total_amount, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *`,
      [
        milestoneId,
        freelancerId,
        submissionData.notes || null,
        JSON.stringify(submissionData.attachments || []),
        JSON.stringify(timeEntries),
        totalHours,
        totalAmount
      ]
    );
    
    const submission = submissionResult.rows[0];
    logger.info('Submission record created', { submissionId: submission.id });
    
    // Link uploaded files to milestone
    if (submissionData.fileIds && submissionData.fileIds.length > 0) {
      logger.info('Linking files to milestone', { milestoneId, fileCount: submissionData.fileIds.length });
      
      await query(
        'UPDATE files SET milestone_id = $1, project_id = $2 WHERE id = ANY($3) AND uploaded_by = $4 AND status = $5',
        [milestoneId, milestone.project_id, submissionData.fileIds, freelancerId, 'active']
      );
    }
    
    // Update milestone status to under_review
    await query(
      'UPDATE project_milestones SET status = $1 WHERE id = $2',
      ['under_review', milestoneId]
    );
    
    // Create notification for client
    try {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, project_id, contract_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          milestone.client_id,
          'milestone_submitted',
          'Milestone Submitted for Review',
          `A milestone "${milestone.title}" has been submitted for your review`,
          milestone.project_id,
          milestone.contract_id
        ]
      );
      logger.info('Notification created for client', { clientId: milestone.client_id, milestoneId });
    } catch (notifError) {
      logger.error('Failed to create notification', { error: notifError.message });
      // Don't fail the submission if notification fails
    }
    
    logger.info('Milestone submitted successfully', { 
      milestoneId, 
      submissionId: submission.id,
      totalHours,
      totalAmount
    });
    
    return formatSubmissionResponse(submission);
  } catch (error) {
    logger.error('Error submitting milestone', { 
      milestoneId, 
      error: error.message,
      stack: error.stack,
      errorDetails: error
    });
    throw error;
  }
};

/**
 * Review milestone submission (approve/reject)
 * @param {string} submissionId - Submission ID
 * @param {string} clientId - Client user ID
 * @param {Object} reviewData - Review data
 * @returns {Promise<Object>} Updated submission
 */
const reviewMilestoneSubmission = async (submissionId, clientId, reviewData) => {
  try {
    logger.info('Reviewing milestone submission', { submissionId, clientId, action: reviewData.action });
    
    // Get submission and verify ownership
    const submissionResult = await query(
      `SELECT ms.*, pm.project_id, p.client_id, pm.amount as milestone_amount,
              c.id as contract_id, c.freelancer_id
       FROM milestone_submissions ms
       JOIN project_milestones pm ON ms.milestone_id = pm.id
       JOIN projects p ON pm.project_id = p.id
       JOIN contracts c ON c.project_id = p.id
       WHERE ms.id = $1`,
      [submissionId]
    );
    
    if (submissionResult.rows.length === 0) {
      throw new Error('Submission not found');
    }
    
    const submission = submissionResult.rows[0];
    
    if (submission.client_id !== clientId) {
      throw new Error('Unauthorized: Only the project client can review this submission');
    }
    
    if (submission.status !== 'pending') {
      throw new Error('Submission has already been reviewed');
    }
    
    const { action, notes } = reviewData; // action: 'approve', 'reject', 'request_revision'
    
    if (!['approve', 'reject', 'request_revision'].includes(action)) {
      throw new Error('Invalid action. Must be approve, reject, or request_revision');
    }
    
    let newStatus = action === 'approve' ? 'approved' : 
                    action === 'reject' ? 'rejected' : 'revision_requested';
    
    // Update submission
    const updateResult = await query(
      `UPDATE milestone_submissions
       SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP,
           review_notes = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [newStatus, clientId, notes || null, submissionId]
    );
    
    const updatedSubmission = updateResult.rows[0];
    
    // Handle different actions
    if (action === 'approve') {
      // Update milestone status to completed
      await query(
        `UPDATE project_milestones
         SET status = 'completed', completed_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [submission.milestone_id]
      );
      
      // Find and release escrow for this milestone
      const escrowResult = await query(
        `SELECT id, amount, net_amount FROM escrow 
         WHERE milestone_id = $1 AND status = 'held'
         LIMIT 1`,
        [submission.milestone_id]
      );
      
      if (escrowResult.rows.length > 0) {
        const escrow = escrowResult.rows[0];
        
        // Release escrow to freelancer
        await query(
          `UPDATE escrow 
           SET status = 'released', 
               released_at = CURRENT_TIMESTAMP,
               release_note = $1
           WHERE id = $2`,
          [`Milestone "${submission.milestone_id}" approved and completed`, escrow.id]
        );
        
        logger.info('Escrow automatically released for approved milestone', { 
          milestoneId: submission.milestone_id, 
          escrowId: escrow.id 
        });
        
        // Send payment received notification to freelancer
        try {
          await query(
            `INSERT INTO notifications (user_id, type, title, message, project_id, contract_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              submission.freelancer_id,
              'payment_received',
              'Payment Received!',
              `You received ${formatCurrency(escrow.net_amount)} for completing the milestone. Funds have been released to your account.`,
              submission.project_id,
              submission.contract_id
            ]
          );
          logger.info('Payment notification sent to freelancer', { 
            freelancerId: submission.freelancer_id,
            amount: escrow.net_amount
          });
        } catch (notifError) {
          logger.error('Failed to create payment notification', { error: notifError.message });
        }
      } else {
        logger.warn('No held escrow found for milestone', { milestoneId: submission.milestone_id });
      }
      
      // Send milestone approved notification to freelancer
      try {
        await query(
          `INSERT INTO notifications (user_id, type, title, message, project_id, contract_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            submission.freelancer_id,
            'milestone_approved',
            'Milestone Approved!',
            `Your milestone submission has been approved by the client. Great work!`,
            submission.project_id,
            submission.contract_id
          ]
        );
        logger.info('Milestone approved notification sent to freelancer', { 
          freelancerId: submission.freelancer_id,
          milestoneId: submission.milestone_id
        });
      } catch (notifError) {
        logger.error('Failed to create milestone approved notification', { error: notifError.message });
      }
      
      // Check if all milestones are completed
      const milestonesCheck = await query(
        `SELECT COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'completed') as completed
         FROM project_milestones
         WHERE project_id = $1`,
        [submission.project_id]
      );
      
      const { total, completed } = milestonesCheck.rows[0];
      
      // If all milestones are completed, mark contract and project as completed
      if (parseInt(total) === parseInt(completed) && parseInt(total) > 0) {
        logger.info('All milestones completed, marking contract and project as completed', {
          projectId: submission.project_id,
          contractId: submission.contract_id
        });
        
        // Update contract status
        await query(
          `UPDATE contracts
           SET status = 'completed', completed_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [submission.contract_id]
        );
        
        // Update project status
        await query(
          `UPDATE projects
           SET status = 'completed', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [submission.project_id]
        );
        
        logger.info('Contract and project marked as completed', {
          projectId: submission.project_id,
          contractId: submission.contract_id
        });
      }
      
      // Note: Approval notification created automatically by database trigger
    } else if (action === 'request_revision') {
      // Create revision request
      await query(
        `INSERT INTO milestone_revisions (
          milestone_id, submission_id, requested_by, revision_notes
        ) VALUES ($1, $2, $3, $4)`,
        [submission.milestone_id, submissionId, clientId, notes]
      );
      
      // Send revision request notification to freelancer
      try {
        await query(
          `INSERT INTO notifications (user_id, type, title, message, project_id, contract_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            submission.freelancer_id,
            'milestone_revision_requested',
            'Revision Requested',
            `The client has requested revisions for your milestone submission. ${notes ? 'Notes: ' + notes : 'Please check the details and resubmit.'}`,
            submission.project_id,
            submission.contract_id
          ]
        );
        logger.info('Revision request notification sent to freelancer', { 
          freelancerId: submission.freelancer_id,
          milestoneId: submission.milestone_id
        });
      } catch (notifError) {
        logger.error('Failed to create revision request notification', { error: notifError.message });
      }
      
      // Note: Revision notification created automatically by database trigger
    } else if (action === 'reject') {
      // Send rejection notification to freelancer
      try {
        await query(
          `INSERT INTO notifications (user_id, type, title, message, project_id, contract_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            submission.freelancer_id,
            'milestone_rejected',
            'Milestone Rejected',
            `Your milestone submission has been rejected by the client. ${notes ? 'Reason: ' + notes : 'Please contact the client for more details.'}`,
            submission.project_id,
            submission.contract_id
          ]
        );
        logger.info('Milestone rejection notification sent to freelancer', { 
          freelancerId: submission.freelancer_id,
          milestoneId: submission.milestone_id
        });
      } catch (notifError) {
        logger.error('Failed to create rejection notification', { error: notifError.message });
      }
      
      // Note: Rejection notification created automatically by database trigger
    }
    
    logger.info('Milestone submission reviewed', { submissionId, action });
    
    return formatSubmissionResponse(updatedSubmission);
  } catch (error) {
    logger.error('Error reviewing milestone submission', { submissionId, error: error.message });
    throw error;
  }
};

/**
 * Get milestone submissions
 * @param {string} milestoneId - Milestone ID
 * @param {string} userId - Current user ID
 * @returns {Promise<Array>} Submissions list
 */
const getMilestoneSubmissions = async (milestoneId, userId) => {
  try {
    logger.info('Getting milestone submissions', { milestoneId, userId });
    
    // Verify access
    const accessResult = await query(
      `SELECT pm.id, p.client_id, c.freelancer_id
       FROM project_milestones pm
       JOIN projects p ON pm.project_id = p.id
       JOIN contracts c ON c.project_id = p.id
       WHERE pm.id = $1`,
      [milestoneId]
    );
    
    if (accessResult.rows.length === 0) {
      throw new Error('Milestone not found');
    }
    
    const milestone = accessResult.rows[0];
    
    if (milestone.client_id !== userId && milestone.freelancer_id !== userId) {
      throw new Error('Unauthorized: You do not have access to this milestone');
    }
    
    // Get submissions
    const result = await query(
      `SELECT ms.*,
              u.full_name as submitted_by_name,
              u.avatar_url as submitted_by_avatar,
              r.full_name as reviewed_by_name
       FROM milestone_submissions ms
       JOIN users u ON ms.submitted_by = u.id
       LEFT JOIN users r ON ms.reviewed_by = r.id
       WHERE ms.milestone_id = $1
       ORDER BY ms.created_at DESC`,
      [milestoneId]
    );
    
    // Fetch uploaded files for each submission
    const submissionsWithFiles = await Promise.all(
      result.rows.map(async (submission) => {
        const filesResult = await query(
          `SELECT id, original_name, file_path, file_url, file_size, mime_type, category, created_at
           FROM files
           WHERE milestone_id = $1 AND status = 'active'
           ORDER BY created_at ASC`,
          [milestoneId]
        );
        
        logger.info('Files fetched for milestone', { 
          milestoneId, 
          submissionId: submission.id,
          fileCount: filesResult.rows.length,
          files: filesResult.rows.map(f => ({ id: f.id, name: f.original_name }))
        });
        
        return {
          ...submission,
          deliverableFiles: filesResult.rows
        };
      })
    );
    
    logger.info('Milestone submissions retrieved', { milestoneId, count: submissionsWithFiles.length });
    
    return submissionsWithFiles.map(formatSubmissionWithDetailsResponse);
  } catch (error) {
    logger.error('Error getting milestone submissions', { milestoneId, error: error.message });
    throw error;
  }
};

/**
 * Get milestone revisions
 * @param {string} milestoneId - Milestone ID
 * @param {string} userId - Current user ID
 * @returns {Promise<Array>} Revisions list
 */
const getMilestoneRevisions = async (milestoneId, userId) => {
  try {
    logger.info('Getting milestone revisions', { milestoneId, userId });
    
    // Verify access
    const accessResult = await query(
      `SELECT pm.id, p.client_id, c.freelancer_id
       FROM project_milestones pm
       JOIN projects p ON pm.project_id = p.id
       JOIN contracts c ON c.project_id = p.id
       WHERE pm.id = $1`,
      [milestoneId]
    );
    
    if (accessResult.rows.length === 0) {
      throw new Error('Milestone not found');
    }
    
    const milestone = accessResult.rows[0];
    
    if (milestone.client_id !== userId && milestone.freelancer_id !== userId) {
      throw new Error('Unauthorized: You do not have access to this milestone');
    }
    
    // Get revisions
    const result = await query(
      `SELECT mr.*,
              u.full_name as requested_by_name,
              u.avatar_url as requested_by_avatar,
              r.full_name as resolved_by_name
       FROM milestone_revisions mr
       JOIN users u ON mr.requested_by = u.id
       LEFT JOIN users r ON mr.resolved_by = r.id
       WHERE mr.milestone_id = $1
       ORDER BY mr.created_at DESC`,
      [milestoneId]
    );
    
    logger.info('Milestone revisions retrieved', { milestoneId, count: result.rows.length });
    
    return result.rows.map(formatRevisionResponse);
  } catch (error) {
    logger.error('Error getting milestone revisions', { milestoneId, error: error.message });
    throw error;
  }
};

/**
 * Mark revision as resolved
 * @param {string} revisionId - Revision ID
 * @param {string} freelancerId - Freelancer user ID
 * @returns {Promise<Object>} Updated revision
 */
const resolveRevision = async (revisionId, freelancerId) => {
  try {
    logger.info('Resolving revision', { revisionId, freelancerId });
    
    // Verify ownership
    const revisionResult = await query(
      `SELECT mr.*, pm.project_id, c.freelancer_id
       FROM milestone_revisions mr
       JOIN project_milestones pm ON mr.milestone_id = pm.id
       JOIN contracts c ON c.project_id = pm.project_id
       WHERE mr.id = $1`,
      [revisionId]
    );
    
    if (revisionResult.rows.length === 0) {
      throw new Error('Revision not found');
    }
    
    const revision = revisionResult.rows[0];
    
    if (revision.freelancer_id !== freelancerId) {
      throw new Error('Unauthorized: Only the assigned freelancer can resolve this revision');
    }
    
    if (revision.resolved) {
      throw new Error('Revision is already resolved');
    }
    
    // Update revision
    const result = await query(
      `UPDATE milestone_revisions
       SET resolved = true, resolved_at = CURRENT_TIMESTAMP,
           resolved_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [freelancerId, revisionId]
    );
    
    logger.info('Revision resolved', { revisionId });
    
    return formatRevisionResponse(result.rows[0]);
  } catch (error) {
    logger.error('Error resolving revision', { revisionId, error: error.message });
    throw error;
  }
};

/**
 * Format submission response
 */
const formatSubmissionResponse = (submission) => {
  return {
    id: submission.id,
    milestoneId: submission.milestone_id,
    submittedBy: submission.submitted_by,
    submissionNotes: submission.submission_notes,
    attachments: submission.attachments,
    timeEntriesSnapshot: submission.time_entries_snapshot,
    totalHours: parseFloat(submission.total_hours),
    totalAmount: parseFloat(submission.total_amount),
    status: submission.status,
    reviewedBy: submission.reviewed_by,
    reviewedAt: submission.reviewed_at,
    reviewNotes: submission.review_notes,
    createdAt: submission.created_at,
    updatedAt: submission.updated_at
  };
};

/**
 * Format submission with details response
 */
const formatSubmissionWithDetailsResponse = (submission) => {
  return {
    ...formatSubmissionResponse(submission),
    submittedByName: submission.submitted_by_name,
    submittedByAvatar: submission.submitted_by_avatar,
    reviewedByName: submission.reviewed_by_name,
    deliverableFiles: submission.deliverableFiles || []
  };
};

/**
 * Format revision response
 */
const formatRevisionResponse = (revision) => {
  return {
    id: revision.id,
    milestoneId: revision.milestone_id,
    submissionId: revision.submission_id,
    requestedBy: revision.requested_by,
    requestedByName: revision.requested_by_name,
    requestedByAvatar: revision.requested_by_avatar,
    revisionNotes: revision.revision_notes,
    resolved: revision.resolved,
    resolvedAt: revision.resolved_at,
    resolvedBy: revision.resolved_by,
    resolvedByName: revision.resolved_by_name,
    createdAt: revision.created_at,
    updatedAt: revision.updated_at
  };
};

module.exports = {
  submitMilestone,
  reviewMilestoneSubmission,
  getMilestoneSubmissions,
  getMilestoneRevisions,
  resolveRevision
};
