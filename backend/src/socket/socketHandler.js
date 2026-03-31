const jwt = require('jsonwebtoken');
const chatService = require('../services/chatService');
const logger = require('../utils/logger');

// In-memory online users map: userId -> Set of socketIds
const onlineUsers = new Map();

const addOnlineUser = (userId, socketId) => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
};

const removeOnlineUser = (userId, socketId) => {
  if (onlineUsers.has(userId)) {
    onlineUsers.get(userId).delete(socketId);
    if (onlineUsers.get(userId).size === 0) onlineUsers.delete(userId);
  }
};

const isUserOnline = (userId) => onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;

const initSocket = (io) => {
  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    logger.info('Socket connected', { userId, socketId: socket.id });

    // Track online status
    addOnlineUser(userId, socket.id);
    socket.broadcast.emit('user:online', { userId });

    // Join user's personal room for direct notifications
    socket.join(`user:${userId}`);

    // ─── JOIN CONVERSATION ───────────────────────────────────────────
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conv:${conversationId}`);
      logger.info('Joined conversation room', { userId, conversationId });
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    // ─── SEND MESSAGE ────────────────────────────────────────────────
    socket.on('message:send', async (data, callback) => {
      try {
        const { conversationId, content, messageType = 'text', fileData } = data;

        if (!content?.trim() && !fileData) {
          return callback?.({ error: 'Message content required' });
        }

        const message = await chatService.saveMessage(
          conversationId, userId, content?.trim(), messageType, fileData
        );

        // Broadcast to all in conversation room
        io.to(`conv:${conversationId}`).emit('message:new', message);

        // Send notification to offline participants
        const conversations = await chatService.getUserConversations(userId);
        const conv = conversations.find(c => c.id === conversationId);
        if (conv && !isUserOnline(conv.otherUser.id)) {
          io.to(`user:${conv.otherUser.id}`).emit('notification:message', {
            conversationId,
            senderName: message.senderName,
            content: message.content
          });
        }

        callback?.({ success: true, message });
      } catch (err) {
        logger.error('message:send error', { error: err.message });
        callback?.({ error: err.message });
      }
    });

    // ─── TYPING INDICATORS ───────────────────────────────────────────
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:start', { userId, conversationId });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:stop', { userId, conversationId });
    });

    // ─── READ RECEIPTS ───────────────────────────────────────────────
    socket.on('messages:read', async ({ conversationId }) => {
      try {
        await chatService.markMessagesAsRead(conversationId, userId);
        socket.to(`conv:${conversationId}`).emit('messages:read', { userId, conversationId });
      } catch (err) {
        logger.error('messages:read error', { error: err.message });
      }
    });

    // ─── DELETE MESSAGE ──────────────────────────────────────────────
    socket.on('message:delete', async ({ messageId, conversationId }, callback) => {
      try {
        const deleted = await chatService.deleteMessage(messageId, userId);
        io.to(`conv:${conversationId}`).emit('message:deleted', { messageId, conversationId });
        callback?.({ success: true });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    // ─── GET ONLINE STATUS ───────────────────────────────────────────
    socket.on('user:status', ({ userIds }, callback) => {
      const statuses = {};
      userIds.forEach(id => { statuses[id] = isUserOnline(id); });
      callback?.(statuses);
    });

    // ─── DISCONNECT ──────────────────────────────────────────────────
    socket.on('disconnect', () => {
      removeOnlineUser(userId, socket.id);
      if (!isUserOnline(userId)) {
        socket.broadcast.emit('user:offline', { userId });
      }
      logger.info('Socket disconnected', { userId, socketId: socket.id });
    });
  });
};

module.exports = { initSocket, isUserOnline };
