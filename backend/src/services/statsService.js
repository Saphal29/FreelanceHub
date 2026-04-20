const { query } = require('../utils/dbQueries');
const logger = require('../utils/logger');

/**
 * Get platform statistics
 * @returns {Promise<Object>} Platform stats
 */
const getPlatformStats = async () => {
  try {
    logger.info('Fetching platform statistics');

    // Get total freelancers
    const freelancersResult = await query(
      `SELECT COUNT(*) as total FROM users WHERE role = 'FREELANCER'`
    );

    // Get total clients
    const clientsResult = await query(
      `SELECT COUNT(*) as total FROM users WHERE role = 'CLIENT'`
    );

    // Get total projects (all statuses)
    const projectsResult = await query(
      `SELECT COUNT(*) as total FROM projects`
    );

    // Get average rating across all reviews
    const avgRatingResult = await query(
      `SELECT COALESCE(AVG(overall_rating), 0) as avg_rating FROM reviews`
    );

    // Get total paid amount from completed payments
    const totalPaidResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE status = 'completed'`
    );

    const stats = {
      totalFreelancers: parseInt(freelancersResult.rows[0].total) || 0,
      totalClients: parseInt(clientsResult.rows[0].total) || 0,
      totalProjects: parseInt(projectsResult.rows[0].total) || 0,
      averageRating: parseFloat(avgRatingResult.rows[0].avg_rating) || 0,
      totalPaid: parseFloat(totalPaidResult.rows[0].total_paid) || 0,
    };

    logger.info('Platform statistics retrieved', stats);
    return stats;
  } catch (error) {
    logger.error('Error fetching platform statistics', { error: error.message });
    throw error;
  }
};

module.exports = {
  getPlatformStats,
};
