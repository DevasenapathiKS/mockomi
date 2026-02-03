"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLinkedProviders = exports.unlinkProvider = exports.linkedinCallback = exports.linkedinAuth = exports.githubCallback = exports.githubAuth = exports.googleCallback = exports.googleAuth = void 0;
const services_1 = require("../services");
const errorHandler_1 = require("../middlewares/errorHandler");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = __importDefault(require("../config"));
/**
 * Get Google OAuth authorization URL
 * @route GET /api/v1/auth/google
 */
exports.googleAuth = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id; // If user is logged in (for linking)
    const state = await services_1.oauthService.generateState(userId);
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        response_type: 'code',
        scope: 'openid profile email',
        access_type: 'offline',
        prompt: 'consent',
        state,
    });
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    // For web: redirect
    // For API: return URL
    if (req.query.mode === 'api') {
        return res.json({
            success: true,
            data: { authUrl, state },
        });
    }
    res.redirect(authUrl);
});
/**
 * Google OAuth callback handler
 * @route GET /api/v1/auth/google/callback
 */
exports.googleCallback = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { code, state, error } = req.query;
    if (error) {
        logger_1.default.error('Google OAuth error:', error);
        return res.redirect(`${config_1.default.frontend.url}/auth/error?message=${error}`);
    }
    if (!code || !state) {
        throw new errors_1.AppError('Missing authorization code or state', 400);
    }
    try {
        // Verify state
        const { userId: linkUserId } = await services_1.oauthService.verifyState(state);
        // Exchange code for tokens and user info
        const { profile, tokens } = await services_1.oauthService.googleOAuth(code);
        // Find or create user
        const { user, isNewUser } = await services_1.oauthService.findOrCreateOAuthUser('google', profile, tokens, linkUserId);
        // Generate JWT tokens
        const accessToken = user.generateAuthToken();
        const refreshToken = user.generateRefreshToken();
        // Save refresh token
        if (!linkUserId) {
            // Only update refresh tokens if not linking
            user.refreshTokens.push(refreshToken);
            user.lastLogin = new Date();
            await user.save();
        }
        // Set refresh token in cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/api/v1/auth',
        });
        // Redirect to frontend with token
        const redirectUrl = linkUserId
            ? `${config_1.default.frontend.url}/settings/accounts?linked=google`
            : isNewUser
                ? `${config_1.default.frontend.url}/onboarding?token=${accessToken}`
                : `${config_1.default.frontend.url}/auth/callback?token=${accessToken}`;
        res.redirect(redirectUrl);
    }
    catch (error) {
        logger_1.default.error('Google OAuth callback error:', error);
        const message = error instanceof errors_1.AppError ? error.message : 'Authentication failed';
        res.redirect(`${config_1.default.frontend.url}/auth/error?message=${encodeURIComponent(message)}`);
    }
});
/**
 * Get GitHub OAuth authorization URL
 * @route GET /api/v1/auth/github
 */
exports.githubAuth = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const state = await services_1.oauthService.generateState(userId);
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
        scope: 'user:email',
        state,
    });
    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    if (req.query.mode === 'api') {
        return res.json({
            success: true,
            data: { authUrl, state },
        });
    }
    res.redirect(authUrl);
});
/**
 * GitHub OAuth callback handler
 * @route GET /api/v1/auth/github/callback
 */
