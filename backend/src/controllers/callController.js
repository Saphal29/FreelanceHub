const callService = require('../services/callService');
const roomService = require('../services/roomService');
const scheduledCallService = require('../services/scheduledCallService');
const { query } = require('../utils/dbQueries');
const logger = require('../utils/logger');

// ─── Call Handlers ────────────────────────────────────────────────────────────

const initiateCall = async (req, res) => {
  try {
    const callerId = req.user.userId;
    const { calleeId, callType = 'video' } = req.body;

    if (!calleeId) {
      return res.status(400).json({ success: false, error: 'calleeId is required' });
    }

    // 404 if callee not found
    const calleeResult = await query('SELECT id FROM users WHERE id = $1', [calleeId]);
    if (calleeResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Callee not found' });
    }

    // 409 if callee already in active call
    const activeCallResult = await query(
      `SELECT call_id FROM calls
       WHERE (caller_id = $1 OR receiver_id = $1)
         AND status IN ('initiated', 'ringing', 'connected')
       LIMIT 1`,
      [calleeId]
    );
    if (activeCallResult.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Callee is already in an active call' });
    }

    const call = await callService.initiateCall(callerId, calleeId, callType);

    logger.info('Call initiated', { callId: call.callId, callerId, calleeId });

    return res.status(201).json({
      success: true,
      callId: call.callId,
      roomId: null,
      status: 'initiated',
    });
  } catch (error) {
    logger.error('initiateCall error', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
};

const endCall = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { callId } = req.params;

    // Verify requester is caller or receiver
    const callResult = await query(
      'SELECT caller_id, receiver_id FROM calls WHERE call_id = $1',
      [callId]
    );
    if (callResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Call not found' });
    }
    const { caller_id, receiver_id } = callResult.rows[0];
    if (caller_id !== userId && receiver_id !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const call = await callService.endCall(callId, userId);

    logger.info('Call ended', { callId, userId });

    return res.json({ success: true, call });
  } catch (error) {
    logger.error('endCall error', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getCall = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { callId } = req.params;

    const call = await callService.getCall(callId);

    if (call.callerId !== userId && call.receiverId !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    return res.json({ success: true, call });
  } catch (error) {
    logger.error('getCall error', { error: error.message });
    const status = error.message === 'Call not found' ? 404 : 500;
    return res.status(status).json({ success: false, error: error.message });
  }
};

const getCallHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const calls = await callService.getCallHistory(userId, limit, offset);

    return res.json({ success: true, calls });
  } catch (error) {
    logger.error('getCallHistory error', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Scheduled Call Handlers ──────────────────────────────────────────────────

const scheduleCall = async (req, res) => {
  try {
    const hostId = req.user.userId;
    const { participantIds = [], scheduledAt, title, durationMins } = req.body;

    const meeting = await scheduledCallService.scheduleCall(
      hostId,
      participantIds,
      scheduledAt,
      title,
      durationMins
    );

    logger.info('Call scheduled', { meetingId: meeting.meetingId, hostId });

    return res.status(201).json({ success: true, meeting });
  } catch (error) {
    logger.error('scheduleCall error', { error: error.message });
    if (error.code === 'VALIDATION_ERROR') {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getScheduledCalls = async (req, res) => {
  try {
    const userId = req.user.userId;
    const meetings = await scheduledCallService.getScheduled(userId);
    return res.json({ success: true, meetings });
  } catch (error) {
    logger.error('getScheduledCalls error', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
};

const joinMeeting = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { meetingId } = req.params;

    const meeting = await scheduledCallService.joinByMeetingId(meetingId, userId);

    return res.json({ success: true, meeting });
  } catch (error) {
    logger.error('joinMeeting error', { error: error.message });
    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({ success: false, error: error.message });
    }
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

const cancelScheduledCall = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { meetingId } = req.params;

    await scheduledCallService.cancelScheduled(meetingId, userId);

    logger.info('Scheduled call cancelled', { meetingId, userId });

    return res.json({ success: true });
  } catch (error) {
    logger.error('cancelScheduledCall error', { error: error.message });
    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({ success: false, error: error.message });
    }
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Room Handlers ────────────────────────────────────────────────────────────

const createRoom = async (req, res) => {
  try {
    const hostId = req.user.userId;
    const { roomName, maxParticipants, roomId } = req.body;

    const room = await roomService.createRoom(hostId, roomName, maxParticipants, roomId);

    logger.info('Room created', { roomId: room.roomId, hostId });

    return res.status(201).json({ success: true, room });
  } catch (error) {
    logger.error('createRoom error', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await roomService.getRoom(roomId);
    const participants = await roomService.getRoomParticipants(roomId);

    return res.json({ success: true, room, participants });
  } catch (error) {
    logger.error('getRoom error', { error: error.message });
    const status = error.message === 'Room not found' ? 404 : 500;
    return res.status(status).json({ success: false, error: error.message });
  }
};

const joinRoom = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { roomId } = req.params;

    const { room, participants } = await roomService.joinRoom(roomId, userId);

    logger.info('User joined room', { roomId, userId });

    return res.json({ success: true, room, participants });
  } catch (error) {
    logger.error('joinRoom error', { error: error.message });
    if (error.code === 'ROOM_FULL') {
      return res.status(409).json({ success: false, error: 'Room is full', code: 'ROOM_FULL' });
    }
    const status = error.message === 'Room not found' ? 404 : 500;
    return res.status(status).json({ success: false, error: error.message });
  }
};

const leaveRoom = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { roomId } = req.params;

    await roomService.leaveRoom(roomId, userId);

    logger.info('User left room', { roomId, userId });

    return res.json({ success: true });
  } catch (error) {
    logger.error('leaveRoom error', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  initiateCall,
  endCall,
  getCall,
  getCallHistory,
  scheduleCall,
  getScheduledCalls,
  joinMeeting,
  cancelScheduledCall,
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
};
