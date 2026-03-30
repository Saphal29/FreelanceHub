const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// IMPORTANT: Specific routes MUST come before parameterized routes
// Workspace routes (must come before /:contractId)
router.get('/workspace', contractController.getFreelancerWorkspace);
router.get('/workspace/:projectId', contractController.getProjectWorkspace);

// Contract routes (parameterized routes come last)
router.get('/', contractController.getUserContracts);
router.post('/:contractId/sign', contractController.signContract);
router.get('/:contractId', contractController.getContractById); // This must be last

module.exports = router;
