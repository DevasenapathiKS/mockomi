import { Router } from 'express';
import { oauthController } from '../controllers';
import { authenticate, optionalAuth } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /auth/google:
 *   get:
 *     tags: [OAuth]
 *     summary: Initiate Google OAuth flow
 *     parameters:
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [api, redirect]
 *         description: Return auth URL (api) or redirect (redirect)
 */
router.get('/google', optionalAuth, oauthController.googleAuth);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     tags: [OAuth]
 *     summary: Google OAuth callback
 */
router.get('/google/callback', oauthController.googleCallback);

/**
 * @swagger
 * /auth/github:
 *   get:
 *     tags: [OAuth]
 *     summary: Initiate GitHub OAuth flow
 */
router.get('/github', optionalAuth, oauthController.githubAuth);

/**
 * @swagger
 * /auth/github/callback:
 *   get:
 *     tags: [OAuth]
 *     summary: GitHub OAuth callback
 */
router.get('/github/callback', oauthController.githubCallback);

/**
 * @swagger
 * /auth/linkedin:
 *   get:
 *     tags: [OAuth]
 *     summary: Initiate LinkedIn OAuth flow
 */
router.get('/linkedin', optionalAuth, oauthController.linkedinAuth);

/**
 * @swagger
 * /auth/linkedin/callback:
 *   get:
 *     tags: [OAuth]
 *     summary: LinkedIn OAuth callback
 */
router.get('/linkedin/callback', oauthController.linkedinCallback);

/**
 * @swagger
 * /auth/oauth/linked:
 *   get:
 *     tags: [OAuth]
 *     summary: Get linked OAuth providers
 *     security: [{ bearerAuth: [] }]
 */
router.get('/oauth/linked', authenticate, oauthController.getLinkedProviders);

/**
 * @swagger
 * /auth/oauth/{provider}:
 *   delete:
 *     tags: [OAuth]
 *     summary: Unlink OAuth provider
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github, linkedin]
 */
router.delete('/oauth/:provider', authenticate, oauthController.unlinkProvider);

export default router;
