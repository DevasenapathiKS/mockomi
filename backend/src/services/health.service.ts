import mongoose from 'mongoose';
import redis from '../config/redis';
import config from '../config';
import logger from '../utils/logger';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  message?: string;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  database: HealthStatus;
  cache: HealthStatus;
  services: {
    razorpay: HealthStatus;
    s3: HealthStatus;
    email: HealthStatus;
  };
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

class HealthService {
  async checkDatabase(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      if (!mongoose.connection.db) {
        throw new Error('Database not connected');
      }
      await mongoose.connection.db.admin().ping();
      const responseTime = Date.now() - start;
      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        message: 'Database connection failed',
      };
    }
  }

  async checkCache(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      const client = redis.getClient();
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
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        message: 'Redis connection failed',
      };
    }
  }

  async checkRazorpay(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      // Razorpay is considered healthy if configured
      // In production, you might want to make a lightweight API call
      const responseTime = Date.now() - start;
      const isConfigured = !!(config.razorpay.keyId && config.razorpay.keySecret);
      return {
        status: isConfigured ? 'healthy' : 'unhealthy',
        responseTime,
        message: isConfigured ? undefined : 'Razorpay not configured',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        message: 'Razorpay service unavailable',
      };
    }
  }

  async checkS3(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      // S3 is considered healthy if configured
      // In production, you might want to check bucket access
      const responseTime = Date.now() - start;
      const isConfigured = !!(config.aws.accessKeyId && config.aws.secretAccessKey && config.aws.s3Bucket);
      return {
        status: isConfigured ? 'healthy' : 'unhealthy',
        responseTime,
        message: isConfigured ? undefined : 'S3 not configured',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        message: 'S3 service unavailable',
      };
    }
  }

  async checkEmail(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      // Check email service configuration
      const responseTime = Date.now() - start;
      return {
        status: config.email.user ? 'healthy' : 'unhealthy',
        responseTime,
        message: config.email.user ? undefined : 'Email service not configured',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        message: 'Email service check failed',
      };
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
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

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (!criticalHealthy) {
      overallStatus = 'unhealthy';
    } else if (!optionalHealthy) {
      overallStatus = 'degraded';
    } else {
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

export default new HealthService();
