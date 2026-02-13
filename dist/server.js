"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = __importDefault(require("node:http"));
const node_process_1 = __importDefault(require("node:process"));
const socket_io_1 = require("socket.io");
const app_1 = require("./app");
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const logger_1 = require("./core/logger");
const MediaService_1 = require("./modules/media/services/MediaService");
let httpServer = null;
async function shutdown(exitCode) {
    if (httpServer) {
        await new Promise((resolve) => {
            httpServer?.close(() => resolve());
        });
    }
    node_process_1.default.exit(exitCode);
}
node_process_1.default.on('unhandledRejection', (reason) => {
    logger_1.logger.fatal({ reason }, 'Unhandled Rejection');
    void shutdown(1);
});
node_process_1.default.on('uncaughtException', (error) => {
    logger_1.logger.fatal({ error }, 'Uncaught Exception');
    void shutdown(1);
});
node_process_1.default.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received. Shutting down gracefully...');
    void shutdown(0);
});
async function startServer() {
    await (0, database_1.connectDatabase)();
    logger_1.logger.info('Database connected successfully');
    // Best-effort retry of pending media meetings (does not block startup).
    void (async () => {
        try {
            const mediaService = new MediaService_1.MediaService();
            await mediaService.retryPendingMeetings();
            logger_1.logger.info('Media meeting retry sweep completed');
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Media meeting retry sweep failed');
        }
    })();
    httpServer = node_http_1.default.createServer(app_1.app);
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*',
        },
    });
    io.on('connection', (socket) => {
        logger_1.logger.info({ socketId: socket.id }, 'Socket connected');
    });
    httpServer.listen(env_1.config.port, () => {
        logger_1.logger.info(`Server running on port ${env_1.config.port}`);
    });
}
void startServer();
