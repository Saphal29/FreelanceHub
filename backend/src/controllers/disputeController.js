const disputeService = require('../services/disputeService');
const logger = require('../utils/logger');

/**
 * File a new dispute
 * @route POST /api/disputes
 */
const fileDispute = async (req, res) => {
  try {
    const userId = req.user.userId;
    const disputeData = req.body;
    
    logger.info('File dispute request', { userId, contractId: disputeData.contractId });
    
    const dispute = await disputeService.fileDispute(userId, disputeData);
    
    logger.info('Dispute filed successfully', { disputeId: dispute.id });
    
    res.status(201).json({
      success: true,
      message: 'Dispute filed successfully',
      dispute
    });
  } catch (error) {
    logger.error('Error filing dispute', { error: error.message });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'NOT_FOUND'
      });
    }
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'UNAUTHORIZED'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to file dispute',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get disputes for current user
 * @route GET /api/disputes
 */
const getUserDisputes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = {
      status: req.query.status,
      category: req.query.category,
      contractId: req.query.contractId
    };
    
    logger.info('Get user disputes request', { userId, filters });
    
    const disputes = await disputeService.getUserDisputes(userId, filters);
    
    logger.info('Disputes retrieved successfully', { userId, count: disputes.length });
    
    res.json({
      success: true,
      disputes
    });
  } catch (error) {
    logger.error('Error getting disputes', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve disputes',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get dispute by ID
 * @route GET /api/disputes/:id
 */
const getDisputeById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    logger.info('Get dispute by ID request', { disputeId: id, userId, userRole });
    
    const dispute = await disputeService.getDisputeById(id, userId, userRole);
    
    logger.info('Dispute retrieved successfully', { disputeId: id });
    
    res.json({
      success: true,
      dispute
    });
  } catch (error) {
    logger.error('Error getting dispute', { disputeId: req.params.id, error: error.message });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'NOT_FOUND'
      });
    }
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'UNAUTHORIZED'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dispute',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Upload evidence for dispute
 * @route POST /api/disputes/:id/evidence
 */
const uploadEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const evidenceData = req.body;
    
    logger.info('Upload evidence request', { disputeId: id, userId });
    
    const evidence = await disputeService.uploadEvidence(id, userId, evidenceData);
    
    logger.info('Evidence uploaded successfully', { disputeId: id, evidenceId: evidence.id });
    
    res.status(201).json({
      success: true,
      message: 'Evidence uploaded successfully',
      evidence
    });
  } catch (error) {
    logger.error('Error uploading evidence', { disputeId: req.params.id, error: error.message });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'NOT_FOUND'
      });
    }
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'UNAUTHORIZED'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload evidence',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get evidence for dispute
 * @route GET /api/disputes/:id/evidence
 */
const getDisputeEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    logger.info('Get dispute evidence request', { disputeId: id, userId, userRole });
    
    const evidence = await disputeService.getDisputeEvidence(id, userId, userRole);
    
    logger.info('Evidence retrieved successfully', { disputeId: id, count: evidence.length });
    
    res.json({
      success: true,
      evidence
    });
  } catch (error) {
    logger.error('Error getting evidence', { disputeId: req.params.id, error: error.message });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'NOT_FOUND'
      });
    }
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'UNAUTHORIZED'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve evidence',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Send message in dispute thread
 * @route POST /api/disputes/:id/messages
 */
const sendDisputeMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const messageData = req.body;
    
    logger.info('Send dispute message request', { disputeId: id, userId });
    
    const message = await disputeService.sendDisputeMessage(id, userId, messageData);
    
    logger.info('Message sent successfully', { disputeId: id, messageId: message.id });
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    logger.error('Error sending message', { disputeId: req.params.id, error: error.message });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'NOT_FOUND'
      });
    }
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'UNAUTHORIZED'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get messages for dispute
 * @route GET /api/disputes/:id/messages
 */
const getDisputeMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    logger.info('Get dispute messages request', { disputeId: id, userId, userRole });
    
    const messages = await disputeService.getDisputeMessages(id, userId, userRole);
    
    logger.info('Messages retrieved successfully', { disputeId: id, count: messages.length });
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    logger.error('Error getting messages', { disputeId: req.params.id, error: error.message });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'NOT_FOUND'
      });
    }
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'UNAUTHORIZED'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve messages',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Assign mediator to dispute (Admin only - will be restricted in admin panel)
 * @route POST /api/disputes/:id/assign-mediator
 */
const assignMediator = async (req, res) => {
  try {
    const { id } = req.params;
    const { mediatorId } = req.body;
    
    logger.info('Assign mediator request', { disputeId: id, mediatorId });
    
    const dispute = await disputeService.assignMediator(id, mediatorId);
    
    logger.info('Mediator assigned successfully', { disputeId: id, mediatorId });
    
    res.json({
      success: true,
      message: 'Mediator assigned successfully',
      dispute
    });
  } catch (error) {
    logger.error('Error assigning mediator', { disputeId: req.params.id, error: error.message });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'NOT_FOUND'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to assign mediator',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Resolve dispute (Mediator only)
 * @route POST /api/disputes/:id/resolve
 */
const resolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const resolutionData = req.body;
    
    logger.info('Resolve dispute request', { disputeId: id, userId, userRole });
    
    const dispute = await disputeService.resolveDispute(id, userId, userRole, resolutionData);
    
    logger.info('Dispute resolved successfully', { disputeId: id });
    
    res.json({
      success: true,
      message: 'Dispute resolved successfully',
      dispute
    });
  } catch (error) {
    logger.error('Error resolving dispute', { disputeId: req.params.id, error: error.message });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'NOT_FOUND'
      });
    }
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'UNAUTHORIZED'
      });
    }
    
    if (error.message.includes('already resolved')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'ALREADY_RESOLVED'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to resolve dispute',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Close dispute
 * @route POST /api/disputes/:id/close
 */
const closeDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    logger.info('Close dispute request', { disputeId: id, userId });
    
    const dispute = await disputeService.closeDispute(id, userId);
    
    logger.info('Dispute closed successfully', { disputeId: id });
    
    res.json({
      success: true,
      message: 'Dispute closed successfully',
      dispute
    });
  } catch (error) {
    logger.error('Error closing dispute', { disputeId: req.params.id, error: error.message });
    
    if (error.message.includes('not found') || error.message.includes('unauthorized')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'NOT_FOUND'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to close dispute',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get dispute timeline
 * @route GET /api/disputes/:id/timeline
 */
const getDisputeTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    logger.info('Get dispute timeline request', { disputeId: id, userId, userRole });
    
    const timeline = await disputeService.getDisputeTimeline(id, userId, userRole);
    
    logger.info('Timeline retrieved successfully', { disputeId: id, count: timeline.length });
    
    res.json({
      success: true,
      timeline
    });
  } catch (error) {
    logger.error('Error getting timeline', { disputeId: req.params.id, error: error.message });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'NOT_FOUND'
      });
    }
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'UNAUTHORIZED'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve timeline',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  fileDispute,
  getUserDisputes,
  getDisputeById,
  uploadEvidence,
  getDisputeEvidence,
  sendDisputeMessage,
  getDisputeMessages,
  assignMediator,
  resolveDispute,
  closeDispute,
  getDisputeTimeline
};
