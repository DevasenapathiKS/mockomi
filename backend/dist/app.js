"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./utils/logger"));
const errorHandler_1 = require("./middlewares/errorHandler");
const rateLimiter_1 = require("./middlewares/rateLimiter");
const routes_1 = __importDefault(require("./routes"));
const swagger_1 = __importDefault(require("./config/swagger"));
const app = (0, express_1.default)();
// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);
// Security middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            config_1.default.frontend.url,
            'http://localhost:3000',
            'http://localhost:5173',
        ].filter(Boolean);
        if (allowedOrigins.includes(origin) || config_1.default.env === 'development') {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Total-Pages'],
}));
// Compression
app.use((0, compression_1.default)());
// Cookie parser
app.use((0, cookie_parser_1.default)());
// Razorpay webhooks need the raw body for signature verification
app.use('/api/v1/payments/webhook', express_1.default.raw({ type: 'application/json' }));
// Body parsing
app.use((req, res, next) => {
    if (req.originalUrl === '/api/v1/payments/webhook') {
        return next();
    }
    return express_1.default.json({ limit: '10mb' })(req, res, next);
});
app.use((req, res, next) => {
    if (req.originalUrl === '/api/v1/payments/webhook') {
        return next();
    }
    return express_1.default.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
});
// Request logging
if (config_1.default.env === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined', {
        stream: { write: (message) => logger_1.default.http(message.trim()) },
    }));
}
// API documentation
if (config_1.default.env !== 'production') {
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default, {
        explorer: true,
        customSiteTitle: 'Mockomi API Documentation',
        customCss: '.swagger-ui .topbar { display: none }',
    }));
    // Serve swagger spec as JSON
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swagger_1.default);
    });
}
// Rate limiting
app.use('/api', rateLimiter_1.apiLimiter);
// API routes
app.use('/api/v1', routes_1.default);
// Root endpoint - simple health/info response
app.get('/', (req, res) => {
    return res.json({
        status: 'ok',
        name: 'Mockomi API',
        env: config_1.default.env,
        apiBase: '/api/v1',
        docs: '/api-docs',
    });
});
// 404 handler
app.use(errorHandler_1.notFoundHandler);
// Global error handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map