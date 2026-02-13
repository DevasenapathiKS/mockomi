"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const error_1 = require("../../../core/error");
const env_1 = require("../../../config/env");
class AuthService {
    async register(input) {
        const email = input.email.trim().toLowerCase();
        const existing = await User_1.User.findOne({ email }).exec();
        if (existing) {
            throw new error_1.AppError('User already exists', 400);
        }
        const hashedPassword = await bcrypt_1.default.hash(input.password, 10);
        const user = await User_1.User.create({
            email,
            password: hashedPassword,
            role: 'candidate',
        });
        return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        };
    }
    async login(input) {
        const email = input.email.trim().toLowerCase();
        const user = await User_1.User.findOne({ email }).exec();
        if (!user) {
            throw new error_1.AppError('Invalid credentials', 401);
        }
        const isValid = await bcrypt_1.default.compare(input.password, user.password);
        if (!isValid) {
            throw new error_1.AppError('Invalid credentials', 401);
        }
        const payload = {
            userId: user._id.toString(),
            role: user.role,
        };
        const token = jsonwebtoken_1.default.sign(payload, env_1.config.jwtSecret, { expiresIn: '1d' });
        return {
            token,
            user: {
                id: user._id.toString(),
                email: user.email,
                role: user.role,
            },
        };
    }
    verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwtSecret);
            if (typeof decoded === 'string' || !decoded) {
                throw new error_1.AppError('Invalid token', 401);
            }
            const payload = decoded;
            const userId = payload.userId;
            const role = payload.role;
            if (typeof userId !== 'string') {
                throw new error_1.AppError('Invalid token', 401);
            }
            if (role !== 'candidate' && role !== 'interviewer' && role !== 'admin') {
                throw new error_1.AppError('Invalid token', 401);
            }
            return decoded;
        }
        catch (_error) {
            throw new error_1.AppError('Invalid token', 401);
        }
    }
}
exports.AuthService = AuthService;
