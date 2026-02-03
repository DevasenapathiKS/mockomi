"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const types_1 = require("../types");
const errors_1 = require("../utils/errors");
const redis_1 = __importDefault(require("../config/redis"));
const logger_1 = __importDefault(require("../utils/logger"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const email_service_1 = __importDefault(require("./email.service"));
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
class AuthService {
    async register(data) {
        const { email, password, firstName, lastName, role, phone } = data;
        // Check if user already exists
        const existingUser = await models_1.User.findOne({ email });
        if (existingUser) {
            throw new errors_1.AppError('Email already registered', 409);
        }
        // Block public email domains for employers
        if (role === types_1.UserRole.EMPLOYER) {
            const emailDomain = email.split('@')[1].toLowerCase();
            if (PUBLIC_EMAIL_DOMAINS.includes(emailDomain)) {
                throw new errors_1.AppError('Please use your company email address. Public email domains are not allowed for employer accounts.', 400);
            }
        }
        // Create user
        const user = await models_1.User.create({
            email,
            password,
            firstName,
            lastName,
            role,
            phone,
            status: role === types_1.UserRole.INTERVIEWER ? types_1.UserStatus.PENDING : types_1.UserStatus.ACTIVE,
            authProviders: {
                local: {
                    enabled: true,
                    createdAt: new Date(),
                },
            },
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
        const userResponse = await models_1.User.findById(user._id);
        logger_1.default.info(`New user registered: ${email} with role: ${role}`);
        // Send welcome email (don't await - non-blocking)
        email_service_1.default.sendWelcomeEmail(email, `${firstName} ${lastName}`).catch((error) => {
            logger_1.default.error('Failed to send welcome email:', error);
        });
        return {
            user: userResponse,
            accessToken,
            refreshToken,
        };
    }
    async login(data) {
        const { email, password } = data;
        // Find user with password
        const user = await models_1.User.findOne({ email }).select('+password +refreshTokens +failedLoginAttempts +accountLockedUntil');
        if (!user) {
            throw new errors_1.AppError('Invalid email or password', 401);
        }
        // Check if account is locked
        if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
            const minutesLeft = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000);
            throw new errors_1.AppError(`Account locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`, 423);
        }
        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            // Increment failed attempts
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            // Lock account after 5 failed attempts
            if (user.failedLoginAttempts >= 5) {
                user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
                await user.save();
                throw new errors_1.AppError('Account locked due to too many failed attempts. Try again in 30 minutes.', 423);
            }
            await user.save();
            throw new errors_1.AppError('Invalid email or password', 401);
        }
        // Reset failed attempts on successful login
        if ((user.failedLoginAttempts && user.failedLoginAttempts > 0) || user.accountLockedUntil) {
            user.failedLoginAttempts = 0;
            user.accountLockedUntil = null;
        }
        // Check user status
        if (user.status === types_1.UserStatus.SUSPENDED) {
            throw new errors_1.AppError('Your account has been suspended', 403);
        }
        if (user.status === types_1.UserStatus.INACTIVE) {
            throw new errors_1.AppError('Your account is inactive', 403);
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
        const userResponse = await models_1.User.findById(user._id);
        logger_1.default.info(`User logged in: ${email}`);
        return {
            user: userResponse,
            accessToken,
            refreshToken,
        };
    }
    async refreshToken(userId, oldRefreshToken) {
        const user = await models_1.User.findById(userId).select('+refreshTokens');
        if (!user) {
            throw new errors_1.AppError('User not found', 404);
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
    async logout(userId, refreshToken) {
        const user = await models_1.User.findById(userId).select('+refreshTokens');
        if (!user) {
            throw new errors_1.AppError('User not found', 404);
        }
        if (refreshToken) {
            // Remove specific refresh token
            user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
        }
        else {
            // Remove all refresh tokens (logout from all devices)
            user.refreshTokens = [];
        }
        await user.save();
        logger_1.default.info(`User logged out: ${user.email}`);
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await models_1.User.findById(userId).select('+password +refreshTokens');
        if (!user) {
            throw new errors_1.AppError('User not found', 404);
        }
        // Verify current password
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            throw new errors_1.AppError('Current password is incorrect', 400);
        }
        // Update password
        user.password = newPassword;
        // Invalidate all refresh tokens
        user.refreshTokens = [];
        await user.save();
        logger_1.default.info(`Password changed for user: ${user.email}`);
    }
    async forgotPassword(email) {
        const user = await models_1.User.findOne({ email }).select('+password');
        if (!user) {
            // Don't reveal if user exists - but still return success
            return {};
        }
        // Generate reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });
        // Send password reset email
        try {
            await email_service_1.default.sendPasswordResetEmail(user.email, resetToken, `${user.firstName} ${user.lastName}`);
            logger_1.default.info(`Password reset email sent to: ${email}`);
            return {};
        }
        catch (error) {
            logger_1.default.error('Failed to send password reset email:', error);
            // In development mode, return the token so user can test
            if (config_1.default.env === 'development') {
                logger_1.default.warn('⚠️  DEVELOPMENT MODE: Returning reset token in response');
                logger_1.default.warn(`Reset URL: ${config_1.default.frontend.url}/reset-password?token=${resetToken}`);
                return { resetToken, devMode: true };
            }
            // In production, clear the token and throw error
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
            throw new errors_1.AppError('Failed to send password reset email. Please try again.', 500);
        }
    }
    async resetPassword(token, newPassword) {
        // Find user with valid reset token
        const user = await models_1.User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() },
        }).select('+password +passwordResetToken +passwordResetExpires');
        if (!user) {
            throw new errors_1.AppError('Invalid or expired reset token', 400);
        }
        // Verify token
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret + user.password);
            if (decoded.id !== user._id.toString()) {
                throw new errors_1.AppError('Invalid reset token', 400);
            }
        }
        catch (error) {
            throw new errors_1.AppError('Invalid or expired reset token', 400);
        }
        // Update password
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.refreshTokens = []; // Logout from all devices
        await user.save();
        logger_1.default.info(`Password reset successful for: ${user.email}`);
    }
    async getMe(userId) {
        // Try cache first
        const cached = await redis_1.default.getJSON(`user:${userId}`);
        if (cached) {
            return cached;
        }
        const user = await models_1.User.findById(userId);
        if (!user) {
            throw new errors_1.AppError('User not found', 404);
        }
        // Cache for 5 minutes
        await redis_1.default.setJSON(`user:${userId}`, user.toJSON(), 300);
        return user;
    }
    async createRoleProfile(userId, role) {
        switch (role) {
            case types_1.UserRole.JOB_SEEKER:
                await models_1.JobSeekerProfile.create({
                    userId,
                    interviewStats: {
                        totalInterviews: 0,
                        freeInterviewsUsed: 0,
                        averageRating: 0,
                    },
                });
                break;
            case types_1.UserRole.EMPLOYER:
                // Company profile will be created separately with more details
                break;
            case types_1.UserRole.INTERVIEWER:
                await models_1.InterviewerProfile.create({
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
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map