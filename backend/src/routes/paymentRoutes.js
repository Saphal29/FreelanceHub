const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');
const {
  initiatePayment,
  verifyPayment,
  initiateEsewaPayment,
  verifyEsewaPayment,
  releaseEscrow,
  refundEscrow,
  getContractPayments,
  getContractEscrow
} = require('../controllers/paymentController');

// All routes require auth
router.use(authMiddleware);

// Khalti
router.post('/initiate', roleMiddleware(['CLIENT']), initiatePayment);
router.get('/verify', verifyPayment);

// eSewa
router.post('/esewa/initiate', roleMiddleware(['CLIENT']), initiateEsewaPayment);
router.get('/esewa/verify', verifyEsewaPayment);

// Get payments for a contract
router.get('/contract/:contractId', getContractPayments);

// Get escrow for a contract
router.get('/escrow/contract/:contractId', getContractEscrow);

// Release escrow (client only)
router.post('/escrow/:escrowId/release', roleMiddleware(['CLIENT']), releaseEscrow);

// Refund escrow (client only)
router.post('/escrow/:escrowId/refund', roleMiddleware(['CLIENT']), refundEscrow);

module.exports = router;
