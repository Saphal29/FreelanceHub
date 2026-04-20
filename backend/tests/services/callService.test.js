const callService = require('../../src/services/callService');
const { query } = require('../../src/utils/dbQueries');

jest.mock('../../src/utils/dbQueries');
jest.mock('../../src/utils/logger');

describe('Call Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UT-76: Initiate call', () => {
    it('should create call record with initiated status', async () => {
      const callerId = 'user-123';
      const calleeId = 'user-456';
      const callType = 'video';

      query.mockResolvedValueOnce({
        rows: [{
          call_id: 'call-123',
          caller_id: callerId,
          receiver_id: calleeId,
          call_type: callType,
          status: 'initiated',
          created_at: new Date()
        }]
      });

      const result = await callService.initiateCall(callerId, calleeId, callType);

      expect(result).toHaveProperty('callId');
      expect(result.status).toBe('initiated');
      expect(result.callType).toBe('video');
    });
  });

  describe('UT-77: Accept call', () => {
    it('should update call status to ringing', async () => {
      const callId = 'call-123';
      const userId = 'user-456';

      query.mockResolvedValueOnce({
        rows: [{
          call_id: callId,
          receiver_id: userId,
          status: 'ringing',
          updated_at: new Date()
        }]
      });

      const result = await callService.acceptCall(callId, userId);

      expect(result.status).toBe('ringing');
    });
  });

  describe('UT-78: Reject call', () => {
    it('should update call status to rejected', async () => {
      const callId = 'call-123';
      const userId = 'user-456';

      query.mockResolvedValueOnce({
        rows: [{
          call_id: callId,
          receiver_id: userId,
          status: 'rejected',
          updated_at: new Date()
        }]
      });

      const result = await callService.rejectCall(callId, userId);

      expect(result.status).toBe('rejected');
    });
  });

  describe('UT-79: End call and calculate duration', () => {
    it('should end call and compute duration', async () => {
      const callId = 'call-123';
      const userId = 'user-123';
      const startTime = new Date(Date.now() - 300000); // 5 minutes ago
      const endTime = new Date();

      query.mockResolvedValueOnce({
        rows: [{
          call_id: callId,
          status: 'ended',
          start_time: startTime,
          end_time: endTime,
          duration: 300,
          updated_at: new Date()
        }]
      });

      const result = await callService.endCall(callId, userId);

      expect(result.status).toBe('ended');
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('UT-80: Get call history', () => {
    it('should return paginated call history for user', async () => {
      const userId = 'user-123';

      query.mockResolvedValueOnce({
        rows: [
          {
            call_id: 'call-1',
            caller_id: userId,
            receiver_id: 'user-456',
            status: 'ended',
            duration: 300,
            created_at: new Date()
          },
          {
            call_id: 'call-2',
            caller_id: 'user-789',
            receiver_id: userId,
            status: 'rejected',
            duration: 0,
            created_at: new Date()
          }
        ]
      });

      const result = await callService.getCallHistory(userId, 20, 0);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('callId');
      expect(result[0]).toHaveProperty('status');
    });
  });
});
