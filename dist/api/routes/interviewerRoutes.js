"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../../core/authMiddleware");
const InterviewerController_1 = require("../../modules/interviewer/controllers/InterviewerController");
const router = (0, express_1.Router)();
exports.router = router;
const controller = new InterviewerController_1.InterviewerController();
// Public discovery (no auth)
router.get('/interviewers', controller.getPublicList);
router.get('/interviewer/profile', authMiddleware_1.authenticate, controller.getMyProfile);
router.post('/interviewer/apply', authMiddleware_1.authenticate, controller.apply);
router.patch('/interviewer/:userId/verify', authMiddleware_1.authenticate, controller.verify);
