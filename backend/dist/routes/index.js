"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const job_routes_1 = __importDefault(require("./job.routes"));
const application_routes_1 = __importDefault(require("./application.routes"));
const interview_routes_1 = __importDefault(require("./interview.routes"));
const profile_routes_1 = __importDefault(require("./profile.routes"));
const payment_routes_1 = __importDefault(require("./payment.routes"));
const notification_routes_1 = __importDefault(require("./notification.routes"));
const admin_routes_1 = __importDefault(require("./admin.routes"));
const withdrawal_routes_1 = __importDefault(require("./withdrawal.routes"));
const coupon_routes_1 = __importDefault(require("./coupon.routes"));
const router = (0, express_1.Router)();
// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
// API routes
router.use('/auth', auth_routes_1.default);
router.use('/jobs', job_routes_1.default);
router.use('/applications', application_routes_1.default);
router.use('/interviews', interview_routes_1.default);
router.use('/profile', profile_routes_1.default);
router.use('/payments', payment_routes_1.default);
router.use('/notifications', notification_routes_1.default);
router.use('/admin', admin_routes_1.default);
router.use('/withdrawals', withdrawal_routes_1.default);
router.use('/coupons', coupon_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map