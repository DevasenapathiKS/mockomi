import { Request, Response, NextFunction } from 'express';
/**
 * Get Google OAuth authorization URL
 * @route GET /api/v1/auth/google
 */
export declare const googleAuth: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Google OAuth callback handler
 * @route GET /api/v1/auth/google/callback
 */
export declare const googleCallback: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Get GitHub OAuth authorization URL
 * @route GET /api/v1/auth/github
 */
export declare const githubAuth: (req: Request, res: Response, next: NextFunction) => void;
/**
 * GitHub OAuth callback handler
 * @route GET /api/v1/auth/github/callback
 */
export declare const githubCallback: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Get LinkedIn OAuth authorization URL
 * @route GET /api/v1/auth/linkedin
 */
export declare const linkedinAuth: (req: Request, res: Response, next: NextFunction) => void;
/**
 * LinkedIn OAuth callback handler
 * @route GET /api/v1/auth/linkedin/callback
 */
export declare const linkedinCallback: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Unlink OAuth provider from user account
 * @route DELETE /api/v1/auth/oauth/:provider
 */
export declare const unlinkProvider: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Get linked providers for current user
 * @route GET /api/v1/auth/oauth/linked
 */
export declare const getLinkedProviders: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=oauth.controller.d.ts.map