import Redis from 'ioredis';
declare class RedisClient {
    private static instance;
    private client;
    private isConnected;
    private constructor();
    static getInstance(): RedisClient;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getClient(): Redis | null;
    ping(): Promise<boolean>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, expirySeconds?: number): Promise<boolean>;
    del(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    setJSON(key: string, value: object, expirySeconds?: number): Promise<boolean>;
    getJSON<T>(key: string): Promise<T | null>;
    invalidatePattern(pattern: string): Promise<void>;
}
declare const _default: RedisClient;
export default _default;
//# sourceMappingURL=redis.d.ts.map