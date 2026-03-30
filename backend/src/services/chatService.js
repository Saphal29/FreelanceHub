const { query } = require('../utils/dbQueries');
const logger = require('../utils/logger');

/**
 * Get or create a conversation between two users
 */
const getOrCreateConversation = async (userId, otherUserId, contractId = null, projectId = null, disputeId = null) => {
  // If disputeId is provided, check if conversation exists for this dispute
  if (disputeId) {
    const existing = await query(
      `SELECT c.* FROM conversations c
       WHERE c.dispute_id = $1
       LIMIT 1`,
      [disputeId]
    );

    if (existing.rows.length > 0) {
      // Ensure current user is a participant
      const participant = await query(
        'SELECT id FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
        [existing.rows[0].id, userId]
      );
      
      if (participant.rows.length === 0) {
        // Add user as participant (for admin joining dispute)
        await query(
          'INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)',
          [existing.rows[0].id, userId]
        );
      }
      
      return formatConversation(existing.rows[0]);
    }

    // Create new conversation for dispute with all parties
    const disputeInfo = await query(
      `SELECT filed_by, respondent_id, mediator_id, project_id, contract_id 
       FROM disputes WHERE id = $1`,
      [disputeId]
    );

    if (disputeInfo.rows.length === 0) throw new Error('Dispute not found');

    const dispute = disputeInfo.rows[0];
    const convResult = await query(
      `INSERT INTO conversations (contract_id, project_id, dispute_id, last_message_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *`,
      [dispute.contract_id, dispute.project_id, disputeId]
    );
    const conv = convResult.rows[0];

    // Add all participants (client, freelancer, and mediator if assigned)
    const participants = [dispute.filed_by, dispute.respondent_id];
    if (dispute.mediator_id) {
      participants.push(dispute.mediator_id);
    }

    for (const participantId of participants) {
      await query(
        'INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [conv.id, participantId]
      );
    }

    return formatConversation(conv);
  }

  // Regular conversation between two users
  const existing = await query(
    `SELECT c.* FROM conversations c
     JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = $1
     JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = $2
     WHERE (c.contract_id = $3 OR $3 IS NULL) AND c.dispute_id IS NULL
     ORDER BY c.last_message_at DESC NULLS LAST
     LIMIT 1`,
    [userId, otherUserId, contractId]
  );

  if (existing.rows.length > 0) {
    return formatConversation(existing.rows[0]);
  }

  // Create new conversation
  const convResult = await query(
    `INSERT INTO conversations (contract_id, project_id, last_message_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING *`,
    [contractId, projectId]
  );
  const conv = convResult.rows[0];

  // Add both participants
  await query(
    `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`,
    [conv.id, userId, otherUserId]
  );

  return formatConversation(conv);
};

/**
 * Get all conversations for a user with last message and other participant info
 */
const getUserConversations = async (userId) => {
  const result = await query(
    `SELECT 
       c.id, c.contract_id, c.project_id, c.last_message_at, c.is_archived,
       cp.unread_count, cp.last_read_at, cp.is_archived as user_archived,
       -- Other participant
       u.id as other_user_id, u.full_name as other_user_name, u.role as other_user_role,
       u.avatar_url as other_user_avatar,
       -- Last message
       m.content as last_message, m.message_type as last_message_type,
       m.sender_id as last_message_sender_id, m.created_at as last_message_time,
       -- Project/contract title
       p.title as project_title
     FROM conversations c
     JOIN conversation_participants cp ON c.id = cp.conversation_id AND cp.user_id = $1
     JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id != $1
     JOIN users u ON cp2.user_id = u.id
     LEFT JOIN projects p ON c.project_id = p.id
     LEFT JOIN messages m ON m.id = (
       SELECT id FROM messages
       WHERE conversation_id = c.id AND is_deleted = FALSE
       ORDER BY created_at DESC LIMIT 1
     )
     WHERE cp.is_archived = FALSE
     ORDER BY COALESCE(c.last_message_at, c.created_at) DESC`,
    [userId]
  );

  return result.rows.map(formatConversationWithDetails);
};

/**
 * Get messages for a conversation with pagination
 */
