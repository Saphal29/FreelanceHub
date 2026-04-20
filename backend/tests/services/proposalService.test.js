/**
 * ============================================
 * PROPOSAL SERVICE - UNIT TESTS
 * ============================================
 * Tests for proposal management service functions
 * Covers: submit, accept, reject, update proposals
 */

const proposalService = require('../../src/services/proposalService');
const contractService = require('../../src/services/contractService');

// Mock dependencies
jest.mock('../../src/utils/dbQueries');
jest.mock('../../src/services/contractService');
const { query } = require('../../src/utils/dbQueries');

describe('Proposal Service - Unit Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // UT-21: Submit proposal with valid data
  // ============================================
  describe('UT-21: Submit proposal with valid data', () => {
    it('should create proposal when all required fields are provided', async () => {
      const proposalData = {
        projectId: 'project-uuid-123',
        coverLetter: 'I am interested in this project',
        proposedBudget: 4500,
        proposedTimeline: '4 weeks'
      };
      const freelancerId = 'freelancer-uuid-123';

      // Mock: Check project exists and is active
      query.mockResolvedValueOnce({
        rows: [{
          id: proposalData.projectId,
          status: 'active',
          client_id: 'client-uuid-456'
        }]
      });

      // Mock: Check no existing proposal
      query.mockResolvedValueOnce({ rows: [] });

      // Mock: Create proposal
      query.mockResolvedValueOnce({
        rows: [{
          id: 'proposal-uuid-123',
          project_id: proposalData.projectId,
          freelancer_id: freelancerId,
          cover_letter: proposalData.coverLetter,
          proposed_budget: proposalData.proposedBudget,
          proposed_timeline: proposalData.proposedTimeline,
          status: 'pending',
          created_at: new Date()
        }]
      });

      const result = await proposalService.submitProposal(freelancerId, proposalData);

      expect(result).toHaveProperty('id');
      expect(result.status).toBe('pending');
    });
  });

  // ============================================
  // UT-22: Submit duplicate proposal
  // ============================================
  describe('UT-22: Submit duplicate proposal', () => {
    it('should throw error when freelancer already submitted proposal', async () => {
      const proposalData = {
        projectId: 'project-uuid-123',
        coverLetter: 'I am interested',
        proposedBudget: 4500
      };
      const freelancerId = 'freelancer-uuid-123';

      // Mock: Project exists
      query.mockResolvedValueOnce({
        rows: [{
          id: proposalData.projectId,
          status: 'active',
          client_id: 'client-uuid-456'
        }]
      });

      // Mock: Existing proposal found
      query.mockResolvedValueOnce({
        rows: [{ id: 'existing-proposal-id' }]
      });

      await expect(proposalService.submitProposal(freelancerId, proposalData))
        .rejects
        .toThrow('already submitted');
    });
  });

  // ============================================
  // UT-23: Accept proposal
  // ============================================
  describe('UT-23: Accept proposal', () => {
    it('should update proposal status to accepted', async () => {
      const proposalId = 'proposal-uuid-123';
      const clientId = 'client-uuid-123';

      // Mock: Get proposal with project
      query.mockResolvedValueOnce({
        rows: [{
          id: proposalId,
          project_id: 'project-uuid-123',
          freelancer_id: 'freelancer-uuid-456',
          status: 'pending',
          client_id: clientId,
          project_status: 'active'
        }]
      });

      // Mock: Update proposal status
      query.mockResolvedValueOnce({
        rows: [{
          id: proposalId,
          status: 'accepted',
          updated_at: new Date()
        }]
      });

      // Mock: Update project status
      query.mockResolvedValueOnce({ rows: [] });

      // Mock: Contract creation
      contractService.createContract.mockResolvedValue({
        id: 'contract-uuid-123',
        status: 'pending'
      });

      const result = await proposalService.updateProposalStatus(proposalId, clientId, 'accepted');

      expect(result.status).toBe('accepted');
    });
  });

  // ============================================
  // UT-24: Reject proposal
  // ============================================
  describe('UT-24: Reject proposal', () => {
    it('should update proposal status to rejected', async () => {
      const proposalId = 'proposal-uuid-123';
      const clientId = 'client-uuid-123';

      // Mock: Get proposal
      query.mockResolvedValueOnce({
        rows: [{
          id: proposalId,
          project_id: 'project-uuid-123',
          status: 'pending',
          client_id: clientId,
          project_status: 'active'
        }]
      });

      // Mock: Update proposal
      query.mockResolvedValueOnce({
        rows: [{
          id: proposalId,
          status: 'rejected',
          updated_at: new Date()
        }]
      });

      const result = await proposalService.updateProposalStatus(proposalId, clientId, 'rejected');

      expect(result.status).toBe('rejected');
    });
  });

  // ============================================
  // UT-25: Get freelancer proposals
  // ============================================
  describe('UT-25: Get freelancer proposals', () => {
    it('should return all proposals for freelancer', async () => {
      const freelancerId = 'freelancer-uuid-123';

      // Mock: Get proposals
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'proposal-1',
            project_id: 'project-1',
            freelancer_id: freelancerId,
            status: 'pending',
            project_title: 'Project 1',
            created_at: new Date()
          },
          {
            id: 'proposal-2',
            project_id: 'project-2',
            freelancer_id: freelancerId,
            status: 'accepted',
            project_title: 'Project 2',
            created_at: new Date()
          }
        ]
      });

      const result = await proposalService.getFreelancerProposals(freelancerId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
    });
  });

  // ============================================
  // UT-26: Get project proposals
  // ============================================
  describe('UT-26: Get project proposals', () => {
    it('should return all proposals for a project', async () => {
      const projectId = 'project-uuid-123';
      const clientId = 'client-uuid-123';

      // Mock: Verify project ownership
      query.mockResolvedValueOnce({
        rows: [{
          id: projectId,
          client_id: clientId
        }]
      });

      // Mock: Get proposals
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'proposal-1',
            freelancer_id: 'freelancer-1',
            status: 'pending',
            created_at: new Date()
          },
          {
            id: 'proposal-2',
            freelancer_id: 'freelancer-2',
            status: 'pending',
            created_at: new Date()
          }
        ]
      });

      const result = await proposalService.getProjectProposals(projectId, clientId);

      expect(result).toHaveLength(2);
    });
  });

  // ============================================
  // UT-27: Get proposal by ID
  // ============================================
  describe('UT-27: Get proposal by ID', () => {
    it('should return proposal details', async () => {
      const proposalId = 'proposal-uuid-123';
      const userId = 'user-uuid-123';

      // Mock: Get proposal
      query.mockResolvedValueOnce({
        rows: [{
          id: proposalId,
          freelancer_id: userId,
          project_client_id: 'client-uuid-456',
          status: 'pending',
          created_at: new Date()
        }]
      });

      const result = await proposalService.getProposalById(proposalId, userId);

      expect(result.id).toBe(proposalId);
    });
  });

  // ============================================
  // UT-28: Prevent accepting already processed proposal
  // ============================================
  describe('UT-28: Prevent accepting already processed proposal', () => {
    it('should throw error when proposal already processed', async () => {
      const proposalId = 'proposal-uuid-123';
      const clientId = 'client-uuid-123';

      // Mock: Get accepted proposal
      query.mockResolvedValueOnce({
        rows: [{
          id: proposalId,
          client_id: clientId,
          status: 'accepted'
        }]
      });

      await expect(proposalService.updateProposalStatus(proposalId, clientId, 'accepted'))
        .rejects
        .toThrow('already been processed');
    });
  });

  // ============================================
  // UT-29: Withdraw proposal
  // ============================================
  describe('UT-29: Withdraw proposal', () => {
    it('should update status to withdrawn', async () => {
      const proposalId = 'proposal-uuid-123';
      const freelancerId = 'freelancer-uuid-123';

      // Mock: Get proposal
      query.mockResolvedValueOnce({
        rows: [{
          id: proposalId,
          freelancer_id: freelancerId,
          status: 'pending'
        }]
      });

      // Mock: Update status
      query.mockResolvedValueOnce({
        rows: [{
          id: proposalId,
          status: 'withdrawn',
          updated_at: new Date()
        }]
      });

      const result = await proposalService.withdrawProposal(proposalId, freelancerId);

      expect(result.status).toBe('withdrawn');
    });
  });

  // ============================================
  // UT-30: Accept proposal by non-owner
  // ============================================
  describe('UT-30: Accept proposal by non-owner', () => {
    it('should throw authorization error', async () => {
      const proposalId = 'proposal-uuid-123';
      const wrongClientId = 'wrong-client-id';

      // Mock: Get proposal
      query.mockResolvedValueOnce({
        rows: [{
          id: proposalId,
          project_id: 'project-uuid-123',
          client_id: 'actual-owner-id'
        }]
      });

      await expect(proposalService.updateProposalStatus(proposalId, wrongClientId, 'accepted'))
        .rejects
        .toThrow('Unauthorized');
    });
  });

});
