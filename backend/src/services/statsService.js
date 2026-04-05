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

    // Get total completed projects
    const completedProjectsResult = await query(
      `SELECT COUNT(*) as total FROM projects WHERE status = 'completed'`
    );

    // Get average rating across all reviews
    const avgRatingResult = await query(
      `SELECT COALESCE(AVG(overall_rating), 0) as avg_rating FROM reviews`
    );

    // Get total contracts
    const contractsResult = await query(
      `SELECT COUNT(*) as total FROM contracts`
    );

    const stats = {
      totalFreelancers: parseInt(freelancersResult.rows[0].total) || 0,
      totalClients: parseInt(clientsResult.rows[0].total) || 0,
      totalCompletedProjects: parseInt(completedProjectsResult.rows[0].total) || 0,
      averageRating: parseFloat(avgRatingResult.rows[0].avg_rating).toFixed(1) || '0.0',
      totalContracts: parseInt(contractsResult.rows[0].total) || 0,
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
