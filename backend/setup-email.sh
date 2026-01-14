#!/bin/bash

# Email Configuration Setup Script for Mockomi
# This script helps you set up email configuration interactively

echo "========================================="
echo "  Mockomi Email Configuration Setup"
echo "========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
fi

echo "Choose your email provider:"
echo ""
echo "1) Gmail (Recommended for development)"
echo "2) Mailtrap (For testing without real emails)"
echo "3) SendGrid (Production recommended)"
echo "4) Skip email setup (Use development mode)"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "📧 Gmail Setup"
        echo "==============="
        echo ""
        echo "Steps to get Gmail App Password:"
        echo "1. Enable 2-Factor Authentication: https://myaccount.google.com/security"
        echo "2. Generate App Password: https://myaccount.google.com/apppasswords"
        echo "3. Select 'Mail' and your device"
        echo "4. Copy the 16-character password"
        echo ""
        
        read -p "Enter your Gmail address: " gmail_user
        read -p "Enter your App Password (16 chars): " gmail_pass
        
        # Update .env file
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|SMTP_HOST=.*|SMTP_HOST=smtp.gmail.com|g" .env
            sed -i '' "s|SMTP_PORT=.*|SMTP_PORT=587|g" .env
            sed -i '' "s|SMTP_USER=.*|SMTP_USER=$gmail_user|g" .env
            sed -i '' "s|SMTP_PASS=.*|SMTP_PASS=$gmail_pass|g" .env
            sed -i '' "s|EMAIL_FROM=.*|EMAIL_FROM=$gmail_user|g" .env
        else
            # Linux
            sed -i "s|SMTP_HOST=.*|SMTP_HOST=smtp.gmail.com|g" .env
            sed -i "s|SMTP_PORT=.*|SMTP_PORT=587|g" .env
            sed -i "s|SMTP_USER=.*|SMTP_USER=$gmail_user|g" .env
            sed -i "s|SMTP_PASS=.*|SMTP_PASS=$gmail_pass|g" .env
            sed -i "s|EMAIL_FROM=.*|EMAIL_FROM=$gmail_user|g" .env
        fi
        
        echo ""
        echo "✅ Gmail configuration saved!"
        ;;
        
    2)
        echo ""
        echo "📧 Mailtrap Setup"
        echo "================="
        echo ""
        echo "1. Sign up at: https://mailtrap.io"
        echo "2. Go to your inbox"
        echo "3. Copy SMTP credentials"
        echo ""
        
        read -p "Enter Mailtrap username: " mailtrap_user
        read -p "Enter Mailtrap password: " mailtrap_pass
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|SMTP_HOST=.*|SMTP_HOST=smtp.mailtrap.io|g" .env
            sed -i '' "s|SMTP_PORT=.*|SMTP_PORT=2525|g" .env
            sed -i '' "s|SMTP_USER=.*|SMTP_USER=$mailtrap_user|g" .env
            sed -i '' "s|SMTP_PASS=.*|SMTP_PASS=$mailtrap_pass|g" .env
            sed -i '' "s|EMAIL_FROM=.*|EMAIL_FROM=noreply@mockomi.com|g" .env
        else
            sed -i "s|SMTP_HOST=.*|SMTP_HOST=smtp.mailtrap.io|g" .env
            sed -i "s|SMTP_PORT=.*|SMTP_PORT=2525|g" .env
            sed -i "s|SMTP_USER=.*|SMTP_USER=$mailtrap_user|g" .env
            sed -i "s|SMTP_PASS=.*|SMTP_PASS=$mailtrap_pass|g" .env
            sed -i "s|EMAIL_FROM=.*|EMAIL_FROM=noreply@mockomi.com|g" .env
        fi
        
        echo ""
        echo "✅ Mailtrap configuration saved!"
        echo "📬 All emails will be caught by Mailtrap (no real emails sent)"
        ;;
        
    3)
        echo ""
        echo "📧 SendGrid Setup"
        echo "================="
        echo ""
        echo "1. Sign up at: https://sendgrid.com"
        echo "2. Create API Key"
        echo "3. Verify sender identity"
        echo ""
        
        read -p "Enter SendGrid API Key: " sendgrid_key
        read -p "Enter verified sender email: " sender_email
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|SMTP_HOST=.*|SMTP_HOST=smtp.sendgrid.net|g" .env
            sed -i '' "s|SMTP_PORT=.*|SMTP_PORT=587|g" .env
            sed -i '' "s|SMTP_USER=.*|SMTP_USER=apikey|g" .env
            sed -i '' "s|SMTP_PASS=.*|SMTP_PASS=$sendgrid_key|g" .env
            sed -i '' "s|EMAIL_FROM=.*|EMAIL_FROM=$sender_email|g" .env
        else
            sed -i "s|SMTP_HOST=.*|SMTP_HOST=smtp.sendgrid.net|g" .env
            sed -i "s|SMTP_PORT=.*|SMTP_PORT=587|g" .env
            sed -i "s|SMTP_USER=.*|SMTP_USER=apikey|g" .env
            sed -i "s|SMTP_PASS=.*|SMTP_PASS=$sendgrid_key|g" .env
            sed -i "s|EMAIL_FROM=.*|EMAIL_FROM=$sender_email|g" .env
        fi
        
        echo ""
        echo "✅ SendGrid configuration saved!"
        ;;
        
    4)
        echo ""
        echo "⚠️  Skipping email setup"
        echo ""
        echo "Email features (forgot password, welcome emails) will not work."
        echo "You can configure email later by running this script again."
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "========================================="
echo "  Next Steps"
echo "========================================="
echo ""
echo "1. Restart your backend server:"
echo "   npm run dev"
echo ""
echo "2. Test forgot password feature"
echo ""
echo "For more help, see EMAIL_SETUP.md"
echo ""
