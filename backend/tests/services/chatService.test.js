const chatService = require('../../src/services/chatService');
const { query } = require('../../src/utils/dbQueries');

jest.mock('../../src/utils/dbQueries');
jest.mock('../../src/utils/logger');

describe('Chat Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UT-71: Create conversation between users', () => {
    it('should create new conversation when none exists', async () => {
      const userId = 'user-123';
      const otherUserId = 'user-456';
      const contractId = 'contract-123';

      // No existing conversation
      query.mockResolvedValueOnce({ rows: [] });

      // Create conversation
      query.mockResolvedValueOnce({
        rows: [{
          id: 'conv-123',
          contract_id: contractId,
          last_message_at: new Date(),
          created_at: new Date()
        }]
      });

      // Add participants
      query.mockResolvedValueOnce({ rows: [] });

      const result = await chatService.getOrCreateConversation(userId, otherUserId, contractId);

      expect(result).toHaveProperty('id');
      expect(result.contractId).toBe(contractId);
    });
  });

  describe('UT-72: Send message in conversation', () => {
    it('should save message and update conversation', async () => {
      const conversationId = 'conv-123';
      const senderId = 'user-123';
      const content = 'Hello, how are you?';

      query.mockResolvedValueOnce({
        rows: [{
          id: 'msg-123',
          conversation_id: conversationId,
          sender_id: senderId,
          content: content,
          message_type: 'text',
          created_at: new Date()
        }]
      });

      query.mockResolvedValueOnce({ rows: [] }); // Update conversation
      query.mockResolvedValueOnce({ rows: [] }); // Update unread count
      query.mockResolvedValueOnce({
        rows: [{ full_name: 'John Doe', avatar_url: '/avatar.jpg' }]
      });

      const result = await chatService.saveMessage(conversationId, senderId, content);

      expect(result).toHaveProperty('id');
      expect(result.content).toBe(content);
      expect(result.messageType).toBe('text');
    });
  });

  describe('UT-73: Get conversation messages', () => {
    it('should return messages for authorized participant', async () => {
      const conversationId = 'conv-123';
      const userId = 'user-123';

      // Verify participant
      query.mockResolvedValueOnce({
        rows: [{ id: 'participant-123' }]
      });

      // Get messages
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'msg-1',
            conversation_id: conversationId,
            sender_id: userId,
            content: 'Hello',
            message_type: 'text',
            sender_name: 'John Doe',
            sender_avatar: '/avatar.jpg',
            created_at: new Date()
          },
          {
            id: 'msg-2',
            conversation_id: conversationId,
            sender_id: 'user-456',
            content: 'Hi there',
            message_type: 'text',
            sender_name: 'Jane Smith',
            sender_avatar: '/avatar2.jpg',
            created_at: new Date()
          }
        ]
      });

      // Mark as read
      query.mockResolvedValueOnce({ rows: [] });

      const result = await chatService.getMessages(conversationId, userId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('content');
      expect(result[0]).toHaveProperty('senderName');
    });
  });

  describe('UT-74: Delete message', () => {
    it('should soft delete message by sender', async () => {
      const messageId = 'msg-123';
      const userId = 'user-123';

      query.mockResolvedValueOnce({
        rows: [{
          id: messageId,
          sender_id: userId,
          is_deleted: true,
          content: 'This message was deleted'
        }]
      });

      const result = await chatService.deleteMessage(messageId, userId);

      expect(result.isDeleted).toBe(true);
      expect(result.content).toBe('This message was deleted');
    });
  });

  describe('UT-75: Get total unread count', () => {
    it('should return total unread messages across all conversations', async () => {
      const userId = 'user-123';

      query.mockResolvedValueOnce({
        rows: [{ total: '15' }]
      });

      const result = await chatService.getTotalUnreadCount(userId);

      expect(result).toBe(15);
    });
  });
});
