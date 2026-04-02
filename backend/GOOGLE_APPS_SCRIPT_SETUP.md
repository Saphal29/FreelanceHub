# Google Apps Script Email Setup Guide

This guide will help you set up Google Apps Script to handle email sending for your FreelanceHub application, bypassing Render's free tier email port restrictions.

## Why Google Apps Script?

Render's free tier blocks SMTP ports (25, 465, 587), preventing direct email sending. Google Apps Script provides a free alternative that:
- Works via HTTPS (port 443) - not blocked by Render
- Uses your Gmail account to send emails
- Has a generous free quota (100 emails/day for personal Gmail, 1500/day for Google Workspace)
- Requires no additional infrastructure

## Step-by-Step Setup

### 1. Create Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click **"New Project"**
3. Name your project (e.g., "FreelanceHub Email Service")

### 2. Add the Script Code

1. Delete any existing code in the editor
2. Copy the entire contents of `backend/google-apps-script/Code.gs`
3. Paste it into the script editor
4. Click **Save** (💾 icon or Ctrl+S)

### 3. Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure the deployment:
   - **Description**: "FreelanceHub Email API v1"
   - **Execute as**: **Me** (your Gmail account)
   - **Who has access**: **Anyone** (this is safe - your backend validates requests)
5. Click **Deploy**
6. **Important**: You'll be asked to authorize the script:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** → **Go to [Project Name] (unsafe)**
   - Click **Allow**
7. Copy the **Web app URL** (looks like: `https://script.google.com/macros/s/XXXXX/exec`)

### 4. Configure Your Backend

1. Open your `backend/.env` file
2. Update the email configuration:

```env
# Email Configuration - Google Apps Script
EMAIL_SERVICE=google-script
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec
EMAIL_FROM_NAME="FreelanceHub Pro"
EMAIL_FROM_ADDRESS=your-email@gmail.com
```

Replace:
- `YOUR_SCRIPT_ID_HERE` with your actual script deployment URL
- `your-email@gmail.com` with your Gmail address

### 5. Test the Setup

1. Restart your backend server:
```bash
cd backend
npm start
```

2. Test email sending by registering a new user or requesting a password reset
3. Check the backend logs for:
   - ✅ Email service initialized with Google Apps Script
   - ✅ Email sent via Google Apps Script to [email]

### 6. Deploy to Render

1. Update your Render environment variables:
   - Go to your Render dashboard
   - Select your backend service
   - Go to **Environment** tab
   - Add/Update these variables:
     ```
     EMAIL_SERVICE=google-script
     GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
     EMAIL_FROM_NAME=FreelanceHub Pro
     EMAIL_FROM_ADDRESS=your-email@gmail.com
     ```
   - Click **Save Changes**

2. Render will automatically redeploy with the new configuration

## Troubleshooting

### Issue: "Authorization required" error

**Solution**: Make sure you completed the authorization step when deploying. Redeploy and authorize again if needed.

### Issue: Emails not sending

**Solution**: 
1. Check the Google Apps Script logs:
   - Open your script project
   - Click **Executions** (⚡ icon on left sidebar)
   - Look for errors
2. Verify your deployment URL is correct in `.env`
3. Check backend logs for error messages

### Issue: "Daily email quota exceeded"

**Solution**: 
- Personal Gmail: 100 emails/day limit
- Google Workspace: 1500 emails/day limit
- Consider upgrading to Google Workspace or implementing email queuing

### Issue: Emails going to spam

**Solution**:
1. Use a professional email address in `EMAIL_FROM_ADDRESS`
2. Consider setting up SPF/DKIM records for your domain
3. For production, consider using a dedicated email service (SendGrid, Mailgun)

## Testing the Script Directly

You can test the script in the Google Apps Script editor:

1. Open your script project
2. Find the `testEmail()` function
3. Update the `to` email address to your email
4. Click **Run** → Select `testEmail`
5. Check your email inbox

## Email Quotas

| Account Type | Daily Limit |
|-------------|-------------|
| Personal Gmail | 100 emails |
| Google Workspace | 1,500 emails |

## Security Notes

1. **The script runs as YOU**: Emails will be sent from your Gmail account
2. **Anyone can call the endpoint**: But they can only send emails, not access your account
3. **No authentication required**: The endpoint is public (this is by design for simplicity)
4. **Rate limiting**: Consider adding rate limiting in your backend to prevent abuse

## Alternative: Traditional SMTP (if ports are available)

If you're not on Render free tier or have access to SMTP ports, you can use traditional email:

```env
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME="FreelanceHub Pro"
EMAIL_FROM_ADDRESS=your-email@gmail.com
```

**Note**: For Gmail, you need to create an [App Password](https://support.google.com/accounts/answer/185833).

## Production Recommendations

For production applications, consider:

1. **SendGrid** (12,000 free emails/month)
2. **Mailgun** (5,000 free emails/month)
3. **AWS SES** (62,000 free emails/month with EC2)
4. **Postmark** (100 free emails/month, excellent deliverability)

These services provide better deliverability, analytics, and scalability.

## Support

If you encounter issues:
1. Check the backend logs
2. Check Google Apps Script execution logs
3. Verify all environment variables are set correctly
4. Ensure your Google account has email sending permissions
