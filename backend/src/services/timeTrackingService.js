const { query } = require('../utils/dbQueries');
const logger = require('../utils/logger');

/**
 * Start a timer for a project
 */
const startTimer = async (userId, { contractId, description, hourlyRate }) => {
  try {
    // Verify contract and get details
    const contractResult = await query(
      `SELECT c.*, p.title as project_title
       FROM contracts c
       JOIN projects p ON c.project_id = p.id
       WHERE c.id = $1 AND c.freelancer_id = $2 AND c.status = 'active'`,
      [contractId, userId]
    );

    if (contractResult.rows.length === 0) {
      throw new Error('Contract not found or not active');
    }

    const contract = contractResult.rows[0];
    const projectId = contract.project_id;

    // Check for existing active timer
    const activeTimer = await query(
      'SELECT id FROM time_entries WHERE freelancer_id = $1 AND end_time IS NULL AND is_manual = FALSE',
      [userId]
    );

    if (activeTimer.rows.length > 0) {
      throw new Error('You already have an active timer running');
    }

    // Create time entry - hourly rate is optional
    const result = await query(
      `INSERT INTO time_entries (
        contract_id, freelancer_id, project_id,
        description, start_time, hourly_rate, is_manual
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, FALSE)
      RETURNING *`,
      [contractId, userId, projectId, description || '', hourlyRate || null]
    );

    logger.info('Timer started', { timeEntryId: result.rows[0].id, userId });
    return formatTimeEntry(result.rows[0]);
  } catch (error) {
    logger.error('Error starting timer', { error: error.message });
    throw error;
  }
};

/**
 * Stop the active timer
 */
