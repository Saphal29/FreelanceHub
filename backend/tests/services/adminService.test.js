const adminService = require('../../src/services/adminService');
const { query } = require('../../src/utils/dbQueries');

jest.mock('../../src/utils/dbQueries');
jest.mock('../../src/utils/logger');

describe('Admin Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UT-81: Get all users with pagination', () => {
    it('should return paginated list of all users', async () => {
      const filters = { page: 1, limit: 20 };

      // Count query
      query.mockResolvedValueOnce({
        rows: [{ total: '50' }]
      });

      // Users query
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'user-1',
            email: 'user1@example.com',
            role: 'FREELANCER',
            full_name: 'John Doe',
            verified: true,
            projects_count: '5',
            contracts_count: '3'
          },
          {
            id: 'user-2',
            email: 'user2@example.com',
            role: 'CLIENT',
            full_name: 'Jane Smith',
            verified: true,
            projects_count: '10',
            contracts_count: '8'
          }
        ]
      });

      const result = await adminService.getAllUsers(filters);

      expect(result.users).toHaveLength(2);
      expect(result.pagination.total).toBe(50);
      expect(result.pagination.pages).toBe(3);
    });
  });

  describe('UT-82: Get user statistics', () => {
    it('should return comprehensive user statistics', async () => {
      query.mockResolvedValueOnce({
        rows: [{
          total_users: '100',
          freelancers: '60',
          clients: '38',
          admins: '2',
          verified_users: '85',
          unverified_users: '15',
          new_users_30d: '20',
          active_users_7d: '45'
        }]
      });

      const result = await adminService.getUserStats();

      expect(result.total_users).toBe('100');
      expect(result.freelancers).toBe('60');
      expect(result.clients).toBe('38');
      expect(result.verified_users).toBe('85');
    });
  });

  describe('UT-83: Suspend user account', () => {
    it('should suspend user by setting verified to false', async () => {
      const userId = 'user-123';
      const reason = 'Violation of terms';

      query.mockResolvedValueOnce({ rows: [] });

      const result = await adminService.suspendUser(userId, reason);

      expect(result.success).toBe(true);
      expect(result.message).toBe('User suspended successfully');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        [userId]
      );
    });
  });

  describe('UT-84: Verify user account', () => {
    it('should verify user account manually', async () => {
      const userId = 'user-123';

      query.mockResolvedValueOnce({ rows: [] });

      const result = await adminService.verifyUserAccount(userId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('User verified successfully');
    });
  });

  describe('UT-85: Delete user account', () => {
    it('should permanently delete user from database', async () => {
      const userId = 'user-123';

      query.mockResolvedValueOnce({ rows: [] });

      const result = await adminService.deleteUser(userId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('User deleted successfully');
    });
  });

  describe('UT-86: Get all projects with filters', () => {
    it('should return filtered and paginated projects', async () => {
      const filters = { status: 'active', page: 1, limit: 20 };

      query.mockResolvedValueOnce({
        rows: [{ total: '30' }]
      });

      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'project-1',
            title: 'E-commerce Website',
            status: 'active',
            client_name: 'John Doe',
            proposals_count: '5',
            contracts_count: '1'
          },
          {
            id: 'project-2',
            title: 'Mobile App',
            status: 'active',
            client_name: 'Jane Smith',
            proposals_count: '8',
            contracts_count: '0'
          }
        ]
      });

      const result = await adminService.getAllProjects(filters);

      expect(result.projects).toHaveLength(2);
      expect(result.pagination.total).toBe(30);
    });
  });

  describe('UT-87: Get project statistics', () => {
    it('should return project statistics by status', async () => {
      query.mockResolvedValueOnce({
        rows: [{
          total_projects: '150',
          draft_projects: '20',
          active_projects: '50',
          in_progress_projects: '40',
          completed_projects: '30',
          cancelled_projects: '8',
          archived_projects: '2',
          new_projects_30d: '25'
        }]
      });

      const result = await adminService.getProjectStats();

      expect(result.total_projects).toBe('150');
      expect(result.active_projects).toBe('50');
      expect(result.completed_projects).toBe('30');
    });
  });

  describe('UT-88: Get all disputes', () => {
    it('should return paginated disputes list', async () => {
      const filters = { status: 'open', page: 1, limit: 20 };

      query.mockResolvedValueOnce({
        rows: [{ total: '15' }]
      });

      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'dispute-1',
            status: 'open',
            category: 'payment',
            project_title: 'Website Project',
            filed_by_name: 'John Doe',
            respondent_name: 'Jane Smith'
          },
          {
            id: 'dispute-2',
            status: 'open',
            category: 'quality',
            project_title: 'App Development',
            filed_by_name: 'Bob Wilson',
            respondent_name: 'Alice Brown'
          }
        ]
      });

      const result = await adminService.getAllDisputes(filters);

      expect(result.disputes).toHaveLength(2);
      expect(result.pagination.total).toBe(15);
    });
  });

  describe('UT-89: Get financial statistics', () => {
    it('should return comprehensive financial statistics', async () => {
      query.mockResolvedValueOnce({
        rows: [{
          total_transactions: '500',
          total_revenue: '250000',
          platform_revenue: '25000',
          pending_transactions: '20',
          completed_transactions: '450',
          failed_transactions: '30',
          revenue_30d: '50000'
        }]
      });

      const result = await adminService.getFinancialStats();

      expect(result.total_transactions).toBe('500');
      expect(result.total_revenue).toBe('250000');
      expect(result.platform_revenue).toBe('25000');
    });
  });

  describe('UT-90: Get dashboard statistics', () => {
    it('should return combined statistics for admin dashboard', async () => {
      // Mock all stats queries
      query.mockResolvedValueOnce({
        rows: [{
          total_users: '100',
          freelancers: '60',
          clients: '38',
          admins: '2',
          verified_users: '85',
          unverified_users: '15',
          new_users_30d: '20',
          active_users_7d: '45'
        }]
      });
      query.mockResolvedValueOnce({
        rows: [{
          total_projects: '150',
          draft_projects: '20',
          active_projects: '50',
          in_progress_projects: '40',
          completed_projects: '30',
          cancelled_projects: '8',
          archived_projects: '2',
          new_projects_30d: '25'
        }]
      });
      query.mockResolvedValueOnce({
        rows: [{
          total_disputes: '25',
          open_disputes: '10',
          under_review_disputes: '5',
          in_mediation_disputes: '3',
          resolved_disputes: '6',
          closed_disputes: '1',
          unassigned_disputes: '8'
        }]
      });
      query.mockResolvedValueOnce({
        rows: [{
          total_transactions: '500',
          total_revenue: '250000',
          platform_revenue: '25000',
          pending_transactions: '20',
          completed_transactions: '450',
          failed_transactions: '30',
          revenue_30d: '50000'
        }]
      });
      const result = await adminService.getDashboardStats();
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('disputes');
      expect(result).toHaveProperty('financial');
      expect(result.users.total_users).toBe('100');
      expect(result.projects.total_projects).toBe('150');
      expect(result.disputes.total_disputes).toBe('25');
      expect(result.financial.total_revenue).toBe('250000');
    });
  });
});
