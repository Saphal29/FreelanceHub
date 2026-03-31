const jwt = require('jsonwebtoken');
const callService = require('../services/callService');
const roomService = require('../services/roomService');
const { query } = require('../utils/dbQueries');
const logger = require('../utils/logger');

// In-memory rate limiting: userId -> { count, resetAt }
const callRateLimits = new Map();

// In-memory active call rooms: roomId -> Set<userId>
const activeCallRooms = new Map();

/**
 * Check and increment rate limit for call:initiate
 * Max 10 per 60s per user
 */
const checkCallRateLimit = (userId) => {
  const now = Date.now();
  const limit = callRateLimits.get(userId);

  if (!limit || now > limit.resetAt) {
    callRateLimits.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (limit.count >= 10) return false;

  limit.count += 1;
  return true;
};

/**
 * Get caller's full name from users table
 */
const getCallerName = async (userId) => {
  const result = await query('SELECT full_name FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.full_name || 'Unknown';
};

/**
 * Check if a user socket is connected to the /video namespace
 */
const isUserConnected = (videoNs, userId) => {
  const room = videoNs.adapter.rooms.get(`user:${userId}`);
  return room && room.size > 0;
};

const initVideoSignaling = (io) => {
  const videoNs = io.of('/video');

  // JWT auth middleware — same pattern as socketHandler.js
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

    // ─── CALL:INITIATE ────────────────────────────────────────────────
    socket.on('call:initiate', async ({ calleeId, callType = 'video' }) => {
      try {
        if (!checkCallRateLimit(userId)) {
          return socket.emit('call:error', { message: 'Rate limit exceeded. Try again later.' });
        }

        const call = await callService.initiateCall(userId, calleeId, callType);
        const callerName = await getCallerName(userId);

        if (!isUserConnected(videoNs, calleeId)) {
          // Callee offline — mark missed and notify caller
          await query(
            `UPDATE calls SET status = 'missed', updated_at = NOW() WHERE call_id = $1`,
            [call.callId]
          );
          return socket.emit('call:unavailable', { callId: call.callId, calleeId });
        }

        videoNs.to(`user:${calleeId}`).emit('call:incoming', {
          callId: call.callId,
          callerId: userId,
          callerName,
          roomId: null,
          callType,
        });
      } catch (err) {
        logger.error('call:initiate error', { error: err.message, userId });
        socket.emit('call:error', { message: err.message });
      }
    });

    // ─── CALL:ACCEPT ──────────────────────────────────────────────────
    socket.on('call:accept', async ({ callId }) => {
      try {
        const call = await callService.acceptCall(callId, userId);
        videoNs.to(`user:${call.callerId}`).emit('call:accepted', { callId });
      } catch (err) {
        logger.error('call:accept error', { error: err.message, userId });
        socket.emit('call:error', { message: err.message });
      }
    });

    // ─── CALL:REJECT ──────────────────────────────────────────────────
    socket.on('call:reject', async ({ callId }) => {
      try {
        const call = await callService.rejectCall(callId, userId);
        videoNs.to(`user:${call.callerId}`).emit('call:rejected', { callId });
      } catch (err) {
        logger.error('call:reject error', { error: err.message, userId });
        socket.emit('call:error', { message: err.message });
      }
    });

    // ─── CALL:CANCEL ──────────────────────────────────────────────────
    socket.on('call:cancel', async ({ callId }) => {
      try {
        const callResult = await query(
          `UPDATE calls SET status = 'cancelled', updated_at = NOW()
           WHERE call_id = $1 AND caller_id = $2 RETURNING *`,
          [callId, userId]
        );
        if (callResult.rows.length === 0) return;
        const calleeId = callResult.rows[0].receiver_id;
        videoNs.to(`user:${calleeId}`).emit('call:cancelled', { callId });
      } catch (err) {
        logger.error('call:cancel error', { error: err.message, userId });
        socket.emit('call:error', { message: err.message });
      }
    });

    // ─── CALL:OFFER ───────────────────────────────────────────────────
    socket.on('call:offer', async ({ callId, sdp }) => {
      try {
        const call = await callService.getCall(callId);
        if (call.callerId !== userId && call.receiverId !== userId) return;
        const targetId = call.callerId === userId ? call.receiverId : call.callerId;
        videoNs.to(`user:${targetId}`).emit('call:offer', { callId, sdp });
      } catch (err) {
        logger.error('call:offer error', { error: err.message, userId });
      }
    });

    // ─── CALL:ANSWER ──────────────────────────────────────────────────
    socket.on('call:answer', async ({ callId, sdp }) => {
      try {
        const call = await callService.getCall(callId);
        if (call.callerId !== userId && call.receiverId !== userId) return;
        const targetId = call.callerId === userId ? call.receiverId : call.callerId;
        videoNs.to(`user:${targetId}`).emit('call:answer', { callId, sdp });
        await callService.setCallConnected(callId);
      } catch (err) {
        logger.error('call:answer error', { error: err.message, userId });
      }
    });

    // ─── CALL:ICE-CANDIDATE ───────────────────────────────────────────
    socket.on('call:ice-candidate', async ({ callId, candidate }) => {
      try {
        const call = await callService.getCall(callId);
        if (call.callerId !== userId && call.receiverId !== userId) return;
        const targetId = call.callerId === userId ? call.receiverId : call.callerId;
        videoNs.to(`user:${targetId}`).emit('call:ice-candidate', { callId, candidate });
      } catch (err) {
        logger.error('call:ice-candidate error', { error: err.message, userId });
      }
    });

    // ─── CALL:END ─────────────────────────────────────────────────────
    socket.on('call:end', async ({ callId }) => {
      try {
        const callBefore = await callService.getCall(callId);
        const call = await callService.endCall(callId, userId);
        await callService.logCallEvent(callId, userId, 'ended');

        videoNs.to(`user:${callBefore.callerId}`).emit('call:ended', { callId });
        videoNs.to(`user:${callBefore.receiverId}`).emit('call:ended', { callId });
      } catch (err) {
        logger.error('call:end error', { error: err.message, userId });
        socket.emit('call:error', { message: err.message });
      }
    });

    // ─── MEDIA CONTROLS ───────────────────────────────────────────────
    const relayMediaEvent = async (eventName, callId, payload) => {
      try {
        const call = await callService.getCall(callId);
        if (call.callerId !== userId && call.receiverId !== userId) return;
        const targetId = call.callerId === userId ? call.receiverId : call.callerId;
        videoNs.to(`user:${targetId}`).emit(eventName, { callId, ...payload });
      } catch (err) {
        logger.error(`${eventName} relay error`, { error: err.message, userId });
      }
    };

    socket.on('media:toggle-audio', ({ callId, muted }) => {
      relayMediaEvent('media:toggle-audio', callId, { muted });
    });

    socket.on('media:toggle-video', ({ callId, videoOff }) => {
      relayMediaEvent('media:toggle-video', callId, { videoOff });
    });

    socket.on('media:screen-share-started', ({ callId }) => {
      relayMediaEvent('media:screen-share-started', callId, {});
    });

    socket.on('media:screen-share-stopped', ({ callId }) => {
      relayMediaEvent('media:screen-share-stopped', callId, {});
    });

    // ─── ROOM:JOIN ────────────────────────────────────────────────────
    socket.on('room:join', async ({ roomId }) => {
      try {
        const { room, participants } = await roomService.joinRoom(roomId, userId);

        socket.join(`room:${roomId}`);

        // Track in-memory
        if (!activeCallRooms.has(roomId)) activeCallRooms.set(roomId, new Set());
        activeCallRooms.get(roomId).add(userId);

        // Send current participants to the joining user (excluding themselves)
        const others = participants.filter(p => p.userId !== userId);
        socket.emit('room:participants', { participants: others });

        // Notify others in the room
        socket.to(`room:${roomId}`).emit('room:user-joined', { userId });
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
