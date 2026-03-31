const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Get user notifications
 * GET /api/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = {
      isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
      type: req.query.type,
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };
    
    const notifications = await notificationService.getUserNotifications(userId, filters);
    
    res.json({
      success: true,
      notifications,
      count: notifications.length
    });
  } catch (error) {
    logger.error('Error in getNotifications controller', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await notificationService.getUnreadCount(userId);
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    logger.error('Error in getUnreadCount controller', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const notification = await notificationService.markAsRead(id, userId);
    
    res.json({
      success: true,
      notification
    });
  } catch (error) {
    logger.error('Error in markAsRead controller', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/mark-all-read
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await notificationService.markAllAsRead(userId);
    
    res.json({
      success: true,
      count,
      message: `${count} notifications marked as read`
    });
  } catch (error) {
    logger.error('Error in markAllAsRead controller', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