exports.githubCallback = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { code, state, error } = req.query;
    if (error) {
        logger_1.default.error('GitHub OAuth error:', error);
        return res.redirect(`${config_1.default.frontend.url}/auth/error?message=${error}`);
    }
    if (!code || !state) {
        throw new errors_1.AppError('Missing authorization code or state', 400);
    }
    try {
        const { userId: linkUserId } = await services_1.oauthService.verifyState(state);
        const { profile, tokens } = await services_1.oauthService.githubOAuth(code);
        const { user, isNewUser } = await services_1.oauthService.findOrCreateOAuthUser('github', profile, tokens, linkUserId);
        const accessToken = user.generateAuthToken();
        const refreshToken = user.generateRefreshToken();
        if (!linkUserId) {
            user.refreshTokens.push(refreshToken);
            user.lastLogin = new Date();
            await user.save();
        }
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/api/v1/auth',
        });
        const redirectUrl = linkUserId
            ? `${config_1.default.frontend.url}/settings/accounts?linked=github`
            : isNewUser
                ? `${config_1.default.frontend.url}/onboarding?token=${accessToken}`
                : `${config_1.default.frontend.url}/auth/callback?token=${accessToken}`;
        res.redirect(redirectUrl);
    }
    catch (error) {
        logger_1.default.error('GitHub OAuth callback error:', error);
        const message = error instanceof errors_1.AppError ? error.message : 'Authentication failed';
        res.redirect(`${config_1.default.frontend.url}/auth/error?message=${encodeURIComponent(message)}`);
    }
});
/**
 * Get LinkedIn OAuth authorization URL
 * @route GET /api/v1/auth/linkedin
 */
exports.linkedinAuth = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const state = await services_1.oauthService.generateState(userId);
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.LINKEDIN_CLIENT_ID,
        redirect_uri: process.env.LINKEDIN_CALLBACK_URL,
        scope: 'r_liteprofile r_emailaddress',
        state,
    });
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    if (req.query.mode === 'api') {
        return res.json({
            success: true,
            data: { authUrl, state },
        });
    }
    res.redirect(authUrl);
});
/**
 * LinkedIn OAuth callback handler
 * @route GET /api/v1/auth/linkedin/callback
 */
exports.linkedinCallback = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { code, state, error } = req.query;
    if (error) {
        logger_1.default.error('LinkedIn OAuth error:', error);
        return res.redirect(`${config_1.default.frontend.url}/auth/error?message=${error}`);
    }
    if (!code || !state) {
        throw new errors_1.AppError('Missing authorization code or state', 400);
    }
    try {
        const { userId: linkUserId } = await services_1.oauthService.verifyState(state);
        const { profile, tokens } = await services_1.oauthService.linkedinOAuth(code);
        const { user, isNewUser } = await services_1.oauthService.findOrCreateOAuthUser('linkedin', profile, tokens, linkUserId);
        const accessToken = user.generateAuthToken();
        const refreshToken = user.generateRefreshToken();
        if (!linkUserId) {
            user.refreshTokens.push(refreshToken);
            user.lastLogin = new Date();
            await user.save();
        }
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/api/v1/auth',
        });
        const redirectUrl = linkUserId
            ? `${config_1.default.frontend.url}/settings/accounts?linked=linkedin`
            : isNewUser
                ? `${config_1.default.frontend.url}/onboarding?token=${accessToken}`
                : `${config_1.default.frontend.url}/auth/callback?token=${accessToken}`;
        res.redirect(redirectUrl);
    }
    catch (error) {
        logger_1.default.error('LinkedIn OAuth callback error:', error);
        const message = error instanceof errors_1.AppError ? error.message : 'Authentication failed';
        res.redirect(`${config_1.default.frontend.url}/auth/error?message=${encodeURIComponent(message)}`);
    }
});
/**
 * Unlink OAuth provider from user account
 * @route DELETE /api/v1/auth/oauth/:provider
 */
exports.unlinkProvider = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { provider } = req.params;
    const userId = req.user.id;
    if (!['google', 'github', 'linkedin'].includes(provider)) {
        throw new errors_1.AppError('Invalid provider', 400);
    }
    await services_1.oauthService.unlinkOAuthProvider(userId, provider);
    res.json({
        success: true,
        message: `${provider} account unlinked successfully`,
    });
});
/**
 * Get linked providers for current user
 * @route GET /api/v1/auth/oauth/linked
 */
exports.getLinkedProviders = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await services_1.authService.getMe(req.user.id);
    const linkedProviders = {
        local: !!(user.authProviders?.local?.enabled),
        google: !!(user.authProviders?.google),
        github: !!(user.authProviders?.github),
        linkedin: !!(user.authProviders?.linkedin),
    };
    res.json({
        success: true,
        data: { linkedProviders },
    });
});
//# sourceMappingURL=oauth.controller.js.map