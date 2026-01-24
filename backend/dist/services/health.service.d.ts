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
declare class HealthService {
    checkDatabase(): Promise<HealthStatus>;
    checkCache(): Promise<HealthStatus>;
    checkRazorpay(): Promise<HealthStatus>;
    checkS3(): Promise<HealthStatus>;
    checkEmail(): Promise<HealthStatus>;
    getSystemHealth(): Promise<SystemHealth>;
}
declare const _default: HealthService;
export default _default;
//# sourceMappingURL=health.service.d.ts.map