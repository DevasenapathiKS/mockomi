"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.getMe = exports.changePassword = exports.logoutAll = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const services_1 = require("../services");
const errorHandler_1 = require("../middlewares/errorHandler");
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await services_1.authService.register(req.body);
    res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result,
    });
});
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await services_1.authService.login(req.body);
    // Set refresh token in httpOnly cookie for security
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/v1/auth',
    });
    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
            user: result.user,
            accessToken: result.accessToken,
            // Don't send refreshToken in response body (it's in cookie)
        },
    });
});
exports.refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Get refresh token from cookie (preferred) or body (fallback for migration)
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: 'Refresh token not provided',
        });
    }
    const result = await services_1.authService.refreshToken(req.user.id, refreshToken);
    // Set new refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/v1/auth',
    });
    res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
            accessToken: result.accessToken,
            // Don't send refreshToken in response body
        },
    });
});
exports.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    await services_1.authService.logout(req.user.id, refreshToken);
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
        path: '/api/v1/auth',
    });
    res.status(200).json({
        success: true,
        message: 'Logout successful',
    });
});
exports.logoutAll = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await services_1.authService.logout(req.user.id);
    res.status(200).json({
        success: true,
        message: 'Logged out from all devices',
    });
});
exports.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await services_1.authService.changePassword(req.user.id, currentPassword, newPassword);
    res.status(200).json({
        success: true,
        message: 'Password changed successfully',
    });
});
exports.getMe = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await services_1.authService.getMe(req.user.id);
    res.status(200).json({
        success: true,
        data: user,
    });
});
exports.forgotPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    const result = await services_1.authService.forgotPassword(email);
    // If in development mode and email failed, return the token
    if (result.devMode && result.resetToken) {
        res.status(200).json({
            success: true,
            message: 'Email service not configured. Using development mode.',
            devMode: true,
            resetUrl: `${process.env.FRONTEND_URL || 'https://mockomi.com'}/reset-password?token=${result.resetToken}`,
        });
    }
    else {
        res.status(200).json({
            success: true,
            message: 'If the email exists, a password reset link has been sent',
        });
    }
});
exports.resetPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { token, password } = req.body;
    await services_1.authService.resetPassword(token, password);
    res.status(200).json({
        success: true,
        message: 'Password reset successful',
    });
});
//# sourceMappingURL=auth.controller.js.map