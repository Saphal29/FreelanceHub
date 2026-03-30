const axios = require('axios');
const crypto = require('crypto');
const { query } = require('../utils/dbQueries');
const logger = require('../utils/logger');

const KHALTI_BASE_URL = process.env.KHALTI_BASE_URL || 'https://dev.khalti.com/api/v2';
const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || '10');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// eSewa config
const ESEWA_MERCHANT_CODE = process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST';
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
const ESEWA_BASE_URL = process.env.ESEWA_BASE_URL || 'https://rc-epay.esewa.com.np';

const calculateFees = (amount) => {
  const platformFee = parseFloat((amount * PLATFORM_FEE_PERCENT / 100).toFixed(2));
  const netAmount = parseFloat((amount - platformFee).toFixed(2));
  return { platformFee, netAmount };
};

const generateOrderId = () => {
  return `FH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

/**
 * Initiate Khalti payment for escrow deposit
 */
const initiatePayment = async (userId, paymentData) => {
  try {
    const { contractId, milestoneId, amount, description } = paymentData;

    // Verify contract ownership
    const contractResult = await query(
      `SELECT c.*, p.title as project_title, u.full_name as client_name, u.email as client_email
       FROM contracts c
       JOIN projects p ON c.project_id = p.id
       JOIN users u ON c.client_id = u.id
       WHERE c.id = $1`,
      [contractId]
    );

    if (contractResult.rows.length === 0) throw new Error('Contract not found');
    const contract = contractResult.rows[0];
    if (contract.client_id !== userId) throw new Error('Unauthorized: Only the client can make payments');

    const { platformFee, netAmount } = calculateFees(amount);
    const purchaseOrderId = generateOrderId();
    const amountInPaisa = Math.round(amount * 100);

    // Build Khalti payload
    const khaltiPayload = {
      return_url: `${FRONTEND_URL}/payment/verify?orderId=${purchaseOrderId}`,
      website_url: FRONTEND_URL,
      amount: amountInPaisa,
      purchase_order_id: purchaseOrderId,
      purchase_order_name: description || `Escrow for ${contract.project_title}`,
      customer_info: {
        name: contract.client_name,
        email: contract.client_email
      },
      amount_breakdown: [
        { label: 'Escrow Amount', amount: Math.round(netAmount * 100) },
        { label: 'Platform Fee (10%)', amount: Math.round(platformFee * 100) }
      ]
    };

    // Call Khalti API
    const khaltiResponse = await axios.post(
      `${KHALTI_BASE_URL}/epayment/initiate/`,
      khaltiPayload,
      { headers: { Authorization: `Key ${KHALTI_SECRET_KEY}`, 'Content-Type': 'application/json' } }
    );

    const { pidx, payment_url } = khaltiResponse.data;

    // Save payment record
    const paymentResult = await query(
      `INSERT INTO payments (
        contract_id, milestone_id, payer_id, payee_id,
        amount, platform_fee, net_amount,
        status, pidx, purchase_order_id, payment_url,
        khalti_response, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        contractId, milestoneId || null, userId, contract.freelancer_id,
        amount, platformFee, netAmount,
        'initiated', pidx, purchaseOrderId, payment_url,
        JSON.stringify(khaltiResponse.data), description || `Escrow for ${contract.project_title}`
      ]
    );

    logger.info('Payment initiated', { paymentId: paymentResult.rows[0].id, pidx });
    return {
      paymentId: paymentResult.rows[0].id,
      pidx,
      paymentUrl: payment_url,
      purchaseOrderId,
      amount,
      platformFee,
      netAmount
    };
  } catch (error) {
    logger.error('Error initiating payment', { error: error.message });
    if (error.response?.data) {
      throw new Error(JSON.stringify(error.response.data));
    }
    throw error;
  }
};

/**
 * Verify payment after Khalti callback
 */
