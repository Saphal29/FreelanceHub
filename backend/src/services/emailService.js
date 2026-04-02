const nodemailer = require('nodemailer');
const axios = require('axios');
const config = require('../config/environment');

class EmailService {
  constructor() {
    this.transporter = null;
    this.useGoogleScript = config.email.service.toLowerCase() === 'google-script';
    this.googleScriptUrl = config.email.googleScriptUrl;
    
    if (!this.useGoogleScript) {
      this.initializeTransporter();
    } else {
      console.log('✅ Email service initialized with Google Apps Script');
    }
  }

  // Initialize email transporter
  initializeTransporter() {
    try {
      let transporterConfig = {};

      // Configure based on email service
      switch (config.email.service.toLowerCase()) {
        case 'sendgrid':
          transporterConfig = {
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: {
              user: 'apikey',
              pass: config.email.password,
            },
          };
          break;

        case 'mailgun':
          transporterConfig = {
            host: 'smtp.mailgun.org',
            port: 587,
            secure: false,
            auth: {
              user: config.email.user,
              pass: config.email.password,
            },
          };
          break;

        case 'ses':
          transporterConfig = {
            host: config.email.host,
            port: config.email.port,
            secure: config.email.secure,
            auth: {
              user: config.email.user,
              pass: config.email.password,
            },
          };
          break;

        case 'gmail':
        case 'hotmail':
        case 'outlook':
          transporterConfig = {
            service: config.email.service,
            auth: {
              user: config.email.user,
              pass: config.email.password,
            },
          };
          break;

        default:
          // Custom SMTP configuration
          transporterConfig = {
            host: config.email.host,
            port: config.email.port,
            secure: config.email.secure,
            auth: {
              user: config.email.user,
              pass: config.email.password,
            },
            tls: {
              rejectUnauthorized: false
            }
          };
      }

      this.transporter = nodemailer.createTransport(transporterConfig);
      console.log(`✅ Email transporter initialized successfully (${config.email.service})`);
    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error.message);
    }
  }

  // Send email via Google Apps Script
  async sendViaGoogleScript(mailOptions) {
    try {
      if (!this.googleScriptUrl) {
        throw new Error('Google Apps Script URL not configured');
      }

      const payload = {
        to: mailOptions.to,
        subject: mailOptions.subject,
        htmlBody: mailOptions.html,
        textBody: mailOptions.text,
        from: mailOptions.from.address || config.email.fromAddress,
        fromName: mailOptions.from.name || config.email.fromName
      };

      const response = await axios.post(this.googleScriptUrl, payload, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        console.log(`✅ Email sent via Google Apps Script to ${mailOptions.to}`);
        return { success: true, messageId: response.data.messageId };
      } else {
        throw new Error(response.data.error || 'Unknown error from Google Apps Script');
      }
    } catch (error) {
      console.error(`❌ Failed to send email via Google Apps Script:`, error.message);
      throw error;
    }
  }

  // Verify email configuration
  async verifyConnection() {
    try {
      if (this.useGoogleScript) {
        // Test Google Apps Script connection
        if (!this.googleScriptUrl) {
          throw new Error('Google Apps Script URL not configured');
        }
        console.log('✅ Google Apps Script URL configured');
        return true;
      }

      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      await this.transporter.verify();
      console.log('✅ Email server connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error.message);
      return false;
    }
  }

  // Send email verification
  async sendVerificationEmail(userEmail, userName, verificationToken) {
    try {
      const verificationUrl = `${config.urls.frontend}/verify-email?token=${verificationToken}`;
      
      const mailOptions = {
        from: {
          name: config.email.fromName,
          address: config.email.fromAddress
        },
        to: userEmail,
        subject: 'Verify Your FreelanceHub Account',
        html: this.getVerificationEmailTemplate(userName, verificationUrl),
        text: this.getVerificationEmailText(userName, verificationUrl)
      };

      if (this.useGoogleScript) {
        return await this.sendViaGoogleScript(mailOptions);
      }

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${userEmail}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Failed to send verification email to ${userEmail}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail, userName, resetToken) {
    try {
      const resetUrl = `${config.urls.frontend}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: {
          name: config.email.fromName,
          address: config.email.fromAddress
        },
        to: userEmail,
        subject: 'Reset Your FreelanceHub Password',
        html: this.getPasswordResetEmailTemplate(userName, resetUrl),
        text: this.getPasswordResetEmailText(userName, resetUrl)
      };

      if (this.useGoogleScript) {
        return await this.sendViaGoogleScript(mailOptions);
      }

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${userEmail}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Failed to send password reset email to ${userEmail}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Send welcome email
  async sendWelcomeEmail(userEmail, userName, userRole) {
    try {
      const mailOptions = {
        from: {
          name: config.email.fromName,
          address: config.email.fromAddress
        },
        to: userEmail,
        subject: 'Welcome to FreelanceHub!',
        html: this.getWelcomeEmailTemplate(userName, userRole),
        text: this.getWelcomeEmailText(userName, userRole)
      };

      if (this.useGoogleScript) {
        return await this.sendViaGoogleScript(mailOptions);
      }

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${userEmail}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Failed to send welcome email to ${userEmail}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Send notification email (for client-freelancer communication)
  async sendNotificationEmail(userEmail, userName, subject, message, actionUrl = null) {
    try {
      const mailOptions = {
        from: {
          name: config.email.fromName,
          address: config.email.fromAddress
        },
        to: userEmail,
        subject: subject,
        html: this.getNotificationEmailTemplate(userName, subject, message, actionUrl),
        text: this.getNotificationEmailText(userName, subject, message, actionUrl)
      };

      if (this.useGoogleScript) {
        return await this.sendViaGoogleScript(mailOptions);
      }

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Notification email sent to ${userEmail}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Failed to send notification email to ${userEmail}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Email Templates
  getVerificationEmailTemplate(userName, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Account</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FreelanceHub</h1>
            <h2>Verify Your Account</h2>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>Thank you for joining FreelanceHub! To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify My Account</a>
            </p>
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
            <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account with FreelanceHub, please ignore this email.</p>
            <p>Best regards,<br>The FreelanceHub Team</p>
          </div>
          <div class="footer">
            <p>© 2024 FreelanceHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getVerificationEmailText(userName, verificationUrl) {
    return `
Hello ${userName},

Thank you for joining FreelanceHub! To complete your registration and start using your account, please verify your email address by visiting this link:

${verificationUrl}

This verification link will expire in 24 hours for security reasons.

If you didn't create an account with FreelanceHub, please ignore this email.

Best regards,
The FreelanceHub Team

© 2024 FreelanceHub. All rights reserved.
    `;
  }

  getPasswordResetEmailTemplate(userName, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FreelanceHub</h1>
            <h2>Password Reset Request</h2>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>We received a request to reset your password for your FreelanceHub account. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset My Password</a>
            </p>
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${resetUrl}</p>
            <p><strong>Important:</strong> This password reset link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            <p>Best regards,<br>The FreelanceHub Team</p>
          </div>
          <div class="footer">
            <p>© 2024 FreelanceHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetEmailText(userName, resetUrl) {
    return `
Hello ${userName},

We received a request to reset your password for your FreelanceHub account. Visit this link to create a new password:

${resetUrl}

This password reset link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The FreelanceHub Team

© 2024 FreelanceHub. All rights reserved.
    `;
  }

  getWelcomeEmailTemplate(userName, userRole) {
    const roleMessage = userRole === 'FREELANCER' 
      ? 'Start showcasing your skills and connecting with amazing clients!'
      : 'Start finding talented freelancers for your projects!';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to FreelanceHub</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to FreelanceHub!</h1>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>Welcome to FreelanceHub! Your account has been successfully verified and you're now part of our growing community.</p>
            <p>${roleMessage}</p>
            <p style="text-align: center;">
              <a href="${config.urls.frontend}/dashboard" class="button">Go to Dashboard</a>
            </p>
            <p>Here's what you can do next:</p>
            <ul>
              <li>Complete your profile to stand out</li>
              <li>Browse available opportunities</li>
              <li>Connect with other professionals</li>
              <li>Start building your reputation</li>
            </ul>
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>Best regards,<br>The FreelanceHub Team</p>
          </div>
          <div class="footer">
            <p>© 2024 FreelanceHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getWelcomeEmailText(userName, userRole) {
    const roleMessage = userRole === 'FREELANCER' 
      ? 'Start showcasing your skills and connecting with amazing clients!'
      : 'Start finding talented freelancers for your projects!';

    return `
Hello ${userName},

Welcome to FreelanceHub! Your account has been successfully verified and you're now part of our growing community.

${roleMessage}

Visit your dashboard: ${config.urls.frontend}/dashboard

Here's what you can do next:
- Complete your profile to stand out
- Browse available opportunities
- Connect with other professionals
- Start building your reputation

If you have any questions, feel free to contact our support team.

Best regards,
The FreelanceHub Team

© 2024 FreelanceHub. All rights reserved.
    `;
  }

  getNotificationEmailTemplate(userName, subject, message, actionUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FreelanceHub</h1>
            <h2>${subject}</h2>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>${message}</p>
            ${actionUrl ? `<p style="text-align: center;"><a href="${actionUrl}" class="button">View Details</a></p>` : ''}
            <p>Best regards,<br>The FreelanceHub Team</p>
          </div>
          <div class="footer">
            <p>© 2024 FreelanceHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getNotificationEmailText(userName, subject, message, actionUrl) {
    return `
Hello ${userName},

${message}

${actionUrl ? `View details: ${actionUrl}` : ''}

Best regards,
The FreelanceHub Team

© 2024 FreelanceHub. All rights reserved.
    `;
  }
}

// Create and export singleton instance
const emailService = new EmailService();
module.exports = emailService;