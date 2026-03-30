const { query } = require('../utils/dbQueries');
const logger = require('../utils/logger');

/**
 * Format a DB call row to camelCase
 */
const formatCall = (row) => ({
  callId: row.call_id,
  callerId: row.caller_id,
  receiverId: row.receiver_id,
  roomId: row.room_id,
  status: row.status,
  callType: row.call_type,
  startTime: row.start_time,
  endTime: row.end_time,
  duration: row.duration,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Create a new call record with status='initiated'
 */
const initiateCall = async (callerId, calleeId, callType = 'video') => {
  const result = await query(
    `INSERT INTO calls (caller_id, receiver_id, call_type, status)
     VALUES ($1, $2, $3, 'initiated') RETURNING *`,
    [callerId, calleeId, callType]
  );
  return formatCall(result.rows[0]);
};

/**
 * Update call status to 'ringing'
 */
const acceptCall = async (callId, userId) => {
  const result = await query(
    `UPDATE calls SET status = 'ringing', updated_at = NOW()
     WHERE call_id = $1 AND receiver_id = $2 RETURNING *`,
    [callId, userId]
  );
  if (result.rows.length === 0) throw new Error('Call not found or unauthorized');
  return formatCall(result.rows[0]);
};

/**
 * Update call status to 'rejected'
 */
const rejectCall = async (callId, userId) => {
  const result = await query(
    `UPDATE calls SET status = 'rejected', updated_at = NOW()
     WHERE call_id = $1 AND receiver_id = $2 RETURNING *`,
    [callId, userId]
  );
  if (result.rows.length === 0) throw new Error('Call not found or unauthorized');
  return formatCall(result.rows[0]);
};

/**
 * Update call status to 'ended', set end_time and compute duration
 */
const endCall = async (callId, userId) => {
  const result = await query(
    `UPDATE calls
     SET status = 'ended',
         end_time = NOW(),
         duration = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - COALESCE(start_time, NOW()))))),
         updated_at = NOW()
     WHERE call_id = $1 AND (caller_id = $2 OR receiver_id = $2) RETURNING *`,
    [callId, userId]
  );
  if (result.rows.length === 0) throw new Error('Call not found or unauthorized');
  const row = result.rows[0];
  // Compute duration in JS as well to match spec: Math.floor((end_time - start_time) / 1000)
  if (row.start_time && row.end_time) {
    row.duration = Math.floor((new Date(row.end_time).getTime() - new Date(row.start_time).getTime()) / 1000);
    if (row.duration < 0) row.duration = 0;
  } else {
    row.duration = 0;
  }
  return formatCall(row);
};

/**
 * Update call status to 'connected' and set start_time
 */
const setCallConnected = async (callId) => {
  const result = await query(
    `UPDATE calls SET status = 'connected', start_time = NOW(), updated_at = NOW()
     WHERE call_id = $1 RETURNING *`,
    [callId]
  );
  if (result.rows.length === 0) throw new Error('Call not found');
  return formatCall(result.rows[0]);
};

/**
 * Get a single call by ID
 */
const getCall = async (callId) => {
  const result = await query(
    `SELECT * FROM calls WHERE call_id = $1`,
    [callId]
  );
  if (result.rows.length === 0) throw new Error('Call not found');
  return formatCall(result.rows[0]);
};

/**
 * Get paginated call history for a user, ordered by created_at DESC
 */
const getCallHistory = async (userId, limit = 20, offset = 0) => {
  const result = await query(
    `SELECT * FROM calls
     WHERE caller_id = $1 OR receiver_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows.map(formatCall);
};

/**
 * Insert a call event into call_logs
 */
const logCallEvent = async (callId, userId, event, metadata = null) => {
  const result = await query(
    `INSERT INTO call_logs (call_id, user_id, event, metadata)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [callId, userId, event, metadata ? JSON.stringify(metadata) : null]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    callId: row.call_id,
    userId: row.user_id,
    event: row.event,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
};

module.exports = {
  initiateCall,
  acceptCall,
  rejectCall,
  endCall,
  setCallConnected,
  getCall,
  getCallHistory,
  logCallEvent,
};
