import { Request, Response, NextFunction } from 'express';
import { oauthService, authService } from '../services';
import { asyncHandler } from '../middlewares/errorHandler';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import config from '../config';

/**
 * Get Google OAuth authorization URL
 * @route GET /api/v1/auth/google
 */
export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id; // If user is logged in (for linking)
  const state = await oauthService.generateState(userId);

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
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
export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    logger.error('Google OAuth error:', error);
    return res.redirect(`${config.frontend.url}/auth/error?message=${error}`);
  }

  if (!code || !state) {
    throw new AppError('Missing authorization code or state', 400);
  }

  try {
    // Verify state
    const { userId: linkUserId } = await oauthService.verifyState(state as string);

    // Exchange code for tokens and user info
    const { profile, tokens } = await oauthService.googleOAuth(code as string);

    // Find or create user
    const { user, isNewUser } = await oauthService.findOrCreateOAuthUser(
      'google',
      profile,
      tokens,
      linkUserId
    );

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
      ? `${config.frontend.url}/settings/accounts?linked=google`
      : isNewUser
      ? `${config.frontend.url}/onboarding?token=${accessToken}`
      : `${config.frontend.url}/auth/callback?token=${accessToken}`;

    res.redirect(redirectUrl);
  } catch (error) {
    logger.error('Google OAuth callback error:', error);
    const message = error instanceof AppError ? error.message : 'Authentication failed';
    res.redirect(`${config.frontend.url}/auth/error?message=${encodeURIComponent(message)}`);
  }
});

/**
 * Get GitHub OAuth authorization URL
 * @route GET /api/v1/auth/github
 */
export const githubAuth = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const state = await oauthService.generateState(userId);

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: process.env.GITHUB_CALLBACK_URL!,
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
export const githubCallback = asyncHandler(async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    logger.error('GitHub OAuth error:', error);
    return res.redirect(`${config.frontend.url}/auth/error?message=${error}`);
  }

  if (!code || !state) {
    throw new AppError('Missing authorization code or state', 400);
  }

  try {
    const { userId: linkUserId } = await oauthService.verifyState(state as string);
    const { profile, tokens } = await oauthService.githubOAuth(code as string);
    
    const { user, isNewUser } = await oauthService.findOrCreateOAuthUser(
      'github',
      profile,
      tokens,
      linkUserId
    );

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
      ? `${config.frontend.url}/settings/accounts?linked=github`
      : isNewUser
      ? `${config.frontend.url}/onboarding?token=${accessToken}`
      : `${config.frontend.url}/auth/callback?token=${accessToken}`;

    res.redirect(redirectUrl);
  } catch (error) {
    logger.error('GitHub OAuth callback error:', error);
    const message = error instanceof AppError ? error.message : 'Authentication failed';
    res.redirect(`${config.frontend.url}/auth/error?message=${encodeURIComponent(message)}`);
  }
});

/**
 * Get LinkedIn OAuth authorization URL
 * @route GET /api/v1/auth/linkedin
 */
export const linkedinAuth = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const state = await oauthService.generateState(userId);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: process.env.LINKEDIN_CALLBACK_URL!,
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
export const linkedinCallback = asyncHandler(async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    logger.error('LinkedIn OAuth error:', error);
    return res.redirect(`${config.frontend.url}/auth/error?message=${error}`);
  }

  if (!code || !state) {
    throw new AppError('Missing authorization code or state', 400);
  }

  try {
    const { userId: linkUserId } = await oauthService.verifyState(state as string);
    const { profile, tokens } = await oauthService.linkedinOAuth(code as string);
    
    const { user, isNewUser } = await oauthService.findOrCreateOAuthUser(
      'linkedin',
      profile,
      tokens,
      linkUserId
    );

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
      ? `${config.frontend.url}/settings/accounts?linked=linkedin`
      : isNewUser
      ? `${config.frontend.url}/onboarding?token=${accessToken}`
      : `${config.frontend.url}/auth/callback?token=${accessToken}`;

    res.redirect(redirectUrl);
  } catch (error) {
    logger.error('LinkedIn OAuth callback error:', error);
    const message = error instanceof AppError ? error.message : 'Authentication failed';
    res.redirect(`${config.frontend.url}/auth/error?message=${encodeURIComponent(message)}`);
  }
});

/**
 * Unlink OAuth provider from user account
 * @route DELETE /api/v1/auth/oauth/:provider
 */
export const unlinkProvider = asyncHandler(async (req: Request, res: Response) => {
  const { provider } = req.params;
  const userId = req.user!.id;

  if (!['google', 'github', 'linkedin'].includes(provider)) {
    throw new AppError('Invalid provider', 400);
  }

  await oauthService.unlinkOAuthProvider(
    userId,
    provider as 'google' | 'github' | 'linkedin'
  );

  res.json({
    success: true,
    message: `${provider} account unlinked successfully`,
  });
});

/**
 * Get linked providers for current user
 * @route GET /api/v1/auth/oauth/linked
 */
export const getLinkedProviders = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);

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
