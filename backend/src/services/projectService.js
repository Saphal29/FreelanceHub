const { query, transaction } = require('../utils/dbQueries');
const logger = require('../utils/logger');

/**
 * Create a new project
 * @param {string} clientId - Client user ID
 * @param {Object} projectData - Project data
 * @returns {Promise<Object>} Created project
 */
const createProject = async (clientId, projectData) => {
  try {
    logger.info('Creating new project', { clientId, title: projectData.title, hasMilestones: !!projectData.milestones, milestoneCount: projectData.milestones?.length || 0 });
    
    const result = await query(
      `INSERT INTO projects (
        client_id, title, description, category, skills, budget_min, budget_max,
        project_type, hourly_rate, duration_estimate, deadline, experience_level,
        visibility, location, is_remote, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        clientId,
        projectData.title,
        projectData.description,
        projectData.category,
        projectData.skills || [],
        projectData.budgetMin,
        projectData.budgetMax,
        projectData.projectType || 'fixed_price',
        projectData.hourlyRate,
        projectData.durationEstimate,
        projectData.deadline,
        projectData.experienceLevel || 'intermediate',
        projectData.visibility || 'public',
        projectData.location,
        projectData.isRemote !== undefined ? projectData.isRemote : true,
        projectData.status || 'draft'
      ]
    );
    
    const project = result.rows[0];
    
    // Link uploaded files to project
    if (projectData.fileIds && projectData.fileIds.length > 0) {
      await linkFilesToProject(project.id, projectData.fileIds, clientId);
    }
    
    // If milestones are provided, create them
    if (projectData.milestones && projectData.milestones.length > 0) {
      logger.info('Creating milestones for new project', { projectId: project.id, count: projectData.milestones.length });
      await createProjectMilestones(project.id, projectData.milestones);
    } else {
      logger.info('No milestones to create', { projectId: project.id });
    }
    
    logger.info('Project created successfully', { projectId: project.id, clientId });
    return await getProjectById(project.id, clientId);
  } catch (error) {
    logger.error('Error creating project', { clientId, error: error.message });
    throw error;
  }
};

/**
 * Get projects with filters and pagination
 * @param {Object} filters - Filter parameters
 * @param {Object} pagination - Pagination parameters
 * @param {string} userId - Current user ID (for bookmarks)
 * @returns {Promise<Object>} Projects list with metadata
 */
const getProjects = async (filters = {}, pagination = {}, userId = null) => {
  try {
    const {
      search,
      category,
      skills,
      budgetMin,
      budgetMax,
      projectType,
      experienceLevel,
      location,
      isRemote,
      status = 'active',
      clientId
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = pagination;

    const offset = (page - 1) * limit;

    // Build WHERE conditions
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Base condition - only show active projects for public browsing
    if (clientId) {
      whereConditions.push(`p.client_id = $${paramIndex}`);
      params.push(clientId);
      paramIndex++;
      
      // Apply status filter for client's own projects
      if (status) {
        whereConditions.push(`p.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }
    } else {
      whereConditions.push(`p.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;

      whereConditions.push(`p.visibility = 'public'`);
    }

    // Search in title and description
    if (search) {
      whereConditions.push(`(
        p.title ILIKE $${paramIndex} OR
        p.description ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Category filter
    if (category) {
      whereConditions.push(`p.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    // Skills filter
    if (skills && skills.length > 0) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      whereConditions.push(`p.skills && $${paramIndex}`);
      params.push(skillsArray);
      paramIndex++;
    }

    // Budget filters
    if (budgetMin) {
      whereConditions.push(`p.budget_max >= $${paramIndex}`);
      params.push(budgetMin);
      paramIndex++;
    }

    if (budgetMax) {
      whereConditions.push(`p.budget_min <= $${paramIndex}`);
      params.push(budgetMax);
      paramIndex++;
    }

    // Project type filter
    if (projectType) {
      whereConditions.push(`p.project_type = $${paramIndex}`);
      params.push(projectType);
      paramIndex++;
    }

    // Experience level filter
    if (experienceLevel) {
      whereConditions.push(`p.experience_level = $${paramIndex}`);
      params.push(experienceLevel);
      paramIndex++;
    }

    // Location filter
    if (location) {
      whereConditions.push(`p.location ILIKE $${paramIndex}`);
      params.push(`%${location}%`);
      paramIndex++;
    }

    // Remote work filter
    if (isRemote !== undefined) {
      whereConditions.push(`p.is_remote = $${paramIndex}`);
      params.push(isRemote);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ?
      `WHERE ${whereConditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    const validSortFields = ['created_at', 'updated_at', 'title', 'budget_min', 'budget_max', 'proposals_count'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Save params for count query (before adding userId, limit, offset)
    const countParams = [...params];

    // Main query with client info and bookmark status
    const projectsQuery = `
      SELECT
        p.*,
        u.full_name as client_name,
        u.avatar_url as client_avatar,
        cp.company_name,
        cp.location as client_location,
        ${userId ? `(SELECT COUNT(*) FROM project_bookmarks pb WHERE pb.project_id = p.id AND pb.user_id = $${paramIndex}) > 0 as is_bookmarked,` : 'false as is_bookmarked,'}
        (SELECT COUNT(*) FROM project_proposals pp WHERE pp.project_id = p.id) as current_proposals_count
      FROM projects p
      JOIN users u ON p.client_id = u.id
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      ${whereClause}
      ORDER BY p.${sortField} ${order}
      LIMIT $${paramIndex + (userId ? 1 : 0)} OFFSET $${paramIndex + (userId ? 2 : 1)}
    `;

    if (userId) {
      params.push(userId);
      paramIndex++;
    }
    params.push(limit, offset);

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM projects p
      JOIN users u ON p.client_id = u.id
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      ${whereClause}
    `;

    // Execute both queries
    const [projectsResult, countResult] = await Promise.all([
      query(projectsQuery, params),
      query(countQuery, countParams)
    ]);

    const projects = projectsResult.rows.map(formatProjectResponse);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    logger.info('Projects retrieved', {
      count: projects.length,
      total,
      page,
      filters: Object.keys(filters).length
    });

    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    logger.error('Error getting projects', { filters, error: error.message });
    throw error;
  }
};

/**
 * Get project by ID with full details
 * @param {string} projectId - Project ID
 * @param {string} userId - Current user ID (for permissions and bookmarks)
 * @returns {Promise<Object>} Project details
 */
const getProjectById = async (projectId, userId = null) => {
  try {
    logger.info('Getting project by ID', { projectId, userId });
    
    // Increment view count if not the owner
    const projectOwnerResult = await query(
      'SELECT client_id FROM projects WHERE id = $1',
      [projectId]
    );
    
    if (projectOwnerResult.rows.length === 0) {
      throw new Error('Project not found');
    }
    
    const isOwner = userId && projectOwnerResult.rows[0].client_id === userId;
    
    // Increment views if not owner
    if (!isOwner) {
      await query('SELECT increment_project_views($1)', [projectId]);
    }
    
    // Get project with client info
    const result = await query(
      `SELECT 
        p.*,
        u.full_name as client_name,
        u.avatar_url as client_avatar,
        u.email as client_email,
        cp.company_name,
        cp.industry,
        cp.location as client_location,
        cp.website as client_website,
        ${userId ? `(SELECT COUNT(*) FROM project_bookmarks pb WHERE pb.project_id = p.id AND pb.user_id = $2) > 0 as is_bookmarked,` : 'false as is_bookmarked,'}
        ${userId ? `(SELECT COUNT(*) FROM project_proposals pp WHERE pp.project_id = p.id AND pp.freelancer_id = $2) > 0 as has_applied` : 'false as has_applied'}
      FROM projects p
      JOIN users u ON p.client_id = u.id
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      WHERE p.id = $1`,
      userId ? [projectId, userId] : [projectId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Project not found');
    }
    
    const project = result.rows[0];
    
    // Get milestones
    const milestonesResult = await query(
      `SELECT * FROM project_milestones 
       WHERE project_id = $1 
       ORDER BY order_index ASC, created_at ASC`,
      [projectId]
    );
    
    // Get attachments
    const attachmentsResult = await query(
      `SELECT pa.*, u.full_name as uploaded_by_name
       FROM project_attachments pa
       JOIN users u ON pa.uploaded_by = u.id
       WHERE pa.project_id = $1
       ORDER BY pa.created_at DESC`,
      [projectId]
    );
    
    const formattedProject = formatProjectResponse(project);
    formattedProject.milestones = milestonesResult.rows.map(formatMilestoneResponse);
    formattedProject.attachments = attachmentsResult.rows.map(formatAttachmentResponse);
    
    logger.info('Project retrieved successfully', { projectId });
    return formattedProject;
  } catch (error) {
    logger.error('Error getting project by ID', { projectId, error: error.message });
    throw error;
  }
};

/**
 * Update project
 * @param {string} projectId - Project ID
 * @param {string} clientId - Client user ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated project
 */
const updateProject = async (projectId, clientId, updateData) => {
  try {
    logger.info('Updating project', { projectId, clientId });
    
    // Verify ownership
    const ownershipResult = await query(
      'SELECT client_id FROM projects WHERE id = $1',
      [projectId]
    );
    
    if (ownershipResult.rows.length === 0) {
      throw new Error('Project not found');
    }
    
    if (ownershipResult.rows[0].client_id !== clientId) {
      throw new Error('Unauthorized: You can only update your own projects');
    }
    
    // Build update query dynamically
    const updateFields = [];
    const params = [projectId];
    let paramIndex = 2;
    
    const allowedFields = [
      'title', 'description', 'category', 'skills', 'budget_min', 'budget_max',
      'project_type', 'hourly_rate', 'duration_estimate', 'deadline',
      'experience_level', 'visibility', 'location', 'is_remote', 'status'
    ];
    
    allowedFields.forEach(field => {
      const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (updateData[camelField] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        params.push(updateData[camelField]);
        paramIndex++;
      }
    });
    
    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Add published_at timestamp if status is being changed to active
    if (updateData.status === 'active') {
      updateFields.push(`published_at = CURRENT_TIMESTAMP`);
    }
    
    const updateQuery = `
      UPDATE projects 
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(updateQuery, params);
    
    logger.info('Project updated successfully', { projectId, clientId });
    return await getProjectById(projectId, clientId);
  } catch (error) {
    logger.error('Error updating project', { projectId, clientId, error: error.message });
    throw error;
  }
};

/**
 * Delete/Archive project
 * @param {string} projectId - Project ID
 * @param {string} clientId - Client user ID
 * @returns {Promise<boolean>} Success status
 */
const deleteProject = async (projectId, clientId) => {
  try {
    logger.info('Deleting project', { projectId, clientId });
    
    // Verify ownership
    const ownershipResult = await query(
      'SELECT client_id, status FROM projects WHERE id = $1',
      [projectId]
    );
    
    if (ownershipResult.rows.length === 0) {
      throw new Error('Project not found');
    }
    
    const project = ownershipResult.rows[0];
    if (project.client_id !== clientId) {
      throw new Error('Unauthorized: You can only delete your own projects');
    }
    
    // If project has proposals or is in progress, archive instead of delete
    const proposalsResult = await query(
      'SELECT COUNT(*) as count FROM project_proposals WHERE project_id = $1',
      [projectId]
    );
    
    const hasProposals = parseInt(proposalsResult.rows[0].count) > 0;
    const isInProgress = ['in_progress', 'completed'].includes(project.status);
    
    if (hasProposals || isInProgress) {
      // Archive the project instead of deleting
      await query(
        'UPDATE projects SET status = $1 WHERE id = $2',
        ['archived', projectId]
      );
      
      logger.info('Project archived instead of deleted', { projectId, clientId });
      return true;
    } else {
      // Safe to delete (no proposals, not in progress)
      await query('DELETE FROM projects WHERE id = $1', [projectId]);
      
      logger.info('Project deleted successfully', { projectId, clientId });
      return true;
    }
  } catch (error) {
    logger.error('Error deleting project', { projectId, clientId, error: error.message });
    throw error;
  }
};

/**
 * Create project milestones
 * @param {string} projectId - Project ID
 * @param {Array} milestones - Milestones data
 * @returns {Promise<Array>} Created milestones
 */
const createProjectMilestones = async (projectId, milestones) => {
  try {
    logger.info('Creating project milestones', { projectId, count: milestones.length });
    
    const createdMilestones = [];
    
    for (let i = 0; i < milestones.length; i++) {
      const milestone = milestones[i];
      const result = await query(
        `INSERT INTO project_milestones (
          project_id, title, description, amount, due_date, order_index
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          projectId,
          milestone.title,
          milestone.description,
          milestone.amount,
          milestone.dueDate,
          milestone.orderIndex || i
        ]
      );
      
      createdMilestones.push(formatMilestoneResponse(result.rows[0]));
    }
    
    logger.info('Milestones created successfully', { projectId, count: createdMilestones.length });
    return createdMilestones;
  } catch (error) {
    logger.error('Error creating milestones', { projectId, error: error.message });
    throw error;
  }
};

/**
 * Get milestones for a project
 * @param {string} projectId - Project ID
 * @param {string} userId - Current user ID (for authorization)
 * @returns {Promise<Array>} Milestones list
 */
const getMilestones = async (projectId, userId = null) => {
  try {
    logger.info('Getting milestones', { projectId, userId });
    
    // Verify project exists
    const projectResult = await query(
      'SELECT client_id FROM projects WHERE id = $1',
      [projectId]
    );
    
    if (projectResult.rows.length === 0) {
      throw new Error('Project not found');
    }
    
    const result = await query(
      `SELECT * FROM project_milestones 
       WHERE project_id = $1 
       ORDER BY order_index ASC, created_at ASC`,
      [projectId]
    );
    
    logger.info('Milestones retrieved', { projectId, count: result.rows.length });
    return result.rows.map(formatMilestoneResponse);
  } catch (error) {
    logger.error('Error getting milestones', { projectId, error: error.message });
    throw error;
  }
};

/**
 * Get milestone by ID
 * @param {string} milestoneId - Milestone ID
 * @param {string} userId - Current user ID (for authorization)
 * @returns {Promise<Object>} Milestone details
 */
const getMilestoneById = async (milestoneId, userId = null) => {
  try {
    logger.info('Getting milestone by ID', { milestoneId, userId });
    
    const result = await query(
      `SELECT m.*, p.client_id 
       FROM project_milestones m
       JOIN projects p ON m.project_id = p.id
       WHERE m.id = $1`,
      [milestoneId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Milestone not found');
    }
    
    logger.info('Milestone retrieved', { milestoneId });
    return formatMilestoneResponse(result.rows[0]);
  } catch (error) {
    logger.error('Error getting milestone', { milestoneId, error: error.message });
    throw error;
  }
};

/**
 * Update milestone
 * @param {string} milestoneId - Milestone ID
 * @param {string} userId - User ID (for authorization)
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated milestone
 */
const updateMilestone = async (milestoneId, userId, updateData) => {
  try {
    logger.info('Updating milestone', { milestoneId, userId });
    
    // Verify ownership
    const ownershipResult = await query(
      `SELECT p.client_id 
       FROM project_milestones m
       JOIN projects p ON m.project_id = p.id
       WHERE m.id = $1`,
      [milestoneId]
    );
    
    if (ownershipResult.rows.length === 0) {
      throw new Error('Milestone not found');
    }
    
    if (ownershipResult.rows[0].client_id !== userId) {
      throw new Error('Unauthorized: You can only update milestones for your own projects');
    }
    
    // Build update query dynamically
    const updateFields = [];
    const params = [milestoneId];
    let paramIndex = 2;
    
    const allowedFields = ['title', 'description', 'amount', 'due_date', 'status', 'order_index'];
    
    allowedFields.forEach(field => {
      const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (updateData[camelField] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        params.push(updateData[camelField]);
        paramIndex++;
      }
    });
    
    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Add completed_at timestamp if status is being changed to completed
    if (updateData.status === 'completed') {
      updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
    }
    
    const updateQuery = `
      UPDATE project_milestones 
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(updateQuery, params);
    
    logger.info('Milestone updated successfully', { milestoneId, userId });
    return formatMilestoneResponse(result.rows[0]);
  } catch (error) {
    logger.error('Error updating milestone', { milestoneId, userId, error: error.message });
    throw error;
  }
};

/**
 * Delete milestone
 * @param {string} milestoneId - Milestone ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<boolean>} Success status
 */
const deleteMilestone = async (milestoneId, userId) => {
  try {
    logger.info('Deleting milestone', { milestoneId, userId });
    
    // Verify ownership
    const ownershipResult = await query(
      `SELECT p.client_id, m.status
       FROM project_milestones m
       JOIN projects p ON m.project_id = p.id
       WHERE m.id = $1`,
      [milestoneId]
    );
    
    if (ownershipResult.rows.length === 0) {
      throw new Error('Milestone not found');
    }
    
    const milestone = ownershipResult.rows[0];
    if (milestone.client_id !== userId) {
      throw new Error('Unauthorized: You can only delete milestones for your own projects');
    }
    
    // Prevent deletion of completed milestones
    if (milestone.status === 'completed') {
      throw new Error('Cannot delete completed milestones');
    }
    
    await query('DELETE FROM project_milestones WHERE id = $1', [milestoneId]);
    
    logger.info('Milestone deleted successfully', { milestoneId, userId });
    return true;
  } catch (error) {
    logger.error('Error deleting milestone', { milestoneId, userId, error: error.message });
    throw error;
  }
};

/**
 * Toggle project bookmark
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Bookmark status
 */
const toggleProjectBookmark = async (projectId, userId) => {
  try {
    logger.info('Toggling project bookmark', { projectId, userId });
    
    // Check if bookmark exists
    const existingResult = await query(
      'SELECT id FROM project_bookmarks WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    if (existingResult.rows.length > 0) {
      // Remove bookmark
      await query(
        'DELETE FROM project_bookmarks WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );
      
      logger.info('Project bookmark removed', { projectId, userId });
      return { bookmarked: false };
    } else {
      // Add bookmark
      await query(
        'INSERT INTO project_bookmarks (project_id, user_id) VALUES ($1, $2)',
        [projectId, userId]
      );
      
      logger.info('Project bookmark added', { projectId, userId });
      return { bookmarked: true };
    }
  } catch (error) {
    logger.error('Error toggling bookmark', { projectId, userId, error: error.message });
    throw error;
  }
};

/**
 * Get completed projects by category
 * @param {string} category - Category name
 * @param {number} limit - Number of projects to return
 * @returns {Promise<Array>} Completed projects list
 */
const getCompletedProjectsByCategory = async (category = null, limit = 8) => {
  try {
    logger.info('Getting completed projects by category', { category, limit });
    
    let whereClause = `WHERE p.status = 'completed' AND p.visibility = 'public'`;
    const params = [limit];
    let paramIndex = 2;
    
    if (category) {
      whereClause += ` AND LOWER(p.category) = LOWER($${paramIndex})`;
      params.push(category);
      paramIndex++;
    }
    
    const result = await query(
      `SELECT 
        p.id,
        p.title,
        p.description,
        p.category,
        p.skills,
        p.budget_min,
        p.budget_max,
        p.project_type,
        p.completed_at,
        p.created_at,
        u.full_name as client_name,
        u.avatar_url as client_avatar,
        cp.company_name,
        (SELECT AVG(overall_rating) FROM reviews WHERE project_id = p.id) as average_rating,
        (SELECT COUNT(*) FROM reviews WHERE project_id = p.id) as review_count,
        (SELECT u2.full_name FROM contracts c 
         JOIN users u2 ON c.freelancer_id = u2.id 
         WHERE c.project_id = p.id LIMIT 1) as freelancer_name,
        (SELECT u2.avatar_url FROM contracts c 
         JOIN users u2 ON c.freelancer_id = u2.id 
         WHERE c.project_id = p.id LIMIT 1) as freelancer_avatar
      FROM projects p
      JOIN users u ON p.client_id = u.id
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      ${whereClause}
      ORDER BY p.completed_at DESC
      LIMIT $1`,
      params
    );
    
    logger.info('Completed projects retrieved', { count: result.rows.length, category });
    
    return result.rows.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      category: project.category,
      skills: project.skills || [],
      budget: {
        min: project.budget_min,
        max: project.budget_max,
        type: project.project_type
      },
      completedAt: project.completed_at,
      createdAt: project.created_at,
      client: {
        name: project.client_name,
        avatar: project.client_avatar,
        company: project.company_name
      },
      freelancer: {
        name: project.freelancer_name,
        avatar: project.freelancer_avatar
      },
      rating: project.average_rating ? parseFloat(project.average_rating).toFixed(1) : null,
      reviewCount: parseInt(project.review_count) || 0
    }));
  } catch (error) {
    logger.error('Error getting completed projects by category', { category, error: error.message });
    throw error;
  }
};

/**
 * Get project categories
 * @returns {Promise<Array>} Categories list
 */
const getProjectCategories = async () => {
  try {
    const result = await query(
      `SELECT * FROM project_categories 
       WHERE is_active = true 
       ORDER BY sort_order ASC, name ASC`
    );
    
    return result.rows.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      parentId: category.parent_id
    }));
  } catch (error) {
    logger.error('Error getting categories', { error: error.message });
    throw error;
  }
};

/**
 * Format project response for API
 * @param {Object} project - Raw project data
 * @returns {Object} Formatted project
 */
const formatProjectResponse = (project) => {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    category: project.category,
    skills: project.skills || [],
    budget: {
      min: project.budget_min,
      max: project.budget_max,
      type: project.project_type
    },
    hourlyRate: project.hourly_rate,
    duration: project.duration_estimate,
    deadline: project.deadline,
    experienceLevel: project.experience_level,
    visibility: project.visibility,
    location: project.location,
    isRemote: project.is_remote,
    status: project.status,
    viewsCount: project.views_count || 0,
    proposalsCount: project.current_proposals_count || project.proposals_count || 0,
    featured: project.featured || false,
    isBookmarked: project.is_bookmarked || false,
    hasApplied: project.has_applied || false,
    client: {
      id: project.client_id,
      name: project.client_name,
      avatar: project.client_avatar,
      email: project.client_email,
      company: project.company_name,
      industry: project.industry,
      location: project.client_location,
      website: project.client_website
    },
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    publishedAt: project.published_at,
    completedAt: project.completed_at
  };
};

/**
 * Format milestone response for API
 * @param {Object} milestone - Raw milestone data
 * @returns {Object} Formatted milestone
 */
const formatMilestoneResponse = (milestone) => {
  return {
    id: milestone.id,
    projectId: milestone.project_id,
    title: milestone.title,
    description: milestone.description,
    amount: milestone.amount,
    dueDate: milestone.due_date,
    status: milestone.status,
    orderIndex: milestone.order_index,
    createdAt: milestone.created_at,
    updatedAt: milestone.updated_at,
    completedAt: milestone.completed_at
  };
};

/**
 * Format attachment response for API
 * @param {Object} attachment - Raw attachment data
 * @returns {Object} Formatted attachment
 */
const formatAttachmentResponse = (attachment) => {
  return {
    id: attachment.id,
    filename: attachment.filename,
    originalFilename: attachment.original_filename,
    fileSize: attachment.file_size,
    mimeType: attachment.mime_type,
    fileUrl: attachment.file_url,
    uploadedBy: {
      id: attachment.uploaded_by,
      name: attachment.uploaded_by_name
    },
    createdAt: attachment.created_at
  };
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  createProjectMilestones,
  getMilestones,
  getMilestoneById,
  updateMilestone,
  deleteMilestone,
  toggleProjectBookmark,
  getCompletedProjectsByCategory,
  getProjectCategories,
  formatProjectResponse,
  formatMilestoneResponse,
  formatAttachmentResponse
};


/**
 * Link uploaded files to a project
 * @param {string} projectId - Project ID
 * @param {Array} fileIds - Array of file IDs
 * @param {string} clientId - Client user ID (for verification)
 * @returns {Promise<void>}
 */
const linkFilesToProject = async (projectId, fileIds, clientId) => {
  try {
    if (!fileIds || fileIds.length === 0) return;
    
    logger.info('Linking files to project', { projectId, fileCount: fileIds.length });
    
    await query(
      'UPDATE files SET project_id = $1 WHERE id = ANY($2) AND uploaded_by = $3 AND status = $4',
      [projectId, fileIds, clientId, 'active']
    );
    
    logger.info('Files linked to project successfully', { projectId, fileCount: fileIds.length });
  } catch (error) {
    logger.error('Error linking files to project', { projectId, error: error.message });
    throw error;
  }
};
