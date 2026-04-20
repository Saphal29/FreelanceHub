const timeTrackingService = require('../services/timeTrackingService');
const logger = require('../utils/logger');

const startTimer = async (req, res) => {
  try {
    const result = await timeTrackingService.startTimer(req.user.userId, req.body);
    res.json({ success: true, timeEntry: result });
  } catch (error) {
    logger.error('startTimer error', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const stopTimer = async (req, res) => {
  try {
    const result = await timeTrackingService.stopTimer(req.user.userId, req.params.id);
    res.json({ success: true, timeEntry: result });
  } catch (error) {
    logger.error('stopTimer error', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const getActiveTimer = async (req, res) => {
  try {
    const result = await timeTrackingService.getActiveTimer(req.user.userId);
    res.json({ success: true, activeTimer: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const createManualEntry = async (req, res) => {
  try {
    const result = await timeTrackingService.createManualEntry(req.user.userId, req.body);
    res.json({ success: true, timeEntry: result });
  } catch (error) {
    logger.error('createManualEntry error', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const updateTimeEntry = async (req, res) => {
  try {
    const result = await timeTrackingService.updateTimeEntry(req.user.userId, req.params.id, req.body);
    res.json({ success: true, timeEntry: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const deleteTimeEntry = async (req, res) => {
  try {
    await timeTrackingService.deleteTimeEntry(req.user.userId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getContractTimeEntries = async (req, res) => {
  try {
    const result = await timeTrackingService.getContractTimeEntries(
      req.user.userId, req.params.contractId, req.query
    );
    res.json({ success: true, timeEntries: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const submitForApproval = async (req, res) => {
  try {
    const { timeEntryIds } = req.body;
    if (!timeEntryIds?.length) {
      return res.status(400).json({ success: false, error: 'timeEntryIds required' });
    }
    const result = await timeTrackingService.submitForApproval(req.user.userId, timeEntryIds);
    res.json({ success: true, timeEntries: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const approveTimeEntry = async (req, res) => {
  try {
    const result = await timeTrackingService.approveTimeEntry(req.user.userId, req.params.id);
    res.json({ success: true, timeEntry: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const rejectTimeEntry = async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await timeTrackingService.rejectTimeEntry(req.user.userId, req.params.id, reason);
    res.json({ success: true, timeEntry: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getTimeSummary = async (req, res) => {
  try {
    const result = await timeTrackingService.getTimeSummary(req.params.contractId, req.query);
    res.json({ success: true, summary: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Debug endpoint to stop all active timers for current user
const stopAllActiveTimers = async (req, res) => {
  try {
    const { query } = require('../utils/dbQueries');
    const userId = req.user.userId;
    
    const result = await query(
      `UPDATE time_entries
       SET end_time = CURRENT_TIMESTAMP
       WHERE freelancer_id = $1 AND end_time IS NULL AND is_manual = FALSE
       RETURNING id, description, start_time`,
      [userId]
    );
    
    logger.info('Stopped all active timers', { userId, count: result.rows.length });
    res.json({ 
      success: true, 
      message: `Stopped ${result.rows.length} active timer(s)`,
      stoppedTimers: result.rows 
    });
  } catch (error) {
    logger.error('stopAllActiveTimers error', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  startTimer, stopTimer, getActiveTimer,
  createManualEntry, updateTimeEntry, deleteTimeEntry,
  getContractTimeEntries, submitForApproval,
  approveTimeEntry, rejectTimeEntry, getTimeSummary,
  stopAllActiveTimers
};
