const { query } = require('../utils/dbQueries');
const logger = require('../utils/logger');

/**
 * Format a DB room row to camelCase
 */
const formatRoom = (row) => ({
  roomId: row.room_id,
  hostId: row.host_id,
  roomName: row.room_name,
  maxParticipants: row.max_participants,
  status: row.status,
  createdAt: row.created_at,
  endedAt: row.ended_at,
});

/**
 * Format a participant row to camelCase
 */
const formatParticipant = (row) => ({
  id: row.id,
  roomId: row.room_id,
  userId: row.user_id,
  fullName: row.full_name,
  avatarUrl: row.avatar_url,
  joinedAt: row.joined_at,
  leftAt: row.left_at,
  isMuted: row.is_muted,
  isVideoOff: row.is_video_off,
});

/**
 * Create a new call room
 * @param {string} hostId - The user ID of the host
 * @param {string} roomName - Name of the room
 * @param {number} maxParticipants - Maximum number of participants (default: 4)
 * @param {string} roomId - Optional custom room ID (for scheduled meetings)
 */
const createRoom = async (hostId, roomName, maxParticipants = 4, roomId = null) => {
  let result;
  
  if (roomId) {
    // Check if room already exists
    const existing = await query(
      `SELECT * FROM call_rooms WHERE room_id = $1`,
      [roomId]
    );
    
    if (existing.rows.length > 0) {
      // Room already exists, return it
      return formatRoom(existing.rows[0]);
    }
    
    // Create room with custom ID
    result = await query(
      `INSERT INTO call_rooms (room_id, host_id, room_name, max_participants)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [roomId, hostId, roomName, maxParticipants]
    );
  } else {
    // Create room with auto-generated ID
    result = await query(
      `INSERT INTO call_rooms (host_id, room_name, max_participants)
       VALUES ($1, $2, $3) RETURNING *`,
      [hostId, roomName, maxParticipants]
    );
  }
  
  return formatRoom(result.rows[0]);
};

/**
 * Join a room — checks capacity, adds participant, returns { room, participants }
 */
const joinRoom = async (roomId, userId) => {
  // Get room details
  const roomResult = await query(
    `SELECT * FROM call_rooms WHERE room_id = $1`,
    [roomId]
  );
  if (roomResult.rows.length === 0) throw new Error('Room not found');
  const room = roomResult.rows[0];

  // Count active participants
  const countResult = await query(
    `SELECT COUNT(*) as count FROM call_participants
     WHERE room_id = $1 AND left_at IS NULL`,
    [roomId]
  );
  const activeCount = parseInt(countResult.rows[0].count);

  // Check if user is already an active participant (idempotent join)
  const existingParticipant = await query(
    `SELECT id FROM call_participants WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL`,
    [roomId, userId]
  );

  if (existingParticipant.rows.length === 0) {
    if (activeCount >= room.max_participants) {
      const err = new Error('Room is full');
      err.code = 'ROOM_FULL';
      throw err;
    }

    // Add participant
    await query(
      `INSERT INTO call_participants (room_id, user_id) VALUES ($1, $2)`,
      [roomId, userId]
    );
  }

  const participants = await getRoomParticipants(roomId);
  return { room: formatRoom(room), participants };
};

/**
 * Leave a room — sets left_at; ends room if no active participants remain
 */
const leaveRoom = async (roomId, userId) => {
  await query(
    `UPDATE call_participants SET left_at = NOW()
     WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL`,
    [roomId, userId]
  );

  // Check if any active participants remain
  const remaining = await query(
    `SELECT COUNT(*) as count FROM call_participants
     WHERE room_id = $1 AND left_at IS NULL`,
    [roomId]
  );

  if (parseInt(remaining.rows[0].count) === 0) {
    await query(
      `UPDATE call_rooms SET status = 'ended', ended_at = NOW()
       WHERE room_id = $1`,
      [roomId]
    );
  }
};

/**
 * Get room details
 */
const getRoom = async (roomId) => {
  const result = await query(
    `SELECT * FROM call_rooms WHERE room_id = $1`,
    [roomId]
  );
  if (result.rows.length === 0) throw new Error('Room not found');
  return formatRoom(result.rows[0]);
};

/**
 * Get active participants (left_at IS NULL) with user info
 */
const getRoomParticipants = async (roomId) => {
  const result = await query(
    `SELECT cp.*, u.full_name, u.avatar_url
     FROM call_participants cp
     JOIN users u ON cp.user_id = u.id
     WHERE cp.room_id = $1 AND cp.left_at IS NULL`,
    [roomId]
  );
  return result.rows.map(formatParticipant);
};

/**
 * Mute a participant — host only
 */
const muteParticipant = async (roomId, hostId, targetUserId) => {
  const roomResult = await query(
    `SELECT host_id FROM call_rooms WHERE room_id = $1`,
    [roomId]
  );
  if (roomResult.rows.length === 0) throw new Error('Room not found');
  if (roomResult.rows[0].host_id !== hostId) throw new Error('Only the host can mute participants');

  await query(
    `UPDATE call_participants SET is_muted = TRUE
     WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL`,
    [roomId, targetUserId]
  );
};

/**
 * Remove a participant — host only
 */
const removeParticipant = async (roomId, hostId, targetUserId) => {
  const roomResult = await query(
    `SELECT host_id FROM call_rooms WHERE room_id = $1`,
    [roomId]
  );
  if (roomResult.rows.length === 0) throw new Error('Room not found');
  if (roomResult.rows[0].host_id !== hostId) throw new Error('Only the host can remove participants');

  await query(
    `UPDATE call_participants SET left_at = NOW()
     WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL`,
    [roomId, targetUserId]
  );
};

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  getRoomParticipants,
  muteParticipant,
  removeParticipant,
};
