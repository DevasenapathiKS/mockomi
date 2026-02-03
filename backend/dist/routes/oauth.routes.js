"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
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
router.get('/google', auth_1.optionalAuth, controllers_1.oauthController.googleAuth);
/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     tags: [OAuth]
 *     summary: Google OAuth callback
 */
router.get('/google/callback', controllers_1.oauthController.googleCallback);
/**
 * @swagger
 * /auth/github:
 *   get:
 *     tags: [OAuth]
 *     summary: Initiate GitHub OAuth flow
 */
router.get('/github', auth_1.optionalAuth, controllers_1.oauthController.githubAuth);
/**
 * @swagger
 * /auth/github/callback:
 *   get:
 *     tags: [OAuth]
 *     summary: GitHub OAuth callback
 */
router.get('/github/callback', controllers_1.oauthController.githubCallback);
/**
 * @swagger
 * /auth/linkedin:
 *   get:
 *     tags: [OAuth]
 *     summary: Initiate LinkedIn OAuth flow
 */
router.get('/linkedin', auth_1.optionalAuth, controllers_1.oauthController.linkedinAuth);
/**
 * @swagger
 * /auth/linkedin/callback:
 *   get:
 *     tags: [OAuth]
 *     summary: LinkedIn OAuth callback
 */
router.get('/linkedin/callback', controllers_1.oauthController.linkedinCallback);
/**
 * @swagger
 * /auth/oauth/linked:
 *   get:
 *     tags: [OAuth]
 *     summary: Get linked OAuth providers
 *     security: [{ bearerAuth: [] }]
 */
router.get('/oauth/linked', auth_1.authenticate, controllers_1.oauthController.getLinkedProviders);
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
router.delete('/oauth/:provider', auth_1.authenticate, controllers_1.oauthController.unlinkProvider);
exports.default = router;
//# sourceMappingURL=oauth.routes.js.map