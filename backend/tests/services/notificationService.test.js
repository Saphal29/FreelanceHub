const notificationService = require('../../src/services/notificationService');
const { query } = require('../../src/utils/dbQueries');

jest.mock('../../src/utils/dbQueries');
jest.mock('../../src/utils/logger');

describe('Notification Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UT-66: Get user notifications', () => {
    it('should return all notifications for user', async () => {
      const userId = 'user-123';

      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'notif-1',
            user_id: userId,
            type: 'proposal_submitted',
            title: 'New Proposal',
            message: 'You received a new proposal',
            is_read: false,
            created_at: new Date()
          },
          {
            id: 'notif-2',
            user_id: userId,
            type: 'payment_received',
            title: 'Payment Received',
            message: 'Payment of $500 received',
            is_read: true,
            created_at: new Date()
          }
        ]
      });

      const result = await notificationService.getUserNotifications(userId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('type');
    });
  });

  describe('UT-67: Mark notification as read', () => {
    it('should update notification read status', async () => {
      const notificationId = 'notif-123';
      const userId = 'user-123';

      query.mockResolvedValueOnce({
        rows: [{
          id: notificationId,
          user_id: userId,
          is_read: true,
          read_at: new Date()
        }]
      });

      const result = await notificationService.markAsRead(notificationId, userId);

      expect(result.isRead).toBe(true);
      expect(result).toHaveProperty('readAt');
    });
  });

  describe('UT-68: Mark all notifications as read', () => {
    it('should mark all unread notifications as read', async () => {
      const userId = 'user-123';

      query.mockResolvedValueOnce({
        rows: [{ id: 'notif-1' }, { id: 'notif-2' }, { id: 'notif-3' }]
      });

      const result = await notificationService.markAllAsRead(userId);

      expect(result).toBe(3);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications'),
        [userId]
      );
    });
  });

  describe('UT-69: Get unread notification count', () => {
    it('should return count of unread notifications', async () => {
      const userId = 'user-123';

      query.mockResolvedValueOnce({
        rows: [{ count: '5' }]
      });

      const result = await notificationService.getUnreadCount(userId);

      expect(result).toBe(5);
    });
  });

  describe('UT-70: Filter notifications by type', () => {
    it('should return notifications of specific type', async () => {
      const userId = 'user-123';
      const filters = { type: 'payment_received' };

      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'notif-1',
            user_id: userId,
            type: 'payment_received',
            title: 'Payment Received',
            is_read: false,
            created_at: new Date()
          }
        ]
      });

      const result = await notificationService.getUserNotifications(userId, filters);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('payment_received');
    });
  });
});
