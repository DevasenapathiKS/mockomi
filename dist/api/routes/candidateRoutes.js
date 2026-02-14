"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../../core/authMiddleware");
const CandidateDashboardController_1 = require("../../modules/candidate/controllers/CandidateDashboardController");
const router = (0, express_1.Router)();
exports.router = router;
const controller = new CandidateDashboardController_1.CandidateDashboardController();
/**
 * @openapi
 * tags:
 *   - name: Candidate
 *     description: Candidate-facing APIs
 */
/**
 * @openapi
 * /api/candidate/dashboard:
 *   get:
 *     summary: Get consolidated candidate dashboard
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/candidate/dashboard', authMiddleware_1.authenticate, controller.getDashboard);
