interface Config {
    env: string;
    port: number;
    apiVersion: string;
    apiPrefix: string;
    mongodb: {
        uri: string;
        options: {
            maxPoolSize: number;
            serverSelectionTimeoutMS: number;
            socketTimeoutMS: number;
        };
    };
    redis: {
        host: string;
        port: number;
        password: string;
    };
    jwt: {
        secret: string;
        refreshSecret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    aws: {
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
        s3Bucket: string;
        s3VideoBucket: string;
    };
    razorpay: {
        keyId: string;
        keySecret: string;
        webhookSecret: string;
    };
    email: {
        host: string;
        port: number;
        user: string;
        pass: string;
        from: string;
    };
    frontend: {
        url: string;
    };
    interview: {
        freeInterviews: number;
        pricePaise: number;
    };
    rateLimit: {
        windowMs: number;
        max: number;
    };
    logging: {
        level: string;
    };
    upload: {
        maxFileSize: number;
        allowedFileTypes: string[];
    };
    vc: {
        baseUrl: string;
    };
}
declare const config: Config;
export default config;
//# sourceMappingURL=index.d.ts.map