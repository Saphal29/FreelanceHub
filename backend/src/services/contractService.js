const { query } = require('../utils/dbQueries');
const logger = require('../utils/logger');

/**
 * Create contract from accepted proposal
 * @param {string} proposalId - Proposal ID
 * @param {string} clientId - Client user ID
 * @returns {Promise<Object>} Created contract
 */
const createContract = async (proposalId, clientId) => {
  try {
    logger.info('Creating contract', { proposalId, clientId });
    
    // Get proposal details
    const proposalResult = await query(
      `SELECT pp.*, p.client_id, p.id as project_id, p.title as project_title
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
      throw new Error('Unauthorized: You can only create contracts for your own projects');
    }
    
    if (proposal.status !== 'accepted') {
      throw new Error('Only accepted proposals can have contracts');
    }
    
    // Check if contract already exists
    const existingResult = await query(
      'SELECT id FROM contracts WHERE proposal_id = $1',
      [proposalId]
    );
    
    if (existingResult.rows.length > 0) {
      throw new Error('Contract already exists for this proposal');
    }
    
    // Create contract
    const result = await query(
      `INSERT INTO contracts (
        project_id, proposal_id, client_id, freelancer_id,
        agreed_budget, agreed_timeline, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        proposal.project_id,
        proposalId,
        proposal.client_id,
        proposal.freelancer_id,
        proposal.proposed_budget,
        proposal.proposed_timeline,
        'pending'
      ]
    );
    
    logger.info('Contract created successfully', { contractId: result.rows[0].id });
    return formatContractResponse(result.rows[0]);
  } catch (error) {
    logger.error('Error creating contract', { proposalId, error: error.message });
    throw error;
  }
};

/**
 * Get contract by ID
 * @param {string} contractId - Contract ID
 * @param {string} userId - Current user ID
 * @returns {Promise<Object>} Contract details
 */
