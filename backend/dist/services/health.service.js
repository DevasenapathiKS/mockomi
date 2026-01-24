"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const redis_1 = __importDefault(require("../config/redis"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
class HealthService {
    async checkDatabase() {
        const start = Date.now();
        try {
            if (!mongoose_1.default.connection.db) {
                throw new Error('Database not connected');
            }
            await mongoose_1.default.connection.db.admin().ping();
            const responseTime = Date.now() - start;
            return {
                status: 'healthy',
                responseTime,
            };
        }
        catch (error) {
            logger_1.default.error('Database health check failed:', error);
            return {
                status: 'unhealthy',
                responseTime: Date.now() - start,
                message: 'Database connection failed',
            };
        }
    }
    async checkCache() {
        const start = Date.now();
        try {
            const client = redis_1.default.getClient();
            if (!client) {
                return {
                    status: 'unhealthy',
                    responseTime: 0,
                    message: 'Redis client not available',
                };
            }
            await client.ping();
            const responseTime = Date.now() - start;
            return {
                status: 'healthy',
                responseTime,
            };
        }
        catch (error) {
            logger_1.default.error('Cache health check failed:', error);
            return {
                status: 'unhealthy',
                responseTime: Date.now() - start,
                message: 'Redis connection failed',
            };
        }
    }
    async checkRazorpay() {
        const start = Date.now();
        try {
            // Razorpay is considered healthy if configured
            // In production, you might want to make a lightweight API call
            const responseTime = Date.now() - start;
            const isConfigured = !!(config_1.default.razorpay.keyId && config_1.default.razorpay.keySecret);
            return {
                status: isConfigured ? 'healthy' : 'unhealthy',
                responseTime,
                message: isConfigured ? undefined : 'Razorpay not configured',
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - start,
                message: 'Razorpay service unavailable',
            };
        }
    }
    async checkS3() {
        const start = Date.now();
        try {
            // S3 is considered healthy if configured
            // In production, you might want to check bucket access
            const responseTime = Date.now() - start;
            const isConfigured = !!(config_1.default.aws.accessKeyId && config_1.default.aws.secretAccessKey && config_1.default.aws.s3Bucket);
            return {
                status: isConfigured ? 'healthy' : 'unhealthy',
                responseTime,
                message: isConfigured ? undefined : 'S3 not configured',
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - start,
                message: 'S3 service unavailable',
            };
        }
    }
    async checkEmail() {
        const start = Date.now();
        try {
            // Check email service configuration
            const responseTime = Date.now() - start;
            return {
                status: config_1.default.email.user ? 'healthy' : 'unhealthy',
                responseTime,
                message: config_1.default.email.user ? undefined : 'Email service not configured',
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - start,
                message: 'Email service check failed',
            };
        }
    }
    async getSystemHealth() {
        const [database, cache, razorpay, s3, email] = await Promise.all([
            this.checkDatabase(),
            this.checkCache(),
            this.checkRazorpay(),
            this.checkS3(),
            this.checkEmail(),
        ]);
        const memory = process.memoryUsage();
        const uptime = process.uptime();
        // Determine overall status
        const criticalServices = [database, cache];
        const optionalServices = [razorpay, s3, email];
        const criticalHealthy = criticalServices.every(s => s.status === 'healthy');
        const optionalHealthy = optionalServices.every(s => s.status === 'healthy');
        let overallStatus;
        if (!criticalHealthy) {
            overallStatus = 'unhealthy';
        }
        else if (!optionalHealthy) {
            overallStatus = 'degraded';
        }
        else {
            overallStatus = 'healthy';
        }
        return {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime,
            database,
            cache,
            services: {
                razorpay,
                s3,
                email,
            },
            memory: {
                rss: memory.rss,
                heapTotal: memory.heapTotal,
                heapUsed: memory.heapUsed,
                external: memory.external,
            },
        };
    }
}
exports.default = new HealthService();
//# sourceMappingURL=health.service.js.map