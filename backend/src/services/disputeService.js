const { query } = require('../utils/dbQueries');
const logger = require('../utils/logger');

/**
 * File a new dispute
 * @param {string} userId - User filing the dispute
 * @param {Object} disputeData - Dispute data
 * @returns {Promise<Object>} Created dispute
 */
const fileDispute = async (userId, disputeData) => {
  try {
    logger.info('Filing dispute', { userId, contractId: disputeData.contractId });
    
    // Get contract details to determine respondent
    const contractResult = await query(
      `SELECT c.*, p.client_id, p.id as project_id
       FROM contracts c
       JOIN projects p ON c.project_id = p.id
       WHERE c.id = $1`,
      [disputeData.contractId]
    );
    
    if (contractResult.rows.length === 0) {
      throw new Error('Contract not found');
    }
    
    const contract = contractResult.rows[0];
    
    // Determine respondent (the other party)
    const respondentId = contract.client_id === userId ? contract.freelancer_id : contract.client_id;
    
    // Verify user is part of the contract
    if (contract.client_id !== userId && contract.freelancer_id !== userId) {
      throw new Error('Unauthorized: You are not part of this contract');
    }
    
    // Create dispute
    const result = await query(
      `INSERT INTO disputes (
        contract_id, project_id, milestone_id, filed_by, respondent_id,
        category, title, description, amount_disputed, priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        disputeData.contractId,
        contract.project_id,
        disputeData.milestoneId || null,
        userId,
        respondentId,
        disputeData.category,
        disputeData.title,
        disputeData.description,
        disputeData.amountDisputed || null,
        disputeData.priority || 'medium'
      ]
    );
    
    const dispute = result.rows[0];
    
    // Link uploaded files to dispute
    if (disputeData.fileIds && disputeData.fileIds.length > 0) {
      logger.info('Linking files to dispute', { disputeId: dispute.id, fileCount: disputeData.fileIds.length });
      
      await query(
        'UPDATE files SET dispute_id = $1, contract_id = $2 WHERE id = ANY($3) AND uploaded_by = $4 AND status = $5',
        [dispute.id, disputeData.contractId, disputeData.fileIds, userId, 'active']
      );
    }
    
    logger.info('Dispute filed successfully', { disputeId: dispute.id });
    
    return formatDisputeResponse(dispute);
  } catch (error) {
    logger.error('Error filing dispute', { userId, error: error.message });
    throw error;
  }
};

/**
 * Get disputes for a user
 * @param {string} userId - User ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Disputes list
 */
const getUserDisputes = async (userId, filters = {}) => {
  try {
    logger.info('Getting user disputes', { userId, filters });
    
    let whereConditions = ['(d.filed_by = $1 OR d.respondent_id = $1 OR d.mediator_id = $1)'];
    let params = [userId];
    let paramIndex = 2;
    
    if (filters.status) {
      whereConditions.push(`d.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }
    
    if (filters.category) {
      whereConditions.push(`d.category = $${paramIndex}`);
      params.push(filters.category);
      paramIndex++;
    }
    
    if (filters.contractId) {
      whereConditions.push(`d.contract_id = $${paramIndex}`);
      params.push(filters.contractId);
      paramIndex++;
    }
    
    const result = await query(
      `SELECT d.*,
              p.title as project_title,
              pm.title as milestone_title,
              filer.full_name as filed_by_name,
              filer.avatar_url as filed_by_avatar,
              resp.full_name as respondent_name,
              resp.avatar_url as respondent_avatar,
              med.full_name as mediator_name,
              med.avatar_url as mediator_avatar,
              (SELECT COUNT(*) FROM dispute_messages WHERE dispute_id = d.id) as message_count,
              (SELECT COUNT(*) FROM dispute_evidence WHERE dispute_id = d.id) as evidence_count
       FROM disputes d
       JOIN projects p ON d.project_id = p.id
       LEFT JOIN project_milestones pm ON d.milestone_id = pm.id
       JOIN users filer ON d.filed_by = filer.id
       JOIN users resp ON d.respondent_id = resp.id
       LEFT JOIN users med ON d.mediator_id = med.id
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY d.created_at DESC`,
      params
    );
    
    logger.info('Disputes retrieved', { userId, count: result.rows.length });
    
    return result.rows.map(formatDisputeWithDetailsResponse);
  } catch (error) {
    logger.error('Error getting user disputes', { userId, error: error.message });
    throw error;
  }
};

/**
 * Get dispute by ID
 * @param {string} disputeId - Dispute ID
 * @param {string} userId - Current user ID
 * @param {string} userRole - Current user role
 * @returns {Promise<Object>} Dispute details
 */