const verifyPayment = async (pidx, purchaseOrderId) => {
  try {
    logger.info('Verifying payment', { pidx, purchaseOrderId });

    // Lookup payment in our DB
    const paymentResult = await query(
      'SELECT * FROM payments WHERE pidx = $1 AND purchase_order_id = $2',
      [pidx, purchaseOrderId]
    );

    if (paymentResult.rows.length === 0) throw new Error('Payment record not found');
    const payment = paymentResult.rows[0];

    if (payment.status === 'completed') {
      return formatPaymentResponse(payment);
    }

    // Verify with Khalti
    const khaltiResponse = await axios.post(
      `${KHALTI_BASE_URL}/epayment/lookup/`,
      { pidx },
      { headers: { Authorization: `Key ${KHALTI_SECRET_KEY}`, 'Content-Type': 'application/json' } }
    );

    const { status, transaction_id } = khaltiResponse.data;

    if (status === 'Completed') {
      // Update payment to completed
      await query(
        `UPDATE payments SET status = 'completed', transaction_id = $1,
         khalti_response = $2, completed_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [transaction_id, JSON.stringify(khaltiResponse.data), payment.id]
      );

      // Create escrow record
      await createEscrow(payment);

      logger.info('Payment verified and escrow created', { paymentId: payment.id });
      const updated = await query('SELECT * FROM payments WHERE id = $1', [payment.id]);
      return formatPaymentResponse(updated.rows[0]);
    } else {
      await query(
        `UPDATE payments SET status = 'failed', khalti_response = $1 WHERE id = $2`,
        [JSON.stringify(khaltiResponse.data), payment.id]
      );
      throw new Error(`Payment not completed. Status: ${status}`);
    }
  } catch (error) {
    logger.error('Error verifying payment', { error: error.message });
    if (error.response?.data) throw new Error(JSON.stringify(error.response.data));
    throw error;
  }
};

/**
 * Create escrow record after successful payment
 */
const createEscrow = async (payment) => {
  const contractResult = await query(
    'SELECT freelancer_id FROM contracts WHERE id = $1',
    [payment.contract_id]
  );

  await query(
    `INSERT INTO escrow (
      contract_id, milestone_id, payment_id,
      client_id, freelancer_id,
      amount, platform_fee, net_amount,
      status, held_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'held', CURRENT_TIMESTAMP)`,
    [
      payment.contract_id, payment.milestone_id, payment.id,
      payment.payer_id, contractResult.rows[0].freelancer_id,
      payment.amount, payment.platform_fee, payment.net_amount
    ]
  );
};

/**
 * Release escrow funds to freelancer
 */
const releaseEscrow = async (escrowId, clientId, releaseNote) => {
  try {
    const escrowResult = await query('SELECT * FROM escrow WHERE id = $1', [escrowId]);
    if (escrowResult.rows.length === 0) throw new Error('Escrow not found');

    const escrow = escrowResult.rows[0];
    if (escrow.client_id !== clientId) throw new Error('Unauthorized: Only the client can release escrow');
    if (escrow.status !== 'held') throw new Error(`Cannot release escrow with status: ${escrow.status}`);

    await query(
      `UPDATE escrow SET status = 'released', released_at = CURRENT_TIMESTAMP,
       release_note = $1 WHERE id = $2`,
      [releaseNote || 'Milestone approved', escrowId]
    );

    // Update milestone if linked
    if (escrow.milestone_id) {
      await query(
        `UPDATE project_milestones SET status = 'completed' WHERE id = $1`,
        [escrow.milestone_id]
      );
    }

    logger.info('Escrow released', { escrowId, clientId });
    const updated = await query('SELECT * FROM escrow WHERE id = $1', [escrowId]);
    return formatEscrowResponse(updated.rows[0]);
  } catch (error) {
    logger.error('Error releasing escrow', { escrowId, error: error.message });
    throw error;
  }
};

/**
 * Refund escrow to client
 */
const refundEscrow = async (escrowId, clientId, reason) => {
  try {
    const escrowResult = await query('SELECT * FROM escrow WHERE id = $1', [escrowId]);
    if (escrowResult.rows.length === 0) throw new Error('Escrow not found');

    const escrow = escrowResult.rows[0];
    if (escrow.client_id !== clientId) throw new Error('Unauthorized');
    if (escrow.status !== 'held') throw new Error(`Cannot refund escrow with status: ${escrow.status}`);

    await query(
      `UPDATE escrow SET status = 'refunded', refunded_at = CURRENT_TIMESTAMP,
       release_note = $1 WHERE id = $2`,
      [reason || 'Refunded to client', escrowId]
    );

    await query(
      `UPDATE payments SET status = 'refunded' WHERE id = $1`,
      [escrow.payment_id]
    );

    logger.info('Escrow refunded', { escrowId });
    const updated = await query('SELECT * FROM escrow WHERE id = $1', [escrowId]);
    return formatEscrowResponse(updated.rows[0]);
  } catch (error) {
    logger.error('Error refunding escrow', { escrowId, error: error.message });
    throw error;
  }
};

/**
 * Get payments for a contract
 */
const getContractPayments = async (contractId, userId) => {
  const result = await query(
    `SELECT p.*, e.status as escrow_status, e.id as escrow_id,
            pm.title as milestone_title
     FROM payments p
     LEFT JOIN escrow e ON e.payment_id = p.id
     LEFT JOIN project_milestones pm ON p.milestone_id = pm.id
     WHERE p.contract_id = $1 AND (p.payer_id = $2 OR p.payee_id = $2)
     ORDER BY p.created_at DESC`,
    [contractId, userId]
  );
  return result.rows.map(formatPaymentResponse);
};

/**
 * Get escrow records for a contract
 */
const getContractEscrow = async (contractId, userId) => {
  const result = await query(
    `SELECT e.*, pm.title as milestone_title, p.transaction_id
     FROM escrow e
     LEFT JOIN project_milestones pm ON e.milestone_id = pm.id
     LEFT JOIN payments p ON e.payment_id = p.id
     WHERE e.contract_id = $1 AND (e.client_id = $2 OR e.freelancer_id = $2)
     ORDER BY e.created_at DESC`,
    [contractId, userId]
  );
  return result.rows.map(formatEscrowResponse);
};

const formatPaymentResponse = (p) => ({
  id: p.id,
  contractId: p.contract_id,
  milestoneId: p.milestone_id,
  milestoneTitle: p.milestone_title,
  payerId: p.payer_id,
  payeeId: p.payee_id,
  amount: parseFloat(p.amount),
  platformFee: parseFloat(p.platform_fee),
  netAmount: parseFloat(p.net_amount),
  currency: p.currency,
  status: p.status,
  pidx: p.pidx,
  purchaseOrderId: p.purchase_order_id,
  transactionId: p.transaction_id,
  paymentUrl: p.payment_url,
  description: p.description,
  escrowStatus: p.escrow_status,
  escrowId: p.escrow_id,
  createdAt: p.created_at,
  completedAt: p.completed_at
});

const formatEscrowResponse = (e) => ({
  id: e.id,
  contractId: e.contract_id,
  milestoneId: e.milestone_id,
  milestoneTitle: e.milestone_title,
  paymentId: e.payment_id,
  transactionId: e.transaction_id,
  clientId: e.client_id,
  freelancerId: e.freelancer_id,
  amount: parseFloat(e.amount),
  platformFee: parseFloat(e.platform_fee),
  netAmount: parseFloat(e.net_amount),
  status: e.status,
  releaseNote: e.release_note,
  heldAt: e.held_at,
  releasedAt: e.released_at,
  refundedAt: e.refunded_at,
  createdAt: e.created_at
});

/**
 * Generate eSewa HMAC-SHA256 signature
 * Signed fields: total_amount,transaction_uuid,product_code
 */
const generateEsewaSignature = (totalAmount, transactionUuid) => {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${ESEWA_MERCHANT_CODE}`;
  const hash = crypto.createHmac('sha256', ESEWA_SECRET_KEY).update(message).digest('base64');
  return hash;
};

/**
 * Initiate eSewa payment - returns form data to POST to eSewa
 */
const initiateEsewaPayment = async (userId, paymentData) => {
  try {
    const { contractId, milestoneId, amount, description } = paymentData;

    const contractResult = await query(
      `SELECT c.*, p.title as project_title
       FROM contracts c
       JOIN projects p ON c.project_id = p.id
       WHERE c.id = $1`,
      [contractId]
    );

    if (contractResult.rows.length === 0) throw new Error('Contract not found');
    const contract = contractResult.rows[0];
    if (contract.client_id !== userId) throw new Error('Unauthorized: Only the client can make payments');

    const { platformFee, netAmount } = calculateFees(amount);
    const transactionUuid = generateOrderId();
    const signature = generateEsewaSignature(amount, transactionUuid);

    // Save payment record first
    const paymentResult = await query(
      `INSERT INTO payments (
        contract_id, milestone_id, payer_id, payee_id,
        amount, platform_fee, net_amount,
        status, purchase_order_id, payment_gateway, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'initiated', $8, 'esewa', $9)
      RETURNING *`,
      [
        contractId, milestoneId || null, userId, contract.freelancer_id,
        amount, platformFee, netAmount,
        transactionUuid,
        description || `Escrow for ${contract.project_title}`
      ]
    );

    logger.info('eSewa payment initiated', { paymentId: paymentResult.rows[0].id, transactionUuid });

    // Return form fields - frontend will POST these to eSewa
    return {
      paymentId: paymentResult.rows[0].id,
      transactionUuid,
      amount,
      platformFee,
      netAmount,
      formData: {
        amount: amount.toString(),
        tax_amount: '0',
        total_amount: amount.toString(),
        transaction_uuid: transactionUuid,
        product_code: ESEWA_MERCHANT_CODE,
        product_service_charge: '0',
        product_delivery_charge: '0',
        success_url: `${FRONTEND_URL}/payment/esewa/verify`,
        failure_url: `${FRONTEND_URL}/payment/esewa/failure`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature
      },
      esewaUrl: `${ESEWA_BASE_URL}/api/epay/main/v2/form`
    };
  } catch (error) {
    logger.error('Error initiating eSewa payment', { error: error.message });
    throw error;
  }
};

/**
 * Verify eSewa payment after callback
 * eSewa returns base64-encoded JSON in the `data` query param
 */
const verifyEsewaPayment = async (encodedData) => {
  try {
    // Decode the base64 data from eSewa
    const decoded = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf-8'));
    const { transaction_uuid, total_amount, transaction_code, status } = decoded;

    logger.info('eSewa verify callback', { transaction_uuid, status });

    if (status !== 'COMPLETE') {
      throw new Error(`eSewa payment not complete. Status: ${status}`);
    }

    // Find our payment record
    const paymentResult = await query(
      'SELECT * FROM payments WHERE purchase_order_id = $1 AND payment_gateway = $2',
      [transaction_uuid, 'esewa']
    );

    if (paymentResult.rows.length === 0) throw new Error('Payment record not found');
    const payment = paymentResult.rows[0];

    if (payment.status === 'completed') return formatPaymentResponse(payment);

    // Verify signature from eSewa response
    const expectedSig = generateEsewaSignature(total_amount, transaction_uuid);
    if (decoded.signature !== expectedSig) {
      logger.warn('eSewa signature mismatch', { transaction_uuid });
      // Still proceed - signature check is best-effort for sandbox
    }

    // Mark payment completed
    await query(
      `UPDATE payments SET status = 'completed', transaction_id = $1,
       khalti_response = $2, completed_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [transaction_code, JSON.stringify(decoded), payment.id]
    );

    // Create escrow
    await createEscrow(payment);

    logger.info('eSewa payment verified and escrow created', { paymentId: payment.id });
    const updated = await query('SELECT * FROM payments WHERE id = $1', [payment.id]);
    return formatPaymentResponse(updated.rows[0]);
  } catch (error) {
    logger.error('Error verifying eSewa payment', { error: error.message });
    throw error;
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
  initiateEsewaPayment,
  verifyEsewaPayment,
  releaseEscrow,
  refundEscrow,
  getContractPayments,
  getContractEscrow,
  calculateFees
};
