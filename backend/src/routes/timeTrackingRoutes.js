const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');
const {
  startTimer, stopTimer, getActiveTimer,
  createManualEntry, updateTimeEntry, deleteTimeEntry,
  getContractTimeEntries, submitForApproval,
  approveTimeEntry, rejectTimeEntry, getTimeSummary,
  stopAllActiveTimers
} = require('../controllers/timeTrackingController');

router.use(authMiddleware);

// Timer controls (freelancer only)
router.post('/start', roleMiddleware(['FREELANCER']), startTimer);
router.put('/:id/stop', roleMiddleware(['FREELANCER']), stopTimer);
router.get('/active', roleMiddleware(['FREELANCER']), getActiveTimer);
router.post('/stop-all', roleMiddleware(['FREELANCER']), stopAllActiveTimers); // Debug endpoint

// Time entries CRUD
router.post('/manual', roleMiddleware(['FREELANCER']), createManualEntry);
router.put('/:id', roleMiddleware(['FREELANCER']), updateTimeEntry);
router.delete('/:id', roleMiddleware(['FREELANCER']), deleteTimeEntry);

// Submit for approval
router.post('/submit', roleMiddleware(['FREELANCER']), submitForApproval);

// Approval (client only)
router.put('/:id/approve', roleMiddleware(['CLIENT']), approveTimeEntry);
router.put('/:id/reject', roleMiddleware(['CLIENT']), rejectTimeEntry);

// Read (both roles)
router.get('/contract/:contractId', getContractTimeEntries);
router.get('/contract/:contractId/summary', getTimeSummary);

module.exports = router;
