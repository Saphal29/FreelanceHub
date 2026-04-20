const { query } = require('../utils/dbQueries');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Format a scheduled_calls DB row to camelCase
 */
const formatScheduledCall = (row, participants = []) => ({
  meetingId: row.meeting_id,
  hostId: row.host_id,
  title: row.title,
  scheduledAt: row.scheduled_at,
  durationMins: row.duration_mins,
  meetingUrl: row.meeting_url,
  status: row.status,
  createdAt: row.created_at,
  participants,
});

/**
 * Format a participant row to camelCase
 */
const formatParticipant = (row) => ({
  userId: row.user_id,
  fullName: row.full_name,
  avatarUrl: row.avatar_url,
});

/**
 * Schedule a new call meeting.
 * @param {string} hostId
 * @param {string[]} participantIds - does NOT need to include hostId; host is added automatically
 * @param {Date|string|number} scheduledAt
 * @param {string} title
 * @param {number} durationMins
 * @returns {Promise<Object>} formatted scheduled call
 */
const scheduleCall = async (hostId, participantIds, scheduledAt, title, durationMins = 60) => {
  // Allow scheduled_at to be in the near future (at least 5 seconds from now)
  const scheduledAtMs = new Date(scheduledAt).getTime();
  if (scheduledAtMs <= Date.now() - 5000) {
    const err = new Error('scheduled_at must be in the future');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  // Get host information for notifications
  const hostResult = await query(
    'SELECT full_name FROM users WHERE id = $1',
    [hostId]
  );
  const hostName = hostResult.rows[0]?.full_name || 'A user';

  // Pre-generate the UUID so we can build meeting_url in the same INSERT
  const meetingId = uuidv4();
  const meetingUrl = `/calls/join/${meetingId}`;

  const insertResult = await query(
    `INSERT INTO scheduled_calls (meeting_id, host_id, title, scheduled_at, duration_mins, meeting_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
     RETURNING *`,
    [meetingId, hostId, title, new Date(scheduledAt), durationMins, meetingUrl]
  );
  const row = insertResult.rows[0];

  // Build the full participant list: unique set of hostId + participantIds
  const allParticipantIds = [...new Set([hostId, ...participantIds])];

  // Insert all participants
  for (const userId of allParticipantIds) {
    await query(
      `INSERT INTO scheduled_call_participants (meeting_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (meeting_id, user_id) DO NOTHING`,
      [meetingId, userId]
    );
  }

  // Send notifications to all participants (except the host)
  const scheduledDate = new Date(scheduledAt);
  const dateStr = scheduledDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = scheduledDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  for (const participantId of participantIds) {
    if (participantId !== hostId) {
      try {
        await query(
          `INSERT INTO notifications (user_id, type, title, message)
           VALUES ($1, $2, $3, $4)`,
          [
            participantId,
            'meeting_scheduled',
            'New Meeting Scheduled',
            `${hostName} has scheduled a meeting "${title}" on ${dateStr} at ${timeStr}. Click to join: ${meetingUrl}`
          ]
        );
        logger.info('Meeting notification sent', { participantId, meetingId });
      } catch (error) {
        logger.error('Failed to send meeting notification', { 
          participantId, 
          meetingId, 
          error: error.message 
        });
      }
    }
  }

  return formatScheduledCall(row, allParticipantIds.map((id) => ({ userId: id })));
};

/**
 * Get all upcoming scheduled calls for a user (as host or participant).
 * Includes participant list with user info.
 * @param {string} userId
 * @returns {Promise<Object[]>}
 */
const getScheduled = async (userId) => {
  const result = await query(
    `SELECT DISTINCT sc.*
     FROM scheduled_calls sc
     LEFT JOIN scheduled_call_participants scp ON scp.meeting_id = sc.meeting_id
     WHERE sc.status = 'scheduled'
       AND sc.scheduled_at > NOW()
       AND (sc.host_id = $1 OR scp.user_id = $1)
     ORDER BY sc.scheduled_at ASC`,
    [userId]
  );

  const calls = await Promise.all(
    result.rows.map(async (row) => {
      const participantsResult = await query(
        `SELECT scp.user_id, u.full_name, u.avatar_url
         FROM scheduled_call_participants scp
         JOIN users u ON u.id = scp.user_id
         WHERE scp.meeting_id = $1`,
        [row.meeting_id]
      );
      const participants = participantsResult.rows.map(formatParticipant);
      return formatScheduledCall(row, participants);
    })
  );

  return calls;
};

/**
 * Resolve a meeting URL to call details. Verifies userId is a participant or host.
 * For instant meetings (no scheduled record), creates an ad-hoc meeting.
 * @param {string} meetingId
 * @param {string} userId
 * @returns {Promise<{ meetingId, roomId, scheduledAt, title }>}
 */
const joinByMeetingId = async (meetingId, userId) => {
  const result = await query(
    `SELECT sc.* FROM scheduled_calls sc WHERE sc.meeting_id = $1`,
    [meetingId]
  );

  // If scheduled call exists, add user as participant
  if (result.rows.length > 0) {
    const row = result.rows[0];

    // Auto-add the user as a participant (open link — anyone authenticated can join)
    await query(
      `INSERT INTO scheduled_call_participants (meeting_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (meeting_id, user_id) DO NOTHING`,
      [meetingId, userId]
    );

    return {
      meetingId: row.meeting_id,
      roomId: null,
      scheduledAt: row.scheduled_at,
      title: row.title,
    };
  }

  // For instant meetings (no scheduled record), create an ad-hoc meeting
  const meetingUrl = `/calls/join/${meetingId}`;
  // Set scheduled_at to 1 second in the future to satisfy the check constraint
  const scheduledAt = new Date(Date.now() + 1000);
  
  await query(
    `INSERT INTO scheduled_calls (meeting_id, host_id, title, scheduled_at, duration_mins, meeting_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
     ON CONFLICT (meeting_id) DO NOTHING`,
    [meetingId, userId, 'Instant Meeting', scheduledAt, 60, meetingUrl]
  );

  // Add the user as a participant
  await query(
    `INSERT INTO scheduled_call_participants (meeting_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (meeting_id, user_id) DO NOTHING`,
    [meetingId, userId]
  );

  return {
    meetingId: meetingId,
    roomId: null,
    scheduledAt: scheduledAt,
    title: 'Instant Meeting',
  };
};

/**
 * Cancel a scheduled call. Only the host may cancel.
 * @param {string} meetingId
 * @param {string} userId
 * @returns {Promise<void>}
 */
const cancelScheduled = async (meetingId, userId) => {
  const result = await query(
    `SELECT host_id FROM scheduled_calls WHERE meeting_id = $1`,
    [meetingId]
  );

  if (result.rows.length === 0) {
    const err = new Error('Scheduled call not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (result.rows[0].host_id !== userId) {
    const err = new Error('Only the host can cancel this meeting');
    err.code = 'FORBIDDEN';
    throw err;
  }

  await query(
    `UPDATE scheduled_calls SET status = 'cancelled' WHERE meeting_id = $1`,
    [meetingId]
  );
};

module.exports = {
  scheduleCall,
  getScheduled,
  joinByMeetingId,
  cancelScheduled,
};