const getContractById = async (contractId, userId) => {
  try {
    logger.info('Getting contract by ID', { contractId, userId });
    
    const result = await query(
      `SELECT c.*, p.title as project_title
       FROM contracts c
       JOIN projects p ON c.project_id = p.id
       WHERE c.id = $1`,
      [contractId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Contract not found');
    }
    
    const contract = result.rows[0];
    
    // Check authorization
    if (contract.client_id !== userId && contract.freelancer_id !== userId) {
      throw new Error('Unauthorized: You can only view your own contracts');
    }
    
    logger.info('Contract retrieved', { contractId });
    return formatContractResponse(contract);
  } catch (error) {
    logger.error('Error getting contract', { contractId, error: error.message });
    throw error;
  }
};

/**
 * Get contracts for a user
 * @param {string} userId - User ID
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Array>} Contracts list
 */
const getUserContracts = async (userId, filters = {}) => {
  try {
    logger.info('Getting user contracts', { userId });
    
    let whereConditions = ['(c.client_id = $1 OR c.freelancer_id = $1)'];
    let params = [userId];
    let paramIndex = 2;
    
    if (filters.status) {
      whereConditions.push(`c.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const result = await query(
      `SELECT c.*, p.title as project_title
       FROM contracts c
       JOIN projects p ON c.project_id = p.id
       WHERE ${whereClause}
       ORDER BY c.created_at DESC`,
      params
    );
    
    logger.info('User contracts retrieved', { userId, count: result.rows.length });
    return result.rows.map(formatContractResponse);
  } catch (error) {
    logger.error('Error getting user contracts', { userId, error: error.message });
    throw error;
  }
};

/**
 * Format contract response for API
 * @param {Object} contract - Raw contract data
 * @returns {Object} Formatted contract
 */
const formatContractResponse = (contract) => {
  return {
    id: contract.id,
    projectId: contract.project_id,
    proposalId: contract.proposal_id,
    clientId: contract.client_id,
    freelancerId: contract.freelancer_id,
    agreedBudget: contract.agreed_budget,
    agreedTimeline: contract.agreed_timeline,
    paymentTerms: contract.payment_terms,
    deliverables: contract.deliverables,
    status: contract.status,
    signedByClient: contract.signed_by_client,
    signedByFreelancer: contract.signed_by_freelancer,
    clientSignedAt: contract.client_signed_at,
    freelancerSignedAt: contract.freelancer_signed_at,
    projectTitle: contract.project_title,
    createdAt: contract.created_at,
    updatedAt: contract.updated_at,
    startedAt: contract.started_at,
    completedAt: contract.completed_at
  };
};

// Note: module.exports is at the end of the file after all functions are defined

/**
 * Sign contract
 * @param {string} contractId - Contract ID
 * @param {string} userId - User ID signing the contract
 * @returns {Promise<Object>} Updated contract
 */
const signContract = async (contractId, userId) => {
  try {
    logger.info('Signing contract', { contractId, userId });
    
    const contractResult = await query(
      'SELECT * FROM contracts WHERE id = $1',
      [contractId]
    );
    
    if (contractResult.rows.length === 0) {
      throw new Error('Contract not found');
    }
    
    const contract = contractResult.rows[0];
    
    if (contract.client_id !== userId && contract.freelancer_id !== userId) {
      throw new Error('Unauthorized: You can only sign your own contracts');
    }
    
    const isClient = contract.client_id === userId;
    const isFreelancer = contract.freelancer_id === userId;
    
    if (isClient && contract.signed_by_client) {
      throw new Error('You have already signed this contract');
    }
    
    if (isFreelancer && contract.signed_by_freelancer) {
      throw new Error('You have already signed this contract');
    }
    
    let updateQuery;
    let params;
    
    if (isClient) {
      updateQuery = 'UPDATE contracts SET signed_by_client = true, client_signed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *';
      params = [contractId];
    } else {
      updateQuery = 'UPDATE contracts SET signed_by_freelancer = true, freelancer_signed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *';
      params = [contractId];
    }
    
    const result = await query(updateQuery, params);
    const updatedContract = result.rows[0];
    
    if (updatedContract.signed_by_client && updatedContract.signed_by_freelancer) {
      await query(
        'UPDATE contracts SET status = $1, started_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['active', contractId]
      );
      logger.info('Contract fully signed and activated', { contractId });
    }
    
    logger.info('Contract signed successfully', { contractId, userId, isClient });
    return formatContractResponse(updatedContract);
  } catch (error) {
    logger.error('Error signing contract', { contractId, error: error.message });
    throw error;
  }
};

// module.exports moved to end of file after all function definitions

/**
 * Get freelancer's active contracts with project details
 * @param {string} freelancerId - Freelancer user ID
 * @returns {Promise<Array>} Contracts with project and milestone details
 */
const getFreelancerWorkspace = async (freelancerId) => {
  try {
    logger.info('Getting freelancer workspace', { freelancerId });
    
    const result = await query(
      `SELECT 
        c.id as contract_id,
        c.status as contract_status,
        c.started_at,
        c.completed_at,
        c.agreed_budget as total_amount,
        c.payment_terms,
        c.created_at as contract_created_at,
        p.id as project_id,
        p.title as project_title,
        p.description as project_description,
        p.category,
        p.skills,
        p.status as project_status,
        p.deadline,
        u.id as client_id,
        u.full_name as client_name,
        u.avatar_url as client_avatar,
        cp.company_name as client_company,
        -- Milestone stats
        (SELECT COUNT(*) FROM project_milestones WHERE project_id = p.id) as total_milestones,
        (SELECT COUNT(*) FROM project_milestones WHERE project_id = p.id AND status = 'completed') as completed_milestones,
        (SELECT COUNT(*) FROM project_milestones WHERE project_id = p.id AND status = 'under_review') as under_review_milestones,
        (SELECT COUNT(*) FROM project_milestones WHERE project_id = p.id AND status = 'in_progress') as in_progress_milestones,
        (SELECT COALESCE(SUM(amount), 0) FROM project_milestones WHERE project_id = p.id AND status = 'completed') as earned_amount,
        -- Time tracking stats
        (SELECT COALESCE(SUM(duration_minutes), 0) FROM time_entries WHERE contract_id = c.id AND is_billable = true) as total_time_minutes,
        (SELECT COUNT(*) FROM time_entries WHERE contract_id = c.id AND end_time IS NULL) as active_timers
       FROM contracts c
       JOIN projects p ON c.project_id = p.id
       JOIN users u ON c.client_id = u.id
       LEFT JOIN client_profiles cp ON u.id = cp.user_id
       WHERE c.freelancer_id = $1
         AND c.status IN ('active', 'pending')
       ORDER BY c.created_at DESC`,
      [freelancerId]
    );
    
    logger.info('Freelancer workspace retrieved', { 
      freelancerId, 
      contractCount: result.rows.length 
    });
    
    return result.rows.map(formatWorkspaceProject);
  } catch (error) {
    logger.error('Error getting freelancer workspace', { 
      freelancerId, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Get detailed project workspace (single project)
 * @param {string} projectId - Project ID
 * @param {string} freelancerId - Freelancer user ID
 * @returns {Promise<Object>} Detailed project workspace
 */
const getProjectWorkspace = async (projectId, freelancerId) => {
  try {
    logger.info('Getting project workspace', { projectId, freelancerId });
    
    // Get project and contract details
    const projectResult = await query(
      `SELECT 
        c.id as contract_id,
        c.status as contract_status,
        c.started_at,
        c.completed_at,
        c.agreed_budget,
        c.agreed_timeline,
        c.payment_terms,
        p.*,
        u.id as client_id,
        u.full_name as client_name,
        u.email as client_email,
        u.avatar_url as client_avatar,
        cp.company_name as client_company
       FROM contracts c
       JOIN projects p ON c.project_id = p.id
       JOIN users u ON c.client_id = u.id
       LEFT JOIN client_profiles cp ON u.id = cp.user_id
       WHERE p.id = $1 AND c.freelancer_id = $2`,
      [projectId, freelancerId]
    );
    
    if (projectResult.rows.length === 0) {
      throw new Error('Project not found or you do not have access');
    }
    
    const project = projectResult.rows[0];
    
    // Get milestones
    const milestonesResult = await query(
      `SELECT * FROM project_milestones 
       WHERE project_id = $1 
       ORDER BY order_index ASC, created_at ASC`,
      [projectId]
    );
    
    // Get recent time entries
    const timeEntriesResult = await query(
      `SELECT * FROM time_entries 
       WHERE contract_id = $1 
       ORDER BY start_time DESC 
       LIMIT 10`,
      [project.contract_id]
    );
    
    // Get pending revisions
    const revisionsResult = await query(
      `SELECT mr.*, pm.title as milestone_title
       FROM milestone_revisions mr
       JOIN project_milestones pm ON mr.milestone_id = pm.id
       WHERE pm.project_id = $1 AND mr.resolved = false
       ORDER BY mr.created_at DESC`,
      [projectId]
    );
    
    logger.info('Project workspace retrieved', { projectId });
    
    return {
      project: formatProjectDetails(project),
      milestones: milestonesResult.rows,
      recentTimeEntries: timeEntriesResult.rows,
      pendingRevisions: revisionsResult.rows
    };
  } catch (error) {
    logger.error('Error getting project workspace', { 
      projectId, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Format workspace project
 */
const formatWorkspaceProject = (project) => {
  return {
    contractId: project.contract_id,
    contractStatus: project.contract_status,
    startDate: project.started_at,
    endDate: project.completed_at,
    totalAmount: parseFloat(project.total_amount || 0),
    paymentTerms: project.payment_terms,
    projectId: project.project_id,
    projectTitle: project.project_title,
    projectDescription: project.project_description,
    category: project.category,
    skills: project.skills,
    projectStatus: project.project_status,
    deadline: project.deadline,
    client: {
      id: project.client_id,
      name: project.client_name,
      avatar: project.client_avatar,
      company: project.client_company
    },
    stats: {
      totalMilestones: parseInt(project.total_milestones || 0),
      completedMilestones: parseInt(project.completed_milestones || 0),
      underReviewMilestones: parseInt(project.under_review_milestones || 0),
      inProgressMilestones: parseInt(project.in_progress_milestones || 0),
      earnedAmount: parseFloat(project.earned_amount || 0),
      totalTimeHours: parseFloat(project.total_time_minutes || 0) / 60,
      activeTimers: parseInt(project.active_timers || 0)
    },
    contractCreatedAt: project.contract_created_at
  };
};

/**
 * Format project details
 */
const formatProjectDetails = (project) => {
  return {
    contractId: project.contract_id,
    contractStatus: project.contract_status,
    startDate: project.started_at,
    endDate: project.completed_at,
    totalAmount: parseFloat(project.agreed_budget || 0),
    agreedBudget: parseFloat(project.agreed_budget || 0),
    agreedTimeline: project.agreed_timeline,
    paymentTerms: project.payment_terms,
    id: project.id,
    title: project.title,
    description: project.description,
    category: project.category,
    skills: project.skills,
    status: project.status,
    projectType: project.project_type,
    deadline: project.deadline,
    client: {
      id: project.client_id,
      name: project.client_name,
      email: project.client_email,
      avatar: project.client_avatar,
      company: project.client_company
    }
  };
};

module.exports = {
  createContract,
  getContractById,
  getUserContracts,
  signContract,
  formatContractResponse,
  getFreelancerWorkspace,
  getProjectWorkspace
};
