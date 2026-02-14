"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../../core/authMiddleware");
const AvailabilityController_1 = require("../../modules/availability/controllers/AvailabilityController");
const router = (0, express_1.Router)();
exports.router = router;
const controller = new AvailabilityController_1.AvailabilityController();
router.post('/availability', authMiddleware_1.authenticate, controller.createSlot);
router.get('/interviewer/slots', authMiddleware_1.authenticate, controller.getMySlots);
// Public interviewer slot discovery
router.get('/interviewers/:id/slots', controller.getPublicSlots);
