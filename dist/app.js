"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const pino_http_1 = __importDefault(require("pino-http"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const errorMiddleware_1 = require("./core/errorMiddleware");
const response_1 = require("./core/response");
const rateLimiters_1 = require("./core/rateLimiters");
const logger_1 = require("./core/logger");
const swagger_1 = require("./config/swagger");
const interviewRoutes_1 = require("./api/routes/interviewRoutes");
const progressRoutes_1 = require("./api/routes/progressRoutes");
const authRoutes_1 = require("./api/routes/authRoutes");
const interviewerRoutes_1 = require("./api/routes/interviewerRoutes");
const availabilityRoutes_1 = require("./api/routes/availabilityRoutes");
const bookingRoutes_1 = require("./api/routes/bookingRoutes");
const sessionRoutes_1 = require("./api/routes/sessionRoutes");
const adminRoutes_1 = require("./api/routes/adminRoutes");
const paymentRoutes_1 = require("./api/routes/paymentRoutes");
const app = (0, express_1.default)();
exports.app = app;
app.use(rateLimiters_1.apiLimiter);
// Razorpay webhook needs raw body for signature verification
app.use('/api/payments/webhook', express_1.default.raw({ type: 'application/json' }));
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, pino_http_1.default)({
    logger: logger_1.logger,
}));
app.get('/health', (_req, res) => {
    return (0, response_1.sendSuccess)(res, { status: 'ok' });
});
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
app.use('/api/interviews', rateLimiters_1.apiLimiter, interviewRoutes_1.router);
app.use('/api/progress', rateLimiters_1.apiLimiter, progressRoutes_1.router);
app.use('/api/auth', rateLimiters_1.apiLimiter, authRoutes_1.router);
app.use('/api', rateLimiters_1.apiLimiter, interviewerRoutes_1.router);
app.use('/api', rateLimiters_1.apiLimiter, availabilityRoutes_1.router);
app.use('/api', rateLimiters_1.apiLimiter, bookingRoutes_1.router);
app.use('/api', rateLimiters_1.apiLimiter, sessionRoutes_1.router);
app.use('/api', rateLimiters_1.apiLimiter, adminRoutes_1.router);
app.use('/api', rateLimiters_1.apiLimiter, paymentRoutes_1.router);
// Error handler must be registered last.
app.use(errorMiddleware_1.errorMiddleware);
