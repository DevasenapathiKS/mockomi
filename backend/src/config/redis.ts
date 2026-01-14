import Redis from 'ioredis';
import config from './index';
import logger from '../utils/logger';

class RedisClient {
  private static instance: RedisClient;
  private client: Redis | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      logger.info('Redis already connected');
      return;
    }

    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        logger.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      // Test connection
      await this.client.ping();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      // Don't throw - Redis is optional, app can work without it
      this.client = null;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }
  }

  public getClient(): Redis | null {
    return this.client;
  }

  public async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error('Redis PING error:', error);
      return false;
    }
  }

  public async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  }

  public async set(key: string, value: string, expirySeconds?: number): Promise<boolean> {
    if (!this.client) return false;
    try {
      if (expirySeconds) {
        await this.client.setex(key, expirySeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  }

  public async setJSON(key: string, value: object, expirySeconds?: number): Promise<boolean> {
    return this.set(key, JSON.stringify(value), expirySeconds);
  }

  public async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  public async invalidatePattern(pattern: string): Promise<void> {
    if (!this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      logger.error('Redis pattern invalidation error:', error);
    }
  }
}

export default RedisClient.getInstance();
