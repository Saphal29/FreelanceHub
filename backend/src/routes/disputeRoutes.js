const express = require('express');
const router = express.Router();
const disputeController = require('../controllers/disputeController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// ============================================
// DISPUTE ROUTES
// ============================================

/**
 * @route   POST /api/disputes
 * @desc    File a new dispute
 * @access  Private (Client or Freelancer)
 */
router.post(
  '/',
  authMiddleware,
  disputeController.fileDispute
);

/**
 * @route   GET /api/disputes
 * @desc    Get disputes for current user
 * @access  Private
 */
router.get(
  '/',
  authMiddleware,
  disputeController.getUserDisputes
);

/**
 * @route   GET /api/disputes/:id
 * @desc    Get dispute by ID
 * @access  Private (Parties involved or mediator)
 */
router.get(
  '/:id',
  authMiddleware,
  disputeController.getDisputeById
);

/**
 * @route   POST /api/disputes/:id/evidence
 * @desc    Upload evidence for dispute
 * @access  Private (Parties involved or mediator)
 */
router.post(
  '/:id/evidence',
  authMiddleware,
  disputeController.uploadEvidence
);

/**
 * @route   GET /api/disputes/:id/evidence
 * @desc    Get evidence for dispute
 * @access  Private (Parties involved or mediator)
 */
router.get(
  '/:id/evidence',
  authMiddleware,
  disputeController.getDisputeEvidence
);

/**
 * @route   POST /api/disputes/:id/messages
 * @desc    Send message in dispute thread
 * @access  Private (Parties involved or mediator)
 */
router.post(
  '/:id/messages',
  authMiddleware,
  disputeController.sendDisputeMessage
);

/**
 * @route   GET /api/disputes/:id/messages
 * @desc    Get messages for dispute
 * @access  Private (Parties involved or mediator)
 */
router.get(
  '/:id/messages',
  authMiddleware,
  disputeController.getDisputeMessages
);

/**
 * @route   POST /api/disputes/:id/assign-mediator
 * @desc    Assign mediator to dispute
 * @access  Private (Admin only - will be restricted in admin panel)
 */
router.post(
  '/:id/assign-mediator',
  authMiddleware,
  disputeController.assignMediator
);

/**
 * @route   POST /api/disputes/:id/resolve
 * @desc    Resolve dispute
 * @access  Private (Mediator only)
 */
router.post(
  '/:id/resolve',
  authMiddleware,
  disputeController.resolveDispute
);

/**
 * @route   POST /api/disputes/:id/close
 * @desc    Close dispute
 * @access  Private (Parties involved or mediator)
 */
router.post(
  '/:id/close',
  authMiddleware,
  disputeController.closeDispute
);

/**
 * @route   GET /api/disputes/:id/timeline
 * @desc    Get dispute timeline
 * @access  Private (Parties involved or mediator)
 */
router.get(
  '/:id/timeline',
  authMiddleware,
  disputeController.getDisputeTimeline
);

module.exports = router;
