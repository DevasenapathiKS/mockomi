import http from 'node:http';
import process from 'node:process';

import { Server as SocketIOServer } from 'socket.io';

import { app } from './app';
import { connectDatabase } from './config/database';
import { config } from './config/env';
import { logger } from './core/logger';
import { MediaService } from './modules/media/services/MediaService';

let httpServer: http.Server | null = null;

async function shutdown(exitCode: number): Promise<void> {
  if (httpServer) {
    await new Promise<void>((resolve) => {
      httpServer?.close(() => resolve());
    });
  }

  process.exit(exitCode);
}

process.on('unhandledRejection', (reason: unknown) => {
  logger.fatal({ reason }, 'Unhandled Rejection');
  void shutdown(1);
});

process.on('uncaughtException', (error: unknown) => {
  logger.fatal({ error }, 'Uncaught Exception');
  void shutdown(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  void shutdown(0);
});

async function startServer(): Promise<void> {
  await connectDatabase();
  logger.info('Database connected successfully');

  // Best-effort retry of pending media meetings (does not block startup).
  void (async () => {
    try {
      const mediaService = new MediaService();
      await mediaService.retryPendingMeetings();
      logger.info('Media meeting retry sweep completed');
    } catch (error: unknown) {
      logger.error({ error }, 'Media meeting retry sweep failed');
    }
  })();

  httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Socket connected');
  });

  httpServer.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
  });
}

void startServer();