const getMessages = async (conversationId, userId, { limit = 50, before = null } = {}) => {
  // Verify user is participant
  const participant = await query(
    'SELECT id FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  );
  if (participant.rows.length === 0) throw new Error('Not a participant in this conversation');

  let queryText = `
    SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = $1 AND m.is_deleted = FALSE
  `;
  const params = [conversationId];

  if (before) {
    params.push(before);
    queryText += ` AND m.created_at < $${params.length}`;
  }

  queryText += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await query(queryText, params);

  // Mark messages as read
  await markMessagesAsRead(conversationId, userId);

  return result.rows.reverse().map(formatMessage);
};

/**
 * Save a message to DB
 */
const saveMessage = async (conversationId, senderId, content, messageType = 'text', fileData = null) => {
  const result = await query(
    `INSERT INTO messages (conversation_id, sender_id, content, message_type, file_url, file_name, file_size)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      conversationId, senderId, content, messageType,
      fileData?.url || null, fileData?.name || null, fileData?.size || null
    ]
  );

  // Update conversation last_message_at
  await query(
    'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
    [conversationId]
  );

  // Increment unread count for other participants
  await query(
    `UPDATE conversation_participants 
     SET unread_count = unread_count + 1
     WHERE conversation_id = $1 AND user_id != $2`,
    [conversationId, senderId]
  );

  // Get sender info
  const senderResult = await query(
    `SELECT full_name, avatar_url FROM users WHERE id = $1`,
    [senderId]
  );

  const msg = result.rows[0];
  msg.sender_name = senderResult.rows[0]?.full_name;
  msg.sender_avatar = senderResult.rows[0]?.avatar_url;

  return formatMessage(msg);
};

/**
 * Mark all messages in conversation as read for user
 */
const markMessagesAsRead = async (conversationId, userId) => {
  await query(
    `UPDATE conversation_participants 
     SET unread_count = 0, last_read_at = CURRENT_TIMESTAMP
     WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
  );
};

/**
 * Delete a message (soft delete)
 */
const deleteMessage = async (messageId, userId) => {
  const result = await query(
    `UPDATE messages SET is_deleted = TRUE, content = 'This message was deleted'
     WHERE id = $1 AND sender_id = $2 RETURNING *`,
    [messageId, userId]
  );
  if (result.rows.length === 0) throw new Error('Message not found or unauthorized');
  return formatMessage(result.rows[0]);
};

/**
 * Archive a conversation for a user
 */
const archiveConversation = async (conversationId, userId) => {
  await query(
    `UPDATE conversation_participants SET is_archived = TRUE
     WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
  );
};

/**
 * Search messages in a conversation
 */
const searchMessages = async (conversationId, userId, searchTerm) => {
  const participant = await query(
    'SELECT id FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  );
  if (participant.rows.length === 0) throw new Error('Not a participant');

  const result = await query(
    `SELECT m.*, u.full_name as sender_name
     FROM messages m JOIN users u ON m.sender_id = u.id
     WHERE m.conversation_id = $1 AND m.is_deleted = FALSE
       AND m.content ILIKE $2
     ORDER BY m.created_at DESC LIMIT 20`,
    [conversationId, `%${searchTerm}%`]
  );

  return result.rows.map(formatMessage);
};

/**
 * Get total unread count for user
 */
const getTotalUnreadCount = async (userId) => {
  const result = await query(
    `SELECT COALESCE(SUM(unread_count), 0) as total
     FROM conversation_participants
     WHERE user_id = $1 AND is_archived = FALSE`,
    [userId]
  );
  return parseInt(result.rows[0].total);
};

const formatMessage = (m) => ({
  id: m.id,
  conversationId: m.conversation_id,
  senderId: m.sender_id,
  senderName: m.sender_name,
  senderAvatar: m.sender_avatar,
  content: m.content,
  messageType: m.message_type,
  fileUrl: m.file_url,
  fileName: m.file_name,
  fileSize: m.file_size,
  isRead: m.is_read,
  isDeleted: m.is_deleted,
  createdAt: m.created_at
});

const formatConversation = (c) => ({
  id: c.id,
  contractId: c.contract_id,
  projectId: c.project_id,
  disputeId: c.dispute_id,
  lastMessageAt: c.last_message_at,
  createdAt: c.created_at
});

const formatConversationWithDetails = (c) => ({
  id: c.id,
  contractId: c.contract_id,
  projectId: c.project_id,
  projectTitle: c.project_title,
  lastMessageAt: c.last_message_at,
  unreadCount: c.unread_count || 0,
  otherUser: {
    id: c.other_user_id,
    name: c.other_user_name,
    role: c.other_user_role,
    avatar: c.other_user_avatar
  },
  lastMessage: c.last_message ? {
    content: c.last_message,
    type: c.last_message_type,
    senderId: c.last_message_sender_id,
    createdAt: c.last_message_time
  } : null
});

module.exports = {
  getOrCreateConversation,
  getUserConversations,
  getMessages,
  saveMessage,
  markMessagesAsRead,
  deleteMessage,
  archiveConversation,
  searchMessages,
  getTotalUnreadCount
};
