import { Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import healthService from '../services/health.service';

export const getHealth = asyncHandler(async (req: any, res: Response) => {
  const health = await healthService.getSystemHealth();
  
  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json({
    success: health.status !== 'unhealthy',
    data: health,
  });
});

export const getHealthLiveness = asyncHandler(async (req: any, res: Response) => {
  // Simple liveness check - just check if app is running
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export const getHealthReadiness = asyncHandler(async (req: any, res: Response) => {
  // Readiness check - verify critical dependencies
  const database = await healthService.checkDatabase();
  const cache = await healthService.checkCache();
  
  const ready = database.status === 'healthy' && cache.status === 'healthy';
  
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not ready',
    database: database.status,
    cache: cache.status,
  });
});
