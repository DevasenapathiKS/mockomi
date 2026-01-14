import { Response, NextFunction } from 'express';
import { authService } from '../services';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: result,
  });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.login(req.body);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshToken(req.user!.id, refreshToken);

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: result,
  });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  await authService.logout(req.user!.id, refreshToken);

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

export const logoutAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.logout(req.user!.id);

  res.status(200).json({
    success: true,
    message: 'Logged out from all devices',
  });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user!.id, currentPassword, newPassword);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.getMe(req.user!.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);

  // If in development mode and email failed, return the token
  if (result.devMode && result.resetToken) {
    res.status(200).json({
      success: true,
      message: 'Email service not configured. Using development mode.',
      devMode: true,
      resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${result.resetToken}`,
    });
  } else {
    res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
    });
  }
});

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
  });
});
