const { query } = require('../utils/dbQueries');
const logger = require('../utils/logger');

/**
 * Get user notifications
 * @param {string} userId - User ID
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Array>} Notifications list
 */
const getUserNotifications = async (userId, filters = {}) => {
  try {
    logger.info('Getting user notifications', { userId });
    
    let whereConditions = ['user_id = $1'];
    let params = [userId];
    let paramIndex = 2;
    
    if (filters.isRead !== undefined) {
      whereConditions.push(`is_read = $${paramIndex}`);
      params.push(filters.isRead);
      paramIndex++;
    }
    
    if (filters.type) {
      whereConditions.push(`type = $${paramIndex}`);
      params.push(filters.type);
      paramIndex++;
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const result = await query(
      `SELECT * FROM notifications
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT ${filters.limit || 50}`,
      params
    );
    
    logger.info('Notifications retrieved', { userId, count: result.rows.length });
    return result.rows.map(formatNotificationResponse);
  } catch (error) {
    logger.error('Error getting notifications', { userId, error: error.message });
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated notification
 */
const markAsRead = async (notificationId, userId) => {
  try {
    logger.info('Marking notification as read', { notificationId, userId });
    
    const result = await query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Notification not found');
    }
    
    logger.info('Notification marked as read', { notificationId });
    return formatNotificationResponse(result.rows[0]);
  } catch (error) {
    logger.error('Error marking notification as read', { notificationId, error: error.message });
    throw error;
  }
};

/**
 * Mark all notifications as read
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of notifications marked as read
 */
const markAllAsRead = async (userId) => {
  try {
    logger.info('Marking all notifications as read', { userId });
    
    const result = await query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND is_read = FALSE
       RETURNING id`,
      [userId]
    );
    
    logger.info('All notifications marked as read', { userId, count: result.rows.length });
    return result.rows.length;
  } catch (error) {
    logger.error('Error marking all notifications as read', { userId, error: error.message });
    throw error;
  }
};

/**
 * Get unread notification count
 * @param {string} userId - User ID
 * @returns {Promise<number>} Unread count
 */
const getUnreadCount = async (userId) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    
    return parseInt(result.rows[0].count);
  } catch (error) {
    logger.error('Error getting unread count', { userId, error: error.message });
    throw error;
  }
};

/**
 * Format notification response for API
 * @param {Object} notification - Raw notification data
 * @returns {Object} Formatted notification
 */
const formatNotificationResponse = (notification) => {
  return {
    id: notification.id,
    userId: notification.user_id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    projectId: notification.project_id,
    proposalId: notification.proposal_id,
    contractId: notification.contract_id,
    isRead: notification.is_read,
    readAt: notification.read_at,
    createdAt: notification.created_at
  };
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  formatNotificationResponse
};
