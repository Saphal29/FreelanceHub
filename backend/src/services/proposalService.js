const { query } = require('../utils/dbQueries');
const logger = require('../utils/logger');
const contractService = require('./contractService');

/**
 * Submit a proposal to a project
 * @param {string} freelancerId - Freelancer user ID
 * @param {Object} proposalData - Proposal data
 * @returns {Promise<Object>} Created proposal
 */
const submitProposal = async (freelancerId, proposalData) => {
  try {
    logger.info('Submitting proposal', { freelancerId, projectId: proposalData.projectId });
    
    // Check if project exists and is active
    const projectResult = await query(
      'SELECT id, status, client_id FROM projects WHERE id = $1',
      [proposalData.projectId]
    );
    
    if (projectResult.rows.length === 0) {
      throw new Error('Project not found');
    }
    
    const project = projectResult.rows[0];
    
    if (project.status !== 'active') {
      throw new Error('Project is not accepting proposals');
    }
    
    if (project.client_id === freelancerId) {
      throw new Error('You cannot submit a proposal to your own project');
    }
    
    // Check if proposal already exists
    const existingResult = await query(
      'SELECT id FROM project_proposals WHERE project_id = $1 AND freelancer_id = $2',
      [proposalData.projectId, freelancerId]
    );
    
    if (existingResult.rows.length > 0) {
      throw new Error('You have already submitted a proposal to this project');
    }
    
    // Create proposal
    const result = await query(
      `INSERT INTO project_proposals (
        project_id, freelancer_id, cover_letter, proposed_budget, proposed_timeline
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        proposalData.projectId,
        freelancerId,
        proposalData.coverLetter,
        proposalData.proposedBudget,
        proposalData.proposedTimeline
      ]
    );
    
    const proposal = result.rows[0];
    
    // Link uploaded files to proposal
    if (proposalData.fileIds && proposalData.fileIds.length > 0) {
      logger.info('Linking files to proposal', { 
        proposalId: proposal.id, 
        fileCount: proposalData.fileIds.length,
        fileIds: proposalData.fileIds,
        freelancerId,
        projectId: proposalData.projectId
      });
      
      const updateResult = await query(
        'UPDATE files SET proposal_id = $1, project_id = $2 WHERE id = ANY($3) AND uploaded_by = $4 AND status = $5 RETURNING id',
        [proposal.id, proposalData.projectId, proposalData.fileIds, freelancerId, 'active']
      );
      
      logger.info('Files linked to proposal', { 
        proposalId: proposal.id,
        linkedCount: updateResult.rows.length,
        linkedFileIds: updateResult.rows.map(r => r.id)
      });
    } else {
      logger.info('No files to link to proposal', { proposalId: proposal.id });
    }
    
    logger.info('Proposal submitted successfully', { 
      proposalId: proposal.id, 
      freelancerId, 
      projectId: proposalData.projectId 
    });
    
    return formatProposalResponse(proposal);
  } catch (error) {
    logger.error('Error submitting proposal', { freelancerId, error: error.message });
    throw error;
  }
};

/**
 * Get proposals for a project (client view)
 * @param {string} projectId - Project ID
 * @param {string} clientId - Client user ID
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Array>} Proposals list
 */
const getProjectProposals = async (projectId, clientId, filters = {}) => {
  try {
    logger.info('Getting project proposals', { projectId, clientId });
    
    // Verify project ownership
    const projectResult = await query(
      'SELECT client_id FROM projects WHERE id = $1',
      [projectId]
    );
    
    if (projectResult.rows.length === 0) {
      throw new Error('Project not found');
    }
    
    if (projectResult.rows[0].client_id !== clientId) {
      throw new Error('Unauthorized: You can only view proposals for your own projects');
    }
    
    // Build WHERE conditions
    let whereConditions = ['pp.project_id = $1'];
    let params = [projectId];
    let paramIndex = 2;
    
    if (filters.status) {
      whereConditions.push(`pp.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Get proposals with freelancer info
    const result = await query(
      `SELECT 
        pp.*,
        u.full_name as freelancer_name,
        u.avatar_url as freelancer_avatar,
        fp.title as freelancer_title,
        fp.hourly_rate as freelancer_hourly_rate,
        fp.average_rating as freelancer_rating,
        fp.total_jobs_completed as freelancer_jobs_completed,
        fp.location as freelancer_location
      FROM project_proposals pp
      JOIN users u ON pp.freelancer_id = u.id
      LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
      WHERE ${whereClause}
      ORDER BY pp.created_at DESC`,
      params
    );
    
    logger.info('Proposals retrieved', { projectId, count: result.rows.length });
    return result.rows.map(formatProposalWithFreelancerResponse);
  } catch (error) {
    logger.error('Error getting project proposals', { projectId, error: error.message });
    throw error;
  }
};

/**
 * Get freelancer's proposals
 * @param {string} freelancerId - Freelancer user ID
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Array>} Proposals list
 */
const getFreelancerProposals = async (freelancerId, filters = {}) => {
  try {
    logger.info('Getting freelancer proposals', { freelancerId });
    
    // Build WHERE conditions
    let whereConditions = ['pp.freelancer_id = $1'];
    let params = [freelancerId];
    let paramIndex = 2;
    
    if (filters.status) {
      whereConditions.push(`pp.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Get proposals with project info
    const result = await query(
      `SELECT 
        pp.*,
        p.title as project_title,
        p.description as project_description,
        p.budget_min as project_budget_min,
        p.budget_max as project_budget_max,
        p.status as project_status,
        u.full_name as client_name,
        u.avatar_url as client_avatar,
        cp.company_name as client_company
      FROM project_proposals pp
      JOIN projects p ON pp.project_id = p.id
      JOIN users u ON p.client_id = u.id
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      WHERE ${whereClause}
      ORDER BY pp.created_at DESC`,
      params
    );
    
    logger.info('Freelancer proposals retrieved', { freelancerId, count: result.rows.length });
    return result.rows.map(formatProposalWithProjectResponse);
  } catch (error) {
    logger.error('Error getting freelancer proposals', { freelancerId, error: error.message });
    throw error;
  }
};

/**
 * Get proposal by ID
 * @param {string} proposalId - Proposal ID
 * @param {string} userId - Current user ID
 * @returns {Promise<Object>} Proposal details
 */
const getProposalById = async (proposalId, userId) => {
  try {
    logger.info('Getting proposal by ID', { proposalId, userId });
    
    const result = await query(
      `SELECT 
        pp.*,
        p.title as project_title,
        p.client_id as project_client_id,
        u.full_name as freelancer_name,
        u.avatar_url as freelancer_avatar,
        fp.title as freelancer_title
      FROM project_proposals pp
      JOIN projects p ON pp.project_id = p.id
      JOIN users u ON pp.freelancer_id = u.id
      LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
      WHERE pp.id = $1`,
      [proposalId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Proposal not found');
    }
    
    const proposal = result.rows[0];
    
    // Check authorization
    if (proposal.freelancer_id !== userId && proposal.project_client_id !== userId) {
      throw new Error('Unauthorized: You can only view your own proposals or proposals for your projects');
    }
    
    logger.info('Proposal retrieved', { proposalId });
    return formatProposalResponse(proposal);
  } catch (error) {
    logger.error('Error getting proposal', { proposalId, error: error.message });
    throw error;
  }
};

/**
 * Update proposal status (accept/reject)
 * @param {string} proposalId - Proposal ID
 * @param {string} clientId - Client user ID
 * @param {string} status - New status (accepted/rejected)
 * @returns {Promise<Object>} Updated proposal
 */
const updateProposalStatus = async (proposalId, clientId, status) => {
  try {
    logger.info('Updating proposal status', { proposalId, clientId, status });
    
    // Verify ownership and get proposal details
    const proposalResult = await query(
      `SELECT pp.*, p.client_id, p.status as project_status, p.id as project_id
       FROM project_proposals pp
       JOIN projects p ON pp.project_id = p.id
       WHERE pp.id = $1`,
      [proposalId]
    );
    
    if (proposalResult.rows.length === 0) {
      throw new Error('Proposal not found');
    }
    
    const proposal = proposalResult.rows[0];
    
    if (proposal.client_id !== clientId) {
      throw new Error('Unauthorized: You can only update proposals for your own projects');
    }
    
    if (proposal.status !== 'pending') {
      throw new Error('Proposal has already been processed');
    }
    
    if (proposal.project_status !== 'active') {
      throw new Error('Project is not active');
    }
    
    // Update proposal status
    const result = await query(
      'UPDATE project_proposals SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, proposalId]
    );
    
    // If proposal is accepted, update project status and create contract
    if (status === 'accepted') {
      await query(
        'UPDATE projects SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['in_progress', proposal.project_id]
      );
      logger.info('Project status updated to in_progress', { projectId: proposal.project_id });
      
      // Create contract automatically
      try {
        await contractService.createContract(proposalId, clientId);
        logger.info('Contract created automatically', { proposalId });
      } catch (contractError) {
        logger.error('Failed to create contract automatically', { proposalId, error: contractError.message });
        // Don't fail the proposal acceptance if contract creation fails
      }
    }
    
    logger.info('Proposal status updated', { proposalId, status });
    return formatProposalResponse(result.rows[0]);
  } catch (error) {
    logger.error('Error updating proposal status', { proposalId, error: error.message });
    throw error;
  }
};

/**
 * Withdraw proposal (freelancer)
 * @param {string} proposalId - Proposal ID
 * @param {string} freelancerId - Freelancer user ID
 * @returns {Promise<Object>} Updated proposal
 */
const withdrawProposal = async (proposalId, freelancerId) => {
  try {
    logger.info('Withdrawing proposal', { proposalId, freelancerId });
    
    // Verify ownership
    const proposalResult = await query(
      'SELECT * FROM project_proposals WHERE id = $1',
      [proposalId]
    );
    
    if (proposalResult.rows.length === 0) {
      throw new Error('Proposal not found');
    }
    
    const proposal = proposalResult.rows[0];
    
    if (proposal.freelancer_id !== freelancerId) {
      throw new Error('Unauthorized: You can only withdraw your own proposals');
    }
    
    if (proposal.status !== 'pending') {
      throw new Error('Only pending proposals can be withdrawn');
    }
    
    // Update proposal status
    const result = await query(
      'UPDATE project_proposals SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['withdrawn', proposalId]
    );
    
    logger.info('Proposal withdrawn', { proposalId });
    return formatProposalResponse(result.rows[0]);
  } catch (error) {
    logger.error('Error withdrawing proposal', { proposalId, error: error.message });
    throw error;
  }
};

/**
 * Format proposal response for API
 * @param {Object} proposal - Raw proposal data
 * @returns {Object} Formatted proposal
 */
const formatProposalResponse = (proposal) => {
  return {
    id: proposal.id,
    projectId: proposal.project_id,
    freelancerId: proposal.freelancer_id,
    coverLetter: proposal.cover_letter,
    proposedBudget: proposal.proposed_budget,
    proposedTimeline: proposal.proposed_timeline,
    status: proposal.status,
    createdAt: proposal.created_at,
    updatedAt: proposal.updated_at
  };
};

/**
 * Format proposal with freelancer info for API
 * @param {Object} proposal - Raw proposal data with freelancer info
 * @returns {Object} Formatted proposal
 */
const formatProposalWithFreelancerResponse = (proposal) => {
  return {
    id: proposal.id,
    projectId: proposal.project_id,
    coverLetter: proposal.cover_letter,
    proposedBudget: proposal.proposed_budget,
    proposedTimeline: proposal.proposed_timeline,
    status: proposal.status,
    freelancer: {
      id: proposal.freelancer_id,
      name: proposal.freelancer_name,
      avatar: proposal.freelancer_avatar,
      title: proposal.freelancer_title,
      hourlyRate: proposal.freelancer_hourly_rate,
      rating: proposal.freelancer_rating,
      jobsCompleted: proposal.freelancer_jobs_completed,
      location: proposal.freelancer_location
    },
    createdAt: proposal.created_at,
    updatedAt: proposal.updated_at
  };
};

/**
 * Format proposal with project info for API
 * @param {Object} proposal - Raw proposal data with project info
 * @returns {Object} Formatted proposal
 */
const formatProposalWithProjectResponse = (proposal) => {
  return {
    id: proposal.id,
    projectId: proposal.project_id,
    coverLetter: proposal.cover_letter,
    proposedBudget: proposal.proposed_budget,
    proposedTimeline: proposal.proposed_timeline,
    status: proposal.status,
    project: {
      title: proposal.project_title,
      description: proposal.project_description,
      budgetMin: proposal.project_budget_min,
      budgetMax: proposal.project_budget_max,
      status: proposal.project_status
    },
    client: {
      name: proposal.client_name,
      avatar: proposal.client_avatar,
      company: proposal.client_company
    },
    createdAt: proposal.created_at,
    updatedAt: proposal.updated_at
  };
};

module.exports = {
  submitProposal,
  getProjectProposals,
  getFreelancerProposals,
  getProposalById,
  updateProposalStatus,
  withdrawProposal,
  formatProposalResponse,
  formatProposalWithFreelancerResponse,
  formatProposalWithProjectResponse
};
