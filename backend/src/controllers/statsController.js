const statsService = require('../services/statsService');
const logger = require('../utils/logger');

/**
 * Get platform statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPlatformStats = async (req, res) => {
  try {
    logger.info('Get platform stats request');

    const stats = await statsService.getPlatformStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Error getting platform stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform statistics',
      code: 'SERVER_ERROR',
    });
  }
};

module.exports = {
  getPlatformStats,
};
