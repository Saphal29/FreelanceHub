# OTP Email Verification System

## Overview
Replaced the "Verify my account" button email verification with a secure 6-digit OTP system.

## Changes Made

### Backend Changes

1. **Database Migration** (`backend/migrations/018_add_otp_verification.sql`)
   - Added `verification_otp` column (6-digit code)
   - Added `otp_expires_at` column (10-minute expiration)
   - Added `otp_attempts` column (max 5 attempts)
   - Added index for faster OTP lookups

2. **Auth Service** (`backend/src/services/authService.js`)
   - Added `generateOTP()` function - generates random 6-digit code
   - Updated `createUser()` - now generates OTP instead of verification token
   - Added `verifyEmailWithOTP()` - verifies email using OTP with:
     - Expiration check (10 minutes)
     - Attempt limiting (max 5 attempts)
     - Automatic attempt counter increment on failure
   - Added `resendOTP()` - generates and sends new OTP
   - Kept legacy `verifyEmail()` for backward compatibility

3. **Email Service** (`backend/src/services/emailService.js`)
   - Added `sendOTPEmail()` function
   - Added `getOTPEmailTemplate()` - HTML email template with:
     - Large, centered OTP display
     - 10-minute expiration notice
     - Security warnings
     - Professional styling
   - Added `getOTPEmailText()` - plain text version

4. **Auth Controller** (`backend/src/controllers/authController.js`)
   - Added `verifyEmailWithOTP()` endpoint handler
   - Added `resendOTP()` endpoint handler
   - Updated `register()` to return `requiresOTP: true`

5. **Auth Routes** (`backend/src/routes/authRoutes.js`)
   - Added `POST /api/auth/verify-otp` - verify OTP
   - Added `POST /api/auth/resend-otp` - resend OTP
   - Kept `GET /api/auth/verify-email` for legacy support

### Frontend Changes

1. **OTP Verification Page** (`frontend/app/(auth)/verify-otp/page.jsx`)
   - 6-digit OTP input with individual boxes
   - Auto-focus next input on digit entry
   - Paste support for full OTP
   - Backspace navigation
   - Real-time validation
   - Resend OTP with 60-second countdown
   - Attempt counter display
   - Success/error messaging
   - Responsive design

2. **Register Page** (`frontend/app/(auth)/register/page.jsx`)
   - Updated to redirect to `/verify-otp?email=...` after registration
   - Changed redirect timing to 1.5 seconds

## Features

### Security Features
- **Time-Limited OTPs**: Expires after 10 minutes
- **Attempt Limiting**: Maximum 5 attempts per OTP
- **Rate Limiting**: API endpoints protected by rate limiters
- **Auto-Reset**: Failed attempts reset when new OTP is requested

### User Experience
- **Auto-Focus**: Automatically moves to next input
- **Paste Support**: Can paste full 6-digit code
- **Countdown Timer**: Shows when resend is available (60s)
- **Clear Feedback**: Shows remaining attempts on failure
- **Professional Email**: Well-designed OTP email template

### Email Template Features
- Large, easy-to-read OTP display
- Clear expiration notice
- Security warnings
- Professional branding
- Mobile-responsive design

## API Endpoints

### POST /api/auth/verify-otp
Verify email using OTP

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Email verified successfully! You can now login.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "FREELANCER",
    "verified": true
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Incorrect OTP. 3 attempts remaining.",
  "code": "INVALID_OTP",
  "attemptsRemaining": 3
}
```

### POST /api/auth/resend-otp
Resend OTP to user email

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully. Please check your email."
}
```

## User Flow

1. User registers on `/register`
2. System generates 6-digit OTP
3. OTP email sent to user
4. User redirected to `/verify-otp?email=...`
5. User enters 6-digit OTP
6. System validates OTP (checks expiration and attempts)
7. On success: User verified and redirected to login
8. On failure: Error shown with remaining attempts
9. User can request new OTP after 60 seconds

## Testing

To test the OTP system:

1. Register a new user
2. Check email for 6-digit OTP
3. Enter OTP on verification page
4. Test resend functionality
5. Test expiration (wait 10 minutes)
6. Test attempt limiting (enter wrong OTP 5 times)

## Migration Status

✅ Migration `018_add_otp_verification.sql` completed successfully
- OTP columns added to users table
- Index created for performance
- Existing users unaffected (columns nullable)

## Backward Compatibility

The legacy token-based verification (`/api/auth/verify-email?token=...`) still works for any existing verification emails that were sent before this update.

## Next Steps

1. Test OTP system thoroughly
2. Monitor email delivery
3. Adjust OTP expiration time if needed (currently 10 minutes)
4. Consider adding SMS OTP as alternative
5. Add OTP verification analytics
