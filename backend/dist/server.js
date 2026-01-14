"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const database_1 = __importDefault(require("./config/database"));
const redis_1 = __importDefault(require("./config/redis"));
const logger_1 = __importDefault(require("./utils/logger"));
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught Exception:', error);
    process.exit(1);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Create HTTP server
const server = http_1.default.createServer(app_1.default);
// Graceful shutdown function
const gracefulShutdown = async (signal) => {
    logger_1.default.info(`${signal} received. Starting graceful shutdown...`);
    // Stop accepting new connections
    server.close(async () => {
        logger_1.default.info('HTTP server closed');
        try {
            // Close Redis connection
            await redis_1.default.disconnect();
            logger_1.default.info('Redis connection closed');
            // Close MongoDB connection
            const mongoose = await Promise.resolve().then(() => __importStar(require('mongoose')));
            await mongoose.default.connection.close();
            logger_1.default.info('MongoDB connection closed');
            logger_1.default.info('Graceful shutdown completed');
            process.exit(0);
        }
        catch (error) {
            logger_1.default.error('Error during graceful shutdown:', error);
            process.exit(1);
        }
    });
    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger_1.default.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};
// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await database_1.default.connect();
        // Test Redis connection
        try {
            await redis_1.default.ping();
            logger_1.default.info('Redis connection established');
        }
        catch (redisError) {
            logger_1.default.warn('Redis connection failed, running without cache:', redisError);
        }
        // Start listening
        server.listen(config_1.default.port, () => {
            logger_1.default.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Mockomi API Server                                    ║
║                                                            ║
║   Environment: ${config_1.default.env.padEnd(40)}║
║   Port: ${String(config_1.default.port).padEnd(48)}║
║   API: http://localhost:${config_1.default.port}/api/v1${' '.repeat(26)}║
║   Docs: http://localhost:${config_1.default.port}/api-docs${' '.repeat(24)}║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
        });
        // Handle server errors
        server.on('error', (error) => {
            if (error.syscall !== 'listen') {
                throw error;
            }
            switch (error.code) {
                case 'EACCES':
                    logger_1.default.error(`Port ${config_1.default.port} requires elevated privileges`);
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    logger_1.default.error(`Port ${config_1.default.port} is already in use`);
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Start the server
startServer();
//# sourceMappingURL=server.js.map