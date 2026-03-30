const express = require('express');
const router = express.Router();
const milestoneController = require('../controllers/milestoneController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

// ============================================
// MILESTONE SUBMISSION ROUTES
// ============================================

/**
 * @route   POST /api/milestones/:milestoneId/submit
 * @desc    Submit milestone for review (Freelancer only)
 * @access  Private (Freelancer)
 */
router.post(
  '/:milestoneId/submit',
  authMiddleware,
  roleMiddleware(['FREELANCER']),
  milestoneController.submitMilestone
);

/**
 * @route   GET /api/milestones/:milestoneId/submissions
 * @desc    Get all submissions for a milestone
 * @access  Private (Client or Freelancer)
 */
router.get(
  '/:milestoneId/submissions',
  authMiddleware,
  milestoneController.getSubmissions
);

/**
 * @route   POST /api/milestones/submissions/:submissionId/review
 * @desc    Review milestone submission (Client only)
 * @access  Private (Client)
 */
router.post(
  '/submissions/:submissionId/review',
  authMiddleware,
  roleMiddleware(['CLIENT']),
  milestoneController.reviewSubmission
);

// ============================================
// MILESTONE REVISION ROUTES
// ============================================

/**
 * @route   GET /api/milestones/:milestoneId/revisions
 * @desc    Get all revisions for a milestone
 * @access  Private (Client or Freelancer)
 */
router.get(
  '/:milestoneId/revisions',
  authMiddleware,
  milestoneController.getRevisions
);

/**
 * @route   POST /api/milestones/revisions/:revisionId/resolve
 * @desc    Mark revision as resolved (Freelancer only)
 * @access  Private (Freelancer)
 */
router.post(
  '/revisions/:revisionId/resolve',
  authMiddleware,
  roleMiddleware(['FREELANCER']),
  milestoneController.resolveRevision
);

module.exports = router;
