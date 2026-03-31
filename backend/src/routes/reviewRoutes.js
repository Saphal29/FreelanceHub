const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// ============================================
// REVIEW ROUTES
// ============================================

/**
 * @route   POST /api/reviews
 * @desc    Submit a review for a completed contract
 * @access  Private
 */
router.post(
  '/',
  authMiddleware,
  reviewController.submitReview
);

/**
 * @route   GET /api/reviews/received
 * @desc    Get reviews received by current user
 * @access  Private
 */
router.get(
  '/received',
  authMiddleware,
  reviewController.getReceivedReviews
);

/**
 * @route   GET /api/reviews/given
 * @desc    Get reviews given by current user
 * @access  Private
 */
router.get(
  '/given',
  authMiddleware,
  reviewController.getGivenReviews
);

/**
 * @route   GET /api/reviews/can-review/:contractId
 * @desc    Check if user can review a contract
 * @access  Private
 */
router.get(
  '/can-review/:contractId',
  authMiddleware,
  reviewController.checkCanReview
);

/**
 * @route   GET /api/reviews/user/:userId
 * @desc    Get reviews for a specific user (public)
 * @access  Public
 */
router.get(
  '/user/:userId',
  reviewController.getUserReviews
);

/**
 * @route   GET /api/reviews/stats/:userId
 * @desc    Get rating statistics for a user
 * @access  Public
 */
router.get(
  '/stats/:userId',
  reviewController.getUserRatingStats
);

/**
 * @route   POST /api/reviews/:id/respond
 * @desc    Respond to a review
 * @access  Private (Reviewee only)
 */
router.post(
  '/:id/respond',
  authMiddleware,
  reviewController.respondToReview
);

/**
 * @route   POST /api/reviews/:id/flag
 * @desc    Flag a review as inappropriate
 * @access  Private
 */
router.post(
  '/:id/flag',
  authMiddleware,
  reviewController.flagReview
);

module.exports = router;
