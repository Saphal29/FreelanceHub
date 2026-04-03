const { query } = require('../utils/dbQueries');
const logger = require('../utils/logger');

/**
 * Get public platform statistics for landing page
 * GET /api/stats/public
 */
const getPublicStats = async (req, res) => {
  try {
    // Get total freelancers
    const freelancersResult = await query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'FREELANCER'"
    );
    
    // Get total clients
    const clientsResult = await query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'CLIENT'"
    );
    
    // Get total completed projects
    const projectsResult = await query(
      "SELECT COUNT(*) as count FROM projects WHERE status = 'completed'"
    );
    
    // Get average rating (handle if reviews table doesn't exist)
    let averageRating = 0;
    try {
      const ratingResult = await query(
        'SELECT AVG(rating) as avg_rating FROM reviews WHERE rating IS NOT NULL'
      );
      averageRating = parseFloat(ratingResult.rows[0].avg_rating) || 0;
    } catch (err) {
      logger.warn('Reviews table may not exist', { error: err.message });
    }
    
    // Get total amount paid (all contracts, regardless of status)
    const paymentsResult = await query(
      `SELECT COALESCE(SUM(agreed_budget), 0) as total_paid FROM contracts`
    );
    
    const stats = {
      totalFreelancers: parseInt(freelancersResult.rows[0].count) || 0,
      totalClients: parseInt(clientsResult.rows[0].count) || 0,
      totalProjects: parseInt(projectsResult.rows[0].count) || 0,
      averageRating: averageRating,
      totalPaid: parseFloat(paymentsResult.rows[0].total_paid) || 0
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error getting public stats', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
};

module.exports = {
  getPublicStats
};
