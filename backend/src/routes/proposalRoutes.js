const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Submit a proposal (freelancers only)
router.post('/', 
  roleMiddleware(['FREELANCER']), 
  proposalController.submitProposal
);

// Get freelancer's proposals
router.get('/my-proposals', 
  roleMiddleware(['FREELANCER']), 
  proposalController.getMyProposals
);

// Get proposals for a project (clients only)
router.get('/project/:projectId', 
  roleMiddleware(['CLIENT']), 
  proposalController.getProjectProposals
);

// Get proposal by ID
router.get('/:id', 
  proposalController.getProposalById
);

// Accept proposal (clients only)
router.put('/:id/accept', 
  roleMiddleware(['CLIENT']), 
  proposalController.acceptProposal
);

// Reject proposal (clients only)
router.put('/:id/reject', 
  roleMiddleware(['CLIENT']), 
  proposalController.rejectProposal
);

// Withdraw proposal (freelancers only)
router.put('/:id/withdraw', 
  roleMiddleware(['FREELANCER']), 
  proposalController.withdrawProposal
);

module.exports = router;
