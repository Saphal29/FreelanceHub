const chatService = require('../services/chatService');
const logger = require('../utils/logger');

const getOrCreateConversation = async (req, res) => {
  try {
    const { otherUserId, contractId, projectId, disputeId } = req.body;
    
    // For dispute conversations, disputeId is required
    if (disputeId) {
      const conv = await chatService.getOrCreateConversation(
        req.user.userId, null, null, null, disputeId
      );
      return res.json({ success: true, conversation: conv });
    }
    
    // For regular conversations, otherUserId is required
    if (!otherUserId) {
      return res.status(400).json({ success: false, error: 'otherUserId or disputeId required' });
    }
    
    const conv = await chatService.getOrCreateConversation(
      req.user.userId, otherUserId, contractId, projectId
    );
    res.json({ success: true, conversation: conv });
  } catch (err) {
    logger.error('getOrCreateConversation error', { error: err.message });
    res.status(400).json({ success: false, error: err.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const conversations = await chatService.getUserConversations(req.user.userId);
    res.json({ success: true, conversations });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await chatService.getMessages(
      req.params.conversationId, req.user.userId, req.query
    );
    res.json({ success: true, messages });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    await chatService.markMessagesAsRead(req.params.conversationId, req.user.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const msg = await chatService.deleteMessage(req.params.messageId, req.user.userId);
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const archiveConversation = async (req, res) => {
  try {
    await chatService.archiveConversation(req.params.conversationId, req.user.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const searchMessages = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, error: 'Search query required' });
    const messages = await chatService.searchMessages(req.params.conversationId, req.user.userId, q);
    res.json({ success: true, messages });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await chatService.getTotalUnreadCount(req.user.userId);
    res.json({ success: true, unreadCount: count });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const uploadChatFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    // Use centralized file service
    const fileService = require('../services/fileService');
    
    const file = await fileService.uploadFile(req.file, req.user.userId, {
      category: 'chat_attachment',
      isPublic: false // Chat attachments are private
    });

    const isImage = req.file.mimetype.startsWith('image/');

    logger.info('Chat file uploaded successfully', {
      userId: req.user.userId,
      fileId: file.id,
      fileName: file.originalName,
      fileSize: file.fileSize
    });

    res.json({
      success: true,
      file: {
        id: file.id,
        url: file.fileUrl,
        name: file.originalName,
        size: file.fileSize,
        type: file.mimeType,
        isImage
      }
    });
  } catch (err) {
    logger.error('Chat file upload error', { 
      userId: req.user?.userId,
      error: err.message 
    });
    
    // Handle validation errors from file service
    if (err.message.includes('exceeds limit') || err.message.includes('not allowed')) {
      return res.status(400).json({
        success: false,
        error: err.message,
        code: 'VALIDATION_ERROR'
      });
    }
    
    res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  }
};

/**
 * Send message via REST API (for testing purposes)
 * In production, messages should be sent via WebSocket for real-time delivery
 */
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType = 'text', fileData } = req.body;
    
    if (!content?.trim() && !fileData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message content required' 
      });
    }
    
    const message = await chatService.saveMessage(
      conversationId, 
      req.user.userId, 
      content?.trim(), 
      messageType, 
      fileData
    );
    
    // Emit via socket if available (for real-time delivery)
    if (req.app.get('io')) {
      req.app.get('io').to(`conv:${conversationId}`).emit('message:new', message);
    }
    
    logger.info('Message sent via REST', {
      userId: req.user.userId,
      conversationId,
      messageId: message.id
    });
    
    res.status(201).json({ 
      success: true, 
      message 
    });
  } catch (err) {
    logger.error('sendMessage error', { error: err.message });
    res.status(400).json({ success: false, error: err.message });
  }
};

module.exports = {
  getOrCreateConversation, getConversations, getMessages,
  markAsRead, deleteMessage, archiveConversation, searchMessages, getUnreadCount,
  uploadChatFile, sendMessage
};
