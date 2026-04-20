const express = require('express');
const router = express.Router();
const { getPlatformStats } = require('../controllers/statsController');

// Get platform statistics (public endpoint)
router.get('/platform', getPlatformStats);
router.get('/public', getPlatformStats); // Alias for frontend compatibility

module.exports = router;
