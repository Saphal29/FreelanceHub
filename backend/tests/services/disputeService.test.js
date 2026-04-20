const disputeService = require('../../src/services/disputeService');
const { query } = require('../../src/utils/dbQueries');

jest.mock('../../src/utils/dbQueries');
jest.mock('../../src/utils/logger');

describe('Dispute Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UT-61: File dispute with valid data', () => {
    it('should create dispute when all required fields are provided', async () => {
      const userId = 'user-123';
      const disputeData = {
        contractId: 'contract-123',
        category: 'payment',
        title: 'Payment not received',
        description: 'Milestone completed but payment not released',
        amountDisputed: 5000,
        priority: 'high'
      };

      // Mock contract query
      query.mockResolvedValueOnce({
        rows: [{
          id: 'contract-123',
          client_id: 'client-123',
          freelancer_id: userId,
          project_id: 'project-123'
        }]
      });

      // Mock dispute creation
      query.mockResolvedValueOnce({
        rows: [{
          id: 'dispute-123',
          contract_id: 'contract-123',
          project_id: 'project-123',
          filed_by: userId,
          respondent_id: 'client-123',
          category: 'payment',
          title: 'Payment not received',
          description: 'Milestone completed but payment not released',
          amount_disputed: 5000,
          priority: 'high',
          status: 'open',
          created_at: new Date()
        }]
      });

      const result = await disputeService.fileDispute(userId, disputeData);

      expect(result).toHaveProperty('id');
      expect(result.category).toBe('payment');
      expect(result.status).toBe('open');
      expect(query).toHaveBeenCalledTimes(2);
    });
  });

  describe('UT-62: File dispute by unauthorized user', () => {
    it('should throw error when user is not part of contract', async () => {
      const userId = 'unauthorized-user';
      const disputeData = {
        contractId: 'contract-123',
        category: 'payment',
        title: 'Test dispute',
        description: 'Test'
      };

      query.mockResolvedValueOnce({
        rows: [{
          client_id: 'client-123',
          freelancer_id: 'freelancer-123',
          project_id: 'project-123'
        }]
      });

      await expect(disputeService.fileDispute(userId, disputeData))
        .rejects.toThrow('Unauthorized: You are not part of this contract');
    });
  });

  describe('UT-63: Get user disputes', () => {
    it('should return all disputes for user', async () => {
      const userId = 'user-123';

      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'dispute-1',
            filed_by: userId,
            status: 'open',
            project_title: 'Project 1',
            filed_by_name: 'John Doe',
            respondent_name: 'Jane Smith',
            message_count: '5',
            evidence_count: '2'
          },
          {
            id: 'dispute-2',
            respondent_id: userId,
            status: 'in_mediation',
            project_title: 'Project 2',
            filed_by_name: 'Bob Wilson',
            respondent_name: 'John Doe',
            message_count: '10',
            evidence_count: '3'
          }
        ]
      });

      const result = await disputeService.getUserDisputes(userId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('projectTitle');
    });
  });

  describe('UT-64: Upload evidence to dispute', () => {
    it('should upload evidence when user has access', async () => {
      const disputeId = 'dispute-123';
      const userId = 'user-123';
      const evidenceData = {
        fileName: 'evidence.pdf',
        filePath: '/uploads/evidence.pdf',
        fileType: 'application/pdf',
        fileSize: 102400,
        description: 'Payment proof'
      };

      query.mockResolvedValueOnce({
        rows: [{ filed_by: userId, respondent_id: 'other-user' }]
      });

      query.mockResolvedValueOnce({
        rows: [{
          id: 'evidence-123',
          dispute_id: disputeId,
          uploaded_by: userId,
          file_name: 'evidence.pdf',
          created_at: new Date()
        }]
      });

      const result = await disputeService.uploadEvidence(disputeId, userId, evidenceData);

      expect(result).toHaveProperty('id');
      expect(result.fileName).toBe('evidence.pdf');
    });
  });

  describe('UT-65: Resolve dispute by mediator', () => {
    it('should resolve dispute when mediator provides resolution', async () => {
      const disputeId = 'dispute-123';
      const mediatorId = 'mediator-123';
      const resolutionData = {
        resolutionType: 'release_to_freelancer',
        resolutionNotes: 'Work completed as per contract',
        resolutionAmount: 5000
      };

      query.mockResolvedValueOnce({
        rows: [{
          id: disputeId,
          mediator_id: mediatorId,
          status: 'in_mediation',
          contract_id: 'contract-123',
          milestone_id: 'milestone-123',
          client_id: 'client-123',
          freelancer_id: 'freelancer-123'
        }]
      });

      query.mockResolvedValueOnce({
        rows: [{
          id: disputeId,
          status: 'resolved',
          resolution_type: 'release_to_freelancer',
          resolved_at: new Date()
        }]
      });

      query.mockResolvedValueOnce({ rows: [] }); // Escrow creation

      const result = await disputeService.resolveDispute(
        disputeId,
        mediatorId,
        'ADMIN',
        resolutionData
      );

      expect(result.status).toBe('resolved');
      expect(result.resolutionType).toBe('release_to_freelancer');
    });
  });
});
