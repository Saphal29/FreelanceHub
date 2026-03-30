const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const {
  initiateCall,
  endCall,
  getCall,
  getCallHistory,
  scheduleCall,
  getScheduledCalls,
  joinMeeting,
  cancelScheduledCall,
} = require('../controllers/callController');

router.use(authMiddleware);

// Scheduled / history routes must come before /:callId to avoid param conflicts
router.get('/history', getCallHistory);
router.get('/scheduled', getScheduledCalls);
router.get('/join/:meetingId', joinMeeting);
router.post('/schedule', scheduleCall);
router.delete('/scheduled/:meetingId', cancelScheduledCall);

// 1-to-1 call routes
router.post('/initiate', initiateCall);
router.post('/:callId/end', endCall);
router.get('/:callId', getCall);

module.exports = router;
