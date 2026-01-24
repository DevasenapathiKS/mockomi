"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_controller_1 = require("../controllers/health.controller");
const router = (0, express_1.Router)();
router.get('/health', health_controller_1.getHealth);
router.get('/health/live', health_controller_1.getHealthLiveness);
router.get('/health/ready', health_controller_1.getHealthReadiness);
exports.default = router;
//# sourceMappingURL=health.routes.js.map