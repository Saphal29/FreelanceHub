const jwt = require('jsonwebtoken');
const roomService = require('../services/roomService');
const { query } = require('../utils/dbQueries');
const logger = require('../utils/logger');

// In-memory active call rooms: roomId -> Set<userId>
const activeCallRooms = new Map();

/**
 * Get user's full name from users table
 */
const getUserName = async (userId) => {
  const result = await query('SELECT full_name FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.full_name || 'Unknown';
};

/**
 * Get TURN server configuration
 * @returns {Object} ICE servers configuration including TURN servers
 */
const getIceServers = () => {
  const iceServers = [
    // Public STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  // Add TURN server if configured
  if (process.env.TURN_SERVER_URL && process.env.TURN_SERVER_USERNAME) {
    const turnConfig = {
      urls: process.env.TURN_SERVER_URL,
      username: process.env.TURN_SERVER_USERNAME,
      credential: process.env.TURN_SERVER_CREDENTIAL || process.env.TURN_SERVER_USERNAME
    };
    
    iceServers.push(turnConfig);
    
    // For Metered, add additional TURN servers for redundancy
    if (process.env.TURN_SERVER_URL.includes('metered.live') || process.env.TURN_SERVER_URL.includes('metered.ca')) {
      // Extract the domain from the configured URL
      const domain = process.env.TURN_SERVER_URL.match(/turn:([^:]+)/)?.[1] || 'a.relay.metered.ca';
      
      const meteredServers = [
        `turn:${domain}:80`,
        `turn:${domain}:80?transport=tcp`,
        `turn:${domain}:443`,
        `turn:${domain}:443?transport=tcp`,
        `turns:${domain}:443`,
        `turns:${domain}:443?transport=tcp`
      ];
      
      meteredServers.forEach(url => {
        if (url !== process.env.TURN_SERVER_URL) {
          iceServers.push({
            urls: url,
            username: process.env.TURN_SERVER_USERNAME,
            credential: process.env.TURN_SERVER_CREDENTIAL || process.env.TURN_SERVER_USERNAME
          });
        }
      });
    }
    
    logger.info('TURN server configured', { 
      url: process.env.TURN_SERVER_URL,
      totalServers: iceServers.length 
    });
  } else {
    logger.info('Using STUN servers only (no TURN configured)');
  }

  return { iceServers };
};

const initVideoSignaling = (io) => {
  const videoNs = io.of('/video');

  // JWT auth middleware
  videoNs.use((socket, next) => {
    const token = socket.handshake.auth?.token;
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

  videoNs.on('connection', (socket) => {
    const userId = socket.userId;
    logger.info('Video socket connected', { userId, socketId: socket.id });

    // Join personal room for direct targeting
    socket.join(`user:${userId}`);

    // Send ICE server configuration to client
    socket.emit('ice:config', getIceServers());

    // ─── ROOM:JOIN ────────────────────────────────────────────────────
    socket.on('room:join', async ({ roomId }) => {
      try {
        const { room, participants } = await roomService.joinRoom(roomId, userId);

        socket.join(`room:${roomId}`);

        // Track in-memory
        if (!activeCallRooms.has(roomId)) activeCallRooms.set(roomId, new Set());
        activeCallRooms.get(roomId).add(userId);

        // Send ICE server configuration
        socket.emit('ice:config', getIceServers());

        // Send current participants to the joining user (excluding themselves)
        const others = participants.filter(p => p.userId !== userId);
        socket.emit('room:participants', { participants: others });

        // Notify others in the room
        socket.to(`room:${roomId}`).emit('room:user-joined', { userId });
        
        logger.info('User joined room', { userId, roomId, participantCount: participants.length });
      } catch (err) {
        logger.error('room:join error', { error: err.message, userId });
        socket.emit('call:error', { message: err.message });
      }
    });

    // ─── ROOM:LEAVE ───────────────────────────────────────────────────
    socket.on('room:leave', async ({ roomId }) => {
      try {
        await roomService.leaveRoom(roomId, userId);
        socket.leave(`room:${roomId}`);

        if (activeCallRooms.has(roomId)) {
          activeCallRooms.get(roomId).delete(userId);
          if (activeCallRooms.get(roomId).size === 0) activeCallRooms.delete(roomId);
        }

        socket.to(`room:${roomId}`).emit('peer:disconnect', { userId });
      } catch (err) {
        logger.error('room:leave error', { error: err.message, userId });
      }
    });

    // ─── PEER:OFFER ───────────────────────────────────────────────────
    socket.on('peer:offer', ({ roomId, targetUserId, sdp }) => {
      videoNs.to(`user:${targetUserId}`).emit('peer:offer', {
        roomId,
        fromUserId: userId,
        sdp,
      });
    });

    // ─── PEER:ANSWER ──────────────────────────────────────────────────
    socket.on('peer:answer', ({ roomId, targetUserId, sdp }) => {
      videoNs.to(`user:${targetUserId}`).emit('peer:answer', {
        roomId,
        fromUserId: userId,
        sdp,
      });
    });

    // ─── PEER:ICE-CANDIDATE ───────────────────────────────────────────
    socket.on('peer:ice-candidate', ({ roomId, targetUserId, candidate }) => {
      videoNs.to(`user:${targetUserId}`).emit('peer:ice-candidate', {
        roomId,
        fromUserId: userId,
        candidate,
      });
    });

    // ─── HOST:MUTE-ALL ────────────────────────────────────────────────
    socket.on('host:mute-all', async ({ roomId }) => {
      try {
        const room = await roomService.getRoom(roomId);
        if (room.hostId !== userId) return; // reject silently if not host
        videoNs.to(`room:${roomId}`).emit('host:muted', { roomId });
      } catch (err) {
        logger.error('host:mute-all error', { error: err.message, userId });
      }
    });

    // ─── HOST:REMOVE-PARTICIPANT ──────────────────────────────────────
    socket.on('host:remove-participant', async ({ roomId, targetUserId }) => {
      try {
        const room = await roomService.getRoom(roomId);
        if (room.hostId !== userId) return; // reject silently if not host
        await roomService.removeParticipant(roomId, userId, targetUserId);
        videoNs.to(`user:${targetUserId}`).emit('host:removed', { roomId });
      } catch (err) {
        logger.error('host:remove-participant error', { error: err.message, userId });
      }
    });

    // ─── DISCONNECT ───────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      logger.info('Video socket disconnected', { userId, socketId: socket.id });

      // Leave all active rooms this socket was part of
      for (const [roomId, members] of activeCallRooms.entries()) {
        if (members.has(userId)) {
          try {
            await roomService.leaveRoom(roomId, userId);
            members.delete(userId);
            if (members.size === 0) activeCallRooms.delete(roomId);
            videoNs.to(`room:${roomId}`).emit('peer:disconnect', { userId });
          } catch (err) {
            logger.error('disconnect room cleanup error', { error: err.message, userId, roomId });
          }
        }
      }
    });
  });
};

module.exports = { initVideoSignaling };