const getDisputeById = async (disputeId, userId, userRole = null) => {
  try {
    logger.info('Getting dispute by ID', { disputeId, userId, userRole });
    
    const result = await query(
      `SELECT d.*,
              p.title as project_title,
              pm.title as milestone_title,
              pm.amount as milestone_amount,
              c.agreed_budget,
              filer.full_name as filed_by_name,
              filer.email as filed_by_email,
              filer.avatar_url as filed_by_avatar,
              resp.full_name as respondent_name,
              resp.email as respondent_email,
              resp.avatar_url as respondent_avatar,
              med.full_name as mediator_name,
              med.email as mediator_email,
              med.avatar_url as mediator_avatar,
              resolver.full_name as resolved_by_name
       FROM disputes d
       JOIN projects p ON d.project_id = p.id
       JOIN contracts c ON d.contract_id = c.id
       LEFT JOIN project_milestones pm ON d.milestone_id = pm.id
       JOIN users filer ON d.filed_by = filer.id
       JOIN users resp ON d.respondent_id = resp.id
       LEFT JOIN users med ON d.mediator_id = med.id
       LEFT JOIN users resolver ON d.resolved_by = resolver.id
       WHERE d.id = $1`,
      [disputeId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Dispute not found');
    }
    
    const dispute = result.rows[0];
    
    // Verify access - allow admins to view all disputes
    if (userRole !== 'ADMIN' && 
        dispute.filed_by !== userId && 
        dispute.respondent_id !== userId && 
        dispute.mediator_id !== userId) {
      throw new Error('Unauthorized: You do not have access to this dispute');
    }
    
    logger.info('Dispute retrieved', { disputeId });
    
    return formatDisputeWithDetailsResponse(dispute);
  } catch (error) {
    logger.error('Error getting dispute', { disputeId, error: error.message });
    throw error;
  }
};

/**
 * Upload evidence for dispute
 * @param {string} disputeId - Dispute ID
 * @param {string} userId - User uploading evidence
 * @param {Object} evidenceData - Evidence data
 * @returns {Promise<Object>} Created evidence
 */
const uploadEvidence = async (disputeId, userId, evidenceData) => {
  try {
    logger.info('Uploading evidence', { disputeId, userId });
    
    // Verify user has access to dispute
    const disputeResult = await query(
      'SELECT filed_by, respondent_id, mediator_id FROM disputes WHERE id = $1',
      [disputeId]
    );
    
    if (disputeResult.rows.length === 0) {
      throw new Error('Dispute not found');
    }
    
    const dispute = disputeResult.rows[0];
    
    if (dispute.filed_by !== userId && 
        dispute.respondent_id !== userId && 
        dispute.mediator_id !== userId) {
      throw new Error('Unauthorized: You do not have access to this dispute');
    }
    
    const result = await query(
      `INSERT INTO dispute_evidence (
        dispute_id, uploaded_by, file_name, file_path, file_type, file_size, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        disputeId,
        userId,
        evidenceData.fileName,
        evidenceData.filePath,
        evidenceData.fileType || null,
        evidenceData.fileSize || null,
        evidenceData.description || null
      ]
    );
    
    logger.info('Evidence uploaded', { disputeId, evidenceId: result.rows[0].id });
    
    return formatEvidenceResponse(result.rows[0]);
  } catch (error) {
    logger.error('Error uploading evidence', { disputeId, error: error.message });
    throw error;
  }
};

/**
 * Get evidence for dispute
 * @param {string} disputeId - Dispute ID
 * @param {string} userId - Current user ID
 * @param {string} userRole - Current user role
 * @returns {Promise<Array>} Evidence list
 */
const getDisputeEvidence = async (disputeId, userId, userRole = null) => {
  try {
    logger.info('Getting dispute evidence', { disputeId, userId, userRole });
    
    // Verify access
    const disputeResult = await query(
      'SELECT filed_by, respondent_id, mediator_id FROM disputes WHERE id = $1',
      [disputeId]
    );
    
    if (disputeResult.rows.length === 0) {
      throw new Error('Dispute not found');
    }
    
    const dispute = disputeResult.rows[0];
    
    // Allow admins to view all evidence
    if (userRole !== 'ADMIN' && 
        dispute.filed_by !== userId && 
        dispute.respondent_id !== userId && 
        dispute.mediator_id !== userId) {
      throw new Error('Unauthorized: You do not have access to this dispute');
    }
    
    const result = await query(
      `SELECT de.*,
              u.full_name as uploaded_by_name,
              u.avatar_url as uploaded_by_avatar
       FROM dispute_evidence de
       JOIN users u ON de.uploaded_by = u.id
       WHERE de.dispute_id = $1
       ORDER BY de.created_at DESC`,
      [disputeId]
    );
    
    logger.info('Evidence retrieved', { disputeId, count: result.rows.length });
    
    return result.rows.map(formatEvidenceWithDetailsResponse);
  } catch (error) {
    logger.error('Error getting evidence', { disputeId, error: error.message });
    throw error;
  }
};

/**
 * Send message in dispute thread
 * @param {string} disputeId - Dispute ID
 * @param {string} userId - User sending message
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} Created message
 */
const sendDisputeMessage = async (disputeId, userId, messageData) => {
  try {
    logger.info('Sending dispute message', { disputeId, userId });
    
    // Verify access
    const disputeResult = await query(
      'SELECT filed_by, respondent_id, mediator_id FROM disputes WHERE id = $1',
      [disputeId]
    );
    
    if (disputeResult.rows.length === 0) {
      throw new Error('Dispute not found');
    }
    
    const dispute = disputeResult.rows[0];
    
    if (dispute.filed_by !== userId && 
        dispute.respondent_id !== userId && 
        dispute.mediator_id !== userId) {
      throw new Error('Unauthorized: You do not have access to this dispute');
    }
    
    const result = await query(
      `INSERT INTO dispute_messages (
        dispute_id, sender_id, message, is_internal, attachments
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        disputeId,
        userId,
        messageData.message,
        messageData.isInternal || false,
        JSON.stringify(messageData.attachments || [])
      ]
    );
    
    logger.info('Message sent', { disputeId, messageId: result.rows[0].id });
    
    return formatMessageResponse(result.rows[0]);
  } catch (error) {
    logger.error('Error sending message', { disputeId, error: error.message });
    throw error;
  }
};

/**
 * Get messages for dispute
 * @param {string} disputeId - Dispute ID
 * @param {string} userId - Current user ID
 * @param {string} userRole - Current user role
 * @returns {Promise<Array>} Messages list
 */
const getDisputeMessages = async (disputeId, userId, userRole = null) => {
  try {
    logger.info('Getting dispute messages', { disputeId, userId, userRole });
    
    // Verify access
    const disputeResult = await query(
      'SELECT filed_by, respondent_id, mediator_id FROM disputes WHERE id = $1',
      [disputeId]
    );
    
    if (disputeResult.rows.length === 0) {
      throw new Error('Dispute not found');
    }
    
    const dispute = disputeResult.rows[0];
    
    // Allow admins to view all messages
    if (userRole !== 'ADMIN' && 
        dispute.filed_by !== userId && 
        dispute.respondent_id !== userId && 
        dispute.mediator_id !== userId) {
      throw new Error('Unauthorized: You do not have access to this dispute');
    }
    
    // Only show internal messages to mediator or admin
    const isMediator = dispute.mediator_id === userId;
    const isAdmin = userRole === 'ADMIN';
    
    const result = await query(
      `SELECT dm.*,
              u.full_name as sender_name,
              u.avatar_url as sender_avatar,
              u.role as sender_role
       FROM dispute_messages dm
       JOIN users u ON dm.sender_id = u.id
       WHERE dm.dispute_id = $1 ${(isMediator || isAdmin) ? '' : 'AND dm.is_internal = FALSE'}
       ORDER BY dm.created_at ASC`,
      [disputeId]
    );
    
    logger.info('Messages retrieved', { disputeId, count: result.rows.length });
    
    return result.rows.map(formatMessageWithDetailsResponse);
  } catch (error) {
    logger.error('Error getting messages', { disputeId, error: error.message });
    throw error;
  }
};

/**
 * Assign mediator to dispute (Admin only)
 * @param {string} disputeId - Dispute ID
 * @param {string} mediatorId - Mediator user ID
 * @returns {Promise<Object>} Updated dispute
 */
const assignMediator = async (disputeId, mediatorId) => {
  try {
    logger.info('Assigning mediator', { disputeId, mediatorId });
    
    // Verify mediator exists and is admin
    const mediatorResult = await query(
      'SELECT id, role FROM users WHERE id = $1',
      [mediatorId]
    );
    
    if (mediatorResult.rows.length === 0) {
      throw new Error('Mediator not found');
    }
    
    // Note: For now, we'll allow assignment. Admin check will be added in admin panel
    
    const result = await query(
      `UPDATE disputes
       SET mediator_id = $1, status = 'in_mediation', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [mediatorId, disputeId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Dispute not found');
    }
    
    logger.info('Mediator assigned', { disputeId, mediatorId });
    
    return formatDisputeResponse(result.rows[0]);
  } catch (error) {
    logger.error('Error assigning mediator', { disputeId, error: error.message });
    throw error;
  }
};

/**
 * Resolve dispute (Mediator or Admin)
 * @param {string} disputeId - Dispute ID
 * @param {string} userId - User ID (mediator or admin)
 * @param {string} userRole - User role
 * @param {Object} resolutionData - Resolution data
 * @returns {Promise<Object>} Updated dispute
 */
const resolveDispute = async (disputeId, userId, userRole, resolutionData) => {
  try {
    logger.info('Resolving dispute', { disputeId, userId, userRole });
    
    // Verify dispute exists and get contract details
    const disputeResult = await query(
      `SELECT d.*, c.client_id, c.freelancer_id 
       FROM disputes d
       JOIN contracts c ON d.contract_id = c.id
       WHERE d.id = $1`,
      [disputeId]
    );
    
    if (disputeResult.rows.length === 0) {
      throw new Error('Dispute not found');
    }
    
    const dispute = disputeResult.rows[0];
    
    // Allow admins or assigned mediators to resolve
    if (userRole !== 'ADMIN' && dispute.mediator_id !== userId) {
      throw new Error('Unauthorized: Only the assigned mediator or admin can resolve this dispute');
    }
    
    if (dispute.status === 'resolved' || dispute.status === 'closed') {
      throw new Error('Dispute is already resolved or closed');
    }
    
    // Update dispute
    const result = await query(
      `UPDATE disputes
       SET resolution_type = $1,
           resolution_notes = $2,
           resolution_amount = $3,
           status = 'resolved',
           resolved_at = CURRENT_TIMESTAMP,
           resolved_by = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [
        resolutionData.resolutionType,
        resolutionData.resolutionNotes,
        resolutionData.resolutionAmount || null,
        userId,
        disputeId
      ]
    );
    
    // Handle fund movements based on resolution type
    if (resolutionData.resolutionType === 'release_to_freelancer' && resolutionData.resolutionAmount) {
      // Create escrow release
      await query(
        `INSERT INTO escrow (
          contract_id, milestone_id, client_id, freelancer_id,
          amount, platform_fee, net_amount, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
        [
          dispute.contract_id,
          dispute.milestone_id,
          dispute.client_id,
          dispute.freelancer_id,
          resolutionData.resolutionAmount,
          resolutionData.resolutionAmount * 0.1,
          resolutionData.resolutionAmount * 0.9
        ]
      );
    }
    
    logger.info('Dispute resolved', { disputeId, resolutionType: resolutionData.resolutionType });
    
    return formatDisputeResponse(result.rows[0]);
  } catch (error) {
    logger.error('Error resolving dispute', { disputeId, error: error.message });
    throw error;
  }
};

/**
 * Close dispute
 * @param {string} disputeId - Dispute ID
 * @param {string} userId - User closing dispute
 * @returns {Promise<Object>} Updated dispute
 */
const closeDispute = async (disputeId, userId) => {
  try {
    logger.info('Closing dispute', { disputeId, userId });
    
    const result = await query(
      `UPDATE disputes
       SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND (filed_by = $2 OR respondent_id = $2 OR mediator_id = $2)
       RETURNING *`,
      [disputeId, userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Dispute not found or unauthorized');
    }
    
    logger.info('Dispute closed', { disputeId });
    
    return formatDisputeResponse(result.rows[0]);
  } catch (error) {
    logger.error('Error closing dispute', { disputeId, error: error.message });
    throw error;
  }
};

/**
 * Get dispute timeline
 * @param {string} disputeId - Dispute ID
 * @param {string} userId - Current user ID
 * @param {string} userRole - Current user role
 * @returns {Promise<Array>} Timeline entries
 */
const getDisputeTimeline = async (disputeId, userId, userRole = null) => {
  try {
    logger.info('Getting dispute timeline', { disputeId, userId, userRole });
    
    // Verify access
    const disputeResult = await query(
      'SELECT filed_by, respondent_id, mediator_id FROM disputes WHERE id = $1',
      [disputeId]
    );
    
    if (disputeResult.rows.length === 0) {
      throw new Error('Dispute not found');
    }
    
    const dispute = disputeResult.rows[0];
    
    // Allow admins to view all timelines
    if (userRole !== 'ADMIN' && 
        dispute.filed_by !== userId && 
        dispute.respondent_id !== userId && 
        dispute.mediator_id !== userId) {
      throw new Error('Unauthorized: You do not have access to this dispute');
    }
    
    const result = await query(
      `SELECT dt.*,
              u.full_name as user_name,
              u.avatar_url as user_avatar
       FROM dispute_timeline dt
       LEFT JOIN users u ON dt.user_id = u.id
       WHERE dt.dispute_id = $1
       ORDER BY dt.created_at ASC`,
      [disputeId]
    );
    
    logger.info('Timeline retrieved', { disputeId, count: result.rows.length });
    
    return result.rows.map(formatTimelineResponse);
  } catch (error) {
    logger.error('Error getting timeline', { disputeId, error: error.message });
    throw error;
  }
};

// Format response functions
const formatDisputeResponse = (dispute) => {
  return {
    id: dispute.id,
    contractId: dispute.contract_id,
    projectId: dispute.project_id,
    milestoneId: dispute.milestone_id,
    filedBy: dispute.filed_by,
    respondentId: dispute.respondent_id,
    mediatorId: dispute.mediator_id,
    category: dispute.category,
    title: dispute.title,
    description: dispute.description,
    amountDisputed: dispute.amount_disputed ? parseFloat(dispute.amount_disputed) : null,
    status: dispute.status,
    priority: dispute.priority,
    resolutionType: dispute.resolution_type,
    resolutionNotes: dispute.resolution_notes,
    resolutionAmount: dispute.resolution_amount ? parseFloat(dispute.resolution_amount) : null,
    resolvedAt: dispute.resolved_at,
    resolvedBy: dispute.resolved_by,
    createdAt: dispute.created_at,
    updatedAt: dispute.updated_at,
    closedAt: dispute.closed_at
  };
};

const formatDisputeWithDetailsResponse = (dispute) => {
  return {
    ...formatDisputeResponse(dispute),
    projectTitle: dispute.project_title,
    milestoneTitle: dispute.milestone_title,
    milestoneAmount: dispute.milestone_amount ? parseFloat(dispute.milestone_amount) : null,
    agreedBudget: dispute.agreed_budget ? parseFloat(dispute.agreed_budget) : null,
    filedByName: dispute.filed_by_name,
    filedByEmail: dispute.filed_by_email,
    filedByAvatar: dispute.filed_by_avatar,
    respondentName: dispute.respondent_name,
    respondentEmail: dispute.respondent_email,
    respondentAvatar: dispute.respondent_avatar,
    mediatorName: dispute.mediator_name,
    mediatorEmail: dispute.mediator_email,
    mediatorAvatar: dispute.mediator_avatar,
    resolvedByName: dispute.resolved_by_name,
    messageCount: parseInt(dispute.message_count || 0),
    evidenceCount: parseInt(dispute.evidence_count || 0)
  };
};

const formatEvidenceResponse = (evidence) => {
  return {
    id: evidence.id,
    disputeId: evidence.dispute_id,
    uploadedBy: evidence.uploaded_by,
    fileName: evidence.file_name,
    filePath: evidence.file_path,
    fileType: evidence.file_type,
    fileSize: evidence.file_size,
    description: evidence.description,
    createdAt: evidence.created_at
  };
};

const formatEvidenceWithDetailsResponse = (evidence) => {
  return {
    ...formatEvidenceResponse(evidence),
    uploadedByName: evidence.uploaded_by_name,
    uploadedByAvatar: evidence.uploaded_by_avatar
  };
};

const formatMessageResponse = (message) => {
  return {
    id: message.id,
    disputeId: message.dispute_id,
    senderId: message.sender_id,
    message: message.message,
    isInternal: message.is_internal,
    attachments: message.attachments,
    createdAt: message.created_at,
    updatedAt: message.updated_at
  };
};

const formatMessageWithDetailsResponse = (message) => {
  return {
    ...formatMessageResponse(message),
    senderName: message.sender_name,
    senderAvatar: message.sender_avatar,
    senderRole: message.sender_role
  };
};

const formatTimelineResponse = (entry) => {
  return {
    id: entry.id,
    disputeId: entry.dispute_id,
    userId: entry.user_id,
    userName: entry.user_name,
    userAvatar: entry.user_avatar,
    action: entry.action,
    description: entry.description,
    oldValue: entry.old_value,
    newValue: entry.new_value,
    metadata: entry.metadata,
    createdAt: entry.created_at
  };
};

module.exports = {
  fileDispute,
  getUserDisputes,
  getDisputeById,
  uploadEvidence,
  getDisputeEvidence,
  sendDisputeMessage,
  getDisputeMessages,
  assignMediator,
  resolveDispute,
  closeDispute,
  getDisputeTimeline
};
