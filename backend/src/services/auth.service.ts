import { User, JobSeekerProfile, CompanyProfile, InterviewerProfile } from '../models';
import { IUserDocument, UserRole, UserStatus } from '../types';
import { AppError } from '../utils/errors';
import redis from '../config/redis';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken';
import config from '../config';
import emailService from './email.service';

// List of public email domains to block for employers
const PUBLIC_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'mail.com',
  'protonmail.com',
  'icloud.com',
  'live.com',
  'msn.com',
  'ymail.com',
  'zoho.com',
  'gmx.com',
  'inbox.com',
  'fastmail.com',
];

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  user: IUserDocument;
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const { email, password, firstName, lastName, role, phone } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    // Block public email domains for employers
    if (role === UserRole.EMPLOYER) {
      const emailDomain = email.split('@')[1].toLowerCase();
      if (PUBLIC_EMAIL_DOMAINS.includes(emailDomain)) {
        throw new AppError(
          'Please use your company email address. Public email domains are not allowed for employer accounts.',
          400
        );
      }
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      status: role === UserRole.INTERVIEWER ? UserStatus.PENDING : UserStatus.ACTIVE,
    });

    // Create role-specific profile
    await this.createRoleProfile(user._id.toString(), role);

    // Generate tokens
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();

    // Get user without password
    const userResponse = await User.findById(user._id);

    logger.info(`New user registered: ${email} with role: ${role}`);

    // Send welcome email (don't await - non-blocking)
    emailService.sendWelcomeEmail(email, `${firstName} ${lastName}`).catch((error) => {
      logger.error('Failed to send welcome email:', error);
    });

    return {
      user: userResponse!,
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user with password
    const user = await User.findOne({ email }).select('+password +refreshTokens');
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check user status
    if (user.status === UserStatus.SUSPENDED) {
      throw new AppError('Your account has been suspended', 403);
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new AppError('Your account is inactive', 403);
    }

    // Generate tokens
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token (limit to 5 active sessions)
    if (user.refreshTokens.length >= 5) {
      user.refreshTokens.shift(); // Remove oldest token
    }
    user.refreshTokens.push(refreshToken);
    user.lastLogin = new Date();
    await user.save();

    // Get user without password
    const userResponse = await User.findById(user._id);

    logger.info(`User logged in: ${email}`);

    return {
      user: userResponse!,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(userId: string, oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await User.findById(userId).select('+refreshTokens');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Remove old refresh token
    user.refreshTokens = user.refreshTokens.filter((token) => token !== oldRefreshToken);

    // Generate new tokens
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Save new refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();

    return { accessToken, refreshToken };
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    const user = await User.findById(userId).select('+refreshTokens');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (refreshToken) {
      // Remove specific refresh token
      user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
    } else {
      // Remove all refresh tokens (logout from all devices)
      user.refreshTokens = [];
    }

    await user.save();
    logger.info(`User logged out: ${user.email}`);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password +refreshTokens');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Update password
    user.password = newPassword;
    // Invalidate all refresh tokens
    user.refreshTokens = [];
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);
  }

  async forgotPassword(email: string): Promise<{ resetToken?: string; devMode?: boolean }> {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      // Don't reveal if user exists - but still return success
      return {};
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        `${user.firstName} ${user.lastName}`
      );
      logger.info(`Password reset email sent to: ${email}`);
      return {};
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      
      // In development mode, return the token so user can test
      if (config.env === 'development') {
        logger.warn('⚠️  DEVELOPMENT MODE: Returning reset token in response');
        logger.warn(`Reset URL: ${config.frontend.url}/reset-password?token=${resetToken}`);
        return { resetToken, devMode: true };
      }
      
      // In production, clear the token and throw error
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw new AppError('Failed to send password reset email. Please try again.', 500);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password +passwordResetToken +passwordResetExpires');

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, config.jwt.secret + user.password) as { id: string };
      if (decoded.id !== user._id.toString()) {
        throw new AppError('Invalid reset token', 400);
      }
    } catch (error) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // Logout from all devices
    await user.save();

    logger.info(`Password reset successful for: ${user.email}`);
  }

  async getMe(userId: string): Promise<IUserDocument> {
    // Try cache first
    const cached = await redis.getJSON<IUserDocument>(`user:${userId}`);
    if (cached) {
      return cached;
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Cache for 5 minutes
    await redis.setJSON(`user:${userId}`, user.toJSON(), 300);

    return user;
  }

  private async createRoleProfile(userId: string, role: UserRole): Promise<void> {
    switch (role) {
      case UserRole.JOB_SEEKER:
        await JobSeekerProfile.create({
          userId,
          interviewStats: {
            totalInterviews: 0,
            freeInterviewsUsed: 0,
            averageRating: 0,
          },
        });
        break;

      case UserRole.EMPLOYER:
        // Company profile will be created separately with more details
        break;

      case UserRole.INTERVIEWER:
        await InterviewerProfile.create({
          userId,
          expertise: [],
          experience: 0,
          isApproved: false,
          rating: { average: 0, count: 0 },
          interviewsCompleted: 0,
          earnings: 0,
        });
        break;

      default:
        break;
    }
  }
}

export default new AuthService();
