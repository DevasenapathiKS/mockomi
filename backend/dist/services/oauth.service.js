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
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
class OAuthService {
    /**
     * Generate OAuth state parameter for CSRF protection
     */
    async generateState(userId) {
        const state = crypto_1.default.randomBytes(32).toString('hex');
        const data = {
            state,
            userId,
            timestamp: Date.now(),
        };
        // Store state in Redis for 10 minutes
        await redis_1.default.setJSON(`oauth:state:${state}`, data, 600);
        return state;
    }
    /**
     * Verify OAuth state parameter
     */
    async verifyState(state) {
        const data = await redis_1.default.getJSON(`oauth:state:${state}`);
        if (!data) {
            throw new errors_1.AppError('Invalid or expired OAuth state', 400);
        }
        // Delete state after verification (one-time use)
        await redis_1.default.del(`oauth:state:${state}`);
        return { userId: data.userId };
    }
    /**
     * Find or create user from OAuth profile
     */
    async findOrCreateOAuthUser(provider, profile, tokens, linkUserId) {
        // If linking to existing account
        if (linkUserId) {
            return await this.linkOAuthProvider(linkUserId, provider, profile, tokens);
        }
        // Check if email is provided
        if (!profile.email) {
            throw new errors_1.AppError(`Email not provided by ${provider}. Please grant email permission.`, 400);
        }
        // Check if user with this provider ID already exists
        const providerQuery = { [`authProviders.${provider}.id`]: profile.id };
        let user = await models_1.User.findOne(providerQuery);
        if (user) {
            // Update tokens if needed
            await this.updateOAuthTokens(user, provider, tokens);
            user.lastLogin = new Date();
            await user.save();
            return { user, isNewUser: false };
        }
        // Check if user with this email exists
        user = await models_1.User.findOne({ email: profile.email });
        if (user) {
            // Link OAuth provider to existing account
            return await this.linkOAuthProvider(user._id.toString(), provider, profile, tokens);
        }
        // Create new user
        const newUser = await models_1.User.create({
            email: profile.email,
            firstName: profile.firstName || 'User',
            lastName: profile.lastName || '',
            avatar: profile.avatar,
            isEmailVerified: profile.emailVerified || false,
            role: types_1.UserRole.JOB_SEEKER, // Default role
            status: types_1.UserStatus.ACTIVE,
            authProviders: {
                [provider]: {
                    id: profile.id,
                    ...(provider === 'google' && {
                        email: profile.email,
                        refreshToken: tokens.refreshToken
                    }),
                    ...(provider === 'github' && {
                        username: profile.username,
                        accessToken: tokens.accessToken
                    }),
                    ...(provider === 'linkedin' && {
                        accessToken: tokens.accessToken
                    }),
                    linkedAt: new Date(),
                },
            },
        });
        // Create default job seeker profile
        await models_1.JobSeekerProfile.create({
            userId: newUser._id,
            interviewStats: {
                totalInterviews: 0,
                freeInterviewsUsed: 0,
                averageRating: 0,
            },
        });
        logger_1.default.info(`New user created via ${provider} OAuth`, {
            userId: newUser._id,
            email: newUser.email,
            provider,
        });
        return { user: newUser, isNewUser: true };
    }
    /**
     * Link OAuth provider to existing user account
     */
    async linkOAuthProvider(userId, provider, profile, tokens) {
        const user = await models_1.User.findById(userId);
        if (!user) {
            throw new errors_1.AppError('User not found', 404);
        }
        // Check if provider is already linked
        if (user.authProviders && user.authProviders[provider]) {
            throw new errors_1.AppError(`${provider} account is already linked to this user`, 400);
        }
        // Link provider
        user.authProviders = user.authProviders || {};
        user.authProviders[provider] = {
            id: profile.id,
            ...(provider === 'google' && {
                email: profile.email,
                refreshToken: tokens.refreshToken
            }),
            ...(provider === 'github' && {
                username: profile.username,
                accessToken: tokens.accessToken
            }),
            ...(provider === 'linkedin' && {
                accessToken: tokens.accessToken
            }),
            linkedAt: new Date(),
        };
        await user.save();
        logger_1.default.info(`${provider} OAuth linked to existing user`, {
            userId: user._id,
            email: user.email,
            provider,
        });
        return { user, isNewUser: false };
    }
    /**
     * Unlink OAuth provider from user account
     */
    async unlinkOAuthProvider(userId, provider) {
        const user = await models_1.User.findById(userId).select('+password');
        if (!user) {
            throw new errors_1.AppError('User not found', 404);
        }
        // Check if provider is linked
        if (!user.authProviders || !user.authProviders[provider]) {
            throw new errors_1.AppError(`${provider} account is not linked`, 400);
        }
        // Prevent unlinking if it's the only auth method
        const hasPassword = !!user.password;
        const linkedProviders = Object.keys(user.authProviders || {}).filter(key => key !== 'local' && user.authProviders[key]);
        if (!hasPassword && linkedProviders.length === 1) {
            throw new errors_1.AppError('Cannot unlink. Please set a password first or link another account.', 400);
        }
        // Unlink provider
        delete user.authProviders[provider];
        await user.save();
        logger_1.default.info(`${provider} OAuth unlinked from user`, {
            userId: user._id,
            email: user.email,
            provider,
        });
    }
    /**
     * Update OAuth tokens for existing user
     */
    async updateOAuthTokens(user, provider, tokens) {
        if (!user.authProviders || !user.authProviders[provider]) {
            return;
        }
        const providerData = user.authProviders[provider];
        if (provider === 'google' && tokens.refreshToken) {
            providerData.refreshToken = tokens.refreshToken;
        }
        else if (provider === 'github' && tokens.accessToken) {
            providerData.accessToken = tokens.accessToken;
        }
        else if (provider === 'linkedin' && tokens.accessToken) {
            providerData.accessToken = tokens.accessToken;
        }
        await user.save();
    }
    /**
     * Exchange Google authorization code for tokens and user info
     */
    async googleOAuth(code) {
        try {
            // Exchange code for tokens
            const tokenResponse = await axios_1.default.post('https://oauth2.googleapis.com/token', {
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_CALLBACK_URL,
                grant_type: 'authorization_code',
            });
            const { access_token, refresh_token, expires_in } = tokenResponse.data;
            // Get user info
            const userResponse = await axios_1.default.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` },
            });
            const { id, email, given_name, family_name, picture, verified_email } = userResponse.data;
            return {
                profile: {
                    id,
                    email,
                    emailVerified: verified_email,
                    firstName: given_name,
                    lastName: family_name,
                    avatar: picture,
                },
                tokens: {
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    expiresIn: expires_in,
                },
            };
        }
        catch (error) {
            logger_1.default.error('Google OAuth error:', error.response?.data || error.message);
            throw new errors_1.AppError('Failed to authenticate with Google', 500);
        }
    }
    /**
     * Exchange GitHub authorization code for tokens and user info
     */
    async githubOAuth(code) {
        try {
            // Exchange code for access token
            const tokenResponse = await axios_1.default.post('https://github.com/login/oauth/access_token', {
                code,
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                redirect_uri: process.env.GITHUB_CALLBACK_URL,
            }, {
                headers: { Accept: 'application/json' },
            });
            const { access_token } = tokenResponse.data;
            // Get user info
            const userResponse = await axios_1.default.get('https://api.github.com/user', {
                headers: { Authorization: `Bearer ${access_token}` },
            });
            const { id, login, name, avatar_url } = userResponse.data;
            // Get primary email
            const emailResponse = await axios_1.default.get('https://api.github.com/user/emails', {
                headers: { Authorization: `Bearer ${access_token}` },
            });
            const primaryEmail = emailResponse.data.find((e) => e.primary);
            const email = primaryEmail?.email;
            const emailVerified = primaryEmail?.verified || false;
            const [firstName, ...lastNameParts] = (name || login).split(' ');
            return {
                profile: {
                    id: id.toString(),
                    email,
                    emailVerified,
                    firstName,
                    lastName: lastNameParts.join(' '),
                    avatar: avatar_url,
                    username: login,
                },
                tokens: {
                    accessToken: access_token,
                },
            };
        }
        catch (error) {
            logger_1.default.error('GitHub OAuth error:', error.response?.data || error.message);
            throw new errors_1.AppError('Failed to authenticate with GitHub', 500);
        }
    }
    /**
     * Exchange LinkedIn authorization code for tokens and user info
     */
    async linkedinOAuth(code) {
        try {
            // Exchange code for access token
            const tokenResponse = await axios_1.default.post('https://www.linkedin.com/oauth/v2/accessToken', new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: process.env.LINKEDIN_CLIENT_ID,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET,
                redirect_uri: process.env.LINKEDIN_CALLBACK_URL,
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            const { access_token, expires_in } = tokenResponse.data;
            // Get user profile
            const profileResponse = await axios_1.default.get('https://api.linkedin.com/v2/me', {
                headers: { Authorization: `Bearer ${access_token}` },
            });
            const { id, localizedFirstName, localizedLastName } = profileResponse.data;
            // Get email
            const emailResponse = await axios_1.default.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
                headers: { Authorization: `Bearer ${access_token}` },
            });
            const email = emailResponse.data.elements?.[0]?.['handle~']?.emailAddress;
            // Get profile picture
            const pictureResponse = await axios_1.default.get('https://api.linkedin.com/v2/me?projection=(id,profilePicture(displayImage~:playableStreams))', {
                headers: { Authorization: `Bearer ${access_token}` },
            });
            const avatar = pictureResponse.data.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier;
            return {
                profile: {
                    id,
                    email,
                    emailVerified: true, // LinkedIn emails are verified
                    firstName: localizedFirstName,
                    lastName: localizedLastName,
                    avatar,
                },
                tokens: {
                    accessToken: access_token,
                    expiresIn: expires_in,
                },
            };
        }
        catch (error) {
            logger_1.default.error('LinkedIn OAuth error:', error.response?.data || error.message);
            throw new errors_1.AppError('Failed to authenticate with LinkedIn', 500);
        }
    }
}
exports.default = new OAuthService();
//# sourceMappingURL=oauth.service.js.map