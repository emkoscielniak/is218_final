# Email Verification Setup Guide

## Overview

PetWell now includes email verification for user registration. Users receive a verification email with a link to confirm their email address before they can fully access the application.

## Features Implemented

✅ **Email Verification Flow**
- Users receive verification email upon registration
- 24-hour expiration on verification tokens
- Verification page with success/error states
- Resend verification email functionality

✅ **Database Schema**
- `is_verified` - Boolean flag for email verification status
- `verification_token` - UUID token for verification
- `verification_token_expires` - Timestamp for token expiration

✅ **API Endpoints**
- `POST /api/verify-email?token={token}` - Verify email with token
- `POST /api/resend-verification` - Resend verification email

✅ **User Interface**
- `/verify-email` - Email verification page with automatic verification
- Animated loading, success, and error states
- "Resend Verification" button on error

## Email Configuration (Optional)

Email verification is **optional**. The application will work without email configuration, but verification emails won't be sent.

### For Gmail Users

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. Add to your `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_16_char_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
SMTP_FROM_NAME=PetWell
BASE_URL=http://localhost:8000
```

### For Other Email Providers

Update the SMTP settings according to your provider:

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

**Yahoo:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

**Custom SMTP:**
```env
SMTP_HOST=your.smtp.server.com
SMTP_PORT=587  # or 465 for SSL
```

## How It Works

### 1. User Registration
```python
# User registers with email
POST /users/register
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### 2. Verification Email Sent
- System generates a unique verification token
- Token expires in 24 hours
- Email sent with verification link: `{BASE_URL}/verify-email?token={token}`

### 3. User Clicks Link
- Redirected to `/verify-email` page
- Page automatically calls `/api/verify-email?token={token}`
- Success: User can log in
- Expired/Invalid: Option to resend verification email

### 4. Verification Complete
- `is_verified` set to `true`
- `verification_token` cleared
- User can now log in normally

## Database Migration

The following columns were added to the `users` table:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP;
```

All existing users have `is_verified = FALSE` by default. You may want to manually verify existing users:

```sql
UPDATE users SET is_verified = TRUE WHERE created_at < NOW();
```

## Testing Email Verification

### Without Email Configuration
1. Register a new user
2. Check logs: "Email not configured. Skipping email send."
3. User registered successfully but `is_verified = FALSE`

### With Email Configuration
1. Register a new user
2. Check email inbox for verification email
3. Click verification link
4. See success message
5. Log in normally

### Manual Verification (for testing)
```sql
-- Get user's verification token
SELECT verification_token FROM users WHERE email = 'test@example.com';

-- Or manually verify user
UPDATE users SET is_verified = TRUE WHERE email = 'test@example.com';
```

## Security Considerations

- ✅ Tokens expire after 24 hours
- ✅ Tokens are UUIDs (not sequential or predictable)
- ✅ One-time use tokens (cleared after verification)
- ✅ Email enumeration protection (generic success messages)
- ✅ SMTP over TLS (port 587)

## Troubleshooting

### "ModuleNotFoundError: No module named 'aiosmtplib'"
```bash
pip install aiosmtplib==3.0.2
```

### "Failed to send verification email"
- Check SMTP credentials in `.env`
- Verify SMTP_HOST and SMTP_PORT are correct
- For Gmail, ensure you're using an App Password (not account password)
- Check firewall isn't blocking port 587

### "Verification token has expired"
- Tokens expire after 24 hours
- User can click "Resend Verification" button
- Or register again with same email (will update token)

### Email not arriving
- Check spam folder
- Verify SMTP_FROM_EMAIL is valid
- Check email service logs
- Test SMTP connection: `telnet smtp.gmail.com 587`

## API Documentation

### Verify Email
```
POST /api/verify-email?token={token}

Response (Success):
{
  "success": true,
  "message": "Email verified successfully! You can now log in.",
  "already_verified": false
}

Response (Already Verified):
{
  "success": true,
  "message": "Email already verified",
  "already_verified": true
}

Response (Error):
{
  "detail": "Verification token has expired. Please request a new one."
}
```

### Resend Verification
```
POST /api/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "If the email exists, a verification link has been sent."
}
```

## Future Enhancements

Potential improvements for email verification:

- [ ] Email templates with HTML/CSS
- [ ] Customizable verification email content
- [ ] Multi-language email support
- [ ] Email verification reminder after X days
- [ ] Re-verification on email change
- [ ] Welcome email after verification
- [ ] Email notification preferences

## Integration with Existing Users

Existing users in the database have `is_verified = FALSE` by default. You have two options:

**Option 1: Auto-verify existing users**
```sql
UPDATE users 
SET is_verified = TRUE 
WHERE created_at < '2025-12-11';  -- Before verification was added
```

**Option 2: Require verification**
- Keep `is_verified = FALSE`
- Force users to verify on next login
- Implement middleware to check verification status
- Redirect to verification page if not verified

## Notes

- Email verification is optional and won't prevent registration
- Users can log in without verification (current behavior)
- To enforce verification, add middleware to check `is_verified` status
- The system gracefully handles missing email configuration
