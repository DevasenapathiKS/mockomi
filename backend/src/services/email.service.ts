import nodemailer from 'nodemailer';
import config from '../config';
import logger from '../utils/logger';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    // Check if email is configured
    if (!config.email.user || !config.email.pass) {
      logger.warn('⚠️  Email service is NOT configured. Set SMTP_USER and SMTP_PASS in .env file.');
      logger.warn('⚠️  Password reset emails will fail until configured.');
      logger.warn('⚠️  See backend/EMAIL_SETUP.md for setup instructions.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465, // true for 465, false for other ports
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
      });

      this.isConfigured = true;

      // Verify connection configuration
      this.transporter.verify((error) => {
        if (error) {
          logger.error('❌ Email service configuration error:', error);
          logger.error('Check your SMTP settings in .env file');
          this.isConfigured = false;
        } else {
          logger.info('✅ Email service is ready to send emails');
          logger.info(`📧 Using SMTP: ${config.email.host}:${config.email.port}`);
          logger.info(`📧 From: ${config.email.from}`);
        }
      });
    } catch (error) {
      logger.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, name: string): Promise<void> {
    if (!this.isConfigured || !this.transporter) {
      const error = new Error(
        'Email service is not configured. Please set SMTP_USER and SMTP_PASS in your .env file. See backend/EMAIL_SETUP.md for instructions.'
      );
      logger.error('❌ Cannot send password reset email - service not configured');
      throw error;
    }

    const resetUrl = `${config.frontend.url}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Mockomi" <${config.email.from}>`,
      to: email,
      subject: 'Password Reset Request - Mockomi',
      html: this.getPasswordResetTemplate(name, resetUrl),
      text: `Hi ${name},\n\nYou requested to reset your password. Please click on the following link to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nMockomi Team`,
    };

    try {
      await this.transporter!.sendMail(mailOptions);
      logger.info(`✅ Password reset email sent to: ${email}`);
    } catch (error: any) {
      logger.error('❌ Failed to send password reset email:', error);
      logger.error(`SMTP Error Details: ${error.message}`);
      if (error.code) {
        logger.error(`Error Code: ${error.code}`);
      }
      throw new Error(`Failed to send email: ${error.message || 'SMTP error'}`);
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    if (!this.isConfigured || !this.transporter) {
      logger.warn('⚠️  Cannot send welcome email - email service not configured');
      return; // Don't throw - welcome email is not critical
    }

    const mailOptions = {
      from: `"Mockomi" <${config.email.from}>`,
      to: email,
      subject: 'Welcome to Mockomi!',
      html: this.getWelcomeTemplate(name),
      text: `Hi ${name},\n\nWelcome to Mockomi! We're excited to have you on board.\n\nGet started by completing your profile and exploring available opportunities.\n\nBest regards,\nMockomi Team`,
    };

    try {
      if (!this.transporter) {
        logger.warn('⚠️  Email transporter is not initialized. Cannot send welcome email.');
        return;
      }
      await this.transporter.sendMail(mailOptions);
      logger.info(`✅ Welcome email sent to: ${email}`);
    } catch (error) {
      logger.error('❌ Failed to send welcome email:', error);
      // Don't throw error for welcome email - it's not critical
    }
  }

  async sendInterviewConfirmationEmail(
    email: string,
    name: string,
    interviewDetails: {
      type: string;
      date: Date;
      interviewer?: string;
    }
  ): Promise<void> {
    const mailOptions = {
      from: `"Mockomi" <${config.email.from}>`,
      to: email,
      subject: 'Interview Scheduled - Mockomi',
      html: this.getInterviewConfirmationTemplate(name, interviewDetails),
    };

    try {
      if (!this.transporter) {
        logger.warn('⚠️  Email transporter is not initialized. Cannot send interview confirmation email.');
        return;
      }
      await this.transporter.sendMail(mailOptions);
      logger.info(`Interview confirmation email sent to: ${email}`);
    } catch (error) {
      logger.error('Failed to send interview confirmation email:', error);
    }
  }

  private getPasswordResetTemplate(name: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>You recently requested to reset your password for your Mockomi account. Click the button below to reset it:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            <p>Best regards,<br>The Mockomi Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Mockomi. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Mockomi</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Mockomi!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Welcome to Mockomi! We're thrilled to have you join our platform.</p>
            <p>Get started by:</p>
            <ul>
              <li>Completing your profile</li>
              <li>Exploring job opportunities</li>
              <li>Scheduling mock interviews</li>
            </ul>
            <div style="text-align: center;">
              <a href="${config.frontend.url}/dashboard" class="button">Go to Dashboard</a>
            </div>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br>The Mockomi Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Mockomi. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getInterviewConfirmationTemplate(
    name: string,
    details: { type: string; date: Date; interviewer?: string }
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Scheduled</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Interview Scheduled!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Your interview has been scheduled. Here are the details:</p>
            <div class="details">
              <p><strong>Type:</strong> ${details.type}</p>
              <p><strong>Date & Time:</strong> ${details.date.toLocaleString()}</p>
              ${details.interviewer ? `<p><strong>Interviewer:</strong> ${details.interviewer}</p>` : ''}
            </div>
            <div style="text-align: center;">
              <a href="${config.frontend.url}/dashboard/interviews" class="button">View Interview Details</a>
            </div>
            <p>Make sure to join on time. Good luck!</p>
            <p>Best regards,<br>The Mockomi Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Mockomi. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new EmailService();
