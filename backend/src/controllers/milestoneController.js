const milestoneService = require('../services/milestoneService');
const logger = require('../utils/logger');

/**
 * Submit milestone for review
 * @route POST /api/milestones/:milestoneId/submit
 */
const submitMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const freelancerId = req.user.userId;
    const submissionData = req.body;
    
    logger.info('Submit milestone request', { milestoneId, freelancerId });
    
    const submission = await milestoneService.submitMilestone(
      milestoneId,
      freelancerId,
      submissionData
    );
    
    logger.info('Milestone submitted successfully', { milestoneId, submissionId: submission.id });
    
    res.status(201).json({
      success: true,
      message: 'Milestone submitted for review',
      submission
    });
  } catch (error) {
    logger.error('Error submitting milestone', {
      milestoneId: req.params.milestoneId,
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'MILESTONE_NOT_FOUND'
      });
    }
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'UNAUTHORIZED'
      });
    }
    
    if (error.message.includes('already')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'INVALID_STATUS'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to submit milestone',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Review milestone submission
 * @route POST /api/milestones/submissions/:submissionId/review
 */
const reviewSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const clientId = req.user.userId;
    const reviewData = req.body;
    
    logger.info('Review submission request', { submissionId, clientId, action: reviewData.action });
    
    const submission = await milestoneService.reviewMilestoneSubmission(
      submissionId,
      clientId,
      reviewData
    );
    
    logger.info('Submission reviewed successfully', { submissionId, action: reviewData.action });
    
    res.json({
      success: true,
      message: `Milestone ${reviewData.action}d successfully`,
      submission
    });
  } catch (error) {
    logger.error('Error reviewing submission', {
      submissionId: req.params.submissionId,
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'SUBMISSION_NOT_FOUND'
      });
    }
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'UNAUTHORIZED'
      });
    }
    
    if (error.message.includes('Invalid action')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'INVALID_ACTION'
      });
    }
    
    if (error.message.includes('already been reviewed')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'ALREADY_REVIEWED'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to review submission',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get milestone submissions
 * @route GET /api/milestones/:milestoneId/submissions
 */
const getSubmissions = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const userId = req.user.userId;
    
    logger.info('Get submissions request', { milestoneId, userId });
    
    const submissions = await milestoneService.getMilestoneSubmissions(milestoneId, userId);
    
    logger.info('Submissions retrieved successfully', { milestoneId, count: submissions.length });
    
    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    logger.error('Error getting submissions', {
      milestoneId: req.params.milestoneId,
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'MILESTONE_NOT_FOUND'
      });
    }
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'UNAUTHORIZED'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve submissions',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get milestone revisions
 * @route GET /api/milestones/:milestoneId/revisions
 */
const getRevisions = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const userId = req.user.userId;
    
    logger.info('Get revisions request', { milestoneId, userId });
    
    const revisions = await milestoneService.getMilestoneRevisions(milestoneId, userId);
    
    logger.info('Revisions retrieved successfully', { milestoneId, count: revisions.length });
    
    res.json({
      success: true,
      revisions
    });
  } catch (error) {
    logger.error('Error getting revisions', {
      milestoneId: req.params.milestoneId,
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'MILESTONE_NOT_FOUND'
      });
    }
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'UNAUTHORIZED'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve revisions',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Resolve revision
 * @route POST /api/milestones/revisions/:revisionId/resolve
 */
const resolveRevision = async (req, res) => {
  try {
    const { revisionId } = req.params;
    const freelancerId = req.user.userId;
    
    logger.info('Resolve revision request', { revisionId, freelancerId });
    
    const revision = await milestoneService.resolveRevision(revisionId, freelancerId);
    
    logger.info('Revision resolved successfully', { revisionId });
    
    res.json({
      success: true,
      message: 'Revision marked as resolved',
      revision
    });
  } catch (error) {
    logger.error('Error resolving revision', {
      revisionId: req.params.revisionId,
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'REVISION_NOT_FOUND'
      });
    }
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'UNAUTHORIZED'
      });
    }
    
    if (error.message.includes('already resolved')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'ALREADY_RESOLVED'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to resolve revision',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  submitMilestone,
  reviewSubmission,
  getSubmissions,
  getRevisions,
  resolveRevision
};
