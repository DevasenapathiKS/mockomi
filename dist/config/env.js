"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = exports.config = void 0;
const node_path_1 = __importDefault(require("node:path"));
const node_process_1 = __importDefault(require("node:process"));
const dotenv_1 = __importDefault(require("dotenv"));
const NODE_ENV = node_process_1.default.env.NODE_ENV ?? 'development';
const envFile = NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv_1.default.config({
    path: node_path_1.default.resolve(node_process_1.default.cwd(), envFile),
});
function getRequiredEnv(name) {
    const value = node_process_1.default.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
function parsePort(portValue) {
    const port = Number(portValue);
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error(`Invalid PORT value: ${portValue}`);
    }
    return port;
}
function parsePositiveInt(value, name) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`Invalid ${name} value: ${value}`);
    }
    return parsed;
}
function buildConfig() {
    const port = parsePort(getRequiredEnv('PORT'));
    const mongoUri = getRequiredEnv('MONGO_URI');
    const jwtSecret = getRequiredEnv('JWT_SECRET');
    const dailyInterviewLimit = parsePositiveInt(getRequiredEnv('DAILY_INTERVIEW_LIMIT'), 'DAILY_INTERVIEW_LIMIT');
    const razorpayKeyId = getRequiredEnv('RAZORPAY_KEY_ID');
    const razorpayKeySecret = getRequiredEnv('RAZORPAY_KEY_SECRET');
    const mediaBaseUrl = getRequiredEnv('MEDIA_BASE_URL');
    const mediaInternalSecret = getRequiredEnv('MEDIA_INTERNAL_SECRET');
    const chamcallSharedSecret = getRequiredEnv('CHAMCALL_SHARED_SECRET');
    return {
        nodeEnv: NODE_ENV,
        port,
        mongoUri,
        jwtSecret,
        dailyInterviewLimit,
        razorpayKeyId,
        razorpayKeySecret,
        mediaBaseUrl,
        mediaInternalSecret,
        chamcallSharedSecret,
    };
}
// Module initialization: if required env vars are missing, an error is thrown
// and the process exits with a non‑zero status.
exports.config = buildConfig();
// Backwards-compatible alias (prefer `config`).
exports.env = exports.config;
