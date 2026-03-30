const contractService = require('../services/contractService');
const logger = require('../utils/logger');

const getUserContracts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = {
      status: req.query.status
    };
    
    logger.info('Get user contracts request', { userId, filters });
    
    const contracts = await contractService.getUserContracts(userId, filters);
    
    res.json({
      success: true,
      contracts,
      count: contracts.length
    });
  } catch (error) {
    logger.error('Get user contracts error', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getContractById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { contractId } = req.params;
    
    logger.info('Get contract by ID request', { contractId, userId });
    
    const contract = await contractService.getContractById(contractId, userId);
    
    res.json({
      success: true,
      contract
    });
  } catch (error) {
    logger.error('Get contract by ID error', { error: error.message });
    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('Unauthorized') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getUserContracts,
  getContractById
};


const signContract = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { contractId } = req.params;
    
    logger.info('Sign contract request', { contractId, userId });
    
    const contract = await contractService.signContract(contractId, userId);
    
    res.json({
      success: true,
      contract,
      message: 'Contract signed successfully'
    });
  } catch (error) {
    logger.error('Sign contract error', { error: error.message });
    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('Unauthorized') ? 403 :
                       error.message.includes('already signed') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
};

// module.exports moved to end of file after all function definitions

/**
 * Get freelancer workspace (all active projects)
 * @route GET /api/contracts/workspace
 */
const getFreelancerWorkspace = async (req, res) => {
  try {
    const freelancerId = req.user.userId;
    
    logger.info('Get freelancer workspace request', { freelancerId });
    
    const workspace = await contractService.getFreelancerWorkspace(freelancerId);
    
    logger.info('Freelancer workspace retrieved', { 
      freelancerId, 
      projectCount: workspace.length 
    });
    
    res.json({
      success: true,
      projects: workspace,
      count: workspace.length
    });
  } catch (error) {
    logger.error('Get freelancer workspace error', { 
      freelancerId: req.user.userId,
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve workspace',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get detailed project workspace
 * @route GET /api/contracts/workspace/:projectId
 */
const getProjectWorkspace = async (req, res) => {
  try {
    const { projectId } = req.params;
    const freelancerId = req.user.userId;
    
    logger.info('Get project workspace request', { projectId, freelancerId });
    
    const workspace = await contractService.getProjectWorkspace(projectId, freelancerId);
    
    logger.info('Project workspace retrieved', { projectId });
    
    res.json({
      success: true,
      ...workspace
    });
  } catch (error) {
    logger.error('Get project workspace error', { 
      projectId: req.params.projectId,
      error: error.message 
    });
    
    if (error.message.includes('not found') || error.message.includes('do not have access')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'PROJECT_NOT_FOUND'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve project workspace',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  getUserContracts,
  getContractById,
  signContract,
  getFreelancerWorkspace,
  getProjectWorkspace
};
