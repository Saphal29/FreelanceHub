const reviewService = require('../services/reviewService');
const logger = require('../utils/logger');

/**
 * Submit a review
 * @route POST /api/reviews
 */
const submitReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const reviewData = req.body;
    
    logger.info('Submit review request', { userId, contractId: reviewData.contractId });
    
    const review = await reviewService.submitReview(userId, reviewData);
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    logger.error('Error submitting review', { error: error.message });
    
    if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'NOT_FOUND'
      });
    }
    
    if (error.message.includes('already reviewed')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'ALREADY_REVIEWED'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to submit review',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get reviews received by current user
 * @route GET /api/reviews/received
 */
const getReceivedReviews = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = {
      page: req.query.page,
      limit: req.query.limit
    };
    
    logger.info('Get received reviews request', { userId });
    
    const result = await reviewService.getReceivedReviews(userId, filters);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error getting received reviews', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reviews',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get reviews given by current user
 * @route GET /api/reviews/given
 */
const getGivenReviews = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = {
      page: req.query.page,
      limit: req.query.limit
    };
    
    logger.info('Get given reviews request', { userId });
    
    const result = await reviewService.getGivenReviews(userId, filters);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error getting given reviews', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reviews',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get reviews for a specific user (public)
 * @route GET /api/reviews/user/:userId
 */
const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const filters = {
      page: req.query.page,
      limit: req.query.limit
    };
    
    logger.info('Get user reviews request', { userId });
    
    const result = await reviewService.getReceivedReviews(userId, filters);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error getting user reviews', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reviews',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get rating statistics for a user
 * @route GET /api/reviews/stats/:userId
 */
const getUserRatingStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    logger.info('Get rating stats request', { userId });
    
    const stats = await reviewService.getUserRatingStats(userId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error getting rating stats', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve rating statistics',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Respond to a review
 * @route POST /api/reviews/:id/respond
 */
const respondToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { response } = req.body;
    
    logger.info('Respond to review request', { reviewId: id, userId });
    
    const review = await reviewService.respondToReview(id, userId, response);
    
    res.json({
      success: true,
      message: 'Response submitted successfully',
      review
    });
  } catch (error) {
    logger.error('Error responding to review', { error: error.message });
    
    if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'NOT_FOUND'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to submit response',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Flag a review
 * @route POST /api/reviews/:id/flag
 */
const flagReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { reason } = req.body;
    
    logger.info('Flag review request', { reviewId: id, userId });
    
    const result = await reviewService.flagReview(id, userId, reason);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Error flagging review', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Failed to flag review',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Check if user can review a contract
 * @route GET /api/reviews/can-review/:contractId
 */
const checkCanReview = async (req, res) => {
  try {
    const { contractId } = req.params;
    const userId = req.user.userId;
    
    logger.info('Check can review request', { contractId, userId });
    
    const result = await reviewService.canReviewContract(userId, contractId);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error checking review eligibility', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Failed to check review eligibility',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  submitReview,
  getReceivedReviews,
  getGivenReviews,
  getUserReviews,
  getUserRatingStats,
  respondToReview,
  flagReview,
  checkCanReview
};
