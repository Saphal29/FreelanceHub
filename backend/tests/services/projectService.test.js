/**
 * ============================================
 * PROJECT SERVICE - UNIT TESTS
 * ============================================
 * Tests for project management service functions
 * Covers: create, update, delete, search, filter projects
 */

const projectService = require('../../src/services/projectService');

// Mock dependencies
jest.mock('../../src/utils/dbQueries');
const { query } = require('../../src/utils/dbQueries');

describe('Project Service - Unit Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // UT-11: Create project with valid data
  // ============================================
  describe('UT-11: Create project with valid data', () => {
    it('should create project when all required fields are provided', async () => {
      const projectData = {
        title: 'Build E-commerce Website',
        description: 'Need a full-stack e-commerce platform',
        category: 'Web Development',
        budgetMin: 4000,
        budgetMax: 6000,
        deadline: '2024-12-31',
        skills: ['React', 'Node.js', 'PostgreSQL']
      };
      const clientId = 'client-uuid-123';

      // Mock: Project creation
      query.mockResolvedValueOnce({
        rows: [{
          id: 'project-uuid-123',
          client_id: clientId,
          title: projectData.title,
          description: projectData.description,
          category: projectData.category,
          skills: projectData.skills,
          budget_min: projectData.budgetMin,
          budget_max: projectData.budgetMax,
          status: 'draft',
          created_at: new Date()
        }]
      });

      // Mock: getProjectById - check ownership for view count
      query.mockResolvedValueOnce({
        rows: [{
          client_id: clientId
        }]
      });

      // Mock: getProjectById - get project details
      query.mockResolvedValueOnce({
        rows: [{
          id: 'project-uuid-123',
          client_id: clientId,
          title: projectData.title,
          description: projectData.description,
          category: projectData.category,
          skills: projectData.skills,
          budget_min: projectData.budgetMin,
          budget_max: projectData.budgetMax,
          status: 'draft',
          client_name: 'Test Client',
          created_at: new Date()
        }]
      });

      // Mock: Milestones query
      query.mockResolvedValueOnce({ rows: [] });

      // Mock: Attachments query
      query.mockResolvedValueOnce({ rows: [] });

      const result = await projectService.createProject(clientId, projectData);

      expect(result).toHaveProperty('id');
      expect(result.title).toBe(projectData.title);
    });
  });

  // ============================================
  // UT-12: Create project with missing title
  // ============================================
  describe('UT-12: Create project with missing title', () => {
    it('should throw database error when title is missing', async () => {
      const projectData = {
        description: 'Need a website',
        category: 'Web Development',
        budgetMin: 5000
      };
      const clientId = 'client-uuid-123';

      // Mock: Database error for missing required field
      query.mockRejectedValueOnce(new Error('null value in column "title" violates not-null constraint'));

      await expect(projectService.createProject(clientId, projectData))
        .rejects
        .toThrow();
    });
  });

  // ============================================
  // UT-13: Update project details
  // ============================================
  describe('UT-13: Update project details', () => {
    it('should update project when valid data is provided', async () => {
      const projectId = 'project-uuid-123';
      const clientId = 'client-uuid-123';
      const updates = {
        title: 'Updated Project Title',
        budgetMin: 5000,
        budgetMax: 7000
      };

      // Mock: Get existing project (ownership check)
      query.mockResolvedValueOnce({
        rows: [{
          id: projectId,
          client_id: clientId,
          title: 'Old Title',
          budget_min: 5000,
          budget_max: 6000
        }]
      });

      // Mock: Update project
      query.mockResolvedValueOnce({
        rows: [{
          id: projectId,
          client_id: clientId,
          title: updates.title,
          budget_min: updates.budgetMin,
          budget_max: updates.budgetMax,
          updated_at: new Date()
        }]
      });

      // Mock: getProjectById - check ownership for view count
      query.mockResolvedValueOnce({
        rows: [{
          client_id: clientId
        }]
      });

      // Mock: getProjectById - get project details
      query.mockResolvedValueOnce({
        rows: [{
          id: projectId,
          client_id: clientId,
          title: updates.title,
          budget_min: updates.budgetMin,
          budget_max: updates.budgetMax,
          client_name: 'Test Client',
          updated_at: new Date()
        }]
      });

      // Mock: Milestones query
      query.mockResolvedValueOnce({ rows: [] });

      // Mock: Attachments query
      query.mockResolvedValueOnce({ rows: [] });

      const result = await projectService.updateProject(projectId, clientId, updates);

      expect(result.title).toBe(updates.title);
    });
  });

  // ============================================
  // UT-14: Delete project
  // ============================================
  describe('UT-14: Delete project', () => {
    it('should delete project when user is owner', async () => {
      const projectId = 'project-uuid-123';
      const clientId = 'client-uuid-123';

      // Mock: Get project (ownership check)
      query.mockResolvedValueOnce({
        rows: [{
          id: projectId,
          client_id: clientId,
          status: 'draft'
        }]
      });

      // Mock: Check proposals count
      query.mockResolvedValueOnce({
        rows: [{ count: '0' }]
      });

      // Mock: Delete project
      query.mockResolvedValueOnce({ rows: [] });

      const result = await projectService.deleteProject(projectId, clientId);

      expect(result).toBe(true);
    });
  });

  // ============================================
  // UT-15: Search projects by keyword
  // ============================================
  describe('UT-15: Search projects by keyword', () => {
    it('should return matching projects when keyword is provided', async () => {
      const searchQuery = 'e-commerce';
      // Mock: Search results (projects query) - comes SECOND in Promise.all
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'project-1',
            title: 'E-commerce Website',
            description: 'Build online store',
            client_id: 'client-1',
            client_name: 'Client One',
            status: 'active',
            budget_min: 5000,
            budget_max: 10000,
            skills: [],
            created_at: new Date()
          },
          {
            id: 'project-2',
            title: 'E-commerce Mobile App',
            description: 'Mobile shopping app',
            client_id: 'client-2',
            client_name: 'Client Two',
            status: 'active',
            budget_min: 8000,
            budget_max: 15000,
            skills: [],
            created_at: new Date()
          }
        ]
      });

      // Mock: Count query - comes FIRST in Promise.all
      query.mockResolvedValueOnce({
        rows: [{ total: '2' }]
      });
      const result = await projectService.getProjects({ search: searchQuery });

      expect(result).toHaveProperty('projects');
      expect(result.projects).toHaveLength(2);
      expect(result.projects[0].title).toContain('commerce');
    });
  });

  // ============================================
  // UT-16: Filter projects by category
  // ============================================
  describe('UT-16: Filter projects by category', () => {
    it('should return projects matching the category', async () => {
      const filters = {
        category: 'Web Development'
      };

      // Mock: Filtered results (projects query)
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'project-1',
            title: 'Website Project',
            description: 'Build a website',
            category: 'Web Development',
            client_id: 'client-1',
            client_name: 'Client One',
            status: 'active',
            budget_min: 5000,
            budget_max: 10000,
            skills: [],
            created_at: new Date()
          }
        ]
      });

      // Mock: Count query
      query.mockResolvedValueOnce({
        rows: [{ total: '1' }]
      });

      const result = await projectService.getProjects(filters);

      expect(result).toHaveProperty('projects');
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].category).toBe('Web Development');
    });
  });

  // ============================================
  // UT-17: Filter projects by budget range
  // ============================================
  describe('UT-17: Filter projects by budget range', () => {
    it('should return projects within budget range', async () => {
      const filters = {
        budgetMin: 1000,
        budgetMax: 5000
      };
      // Mock: Filtered results (projects query)
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'project-1',
            title: 'Small Project',
            description: 'Small project desc',
            budget_min: 1500,
            budget_max: 2500,
            client_id: 'client-1',
            client_name: 'Client One',
            status: 'active',
            category: 'Web Development',
            skills: [],
            created_at: new Date()
          },
          {
            id: 'project-2',
            title: 'Medium Project',
            description: 'Medium project desc',
            budget_min: 3000,
            budget_max: 4500,
            client_id: 'client-2',
            client_name: 'Client Two',
            status: 'active',
            category: 'Mobile Development',
            skills: [],
            created_at: new Date()
          }
        ]
      });

      // Mock: Count query
      query.mockResolvedValueOnce({
        rows: [{ total: '2' }]
      });

      const result = await projectService.getProjects(filters);

      expect(result).toHaveProperty('projects');
      expect(result.projects).toHaveLength(2);
    });
  });

  // ============================================
  // UT-18: Get project by ID
  // ============================================
  describe('UT-18: Get project by ID', () => {
    it('should return project details when ID is valid', async () => {
      const projectId = 'project-uuid-123';
      const userId = 'user-uuid-123';

      // Mock: Check project ownership for view count
      query.mockResolvedValueOnce({
        rows: [{
          client_id: 'client-uuid-123' // Different from userId, so views will increment
        }]
      });

      // Mock: Increment views (called because user is not owner)
      query.mockResolvedValueOnce({ rows: [] });

      // Mock: Project details with user info
      query.mockResolvedValueOnce({
        rows: [{
          id: projectId,
          title: 'Test Project',
          description: 'Test Description',
          status: 'active',
          client_id: 'client-uuid-123',
          client_name: 'Test Client',
          category: 'Web Development',
          skills: [],
          budget_min: 5000,
          budget_max: 10000,
          created_at: new Date()
        }]
      });

      // Mock: Milestones query
      query.mockResolvedValueOnce({ rows: [] });

      // Mock: Attachments query
      query.mockResolvedValueOnce({ rows: [] });

      const result = await projectService.getProjectById(projectId, userId);

      expect(result).toHaveProperty('id');
      expect(result.id).toBe(projectId);
    });
  });

  // ============================================
  // UT-19: Get project with non-existent ID
  // ============================================
  describe('UT-19: Get project with non-existent ID', () => {
    it('should throw error when project does not exist', async () => {
      const projectId = 'non-existent-id';

      // Mock: Check ownership - no project found
      query.mockResolvedValueOnce({ rows: [] });

      await expect(projectService.getProjectById(projectId))
        .rejects
        .toThrow('Project not found');
    });
  });

  // ============================================
  // UT-20: Update project by non-owner
  // ============================================
  describe('UT-20: Update project by non-owner', () => {
    it('should throw authorization error when user is not owner', async () => {
      const projectId = 'project-uuid-123';
      const wrongUserId = 'wrong-user-id';
      const updates = { title: 'New Title' };

      // Mock: Project owned by different user
      query.mockResolvedValueOnce({
        rows: [{
          id: projectId,
          client_id: 'actual-owner-id'
        }]
      });

      await expect(projectService.updateProject(projectId, wrongUserId, updates))
        .rejects
        .toThrow('Unauthorized');
    });
  });

});
