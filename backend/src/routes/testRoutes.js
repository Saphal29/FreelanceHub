const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// Test email endpoint (only for development)
router.post('/test-email', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const { type, email, name } = req.body;

    let result;
    switch (type) {
      case 'verification':
        result = await emailService.sendVerificationEmail(email, name, 'test-token-123');
        break;
      case 'reset':
        result = await emailService.sendPasswordResetEmail(email, name, 'test-reset-token-123');
        break;
      case 'welcome':
        result = await emailService.sendWelcomeEmail(email, name, 'FREELANCER');
        break;
      case 'notification':
        result = await emailService.sendNotificationEmail(
          email, 
          name, 
          'Test Notification', 
          'This is a test notification message.'
        );
        break;
      default:
        return res.status(400).json({ error: 'Invalid email type' });
    }

    res.json({
      success: true,
      message: 'Test email sent',
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test email connection
router.get('/test-email-connection', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const isConnected = await emailService.verifyConnection();
    res.json({
      success: true,
      connected: isConnected,
      message: isConnected ? 'Email service is working' : 'Email service connection failed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;