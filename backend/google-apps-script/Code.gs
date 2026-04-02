/**
 * Google Apps Script for Email Sending
 * This script bypasses SMTP port restrictions on Render free tier
 * 
 * Setup Instructions:
 * 1. Go to https://script.google.com
 * 2. Create a new project
 * 3. Copy this code into Code.gs
 * 4. Deploy as Web App
 * 5. Copy the deployment URL to your .env file
 */

function doPost(e) {
  try {
    // Parse the incoming request
    const data = JSON.parse(e.postData.contents);
    
    // Validate required fields
    if (!data.to || !data.subject) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Missing required fields: to, subject'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Prepare email options
    const emailOptions = {
      to: data.to,
      subject: data.subject,
      name: data.fromName || 'FreelanceHub Pro'
    };
    
    // Add HTML body if provided
    if (data.htmlBody) {
      emailOptions.htmlBody = data.htmlBody;
    }
    
    // Add plain text body if provided (fallback)
    if (data.textBody && !data.htmlBody) {
      emailOptions.body = data.textBody;
    }
    
    // Send the email
    GmailApp.sendEmail(
      emailOptions.to,
      emailOptions.subject,
      emailOptions.body || '', // Plain text fallback
      emailOptions
    );
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      messageId: Utilities.getUuid(),
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Return error response
    Logger.log('Error sending email: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function (optional - for testing in the script editor)
function testEmail() {
  const testData = {
    to: 'test@example.com',
    subject: 'Test Email from FreelanceHub',
    htmlBody: '<h1>Hello!</h1><p>This is a test email.</p>',
    textBody: 'Hello! This is a test email.',
    fromName: 'FreelanceHub Pro'
  };
  
  const result = doPost({
    postData: {
      contents: JSON.stringify(testData)
    }
  });
  
  Logger.log(result.getContent());
}
