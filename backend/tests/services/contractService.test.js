/**
 * ============================================
 * CONTRACT SERVICE - UNIT TESTS
 * ============================================
 * Tests for contract management service functions
 * Covers: create, sign, get contracts
 */

const contractService = require('../../src/services/contractService');

// Mock dependencies
jest.mock('../../src/utils/dbQueries');
const { query } = require('../../src/utils/dbQueries');

describe('Contract Service - Unit Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // UT-31: Create contract from accepted proposal
  // ============================================
  describe('UT-31: Create contract from accepted proposal', () => {
    it('should create contract when proposal is accepted', async () => {
      const proposalId = 'proposal-uuid-123';
      const clientId = 'client-uuid-123';

      // Mock: Get proposal details
      query.mockResolvedValueOnce({
        rows: [{
          id: proposalId,
          client_id: clientId,
          freelancer_id: 'freelancer-uuid-123',
          project_id: 'project-uuid-123',
          proposed_budget: 5000,
          proposed_timeline: '4 weeks',
          status: 'accepted'
        }]
      });
      // Mock: Check no existing contract
      query.mockResolvedValueOnce({ rows: [] });

      // Mock: Create contract
      query.mockResolvedValueOnce({
        rows: [{
          id: 'contract-uuid-123',
          project_id: 'project-uuid-123',
          status: 'pending',
          agreed_budget: 5000
        }]
      });

      const result = await contractService.createContract(proposalId, clientId);

      expect(result).toHaveProperty('id');
      expect(result.status).toBe('pending');
    });
  });

  // ============================================
  // UT-32: Create contract from non-accepted proposal
  // ============================================
  describe('UT-32: Create contract from non-accepted proposal', () => {
    it('should throw error when proposal is not accepted', async () => {
      const proposalId = 'proposal-uuid-123';
      const clientId = 'client-uuid-123';

      // Mock: Get proposal with pending status
      query.mockResolvedValueOnce({
        rows: [{
          id: proposalId,
          client_id: clientId,
          status: 'pending'
        }]
      });

      await expect(contractService.createContract(proposalId, clientId))
        .rejects
        .toThrow('Only accepted proposals');
    });
  });

  // ============================================
  // UT-33: Sign contract by client
  // ============================================
  describe('UT-33: Sign contract by client', () => {
    it('should update client signature when client signs', async () => {
      const contractId = 'contract-uuid-123';
      const clientId = 'client-uuid-123';

      // Mock: Get contract
      query.mockResolvedValueOnce({
        rows: [{
          id: contractId,
          client_id: clientId,
          freelancer_id: 'freelancer-uuid-123',
          signed_by_client: false,
          signed_by_freelancer: false
        }]
      });

      // Mock: Update signature
      query.mockResolvedValueOnce({
        rows: [{
          id: contractId,
          project_id: 'project-uuid-123',
          proposal_id: 'proposal-uuid-123',
          client_id: clientId,
          freelancer_id: 'freelancer-uuid-123',
          agreed_budget: 5000,
          agreed_timeline: '4 weeks',
          status: 'pending',
          signed_by_client: true,
          client_signed_at: new Date(),
          signed_by_freelancer: false,
          created_at: new Date()
        }]
      });

      const result = await contractService.signContract(contractId, clientId);

      expect(result.signedByClient).toBe(true);
      expect(result.status).toBe('pending'); // Still pending freelancer signature
    });
  });

  // ============================================
  // UT-34: Sign contract by freelancer
  // ============================================
  describe('UT-34: Sign contract by freelancer', () => {
    it('should update freelancer signature when freelancer signs', async () => {
      const contractId = 'contract-uuid-123';
      const freelancerId = 'freelancer-uuid-123';

      // Mock: Get contract
      query.mockResolvedValueOnce({
        rows: [{
          id: contractId,
          client_id: 'client-uuid-123',
          freelancer_id: freelancerId,
          signed_by_client: false,
          signed_by_freelancer: false
        }]
      });

      // Mock: Update signature
      query.mockResolvedValueOnce({
        rows: [{
          id: contractId,
          signed_by_client: false,
          signed_by_freelancer: true,
          freelancer_signed_at: new Date()
        }]
      });

      const result = await contractService.signContract(contractId, freelancerId);

      expect(result.signedByFreelancer).toBe(true);
    });
  });

  // ============================================
  // UT-35: Activate contract when both parties sign
  // ============================================
  describe('UT-35: Activate contract when both parties sign', () => {
    it('should change status to active when both sign', async () => {
      const contractId = 'contract-uuid-123';
      const freelancerId = 'freelancer-uuid-123';

      // Mock: Get contract (client already signed)
      query.mockResolvedValueOnce({
        rows: [{
          id: contractId,
          client_id: 'client-uuid-123',
          freelancer_id: freelancerId,
          signed_by_client: true,
          signed_by_freelancer: false
        }]
      });

      // Mock: Update freelancer signature
      query.mockResolvedValueOnce({
        rows: [{
          id: contractId,
          signed_by_client: true,
          signed_by_freelancer: true
        }]
      });

      // Mock: Activate contract
      query.mockResolvedValueOnce({
        rows: [{
          id: contractId,
          status: 'active',
          started_at: new Date()
        }]
      });

      const result = await contractService.signContract(contractId, freelancerId);

      expect(result.status).toBe('active');
      expect(result).toHaveProperty('startedAt');
    });
  });

  // ============================================
  // UT-36: Prevent duplicate signature
  // ============================================
  describe('UT-36: Prevent duplicate signature', () => {
    it('should throw error when user already signed', async () => {
      const contractId = 'contract-uuid-123';
      const clientId = 'client-uuid-123';

      // Mock: Get contract (client already signed)
      query.mockResolvedValueOnce({
        rows: [{
          id: contractId,
          client_id: clientId,
          signed_by_client: true
        }]
      });

      await expect(contractService.signContract(contractId, clientId))
        .rejects
        .toThrow('already signed');
    });
  });

  // ============================================
  // UT-37: Get user contracts
  // ============================================
  describe('UT-37: Get user contracts', () => {
    it('should return all contracts for user', async () => {
      const userId = 'user-uuid-123';

      // Mock: Get contracts
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'contract-1',
            client_id: userId,
            status: 'active'
          },
          {
            id: 'contract-2',
            freelancer_id: userId,
            status: 'pending'
          }
        ]
      });

      const result = await contractService.getUserContracts(userId);

      expect(result).toHaveLength(2);
    });
  });

  // ============================================
  // UT-38: Filter contracts by status
  // ============================================
  describe('UT-38: Filter contracts by status', () => {
    it('should return only active contracts', async () => {
      const userId = 'user-uuid-123';
      const filters = { status: 'active' };

      // Mock: Get filtered contracts
      query.mockResolvedValueOnce({
        rows: [{
          id: 'contract-1',
          status: 'active'
        }]
      });

      const result = await contractService.getUserContracts(userId, filters);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('active');
    });
  });

  // ============================================
  // UT-39: Get contract by ID
  // ============================================
  describe('UT-39: Get contract by ID', () => {
    it('should return contract details', async () => {
      const contractId = 'contract-uuid-123';
      const userId = 'user-uuid-123';

      // Mock: Get contract
      query.mockResolvedValueOnce({
        rows: [{
          id: contractId,
          client_id: userId,
          status: 'active'
        }]
      });

      const result = await contractService.getContractById(contractId, userId);

      expect(result.id).toBe(contractId);
    });
  });

  // ============================================
  // UT-40: Unauthorized contract access
  // ============================================
  describe('UT-40: Unauthorized contract access', () => {
    it('should throw error when user is not party to contract', async () => {
      const contractId = 'contract-uuid-123';
      const wrongUserId = 'wrong-user-id';

      // Mock: Get contract
      query.mockResolvedValueOnce({
        rows: [{
          id: contractId,
          client_id: 'client-id',
          freelancer_id: 'freelancer-id'
        }]
      });

      await expect(contractService.getContractById(contractId, wrongUserId))
        .rejects
        .toThrow('Unauthorized');
    });
  });

});
