const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
} = require('../controllers/callController');

router.use(authMiddleware);

router.post('/', createRoom);
router.get('/:roomId', getRoom);
router.post('/:roomId/join', joinRoom);
router.post('/:roomId/leave', leaveRoom);

module.exports = router;
