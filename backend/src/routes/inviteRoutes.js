const express = require('express');
const router = express.Router();
const inviteController = require('../controllers/inviteController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Send invitation to freelancer
router.post('/send', authMiddleware, inviteController.sendInvitation);

// Get client's projects for invitation
router.get('/my-projects', authMiddleware, inviteController.getClientProjectsForInvite);

module.exports = router;