const stopTimer = async (userId, timeEntryId) => {
  try {
    const result = await query(
      `UPDATE time_entries
       SET end_time = CURRENT_TIMESTAMP
       WHERE id = $1 AND freelancer_id = $2 AND end_time IS NULL
       RETURNING *`,
      [timeEntryId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Active timer not found');
    }

    logger.info('Timer stopped', { timeEntryId, userId });
    return formatTimeEntry(result.rows[0]);
  } catch (error) {
    logger.error('Error stopping timer', { error: error.message });
    throw error;
  }
};

/**
 * Get active timer for user
 */
const getActiveTimer = async (userId) => {
  const result = await query(
    `SELECT te.*, p.title as project_title, c.agreed_budget
     FROM time_entries te
     JOIN projects p ON te.project_id = p.id
     JOIN contracts c ON te.contract_id = c.id
     WHERE te.freelancer_id = $1 AND te.end_time IS NULL AND te.is_manual = FALSE`,
    [userId]
  );

  return result.rows.length > 0 ? formatTimeEntry(result.rows[0]) : null;
};

/**
 * Create manual time entry
 */
const createManualEntry = async (userId, entryData) => {
  try {
    const { contractId, description, startTime, endTime, hourlyRate, isBillable } = entryData;

    // Verify contract and get project_id
    const contractResult = await query(
      'SELECT c.id, c.project_id FROM contracts c WHERE c.id = $1 AND c.freelancer_id = $2',
      [contractId, userId]
    );

    if (contractResult.rows.length === 0) {
      throw new Error('Contract not found');
    }

    const contract = contractResult.rows[0];
    const projectId = contract.project_id;

    const result = await query(
      `INSERT INTO time_entries (
        contract_id, freelancer_id, project_id,
        description, start_time, end_time, hourly_rate, is_billable, is_manual
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
      RETURNING *`,
      [contractId, userId, projectId, description, startTime, endTime, hourlyRate || null, isBillable !== false]
    );

    logger.info('Manual time entry created', { timeEntryId: result.rows[0].id });
    return formatTimeEntry(result.rows[0]);
  } catch (error) {
    logger.error('Error creating manual entry', { error: error.message });
    throw error;
  }
};

/**
 * Update time entry
 */
const updateTimeEntry = async (userId, timeEntryId, updates) => {
  try {
    const { description, startTime, endTime, hourlyRate, isBillable } = updates;

    // Check ownership and status
    const checkResult = await query(
      'SELECT status, freelancer_id FROM time_entries WHERE id = $1',
      [timeEntryId]
    );

    if (checkResult.rows.length === 0) throw new Error('Time entry not found');
    if (checkResult.rows[0].freelancer_id !== userId) throw new Error('Unauthorized');
    if (checkResult.rows[0].status === 'approved') {
      throw new Error('Cannot edit approved time entries');
    }

    const result = await query(
      `UPDATE time_entries
       SET description = COALESCE($1, description),
           start_time = COALESCE($2, start_time),
           end_time = COALESCE($3, end_time),
           hourly_rate = COALESCE($4, hourly_rate),
           is_billable = COALESCE($5, is_billable)
       WHERE id = $6
       RETURNING *`,
      [description, startTime, endTime, hourlyRate, isBillable, timeEntryId]
    );

    return formatTimeEntry(result.rows[0]);
  } catch (error) {
    logger.error('Error updating time entry', { error: error.message });
    throw error;
  }
};

/**
 * Delete time entry
 */
const deleteTimeEntry = async (userId, timeEntryId) => {
  try {
    const checkResult = await query(
      'SELECT status, freelancer_id FROM time_entries WHERE id = $1',
      [timeEntryId]
    );

    if (checkResult.rows.length === 0) throw new Error('Time entry not found');
    if (checkResult.rows[0].freelancer_id !== userId) throw new Error('Unauthorized');
    if (checkResult.rows[0].status === 'approved') {
      throw new Error('Cannot delete approved time entries');
    }

    await query('DELETE FROM time_entries WHERE id = $1', [timeEntryId]);
    logger.info('Time entry deleted', { timeEntryId });
    return { success: true };
  } catch (error) {
    logger.error('Error deleting time entry', { error: error.message });
    throw error;
  }
};

/**
 * Get time entries for a contract
 */
const getContractTimeEntries = async (userId, contractId, filters = {}) => {
  const { status, startDate, endDate } = filters;
  
  let queryText = `
    SELECT te.*, p.title as project_title
    FROM time_entries te
    JOIN projects p ON te.project_id = p.id
    WHERE te.contract_id = $1
  `;
  const params = [contractId];
  let paramCount = 1;

  if (status) {
    paramCount++;
    queryText += ` AND te.status = $${paramCount}`;
    params.push(status);
  }

  if (startDate) {
    paramCount++;
    queryText += ` AND te.start_time >= $${paramCount}`;
    params.push(startDate);
  }

  if (endDate) {
    paramCount++;
    queryText += ` AND te.start_time <= $${paramCount}`;
    params.push(endDate);
  }

  queryText += ' ORDER BY te.start_time DESC';

  const result = await query(queryText, params);
  return result.rows.map(formatTimeEntry);
};
  
/**
 * Submit time entries for approval
 */
const submitForApproval = async (userId, timeEntryIds) => {
  try {
    const result = await query(
      `UPDATE time_entries
       SET status = 'submitted'
       WHERE id = ANY($1) AND freelancer_id = $2 AND status = 'draft' AND end_time IS NOT NULL
       RETURNING *`,
      [timeEntryIds, userId]
    );

    logger.info('Time entries submitted', { count: result.rows.length });
    return result.rows.map(formatTimeEntry);
  } catch (error) {
    logger.error('Error submitting time entries', { error: error.message });
    throw error;
  }
};

/**
 * Approve time entry (client only)
 */
const approveTimeEntry = async (clientId, timeEntryId) => {
  try {
    // Verify client owns the contract
    const checkResult = await query(
      `SELECT te.id FROM time_entries te
       JOIN contracts c ON te.contract_id = c.id
       WHERE te.id = $1 AND c.client_id = $2 AND te.status = 'submitted'`,
      [timeEntryId, clientId]
    );

    if (checkResult.rows.length === 0) {
      throw new Error('Time entry not found or not submitted');
    }

    const result = await query(
      `UPDATE time_entries
       SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [clientId, timeEntryId]
    );

    logger.info('Time entry approved', { timeEntryId, clientId });
    return formatTimeEntry(result.rows[0]);
  } catch (error) {
    logger.error('Error approving time entry', { error: error.message });
    throw error;
  }
};

/**
 * Reject time entry (client only)
 */
const rejectTimeEntry = async (clientId, timeEntryId, reason) => {
  try {
    const checkResult = await query(
      `SELECT te.id FROM time_entries te
       JOIN contracts c ON te.contract_id = c.id
       WHERE te.id = $1 AND c.client_id = $2 AND te.status = 'submitted'`,
      [timeEntryId, clientId]
    );

    if (checkResult.rows.length === 0) {
      throw new Error('Time entry not found or not submitted');
    }

    const result = await query(
      `UPDATE time_entries
       SET status = 'rejected', rejection_reason = $1
       WHERE id = $2
       RETURNING *`,
      [reason, timeEntryId]
    );

    logger.info('Time entry rejected', { timeEntryId, clientId });
    return formatTimeEntry(result.rows[0]);
  } catch (error) {
    logger.error('Error rejecting time entry', { error: error.message });
    throw error;
  }
};

/**
 * Get time summary for contract
 */
const getTimeSummary = async (contractId, filters = {}) => {
  const { startDate, endDate } = filters;
  
  let queryText = `
    SELECT 
      COUNT(*) as total_entries,
      SUM(duration_minutes) as total_minutes,
      SUM(CASE WHEN is_billable THEN duration_minutes ELSE 0 END) as billable_minutes,
      SUM(CASE WHEN is_billable THEN total_amount ELSE 0 END) as total_billable_amount,
      SUM(CASE WHEN status = 'approved' THEN total_amount ELSE 0 END) as approved_amount
    FROM time_entries
    WHERE contract_id = $1 AND end_time IS NOT NULL
  `;
  const params = [contractId];
  let paramCount = 1;

  if (startDate) {
    paramCount++;
    queryText += ` AND start_time >= $${paramCount}`;
    params.push(startDate);
  }

  if (endDate) {
    paramCount++;
    queryText += ` AND start_time <= $${paramCount}`;
    params.push(endDate);
  }

  const result = await query(queryText, params);
  const row = result.rows[0];

  return {
    totalEntries: parseInt(row.total_entries) || 0,
    totalHours: parseFloat((row.total_minutes / 60).toFixed(2)) || 0,
    billableHours: parseFloat((row.billable_minutes / 60).toFixed(2)) || 0,
    totalBillableAmount: parseFloat(row.total_billable_amount) || 0,
    approvedAmount: parseFloat(row.approved_amount) || 0
  };
};

const formatTimeEntry = (entry) => ({
  id: entry.id,
  contractId: entry.contract_id,
  freelancerId: entry.freelancer_id,
  projectId: entry.project_id,
  projectTitle: entry.project_title,
  description: entry.description,
  startTime: entry.start_time,
  endTime: entry.end_time,
  durationMinutes: entry.duration_minutes,
  hourlyRate: entry.hourly_rate ? parseFloat(entry.hourly_rate) : null,
  totalAmount: entry.total_amount ? parseFloat(entry.total_amount) : 0,
  isBillable: entry.is_billable,
  isManual: entry.is_manual,
  status: entry.status,
  approvedBy: entry.approved_by,
  approvedAt: entry.approved_at,
  rejectionReason: entry.rejection_reason,
  createdAt: entry.created_at,
  updatedAt: entry.updated_at
});

module.exports = {
  startTimer,
  stopTimer,
  getActiveTimer,
  createManualEntry,
  updateTimeEntry,
  deleteTimeEntry,
  getContractTimeEntries,
  submitForApproval,
  approveTimeEntry,
  rejectTimeEntry,
  getTimeSummary
};
