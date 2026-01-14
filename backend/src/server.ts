import http from 'http';
import app from './app';
import config from './config';
import database from './config/database';
import redis from './config/redis';
import logger from './utils/logger';

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Create HTTP server
const server = http.createServer(app);

// Graceful shutdown function
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close Redis connection
      await redis.disconnect();
      logger.info('Redis connection closed');

      // Close MongoDB connection
      const mongoose = await import('mongoose');
      await mongoose.default.connection.close();
      logger.info('MongoDB connection closed');

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
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
    await database.connect();

    // Test Redis connection
    try {
      await redis.ping();
      logger.info('Redis connection established');
    } catch (redisError) {
      logger.warn('Redis connection failed, running without cache:', redisError);
    }

    // Start listening
    server.listen(config.port, () => {
      logger.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Mockomi API Server                                    ║
║                                                            ║
║   Environment: ${config.env.padEnd(40)}║
║   Port: ${String(config.port).padEnd(48)}║
║   API: http://localhost:${config.port}/api/v1${' '.repeat(26)}║
║   Docs: http://localhost:${config.port}/api-docs${' '.repeat(24)}║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          logger.error(`Port ${config.port} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`Port ${config.port} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
