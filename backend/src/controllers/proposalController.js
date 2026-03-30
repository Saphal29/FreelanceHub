const proposalService = require('../services/proposalService');
const logger = require('../utils/logger');
const { validateProposalData } = require('../utils/validation');

/**
 * Submit a proposal
 * POST /api/proposals
 */
const submitProposal = async (req, res) => {
  try {
    const freelancerId = req.user.userId;
    
    // Validate proposal data
    const validationResult = validateProposalData(req.body);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: validationResult.errors.join(', ')
      });
    }
    
    const proposal = await proposalService.submitProposal(freelancerId, validationResult.sanitizedData);
    
    res.status(201).json({
      success: true,
      proposal
    });
  } catch (error) {
    logger.error('Error in submitProposal controller', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get proposals for a project (client view)
 * GET /api/proposals/project/:projectId
 */
const getProjectProposals = async (req, res) => {
  try {
    const { projectId } = req.params;
    const clientId = req.user.userId;
    const filters = {
      status: req.query.status
    };
    
    const proposals = await proposalService.getProjectProposals(projectId, clientId, filters);
    
    res.json({
      success: true,
      proposals,
      count: proposals.length
    });
  } catch (error) {
    logger.error('Error in getProjectProposals controller', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get freelancer's proposals
 * GET /api/proposals/my-proposals
 */
const getMyProposals = async (req, res) => {
  try {
    const freelancerId = req.user.userId;
    const filters = {
      status: req.query.status
    };
    
    const proposals = await proposalService.getFreelancerProposals(freelancerId, filters);
    
    res.json({
      success: true,
      proposals,
      count: proposals.length
    });
  } catch (error) {
    logger.error('Error in getMyProposals controller', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get proposal by ID
 * GET /api/proposals/:id
 */
const getProposalById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const proposal = await proposalService.getProposalById(id, userId);
    
    res.json({
      success: true,
      proposal
    });
  } catch (error) {
    logger.error('Error in getProposalById controller', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Accept proposal
 * PUT /api/proposals/:id/accept
 */
const acceptProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.userId;
    
    const proposal = await proposalService.updateProposalStatus(id, clientId, 'accepted');
    
    res.json({
      success: true,
      proposal,
      message: 'Proposal accepted successfully'
    });
  } catch (error) {
    logger.error('Error in acceptProposal controller', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Reject proposal
 * PUT /api/proposals/:id/reject
 */
const rejectProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.userId;
    
    const proposal = await proposalService.updateProposalStatus(id, clientId, 'rejected');
    
    res.json({
      success: true,
      proposal,
      message: 'Proposal rejected'
    });
  } catch (error) {
    logger.error('Error in rejectProposal controller', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Withdraw proposal
 * PUT /api/proposals/:id/withdraw
 */
const withdrawProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const freelancerId = req.user.userId;
    
    const proposal = await proposalService.withdrawProposal(id, freelancerId);
    
    res.json({
      success: true,
      proposal,
      message: 'Proposal withdrawn successfully'
    });
  } catch (error) {
    logger.error('Error in withdrawProposal controller', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  submitProposal,
  getProjectProposals,
  getMyProposals,
  getProposalById,
  acceptProposal,
  rejectProposal,
  withdrawProposal
};
