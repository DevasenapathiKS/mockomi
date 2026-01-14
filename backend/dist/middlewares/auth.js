"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireInterviewerApproval = exports.requireEmailVerification = exports.verifyRefreshToken = exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const types_1 = require("../types");
const models_1 = require("../models");
const config_1 = __importDefault(require("../config"));
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.AppError('No token provided', 401);
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new errors_1.AppError('No token provided', 401);
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
            // Verify user still exists and is active
            const user = await models_1.User.findById(decoded.id).select('status role');
            if (!user) {
                throw new errors_1.AppError('User no longer exists', 401);
            }
            if (user.status === 'suspended') {
                throw new errors_1.AppError('Your account has been suspended', 403);
            }
            if (user.status === 'inactive') {
                throw new errors_1.AppError('Your account is inactive', 403);
            }
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
            };
            next();
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new errors_1.AppError('Token has expired', 401);
            }
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new errors_1.AppError('Invalid token', 401);
            }
            throw error;
        }
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errors_1.AppError('Not authenticated', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errors_1.AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
exports.authorize = authorize;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return next();
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
            };
        }
        catch {
            // Invalid token, but continue as unauthenticated
            logger_1.default.debug('Optional auth: Invalid token provided');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.optionalAuth = optionalAuth;
const verifyRefreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw new errors_1.AppError('Refresh token is required', 400);
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, config_1.default.jwt.refreshSecret);
            const user = await models_1.User.findById(decoded.id).select('+refreshTokens');
            if (!user) {
                throw new errors_1.AppError('User not found', 401);
            }
            if (!user.refreshTokens.includes(refreshToken)) {
                throw new errors_1.AppError('Invalid refresh token', 401);
            }
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
            };
            next();
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new errors_1.AppError('Refresh token has expired', 401);
            }
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new errors_1.AppError('Invalid refresh token', 401);
            }
            throw error;
        }
    }
    catch (error) {
        next(error);
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
const requireEmailVerification = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.AppError('Not authenticated', 401);
        }
        const user = await models_1.User.findById(req.user.id).select('isEmailVerified');
        if (!user) {
            throw new errors_1.AppError('User not found', 404);
        }
        if (!user.isEmailVerified) {
            throw new errors_1.AppError('Please verify your email address', 403);
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireEmailVerification = requireEmailVerification;
const requireInterviewerApproval = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.AppError('Not authenticated', 401);
        }
        if (req.user.role !== types_1.UserRole.INTERVIEWER) {
            return next();
        }
        const { InterviewerProfile } = await Promise.resolve().then(() => __importStar(require('../models')));
        const profile = await InterviewerProfile.findOne({ userId: req.user.id });
        if (!profile) {
            throw new errors_1.AppError('Interviewer profile not found', 404);
        }
        if (!profile.isApproved) {
            throw new errors_1.AppError('Your interviewer profile is pending approval', 403);
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireInterviewerApproval = requireInterviewerApproval;
//# sourceMappingURL=auth.js.map