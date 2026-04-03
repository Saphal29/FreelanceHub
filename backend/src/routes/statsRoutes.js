const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// Public stats endpoint (no authentication required)
router.get('/public', statsController.getPublicStats);

module.exports = router;
