"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const index_1 = __importDefault(require("./index"));
const logger_1 = __importDefault(require("../utils/logger"));
class RedisClient {
    static instance;
    client = null;
    isConnected = false;
    constructor() { }
    static getInstance() {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient();
        }
        return RedisClient.instance;
    }
    async connect() {
        if (this.isConnected && this.client) {
            logger_1.default.info('Redis already connected');
            return;
        }
        try {
            this.client = new ioredis_1.default({
                host: index_1.default.redis.host,
                port: index_1.default.redis.port,
                password: index_1.default.redis.password || undefined,
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 3,
            });
            this.client.on('connect', () => {
                logger_1.default.info('Redis connected successfully');
                this.isConnected = true;
            });
            this.client.on('error', (error) => {
                logger_1.default.error('Redis connection error:', error);
                this.isConnected = false;
            });
            this.client.on('close', () => {
                logger_1.default.warn('Redis connection closed');
                this.isConnected = false;
            });
            // Test connection
            await this.client.ping();
        }
        catch (error) {
            logger_1.default.error('Failed to connect to Redis:', error);
            // Don't throw - Redis is optional, app can work without it
            this.client = null;
        }
    }
    async disconnect() {
        if (!this.client) {
            return;
        }
        try {
            await this.client.quit();
            this.isConnected = false;
            logger_1.default.info('Redis connection closed');
        }
        catch (error) {
            logger_1.default.error('Error closing Redis connection:', error);
        }
    }
    getClient() {
        return this.client;
    }
    async ping() {
        if (!this.client)
            return false;
        try {
            await this.client.ping();
            return true;
        }
        catch (error) {
            logger_1.default.error('Redis PING error:', error);
            return false;
        }
    }
    async get(key) {
        if (!this.client)
            return null;
        try {
            return await this.client.get(key);
        }
        catch (error) {
            logger_1.default.error('Redis GET error:', error);
            return null;
        }
    }
    async set(key, value, expirySeconds) {
        if (!this.client)
            return false;
        try {
            if (expirySeconds) {
                await this.client.setex(key, expirySeconds, value);
            }
            else {
                await this.client.set(key, value);
            }
            return true;
        }
        catch (error) {
            logger_1.default.error('Redis SET error:', error);
            return false;
        }
    }
    async del(key) {
        if (!this.client)
            return false;
        try {
            await this.client.del(key);
            return true;
        }
        catch (error) {
            logger_1.default.error('Redis DEL error:', error);
            return false;
        }
    }
    async exists(key) {
        if (!this.client)
            return false;
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.default.error('Redis EXISTS error:', error);
            return false;
        }
    }
    async setJSON(key, value, expirySeconds) {
        return this.set(key, JSON.stringify(value), expirySeconds);
    }
    async getJSON(key) {
        const value = await this.get(key);
        if (!value)
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return null;
        }
    }
    async invalidatePattern(pattern) {
        if (!this.client)
            return;
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        }
        catch (error) {
            logger_1.default.error('Redis pattern invalidation error:', error);
        }
    }
}
exports.default = RedisClient.getInstance();
//# sourceMappingURL=redis.js.map