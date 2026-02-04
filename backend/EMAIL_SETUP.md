# Email Configuration Guide

The forgot password feature now sends actual emails to users. To enable this functionality, you need to configure your email settings.

## Quick Setup

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password

3. **Update your `.env` file**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
EMAIL_FROM=your-email@gmail.com
FRONTEND_URL=https://mockomi.com
```

### Option 2: Other Email Providers

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
EMAIL_FROM=noreply@yourdomain.com
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
EMAIL_FROM=verified-email@yourdomain.com
```

#### Outlook/Office365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
EMAIL_FROM=your-email@outlook.com
```

## Testing Email Functionality

### 1. Start the backend server
```bash
cd backend
npm run dev
```

### 2. Test the forgot password endpoint
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 3. Check your email
- Look for an email from Mockomi
- Click the reset password link
- The link format: `https://mockomi.com/reset-password?token=...`

## Email Templates

The email service includes professional HTML templates for:

✅ **Password Reset Email**
- Branded design with gradient header
- Clear call-to-action button
- 1-hour expiration notice
- Fallback plain text version

✅ **Welcome Email** (bonus)
- Sent on user registration
- Links to dashboard
- Getting started guidance

✅ **Interview Confirmation** (bonus)
- Sent when interview is scheduled
- Includes interview details
- Direct link to interview panel

## Troubleshooting

### "Failed to send email" error

1. **Check your credentials**:
   ```bash
   echo $SMTP_USER
   echo $SMTP_PASS
   ```

2. **Verify SMTP settings**:
   - Correct host and port
   - For Gmail, use port 587 (not 465)
   - For other providers, check their documentation

3. **Check firewall/network**:
   - Ensure your server can reach the SMTP host
   - Some networks block port 587

4. **Gmail specific**:
   - Make sure you're using an App Password, not your regular password
   - "Less secure app access" is deprecated - use App Password instead

### Email not received

1. **Check spam folder**
2. **Verify the email address exists in your database**
3. **Check backend logs** for any errors:
   ```bash
   tail -f backend/logs/error.log
   ```

### Development Testing (without real email)

If you want to test without real email setup, use a service like:
- **Mailtrap** (https://mailtrap.io) - Email testing for staging
- **MailHog** - Local email testing server
- **Ethereal Email** - Fake SMTP service

Example Mailtrap config:
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
EMAIL_FROM=test@mockomi.com
```

## Security Best Practices

1. ✅ **Never commit** `.env` file to git
2. ✅ **Use App Passwords** instead of real passwords (Gmail)
3. ✅ **Verify sender domain** for production (SPF, DKIM, DMARC)
4. ✅ **Rate limit** email endpoints (already implemented)
5. ✅ **Monitor email bounce rates**
6. ✅ **Use dedicated email service** for production (SendGrid, AWS SES, etc.)

## Production Recommendations

For production, we recommend using a dedicated email service provider:

- **SendGrid**: 100 emails/day free, easy setup
- **AWS SES**: Very affordable, requires domain verification
- **Mailgun**: 5,000 emails/month free for 3 months
- **Postmark**: Excellent deliverability, transactional focus

These services provide:
- Better deliverability rates
- Email analytics and tracking
- Bounce and complaint handling
- Template management
- Scalability

## Need Help?

If you're still having issues:
1. Check the logs: `backend/logs/combined.log`
2. Verify your `.env` file matches `.env.example`
3. Test SMTP connection with: `telnet smtp.gmail.com 587`
4. Contact support or create an issue

## What Changed?

✅ Created `email.service.ts` with nodemailer integration
✅ Updated `auth.service.ts` to send actual emails
✅ Added professional HTML email templates
✅ Error handling for email failures
✅ Logging for email operations
✅ Security: Tokens are no longer returned in API response
