/**
 * ============================================
 * MILESTONE SERVICE - UNIT TESTS
 * ============================================
 * Tests for milestone submission and review functions
 * Note: Milestone CRUD is in projectService
 * Covers: submit, review, revisions
 */

const milestoneService = require('../../src/services/milestoneService');
const projectService = require('../../src/services/projectService');

// Mock dependencies
jest.mock('../../src/utils/dbQueries');
const { query } = require('../../src/utils/dbQueries');

describe('Milestone Service - Unit Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // UT-41: Create milestone with valid data (using projectService)
  // ============================================
  describe('UT-41: Create milestone with valid data', () => {
    it('should create milestone when all required fields provided', async () => {
      const projectId = 'project-uuid-123';
      const milestones = [{
        title: 'Design Phase',
        description: 'Complete UI/UX design',
        amount: 1000,
        dueDate: '2024-12-31',
        orderIndex: 0
      }];

      // Mock: Create milestone
      query.mockResolvedValueOnce({
        rows: [{
          id: 'milestone-uuid-123',
          project_id: projectId,
          title: milestones[0].title,
          description: milestones[0].description,
          amount: milestones[0].amount,
          due_date: milestones[0].dueDate,
          order_index: 0,
          status: 'pending',
          created_at: new Date()
        }]
      });

      const result = await projectService.createProjectMilestones(projectId, milestones);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0].status).toBe('pending');
    });
  });

  // ============================================
  // UT-42: Submit milestone for review
  // ============================================
  describe('UT-42: Submit milestone for review', () => {
    it('should create submission record', async () => {
      const milestoneId = 'milestone-uuid-123';
      const freelancerId = 'freelancer-uuid-123';
      const submissionData = {
        notes: 'All requirements completed',
        attachments: []
      };

      // Mock: Get milestone with contract
      query.mockResolvedValueOnce({
        rows: [{
          id: milestoneId,
          project_id: 'project-uuid-123',
          client_id: 'client-uuid-456',
          freelancer_id: freelancerId,
          contract_id: 'contract-uuid-789',
          status: 'in_progress'
        }]
      });

      // Mock: Get last completed milestone date
      query.mockResolvedValueOnce({
        rows: [{ last_completed: null }]
      });

      // Mock: Get contract created date
      query.mockResolvedValueOnce({
        rows: [{ created_at: new Date() }]
      });

      // Mock: Get time entries
      query.mockResolvedValueOnce({
        rows: []
      });

      // Mock: Create submission
      query.mockResolvedValueOnce({
        rows: [{
          id: 'submission-uuid-123',
          milestone_id: milestoneId,
          submitted_by: freelancerId,
          submission_notes: submissionData.notes,
          status: 'pending',
          total_hours: 0,
          total_amount: 0,
          created_at: new Date()
        }]
      });

      const result = await milestoneService.submitMilestone(milestoneId, freelancerId, submissionData);

      expect(result).toHaveProperty('id');
      expect(result.status).toBe('pending');
    });
  });

  // ============================================
  // UT-43: Approve milestone submission
  // ============================================
  describe('UT-43: Approve milestone submission', () => {
    it('should update status to approved and create escrow', async () => {
      const submissionId = 'submission-uuid-123';
      const clientId = 'client-uuid-123';

      // Mock: Get submission
      query.mockResolvedValueOnce({
        rows: [{
          id: submissionId,
          milestone_id: 'milestone-uuid-456',
          project_id: 'project-uuid-789',
          client_id: clientId,
          freelancer_id: 'freelancer-uuid-111',
          contract_id: 'contract-uuid-222',
          status: 'pending',
          milestone_amount: 5000
        }]
      });

      // Mock: Update submission
      query.mockResolvedValueOnce({
        rows: [{
          id: submissionId,
          status: 'approved',
          reviewed_by: clientId,
          reviewed_at: new Date()
        }]
      });

      // Mock: Update milestone to completed
      query.mockResolvedValueOnce({ rows: [] });

      // Mock: Create escrow
      query.mockResolvedValueOnce({ rows: [] });

      // Mock: Check all milestones completed
      query.mockResolvedValueOnce({
        rows: [{ total: '2', completed: '1' }]
      });

      const result = await milestoneService.reviewMilestoneSubmission(submissionId, clientId, { action: 'approve' });

      expect(result.status).toBe('approved');
    });
  });

  // ============================================
  // UT-44: Reject milestone submission
  // ============================================
  describe('UT-44: Reject milestone submission', () => {
    it('should update status to rejected', async () => {
      const submissionId = 'submission-uuid-123';
      const clientId = 'client-uuid-123';
      const reviewData = {
        action: 'reject',
        notes: 'Design needs improvements'
      };

      // Mock: Get submission
      query.mockResolvedValueOnce({
        rows: [{
          id: submissionId,
          milestone_id: 'milestone-uuid-456',
          project_id: 'project-uuid-789',
          client_id: clientId,
          status: 'pending'
        }]
      });

      // Mock: Update submission
      query.mockResolvedValueOnce({
        rows: [{
          id: submissionId,
          status: 'rejected',
          reviewed_by: clientId,
          review_notes: reviewData.notes,
          reviewed_at: new Date()
        }]
      });

      const result = await milestoneService.reviewMilestoneSubmission(submissionId, clientId, reviewData);

      expect(result.status).toBe('rejected');
    });
  });

  // ============================================
  // UT-45: Request revision on milestone
  // ============================================
  describe('UT-45: Request revision on milestone', () => {
    it('should create revision request', async () => {
      const submissionId = 'submission-uuid-123';
      const clientId = 'client-uuid-123';
      const reviewData = {
        action: 'request_revision',
        notes: 'Please update the color scheme'
      };

      // Mock: Get submission
      query.mockResolvedValueOnce({
        rows: [{
          id: submissionId,
          milestone_id: 'milestone-uuid-456',
          project_id: 'project-uuid-789',
          client_id: clientId,
          status: 'pending'
        }]
      });

      // Mock: Update submission
      query.mockResolvedValueOnce({
        rows: [{
          id: submissionId,
          status: 'revision_requested',
          reviewed_by: clientId,
          review_notes: reviewData.notes,
          reviewed_at: new Date()
        }]
      });

      // Mock: Create revision
      query.mockResolvedValueOnce({
        rows: [{
          id: 'revision-uuid-123',
          milestone_id: 'milestone-uuid-456',
          submission_id: submissionId
        }]
      });

      const result = await milestoneService.reviewMilestoneSubmission(submissionId, clientId, reviewData);

      expect(result.status).toBe('revision_requested');
    });
  });

  // ============================================
  // UT-46: Get milestone submissions
  // ============================================
  describe('UT-46: Get milestone submissions', () => {
    it('should return all submissions for milestone', async () => {
      const milestoneId = 'milestone-uuid-123';
      const userId = 'user-uuid-123';

      // Mock: Verify access
      query.mockResolvedValueOnce({
        rows: [{
          id: milestoneId,
          client_id: userId,
          freelancer_id: 'freelancer-uuid-456'
        }]
      });

      // Mock: Get submissions
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'submission-1',
            milestone_id: milestoneId,
            status: 'approved',
            created_at: new Date()
          },
          {
            id: 'submission-2',
            milestone_id: milestoneId,
            status: 'pending',
            created_at: new Date()
          }
        ]
      });

      const result = await milestoneService.getMilestoneSubmissions(milestoneId, userId);

      expect(result).toHaveLength(2);
    });
  });

  // ============================================
  // UT-47: Get milestone revisions
  // ============================================
  describe('UT-47: Get milestone revisions', () => {
    it('should return all revisions for milestone', async () => {
      const milestoneId = 'milestone-uuid-123';
      const userId = 'user-uuid-123';

      // Mock: Verify access
      query.mockResolvedValueOnce({
        rows: [{
          id: milestoneId,
          client_id: userId,
          freelancer_id: 'freelancer-uuid-456'
        }]
      });

      // Mock: Get revisions
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'revision-1',
            milestone_id: milestoneId,
            resolved: false,
            created_at: new Date()
          }
        ]
      });

      const result = await milestoneService.getMilestoneRevisions(milestoneId, userId);

      expect(result).toHaveLength(1);
    });
  });

  // ============================================
  // UT-48: Resolve revision
  // ============================================
  describe('UT-48: Resolve revision', () => {
    it('should mark revision as resolved', async () => {
      const revisionId = 'revision-uuid-123';
      const freelancerId = 'freelancer-uuid-123';

      // Mock: Get revision
      query.mockResolvedValueOnce({
        rows: [{
          id: revisionId,
          milestone_id: 'milestone-uuid-456',
          project_id: 'project-uuid-789',
          freelancer_id: freelancerId,
          resolved: false
        }]
      });

      // Mock: Update revision
      query.mockResolvedValueOnce({
        rows: [{
          id: revisionId,
          resolved: true,
          resolved_at: new Date(),
          resolved_by: freelancerId
        }]
      });

      const result = await milestoneService.resolveRevision(revisionId, freelancerId);

      expect(result.resolved).toBe(true);
    });
  });

  // ============================================
  // UT-49: Prevent unauthorized submission
  // ============================================
  describe('UT-49: Prevent unauthorized submission', () => {
    it('should throw error when non-freelancer submits', async () => {
      const milestoneId = 'milestone-uuid-123';
      const wrongUserId = 'wrong-user-id';
      const submissionData = { notes: 'Test' };

      // Mock: Get milestone
      query.mockResolvedValueOnce({
        rows: [{
          id: milestoneId,
          freelancer_id: 'actual-freelancer-id'
        }]
      });

      await expect(milestoneService.submitMilestone(milestoneId, wrongUserId, submissionData))
        .rejects
        .toThrow('Unauthorized');
    });
  });

  // ============================================
  // UT-50: Review milestone with invalid action
  // ============================================
  describe('UT-50: Review milestone with invalid action', () => {
    it('should throw validation error', async () => {
      const submissionId = 'submission-uuid-123';
      const clientId = 'client-uuid-123';
      const reviewData = {
        action: 'invalid_action'
      };

      // Mock: Get submission
      query.mockResolvedValueOnce({
        rows: [{
          id: submissionId,
          client_id: clientId,
          status: 'pending'
        }]
      });

      await expect(milestoneService.reviewMilestoneSubmission(submissionId, clientId, reviewData))
        .rejects
        .toThrow('Invalid action');
    });
  });

});
