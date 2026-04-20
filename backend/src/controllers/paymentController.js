const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

const initiatePayment = async (req, res) => {
  try {
    const { contractId, milestoneId, amount, description } = req.body;
    if (!contractId || !amount) {
      return res.status(400).json({ success: false, error: 'contractId and amount are required' });
    }
    const result = await paymentService.initiatePayment(req.user.userId, {
      contractId, milestoneId, amount: parseFloat(amount), description
    });
    res.json({ success: true, payment: result });
  } catch (error) {
    logger.error('initiatePayment error', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const initiateEsewaPayment = async (req, res) => {
  try {
    const { contractId, milestoneId, amount, description } = req.body;
    if (!contractId || !amount) {
      return res.status(400).json({ success: false, error: 'contractId and amount are required' });
    }
    const result = await paymentService.initiateEsewaPayment(req.user.userId, {
      contractId, milestoneId, amount: parseFloat(amount), description
    });
    res.json({ success: true, payment: result });
  } catch (error) {
    logger.error('initiateEsewaPayment error', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const verifyEsewaPayment = async (req, res) => {
  try {
    const { data } = req.query;
    if (!data) {
      return res.status(400).json({ success: false, error: 'Missing data parameter from eSewa' });
    }
    const result = await paymentService.verifyEsewaPayment(data);
    res.json({ success: true, payment: result });
  } catch (error) {
    logger.error('verifyEsewaPayment error', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { pidx, purchase_order_id } = req.query;
    if (!pidx || !purchase_order_id) {
      return res.status(400).json({ success: false, error: 'pidx and purchase_order_id are required' });
    }
    const result = await paymentService.verifyPayment(pidx, purchase_order_id);
    res.json({ success: true, payment: result });
  } catch (error) {
    logger.error('verifyPayment error', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const releaseEscrow = async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { releaseNote } = req.body;
    const result = await paymentService.releaseEscrow(escrowId, req.user.userId, releaseNote);
    res.json({ success: true, escrow: result });
  } catch (error) {
    logger.error('releaseEscrow error', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const refundEscrow = async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { reason } = req.body;
    const result = await paymentService.refundEscrow(escrowId, req.user.userId, reason);
    res.json({ success: true, escrow: result });
  } catch (error) {
    logger.error('refundEscrow error', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const getContractPayments = async (req, res) => {
  try {
    const { contractId } = req.params;
    const result = await paymentService.getContractPayments(contractId, req.user.userId);
    res.json({ success: true, payments: result });
  } catch (error) {
    logger.error('getContractPayments error', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const getContractEscrow = async (req, res) => {
  try {
    const { contractId } = req.params;
    const result = await paymentService.getContractEscrow(contractId, req.user.userId);
    res.json({ success: true, escrow: result });
  } catch (error) {
    logger.error('getContractEscrow error', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = { initiatePayment, verifyPayment, initiateEsewaPayment, verifyEsewaPayment, releaseEscrow, refundEscrow, getContractPayments, getContractEscrow };

// Stripe Payment Controllers
const initiateStripePayment = async (req, res) => {
  try {
    const { contractId, milestoneId, amount, description } = req.body;
    if (!contractId || !amount) {
      return res.status(400).json({ success: false, error: 'contractId and amount are required' });
    }
    const result = await paymentService.initiateStripePayment(req.user.userId, {
      contractId, milestoneId, amount: parseFloat(amount), description
    });
    res.json({ success: true, payment: result });
  } catch (error) {
    logger.error('initiateStripePayment error', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const verifyStripePayment = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ success: false, error: 'Missing session_id parameter from Stripe' });
    }
    const result = await paymentService.verifyStripePayment(session_id);
    res.json({ success: true, payment: result });
  } catch (error) {
    logger.error('verifyStripePayment error', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const handleStripeWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const result = await paymentService.handleStripeWebhook(req.body, sig);
    res.json({ success: true, received: true });
  } catch (error) {
    logger.error('handleStripeWebhook error', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await paymentService.getMyPayments(userId);
    res.json({ success: true, payments: result });
  } catch (error) {
    logger.error('getMyPayments error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports.initiateStripePayment = initiateStripePayment;
module.exports.verifyStripePayment = verifyStripePayment;
module.exports.handleStripeWebhook = handleStripeWebhook;
module.exports.getMyPayments = getMyPayments;
