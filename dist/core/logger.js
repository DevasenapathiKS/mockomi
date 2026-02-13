"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const env_1 = require("../config/env");
exports.logger = (0, pino_1.default)({
    level: env_1.config.nodeEnv === "production" ? "info" : "debug",
    redact: {
        paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "req.headers['set-cookie']"
        ],
        remove: true,
    },
    transport: env_1.config.nodeEnv !== "production"
        ? {
            target: "pino-pretty",
            options: {
                colorize: true,
            },
        }
        : undefined,
});
