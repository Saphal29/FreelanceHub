const { query } = require('../utils/dbQueries');
const logger = require('../utils/logger');

/**
 * Submit a review for a completed contract
 */
const submitReview = async (userId, reviewData) => {
  try {
    logger.info('Submitting review', { userId, contractId: reviewData.contractId });
    
    // Verify contract exists and is completed
    const contractResult = await query(
      `SELECT c.id, c.status, c.project_id, c.client_id, c.freelancer_id
       FROM contracts c
       WHERE c.id = $1`,
      [reviewData.contractId]
    );
    
    if (contractResult.rows.length === 0) {
      throw new Error('Contract not found');
    }
    
    const contract = contractResult.rows[0];
    
    // Verify contract is completed
    if (contract.status !== 'completed') {
      throw new Error('Can only review completed contracts');
    }
    
    // Determine reviewer and reviewee
    let revieweeId, reviewType;
    if (contract.client_id === userId) {
      revieweeId = contract.freelancer_id;
      reviewType = 'client_to_freelancer';
    } else if (contract.freelancer_id === userId) {
      revieweeId = contract.client_id;
      reviewType = 'freelancer_to_client';
    } else {
      throw new Error('Unauthorized: You are not part of this contract');
    }
    
    // Check if review already exists
    const existingReview = await query(
      'SELECT id FROM reviews WHERE contract_id = $1 AND reviewer_id = $2',
      [reviewData.contractId, userId]
    );
    
    if (existingReview.rows.length > 0) {
      throw new Error('You have already reviewed this contract');
    }
    
    // Insert review
    const result = await query(
      `INSERT INTO reviews (
        contract_id, project_id, reviewer_id, reviewee_id, review_type,
        overall_rating, communication_rating, quality_rating, timeliness_rating, professionalism_rating,
        feedback
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        reviewData.contractId,
        contract.project_id,
        userId,
        revieweeId,
        reviewType,
        reviewData.overallRating,
        reviewData.communicationRating || null,
        reviewData.qualityRating || null,
        reviewData.timelinessRating || null,
        reviewData.professionalismRating || null,
        reviewData.feedback
      ]
    );
    
    logger.info('Review submitted successfully', { reviewId: result.rows[0].id });
    
    return formatReviewResponse(result.rows[0]);
  } catch (error) {
    logger.error('Error submitting review', { userId, error: error.message, stack: error.stack });
    throw error;
  }
};

/**
 * Get reviews received by a user
 */
const getReceivedReviews = async (userId, filters = {}) => {
  try {
    const { page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;
    
    logger.info('Getting received reviews', { userId });
    
    const result = await query(
      `SELECT r.*,
              reviewer.full_name as reviewer_name,
              reviewer.avatar_url as reviewer_avatar,
              reviewer.role as reviewer_role,
              p.title as project_title,
              c.agreed_budget
       FROM reviews r
       JOIN users reviewer ON r.reviewer_id = reviewer.id
       JOIN projects p ON r.project_id = p.id
       JOIN contracts c ON r.contract_id = c.id
       WHERE r.reviewee_id = $1 AND r.is_hidden = FALSE
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    const countResult = await query(
      'SELECT COUNT(*) as total FROM reviews WHERE reviewee_id = $1 AND is_hidden = FALSE',
      [userId]
    );
    
    return {
      reviews: result.rows.map(formatReviewWithDetailsResponse),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    };
  } catch (error) {
    logger.error('Error getting received reviews', { userId, error: error.message });
    throw error;
  }
};

/**
 * Get reviews given by a user
 */
const getGivenReviews = async (userId, filters = {}) => {
  try {
    const { page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;
    
    logger.info('Getting given reviews', { userId });
    
    const result = await query(
      `SELECT r.*,
              reviewee.full_name as reviewee_name,
              reviewee.avatar_url as reviewee_avatar,
              reviewee.role as reviewee_role,
              p.title as project_title,
              c.agreed_budget
       FROM reviews r
       JOIN users reviewee ON r.reviewee_id = reviewee.id
       JOIN projects p ON r.project_id = p.id
       JOIN contracts c ON r.contract_id = c.id
       WHERE r.reviewer_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    const countResult = await query(
      'SELECT COUNT(*) as total FROM reviews WHERE reviewer_id = $1',
      [userId]
    );
    
    return {
      reviews: result.rows.map(formatReviewWithDetailsResponse),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    };
  } catch (error) {
    logger.error('Error getting given reviews', { userId, error: error.message });
    throw error;
  }
};

/**
 * Get rating statistics for a user
 */
const getUserRatingStats = async (userId) => {
  try {
    logger.info('Getting user rating stats', { userId });
    
    const result = await query(
      'SELECT * FROM calculate_user_average_rating($1)',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
        avg_communication: 0,
        avg_quality: 0,
        avg_timeliness: 0,
        avg_professionalism: 0,
        rating_5_count: 0,
        rating_4_count: 0,
        rating_3_count: 0,
        rating_2_count: 0,
        rating_1_count: 0
      };
    }
    
    return formatRatingStatsResponse(result.rows[0]);
  } catch (error) {
    logger.error('Error getting rating stats', { userId, error: error.message });
    throw error;
  }
};

/**
 * Respond to a review
 */
const respondToReview = async (reviewId, userId, response) => {
  try {
    logger.info('Responding to review', { reviewId, userId });
    
    // Verify user is the reviewee
    const reviewResult = await query(
      'SELECT reviewee_id FROM reviews WHERE id = $1',
      [reviewId]
    );
    
    if (reviewResult.rows.length === 0) {
      throw new Error('Review not found');
    }
    
    if (reviewResult.rows[0].reviewee_id !== userId) {
      throw new Error('Unauthorized: You can only respond to reviews about you');
    }
    
    const result = await query(
      `UPDATE reviews
       SET response = $1, response_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [response, reviewId]
    );
    
    logger.info('Review response submitted', { reviewId });
    
    return formatReviewResponse(result.rows[0]);
  } catch (error) {
    logger.error('Error responding to review', { reviewId, error: error.message });
    throw error;
  }
};

/**
 * Flag a review as inappropriate
 */
const flagReview = async (reviewId, userId, reason) => {
  try {
    logger.info('Flagging review', { reviewId, userId });
    
    const result = await query(
      `UPDATE reviews
       SET is_flagged = TRUE, flag_reason = $1, flagged_by = $2, flagged_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [reason, userId, reviewId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Review not found');
    }
    
    logger.info('Review flagged', { reviewId });
    
    return { success: true, message: 'Review flagged for moderation' };
  } catch (error) {
    logger.error('Error flagging review', { reviewId, error: error.message });
    throw error;
  }
};

/**
 * Check if user can review a contract
 */
const canReviewContract = async (userId, contractId) => {
  try {
    // Check if contract is completed
    const contractResult = await query(
      `SELECT c.status, c.client_id, c.freelancer_id
       FROM contracts c
       WHERE c.id = $1`,
      [contractId]
    );
    
    if (contractResult.rows.length === 0) {
      return { canReview: false, reason: 'Contract not found' };
    }
    
    const contract = contractResult.rows[0];
    
    if (contract.status !== 'completed') {
      return { canReview: false, reason: 'Contract must be completed to leave a review' };
    }
    
    // Check if user is part of contract
    if (contract.client_id !== userId && contract.freelancer_id !== userId) {
      return { canReview: false, reason: 'You are not part of this contract' };
    }
    
    // Check if already reviewed
    const existingReview = await query(
      'SELECT id FROM reviews WHERE contract_id = $1 AND reviewer_id = $2',
      [contractId, userId]
    );
    
    if (existingReview.rows.length > 0) {
      return { canReview: false, reason: 'You have already reviewed this contract' };
    }
    
    return { canReview: true };
  } catch (error) {
    logger.error('Error checking review eligibility', { userId, contractId, error: error.message });
    throw error;
  }
};

// Format response functions
const formatReviewResponse = (review) => {
  return {
    id: review.id,
    contractId: review.contract_id,
    projectId: review.project_id,
    reviewerId: review.reviewer_id,
    revieweeId: review.reviewee_id,
    reviewType: review.review_type,
    overallRating: review.overall_rating,
    communicationRating: review.communication_rating,
    qualityRating: review.quality_rating,
    timelinessRating: review.timeliness_rating,
    professionalismRating: review.professionalism_rating,
    feedback: review.feedback,
    response: review.response,
    responseAt: review.response_at,
    isFlagged: review.is_flagged,
    isHidden: review.is_hidden,
    createdAt: review.created_at,
    updatedAt: review.updated_at
  };
};

const formatReviewWithDetailsResponse = (review) => {
  return {
    ...formatReviewResponse(review),
    reviewerName: review.reviewer_name,
    reviewerAvatar: review.reviewer_avatar,
    reviewerRole: review.reviewer_role,
    revieweeName: review.reviewee_name,
    revieweeAvatar: review.reviewee_avatar,
    revieweeRole: review.reviewee_role,
    projectTitle: review.project_title,
    agreedBudget: review.agreed_budget ? parseFloat(review.agreed_budget) : null
  };
};

const formatRatingStatsResponse = (stats) => {
  return {
    averageRating: stats.average_rating ? parseFloat(stats.average_rating) : 0,
    totalReviews: parseInt(stats.total_reviews || 0),
    avgCommunication: stats.avg_communication ? parseFloat(stats.avg_communication) : 0,
    avgQuality: stats.avg_quality ? parseFloat(stats.avg_quality) : 0,
    avgTimeliness: stats.avg_timeliness ? parseFloat(stats.avg_timeliness) : 0,
    avgProfessionalism: stats.avg_professionalism ? parseFloat(stats.avg_professionalism) : 0,
    rating5Count: parseInt(stats.rating_5_count || 0),
    rating4Count: parseInt(stats.rating_4_count || 0),
    rating3Count: parseInt(stats.rating_3_count || 0),
    rating2Count: parseInt(stats.rating_2_count || 0),
    rating1Count: parseInt(stats.rating_1_count || 0)
  };
};

module.exports = {
  submitReview,
  getReceivedReviews,
  getGivenReviews,
  getUserRatingStats,
  respondToReview,
  flagReview,
  canReviewContract
};
