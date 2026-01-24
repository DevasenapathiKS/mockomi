"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthReadiness = exports.getHealthLiveness = exports.getHealth = void 0;
const errorHandler_1 = require("../middlewares/errorHandler");
const health_service_1 = __importDefault(require("../services/health.service"));
exports.getHealth = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const health = await health_service_1.default.getSystemHealth();
    const statusCode = health.status === 'healthy' ? 200 :
        health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json({
        success: health.status !== 'unhealthy',
        data: health,
    });
});
exports.getHealthLiveness = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Simple liveness check - just check if app is running
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});
exports.getHealthReadiness = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Readiness check - verify critical dependencies
    const database = await health_service_1.default.checkDatabase();
    const cache = await health_service_1.default.checkCache();
    const ready = database.status === 'healthy' && cache.status === 'healthy';
    res.status(ready ? 200 : 503).json({
        status: ready ? 'ready' : 'not ready',
        database: database.status,
        cache: cache.status,
    });
});
//# sourceMappingURL=health.controller.js.map