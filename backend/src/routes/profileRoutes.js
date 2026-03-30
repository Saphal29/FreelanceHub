const express = require('express');
const router = express.Router();
const { getFreelancerProfile, searchFreelancers } = require('../controllers/profileController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Search freelancers
router.get('/search/freelancers', authMiddleware, searchFreelancers);

// Get freelancer public profile
router.get('/:userId', authMiddleware, getFreelancerProfile);

module.exports = router;
